'use strict';

const WalletRepository = require('../models/wallet/WalletRepository')

module.exports = {

    retrieveWalletByAddress(request, response, next, address) {
        if (!address || address.length != 40) {
            next(new Error("Invalid address."));
        }
        else {
            let wallet = WalletRepository.walletByAddress(address);
            if (!wallet) {
                next(new Error("WalletRepository not found."));
            } else {
                request.wallet = wallet;
                next();
            }
        }
    }
};
