'use strict';

const walletResource = require('./wallet/WalletController');
const transactionResource = require('./transaction/TransactionController');
const errorHandler = require('./ErrorHandler')

module.exports = {
    walletResource,
    transactionResource,
    errorHandler
};