const env = process.env.NODE_ENV || 'development';
const config = require('./config/config')[env];
const app = require('express')();
require('./config/express')(app);
require('./config/routes')(app);
app.listen(config.port);

let Wallet = require('./models/wallet/Wallet');
let WalletRepository = require('./models/wallet/WalletRepository');
let sender = Wallet.loadWallet('83c017f19187ac6859f6a312357cc4733ceef1e44644fd5c91353bcbd5e2618a');
let receiver = Wallet.loadWallet('59f4f7b5d2ee51b9a1653752d3669f5846029171cb8c4c84e5f24745d29bf1e0');
WalletRepository.addWallet(sender);
WalletRepository.addWallet(receiver);


console.log("Listening on port: " + config.port)