const env = process.env.NODE_ENV || 'development';

const Wallet = require('./models/wallet/Wallet');
const WalletRepo = require('./models/wallet/WalletRepository');

let wallet = Wallet.createWallet('7e4670ae70c98d24f3662c172dc510a085578b9ccc717e6c2f4e547edd960a34');
WalletRepo.addWallet(wallet);

const config = require('./config/config')[env];
const app = require('express')();
require('./config/express')(app);
require('./config/routes')(app);
app.listen(config.port);
console.log("Listening on port: " + config.port)