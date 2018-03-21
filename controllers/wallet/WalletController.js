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
    response.send(walletInfo);
}

module.exports = {

    retrieveWalletByAddress(request, response) {
        if (process.env.NODE_ENV !== 'development') {
            next(new Error("Not Found."));
            return;
        }
        response.set('Content-Type', 'application/json');
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
            response.send(balance);
        });

    }
};

