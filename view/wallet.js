$(document).ready(function () {


    // --- Main UI Functions ---

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
        let signedTransactionPayload = JSON.parse($('#walletTransactionSigned').val());
        $.post("/wallets/" + txSender + "/transactions/send", signedTransactionPayload)
            .then(function (signedTransaction) {
                let sentTransactionInfo = "Transaction successfully sent. \n" +
                    "Transaction hash: " + signedTransaction.transactionHash;
                $('#walletTransactionSent').val(sentTransactionInfo);
            })
            .catch(function (err) {
                console.error(err);
            });
    };


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

    // --- Button Handlers ---

    $('#documentCreateWallet').click(createWallet);
    $('#documentLoadWallet').click(loadWallet);
    $('#documentViewBalance').click(viewBalance);
    $('#documentSignTransaction').click(signTransaction);
    $('#documentSendTransaction').click(sendTransaction);

    // --- Helper Functions ---

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


