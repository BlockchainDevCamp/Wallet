'use strict';

const Wallet = require('../../models/wallet/Wallet');
const WalletInfo = require('./WalletInfo');
const WalletRepository = require('../../models/wallet/WalletRepository');

const Request = require('request');

function handleWalletCreation(request, response, wallet) {
    let walletInfo = new WalletInfo(wallet.privateKey, wallet.compressedPublicKey, wallet.address);
    let status = 200;

    if (!WalletRepository.walletByAddress(wallet.address)) {
        WalletRepository.addWallet(wallet);
        status = 201;
    }

    response.status(status);
    response.set('Content-Type', 'application/json');
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    response.send(walletInfo);
}

module.exports = {

    retrieveWalletByAddress(request, response) {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error("Not Found.");
        }
        response.set('Content-Type', 'application/json');
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        response.send(request.wallet);
    },

    createWallet(request, response) {
        let wallet = Wallet.createWallet();
        handleWalletCreation(request, response, wallet);
    },

    loadWallet(request, response) {
        let privateKey = request.body['privateKey'];
        let wallet = Wallet.loadWallet(privateKey);
        handleWalletCreation(request, response, wallet);
    },

    retrieveWalletBalance: async (request, response) => {
        let options = {
            method: 'get',
            json: true,
            // TODO: move to a configuration
            url: "http://localhost:5555/addresses/" + request.wallet.address + "/balance",
        };

        await Request(options, function (err, res, balance) {
            if (err) {
                throw Error("Error: " + err.getMessage());
            }
            response.set('Content-Type', 'application/json');
            response.header("Access-Control-Allow-Origin", "*");
            response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            response.send(balance);
        });

    }
};

