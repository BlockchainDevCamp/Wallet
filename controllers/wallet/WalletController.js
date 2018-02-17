'use strict';

const Wallet = require('../../models/wallet/Wallet')

module.exports = {

    retrieveWalletByAddress(request, response) {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error("Not Found.");
        }
        response.set('Content-Type', 'application/json');
        response.send(request.wallet);
    }
};