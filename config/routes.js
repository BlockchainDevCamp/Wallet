'use strict';

const controllers = require('../controllers');
const middlewares = require('../middlewares');

module.exports = app => {

    // executed every time `:address` is found in the path; before any controller
    app.param('address', middlewares.walletFilter.retrieveWalletByAddress);

    // lower environments only
    app.get("/wallets/:address", controllers.walletResource.retrieveWalletByAddress);

    app.post('/wallets/:address/transactions', [
        controllers.transactionResource.validateTransactionData,
        controllers.transactionResource.createTransaction
    ]);

    app.use(controllers.errorHandler.handle);

    app.all('*', (req, res) => {

        res.status(404);
        res.send('404 Not Found');
        res.end();
    });
};