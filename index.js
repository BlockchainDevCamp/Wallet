const env = process.env.NODE_ENV || 'development';
const config = require('./config/config')[env];
const app = require('express')();
require('./config/express')(app);
require('./config/routes')(app);
app.listen(config.port);

let Wallet = require('./models/wallet/Wallet');
let WalletRepository = require('./models/wallet/WalletRepository');

console.log("Listening on port: " + config.port)