'use strict';

const Wallet = require('../../models/wallet/Wallet');
const WalletRepository = require('../../models/wallet/WalletRepository');
module.exports = {

    retrieveWalletByAddress(request, response) {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error("Not Found.");
        }
        response.set('Content-Type', 'application/json');
        response.send(request.wallet);
    },

    loadWallet(request, response) {
        let privateKey = request.body['privateKey'];
        let wallet = Wallet.loadWallet(privateKey);
        let walletInfo = {
            privateKey: wallet.privateKey,
            publicKey: wallet.compressedPublicKey,
            address: wallet.address
        };
        let status = 200;

        if (!WalletRepository.walletByAddress(wallet.address)) {
            WalletRepository.addWallet(wallet);
            status = 201;
        }

        response.status(status);
        response.set('Content-Type', 'application/json');
        response.send(walletInfo);
    }
};
