'use strict';

const Crypto = require('../../models/Crypto')

class TransactionHash {

    constructor(transaction) {
        let transactionPayload = JSON.stringify(transaction);
        this.transactionHash = Crypto.signSHA256(transactionPayload);
    }
}

module.exports = TransactionHash;
