'use strict';

class WalletInfo {

    //TODO Create constructor/builder/factory method which generates public AND private key on behalf of the user

    constructor(privateKeyStr, compressedPublicKey, address) {
        this.privateKey = privateKeyStr;
        this.publicKey = compressedPublicKey;
        this.address = address;
    }
}

module.exports = WalletInfo;
