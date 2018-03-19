$(document).ready(function () {

    const tenancyContractABI = [];
    const tenancyContractData = '';
    const tenancyContractGas = 4700000;

    const KEY_LANDLORD_ADDRESS = 'landlordAddress';
    const KEY_TENANT_ADDRESS = 'tenantAddress';
    const KEY_ARBITER_ADDRESS = 'arbiterAddress';
    const KEY_DEPOSIT = 'deposit';
    const KEY_DEDUCTION = 'deduction';
    const KEY_BALANCE = 'balance';
    const KEY_STATUS = 'status';
    const KEY_IS_ROPSTEN = 'isRopstenTestNet';
    const KEY_CONTRACT_ADDRESS = 'tenancyDepositContractAddress';
    const KEY_LANDLORD_DEDUCTION_CLAIM = 'landlordDeductionClaim';
    const KEY_TENANT_DEDUCTION_CLAIM = 'tenantDeductionClaim';

    let statusChangedEvent;
    let deductionClaimedEvent;
    let deductionAgreedEvent;
    let disputeResolvedEvent;
    let balanceChangedEvent;
    let moneyWithdrawnEvent;

    // resetTenancyDepositContractData();

    // --- Solidity Contract Call Functions ---

    function createWallet() {
        $.post("/wallets").then(function(walletData) {
            // TODO handle errors
            let walletInfo = "Generated random private key: " + walletData.privateKey + "\n" +
                            "Extracted public key: " + walletData.publicKey + "\n" +
                            "Extracted blockchain address: " + walletData.address + "\n";
            $('#newWalletContainer').val(walletInfo);
        });
    }

    function loadWallet() {
        let privateKey = $('#walletPrivateKey').val();
        // TODO input validation
        $.ajax({
            type: 'PUT',
            dataType: 'json',
            url: "/wallets",
            // headers: {"X-HTTP-Method-Override": "PUT"}, // X-HTTP-Method-Override set to PUT.
            data: {privateKey: privateKey}
        }).then(function(walletData) {
            // TODO handle errors
            let walletInfo = "Generated random private key: " + walletData.privateKey + "\n" +
                            "Extracted public key: " + walletData.publicKey + "\n" +
                            "Extracted blockchain address: " + walletData.address + "\n";
            $('#existingWalletContainer').val(walletInfo);
        });
    }

    async function viewBalance() {
        let walletAddress = $('#viewBalanceWalletAddress').val();
        let nodeURL = $('#viewBalanceBlockchainNode').val() + "/addresses/" + walletAddress + "/balance";
        // TODO input validation
        await $.get( nodeURL, function(walletBalanceData) {
            // TODO handle errors
            let walletInfo = "Balance (confirmed): " + walletBalanceData.confirmedBalance.balance + "\n" +
                "Balance (1 confirmation): " + walletBalanceData.lastMinedBalance.balance + "\n" +
                "Balance (pending): " + walletBalanceData.pendingBalance.balance + "\n";
            $('#walletBalanceContainer').val(walletInfo);
        });
    }

    async function signTransaction() {
        let txSender = $('#viewSendTransactionSender').val();
        let txSenderPubKey = $('#viewSendTransactionSenderPubKey').val();
        let txRecipient = $('#viewSendTransactionRecipient').val();
        let txValue = $('#viewSendTransactionValue').val();
        let txFee = $('#viewSendTransactionFee').val();
        let postRequestPayload = {
            from: txSender,
            to: txRecipient,
            senderPubKey: txSenderPubKey,
            value: txValue,
            fee: txFee
        };
        await $.post("/wallets/" + txSender + "/transactions", postRequestPayload).then(function(signedTransaction) {
            $('#walletTransactionSigned').val(JSON.stringify(signedTransaction));
        });
    }

    function sendTransaction() {
        let txSender = $('#viewSendTransactionSender').val();
        let txSenderPubKey = $('#viewSendTransactionSenderPubKey').val();
        let txRecipient = $('#viewSendTransactionRecipient').val();
        let txValue = $('#viewSendTransactionValue').val();
        let txFee = $('#viewSendTransactionFee').val();
        let postRequestPayload = {
            from: txSender,
            to: txRecipient,
            senderPubKey: txSenderPubKey,
            value: txValue,
            fee: txFee
        };
        let signedTransactionPayload = null;
        $.post("/wallets/" + txSender + "/transactions", postRequestPayload).then(function(signedTransaction) {
            signedTransactionPayload = signedTransaction;
            $('#walletTransactionSigned').val(JSON.stringify(signedTransaction));
        }).then(function() {
            $.post("/wallets/" + txSender + "/transactions/send", signedTransactionPayload)
                .then(function (signedTransaction) {
                    console.log(">> " + signedTransaction);
                    let sentTransactionInfo = "Transaction successfully sent. \n" +
                        "Transaction hash: " + signedTransaction.transactionHash;
                    $('#walletTransactionSent').val(JSON.stringify(sentTransactionInfo));
                })
                .catch(function (err) {
                    console.error(err);
                });
        });
    }

    function createTenancyDepositContractData() {
        console.log("setup Tenancy Deposit Contract Details...");
        if (typeof(Storage) !== "undefined") {

            let landlordAddress = $('#contract-landlordAddress').val();
            let tenantAddress = $('#contract-tenantAddress').val();
            let arbiterAddress = $('#contract-arbiterAddress').val();
            let deposit = $('#contract-deposit').val();
            let isRopstenTestNet = $('#contract-ropstenTestNet').is(':checked');

            // validate input
            // validateActorAddress(landlordAddress, "landlord");
            // validateActorAddress(tenantAddress, "tenant");
            // validateActorAddress(arbiterAddress, "arbiter");

            createContract(isRopstenTestNet, landlordAddress, tenantAddress, arbiterAddress, deposit, defaultCallbackHandler);

        } else {
            // TODO make it visible
            console.error("no local storage support...");
        }
    }

    function validateActorAddress(address, actorType) {
        if ((typeof address === 'undefined') || ! (/^(0x){1}[0-9a-fA-F]{40}$/i.test(address))) {
            return showError("Please provide valid " + actorType + " address.");
        }
    }

    function createContract(isRopstenTestNet, landlordAddress, tenantAddress, arbiterAddress, expectedDeposit) {
        console.log("createContract...");
        if (typeof(Storage) !== "undefined") {

            if (isRopstenTestNet) {
                if (typeof web3 === 'undefined') {
                    return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser");
                }
            } else {
                web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
            }

            let TenancyDepositContract = web3.eth.contract(tenancyContractABI);
            let tenancyDepositContractInstance = TenancyDepositContract.new(
                tenantAddress,
                arbiterAddress,
                expectedDeposit,
                {
                    from: landlordAddress,
                    data: tenancyContractData,
                    gas: tenancyContractGas
                }, function (error, contract){
                    if(error) {
                        console.error(error, contract);
                    } else if (typeof contract.address !== 'undefined') {
                        console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);

                        // persist contract data to local storage
                        localStorage.setItem(KEY_LANDLORD_ADDRESS, landlordAddress);
                        localStorage.setItem(KEY_TENANT_ADDRESS, tenantAddress);
                        localStorage.setItem(KEY_ARBITER_ADDRESS, arbiterAddress);
                        localStorage.setItem(KEY_DEPOSIT, ""+expectedDeposit);
                        localStorage.setItem(KEY_IS_ROPSTEN, isRopstenTestNet);
                        localStorage.setItem(KEY_CONTRACT_ADDRESS, contract.address);

                        // register event listeners
                        statusChangedEvent = contract.StatusChanged({_contractAddress:contract.address},{fromBlock: 0, toBlock: 'latest'});
                        statusChangedEvent.watch(handleStatusChanged);

                        balanceChangedEvent = contract.BalanceChanged({_contractAddress:contract.address},{fromBlock: 0, toBlock: 'latest'});
                        balanceChangedEvent.watch(handleBalanceChanged);

                        deductionAgreedEvent = contract.DeductionAgreed({_contractAddress:contract.address},{fromBlock: 0, toBlock: 'latest'});
                        deductionAgreedEvent.watch(handleDeductionAgreed);

                        disputeResolvedEvent = contract.DisputeResolved({_contractAddress:contract.address},{fromBlock: 0, toBlock: 'latest'});
                        disputeResolvedEvent.watch(handleDisputeResolved);

                        deductionClaimedEvent = contract.DeductionClaimed({_contractAddress:contract.address},{fromBlock: 0, toBlock: 'latest'});
                        deductionClaimedEvent.watch(handleDeductionClaimed);

                        moneyWithdrawnEvent = contract.MoneyWithdrawn({_contractAddress:contract.address},{fromBlock: 0, toBlock: 'latest'});
                        moneyWithdrawnEvent.watch(handleMoneyWithdrawn);
                    }
                });
        }
    }

    function tenantSignContract() {
        console.log('tenant signs contract...');

        configureWeb3Provider();

        let tenancyContractAddress = localStorage.getItem(KEY_CONTRACT_ADDRESS);
        let tenantAddress = localStorage.getItem(KEY_TENANT_ADDRESS);
        let deposit = localStorage.getItem(KEY_DEPOSIT);

        let contract = web3.eth.contract(tenancyContractABI).at(tenancyContractAddress);

        contract.signContract({from: tenantAddress, value: deposit}, defaultCallbackHandler);
    }

    function landlordTerminateContract() {
        terminateContract(KEY_LANDLORD_ADDRESS);
    }

    function tenantTerminateContract() {
        terminateContract(KEY_TENANT_ADDRESS);
    }

    function terminateContract(senderAddressKey) {
        console.log('terminating contract...');

        configureWeb3Provider();

        let tenancyContractAddress = localStorage.getItem(KEY_CONTRACT_ADDRESS);
        let senderAddress = localStorage.getItem(senderAddressKey);

        let contract = web3.eth.contract(tenancyContractABI).at(tenancyContractAddress);

        contract.terminateContract({from: senderAddress}, defaultCallbackHandler);
    }

    function landlordClaimDeduction() {
        console.log('landlord claiming deduction...');

        configureWeb3Provider();

        let landlordDeductionClaim = $('#landlord-deduction').val();
        let tenancyContractAddress = localStorage.getItem(KEY_CONTRACT_ADDRESS);
        let senderAddress = localStorage.getItem(KEY_LANDLORD_ADDRESS);

        let contract = web3.eth.contract(tenancyContractABI).at(tenancyContractAddress);

        contract.landlordClaimDeduction(landlordDeductionClaim, {from: senderAddress}, defaultCallbackHandler);
    }

    function tenantClaimDeduction() {
        console.log('tenant claiming deduction...');

        configureWeb3Provider();

        let tenantDeductionClaim = $('#tenant-deduction').val();
        let tenancyContractAddress = localStorage.getItem(KEY_CONTRACT_ADDRESS);
        let senderAddress = localStorage.getItem(KEY_TENANT_ADDRESS);

        let contract = web3.eth.contract(tenancyContractABI).at(tenancyContractAddress);

        contract.tenantClaimDeduction(tenantDeductionClaim, {from: senderAddress}, defaultCallbackHandler);
    }

    function arbiterResolvesDispute() {
        console.log('arbiter resolves dispute...');

        configureWeb3Provider();

        let deductionValue = $('#arbiter-deduction').val();
        let tenancyContractAddress = localStorage.getItem(KEY_CONTRACT_ADDRESS);
        let senderAddress = localStorage.getItem(KEY_ARBITER_ADDRESS);

        let contract = web3.eth.contract(tenancyContractABI).at(tenancyContractAddress);

        contract.resolveDispute(deductionValue, {from: senderAddress}, defaultCallbackHandler);
    }

    function withdrawTenantDeposit() {
        console.log('tenant withdraws deposit...');

        configureWeb3Provider();

        let tenancyContractAddress = localStorage.getItem(KEY_CONTRACT_ADDRESS);
        let senderAddress = localStorage.getItem(KEY_TENANT_ADDRESS);

        let contract = web3.eth.contract(tenancyContractABI).at(tenancyContractAddress);

        contract.withdrawTenantDeposit({from: senderAddress}, defaultCallbackHandler);
    }

    function withdrawLandlordClaim() {
        console.log('landlord withdraws deduction...');

        configureWeb3Provider();

        let tenancyContractAddress = localStorage.getItem(KEY_CONTRACT_ADDRESS);
        let senderAddress = localStorage.getItem(KEY_LANDLORD_ADDRESS);

        let contract = web3.eth.contract(tenancyContractABI).at(tenancyContractAddress);

        contract.withdrawLandlordClaim({from: senderAddress}, defaultCallbackHandler);
    }

    // --- Solidity Event Handlers ---

    // TODO move this logic (state machine?) out in a separate module/file/package
    function handleStatusChanged(error, statusChangedEvent){
        if (error) {
            console.error("Problem handling StatusChanged event: " + error);
        } else {
            let oldContractStatusIndex = parseInt(""+localStorage.getItem(KEY_STATUS));
            let newStatusIndex = statusChangedEvent.args.statusIndex.c[0];
            let senderAddress = statusChangedEvent.args._from;

            // TODO validate values

            let newContractStatus = getStatus(newStatusIndex);
            let oldContractStatus = getStatus(oldContractStatusIndex);

            let logMsg = "changing status: "+ oldContractStatusIndex + " -> " + newStatusIndex;
            let errMsg = "Invalid new contract status '" + newContractStatus
                + "' when old one is '" + oldContractStatus + "'";

            switch(oldContractStatusIndex) {
                case -1: // N/A
                    switch (newStatusIndex) {
                        case 0: // Booting Up: N/A -> Not Signed
                        {
                            updateStatus(newStatusIndex, logMsg);
                        }
                        default:
                            ignoreStatusChange(errMsg);
                        break;
                    }
                case 0: // Not Signed
                    switch (newStatusIndex) {
                        case 1: // Contract Created: Not Signed -> Deposit Required
                        {
                            updateStatus(newStatusIndex, logMsg);

                            // update UI:
                            updateView(KEY_LANDLORD_ADDRESS, localStorage.getItem(KEY_LANDLORD_ADDRESS));
                            updateView(KEY_TENANT_ADDRESS, localStorage.getItem(KEY_TENANT_ADDRESS));
                            updateView(KEY_ARBITER_ADDRESS, localStorage.getItem(KEY_ARBITER_ADDRESS));
                            updateView(KEY_DEPOSIT, localStorage.getItem(KEY_DEPOSIT));

                            disableElement('contract-landlordAddress');
                            disableElement('contract-tenantAddress');
                            disableElement('contract-arbiterAddress');
                            disableElement('contract-deposit');
                            disableElement('contract-deduction');
                            disableElement('contract-ropstenTestNet');
                            disableElement('documentCreateTenancyDepositContract');

                            enableElement('documentResetTenancyDepositContract');
                            enableElement('documentTenantSignContract');
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                    break;
                case 1: // Deposit Required
                    switch(newStatusIndex)
                    {
                        case 2: // Tenants Signs Contract: Deposit Required -> Active
                        {
                            updateStatus(newStatusIndex, logMsg);

                            // update UI:

                            // landlord ui controls
                            enableElement('documentLandlordTerminateContract');

                            // tenant ui controls
                            disableElement('documentTenantSignContract');
                            enableElement('documentTenantTerminateContract');
                            break;
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                case 2: // Active
                    switch(newStatusIndex)
                    {
                        case 3: // Contract Comes to an End: Active -> Complete
                        {
                            updateStatus(newStatusIndex, logMsg);

                            // update UI:

                            // landlord ui controls
                            enableElement('landlord-deduction');
                            disableElement('documentLandlordTerminateContract');
                            enableElement('documentLandlordClaimDeduction');

                            // tenant ui controls
                            enableElement('tenant-deduction');
                            disableElement('documentTenantTerminateContract');
                            enableElement('documentTenantClaimDeduction');
                            break;
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                case 3: // Complete
                    switch(newStatusIndex)
                    {
                        case 4: // Landlord or Tenant Claimed Deduction: Complete -> Deduction Claiming
                        {
                            handleDeductionClaimingStatusChange(senderAddress, newStatusIndex, logMsg);
                            break;
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                case 4: // Deduction Claiming
                    switch(newStatusIndex)
                    {
                        case 4: // The Second Party Claimed Deduction: Deduction Claiming -> Deduction Claiming
                        {
                            handleDeductionClaimingStatusChange(senderAddress, newStatusIndex, logMsg);
                            break;
                        }
                        case 5: // Both Parties Agreed on Deduction Value: Deduction Claiming -> Deduction Agreed
                        {
                            handleDeductionClaimingStatusChange(senderAddress, newStatusIndex, logMsg);

                            // landlord ui controls
                            enableElement('documentLandlordWithdrawDeduction');

                            // tenant ui controls
                            enableElement('documentTenantWithdrawDeposit');

                            break;
                        }
                        case 6: // The Parties Disagreed on Deduction Value: Deduction Claiming -> Dispute
                        {
                            handleDeductionClaimingStatusChange(senderAddress, newStatusIndex, logMsg);

                            // arbiter ui controls
                            enableElement('arbiter-deduction');
                            enableElement('documentArbiterResolveDispute');

                            break;
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                case 5: // Deduction Agreed
                    switch(newStatusIndex)
                    {
                        case 8: // Tenant or Landlord Withdraws Money: Deduction Agreed -> Money Withdrawal
                        {
                            updateStatus(newStatusIndex, logMsg);
                            break;
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                case 6: // Dispute
                    switch(newStatusIndex)
                    {
                        case 7: // Arbiter Resolves Dispute: Dispute -> Dispute Resolved
                        {
                            updateStatus(newStatusIndex, logMsg);

                            // update UI:

                            // landlord ui controls
                            enableElement('documentLandlordWithdrawDeduction');

                            // tenant ui controls
                            enableElement('documentTenantWithdrawDeposit');

                            // arbiter ui controls
                            disableElement('arbiter-deduction');
                            disableElement('documentArbiterResolveDispute');

                            break;
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                case 7: // Dispute Resolved
                    switch(newStatusIndex)
                    {
                        case 8: // Tenant or Landlord Withdraws Money: DisputeResolved -> Money Withdrawal
                        {
                            updateStatus(newStatusIndex, logMsg);
                            break;
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                case 8: // Money Withdrawal
                    switch(newStatusIndex)
                    {
                        case 9: // The Second Party Withdraws Money: Money Withdrawal -> Done
                        {
                            updateStatus(newStatusIndex, logMsg);
                            break;
                        }
                        default:
                            ignoreStatusChange(errMsg);
                    }
                default:
                    ignoreStatusChange(errMsg);
            }
        }
    }

    function handleDeductionClaimingStatusChange(senderAddress, newStatusIndex, logMsg) {
        updateStatus(newStatusIndex, logMsg);

        // update UI:

        // landlord ui controls
        if (senderAddress.toLowerCase() === (localStorage.getItem(KEY_LANDLORD_ADDRESS).toLowerCase())) {
            disableElement('landlord-deduction');
            disableElement('documentLandlordClaimDeduction');
        }
        // tenant ui controls
        else if (senderAddress.toLowerCase() === (localStorage.getItem(KEY_TENANT_ADDRESS).toLowerCase())) {
            disableElement('tenant-deduction');
            disableElement('documentTenantClaimDeduction');
        }
    }

    function handleBalanceChanged(error, balanceChangedEvent){
        if (error) {
            console.error("Problem handling BalanceChanged event: " + error);
        } else {
            let localBalanceValue = localStorage.getItem(KEY_BALANCE);
            let newBalanceValue = balanceChangedEvent.args.value.c[0];
            // TODO validate new balance value

            if (localBalanceValue != newBalanceValue) {
                console.log('balance changed to: ' + newBalanceValue);

                // update model
                localStorage.setItem(KEY_BALANCE, newBalanceValue);

                // update UI
                updateView(KEY_BALANCE, newBalanceValue);
            } else {
                console.log("Ignoring follow-up balancedChangedEvent.");
            }
        }
    }

    function handleDeductionAgreed(error, deductionAgreedEvent) {
        if (error) {
            console.error("Problem handling DeductionAgreed event: " + error);
        } else {
            let deductionValue = deductionAgreedEvent.args.deduction.c[0];

            localStorage.setItem(KEY_DEDUCTION, deductionValue);
            updateView(KEY_DEDUCTION, deductionValue);
        }
    }

    function handleDisputeResolved(error, disputeResolvedEvent) {
        if (error) {
            console.error("Problem handling DisputeResolved event: " + error);
        } else {
            let deductionValue = disputeResolvedEvent.args.deduction.c[0];

            localStorage.setItem(KEY_DEDUCTION, deductionValue);
            updateView(KEY_DEDUCTION, deductionValue);
        }
    }

    function handleDeductionClaimed(error, deductionClaimedEvent){
        if (error) {
            console.error("Problem handling DeductionClaimed event: " + error);
        } else {
            let senderAddress = deductionClaimedEvent.args._from;
            let deductionClaimValue = deductionClaimedEvent.args.claim.c[0];

            // TODO validate new values

            if (senderAddress.toLowerCase() === localStorage.getItem(KEY_LANDLORD_ADDRESS).toLowerCase()) {
                localStorage.setItem(KEY_LANDLORD_DEDUCTION_CLAIM, deductionClaimValue);
                disableElement('landlord-deduction');
                disableElement('documentLandlordClaimDeduction');
            }
            else if (senderAddress.toLowerCase() === localStorage.getItem(KEY_TENANT_ADDRESS).toLowerCase()) {
                disableElement('tenant-deduction');
                disableElement('documentTenantClaimDeduction');
                localStorage.setItem(KEY_TENANT_DEDUCTION_CLAIM, deductionClaimValue);
            }
        }
    }

    function handleMoneyWithdrawn(error, moneyWithdrawnEvent) {
        if (error) {
            console.error("Problem handling DeductionClaimed event: " + error);
        } else {
            let senderAddress = moneyWithdrawnEvent.args._from;

            // landlord ui controls
            if (senderAddress.toLowerCase() === (localStorage.getItem(KEY_LANDLORD_ADDRESS).toLowerCase())) {
                disableElement('documentLandlordWithdrawDeduction');
            }
            // tenant ui controls
            else if (senderAddress.toLowerCase() === (localStorage.getItem(KEY_TENANT_ADDRESS).toLowerCase())) {
                disableElement('documentTenantWithdrawDeposit');
            }
        }
    }

    // --- Header Links Handlers ---

    $('#linkHome').click(function () {
        showView("viewHome");
    });

    $('#linkCreateWallet').click(function () {
        showView("viewCreateWallet");
    });

    $('#linkLoadWallet').click(function () {
        showView("viewLoadWallet");
    });

    $('#linkViewBalance').click(function () {
        showView("viewBalance");
    });

    $('#linkSendTransaction').click(function () {
        showView("viewSendTransaction");
    });

    $('#linkContractDetails').click(function () {
        showView("viewContractDetails");
    });

    $('#linkContractAdd').click(function () {
        showView("viewContractAdd");
    });

    $('#linkLandlord').click(function () {
        showView("viewLandlord")
    });

    $('#linkTenant').click(function () {
        showView("viewTenant")
    });

    $('#linkArbiter').click(function () {
        showView("viewArbiter")
    });

    // --- Button Handlers ---

    $('#documentCreateWallet').click(createWallet);
    $('#documentLoadWallet').click(loadWallet);
    $('#documentViewBalance').click(viewBalance);
    $('#documentSignTransaction').click(signTransaction);
    $('#documentSendTransaction').click(sendTransaction);



    $('#documentCreateTenancyDepositContract').click(createTenancyDepositContractData);

    $('#documentTenantSignContract').click(tenantSignContract);

    $('#documentLandlordTerminateContract').click(landlordTerminateContract);

    $('#documentTenantTerminateContract').click(tenantTerminateContract);

    $('#documentLandlordClaimDeduction').click(landlordClaimDeduction);

    $('#documentTenantClaimDeduction').click(tenantClaimDeduction);

    $('#documentArbiterResolveDispute').click(arbiterResolvesDispute);

    $('#documentLandlordWithdrawDeduction').click(withdrawLandlordClaim);

    $('#documentTenantWithdrawDeposit').click(withdrawTenantDeposit);

    $('#documentResetTenancyDepositContract').click(resetTenancyDepositContractData);

    // --- Helper Functions ---

    function configureWeb3Provider() {
        if (isRopstenTestNet) {
            if (typeof web3 === 'undefined') {
                return showError("Please install MetaMask to access the Ethereum Web3 API from your web browser");
            }
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
    }

    function getStatus(statusIndex) {
        const ContractStatus = [
            "Not Signed",
            "Deposit Required",
            "Active" ,
            "Complete",
            "Deduction Claiming" ,
            "Deduction Agreed",
            "Dispute",
            "Dispute Resolved",
            "Money Withdrawal",
            "Done"
        ];
        if (statusIndex < 0 || statusIndex >= ContractStatus.length) {
            return "N/A";
        }
        return ContractStatus[statusIndex];
    }

    function defaultCallbackHandler(error, result) {
        if(error) {
            console.error(error);
        } else {
            // console.log(result);
        }
    }

    function ignoreStatusChange(errMsg) {
        // console.log(errMsg);
    }

    function updateStatus(newStatusIndex, logMsg) {
        console.log(logMsg);

        // update model:
        localStorage.setItem(KEY_STATUS, newStatusIndex);

        // update UI:
        updateView(KEY_STATUS, getStatus(newStatusIndex));

    }

    function resetTenancyDepositContractData() {
        console.log("cleanup...");

        (function resetView() {
            updateView(KEY_LANDLORD_ADDRESS, "");
            updateView(KEY_TENANT_ADDRESS, "");
            updateView(KEY_ARBITER_ADDRESS, "");
            updateView(KEY_DEPOSIT, "");
            updateView(KEY_DEDUCTION, "");
            updateView(KEY_BALANCE, "");
            updateView(KEY_STATUS, "N/A");
            $('#contract-ropstenTestNet').prop('checked', false);

            // reset tenancy deposit agreement controls
            enableElement('contract-landlordAddress');
            enableElement('contract-tenantAddress');
            enableElement('contract-arbiterAddress');
            enableElement('contract-deposit');
            enableElement('contract-ropstenTestNet');
            enableElement('documentCreateTenancyDepositContract');
            enableElement('documentResetTenancyDepositContract');

            // disable landlord ui controls
            disableElement('documentLandlordTerminateContract');
            disableElement('documentLandlordClaimDeduction');
            disableElement('documentLandlordWithdrawDeduction');

            // disable tenant ui controls
            disableElement('documentTenantSignContract');
            disableElement('documentTenantTerminateContract');
            disableElement('documentTenantClaimDeduction');
            disableElement('documentTenantWithdrawDeposit');

            // disable arbiter ui controls
            disableElement('documentArbiterResolveDispute');
        })();

        // reset local storage
        if (typeof(Storage) !== "undefined") {
            localStorage.clear();
            localStorage.setItem(KEY_STATUS, -1);
        } else {
            // TODO make it visible
            console.error("no local storage support...");
        }
    }

    function isRopstenTestNet() {
        return JSON.parse(localStorage.getItem(KEY_IS_ROPSTEN)) === true;
    }

    function updateView(key, value) {
        $('#' + key).val(value);
        $('#contract-' + key).val(value);
        $('#landlord-' + key).val(value);
        $('#tenant-' + key).val(value);
        $('#arbiter-' + key).val(value);
    }

    function enableElement(key) {
        $('#'+key).prop("disabled", false);
    }

    function disableElement(key) {
        $('#'+key).prop("disabled", true);
    }

// Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showInfo(message) {
        $('#infoBox>p').html(message);
        $('#infoBox').show();
        $('#infoBox>header').click(function () {
            $('#infoBox').hide();
        });
    }

    function showError(errorMsg) {
        $('#errorBox>p').html("Error: " + errorMsg);
        $('#errorBox').show();
        $('#errorBox>header').click(function () {
            $('#errorBox').hide();
        });
    }
});


