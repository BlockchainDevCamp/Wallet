'use strict';

// TODO add security (wallet instance encryption/decryption, salt, etc.)
// TODO add synchronisation (unless external data source is not used)

const walletsStorageByAddress = new Map();

class WalletRepository {

    static addWallet(wallet) {
        if (!wallet) {
            throw new Error("Invalid wallet.");
        }
        if (walletsStorageByAddress.has(wallet.address)) {
            throw new Error("Wallet already exists.");
        }
        walletsStorageByAddress[wallet.address] = wallet;
    }

    static walletByAddress(address) {
        if (!address) {
            throw new Error("Invalid wallet address.")
        }
        return walletsStorageByAddress[address];
    }
}

module.exports = WalletRepository;
