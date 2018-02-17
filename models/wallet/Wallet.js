// 'use strict';

const Crypto = require('../Crypto');

class Wallet {

    //TODO Create constructor/builder/factory method which generates public AND private key on behalf of the user

    constructor(privateKeyStr, publicKey, compressedPublicKey, address) {
        this.privateKey = privateKeyStr;
        this.publicKey = publicKey;
        this.compressedPublicKey = compressedPublicKey;
        this.address = address;
    }

    static createWallet(privateKeyStr) {
        if (!privateKeyStr) {
            throw new Error("Missing private key.");
        }

        let publicKey = Crypto.derivePublicKey(privateKeyStr);
        let compressedPublicKey = Crypto.compressPublicKey(publicKey);
        let address = Crypto.createAddress(compressedPublicKey);

        return new Wallet(privateKeyStr, publicKey, compressedPublicKey, address);
    }
}

module.exports = Wallet;