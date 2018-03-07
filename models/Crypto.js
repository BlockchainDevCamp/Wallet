'use strict';

const BigInteger = require("big-integer");
const utf8 = require('utf8');
const EC = require('elliptic').ec;
const RipeMD160 = require('ripemd160');
const hash = require('hash.js');

// Create and initialize EC context
const secp256k1Curve = new EC('secp256k1');

// secp256k1Curve Elliptic Curve's G point
const G = secp256k1Curve.g;

class Crypto {

    // 256-bit number / 64 hex digits
    static createPrivateKey() {
        // TODO: try to implement the generation of private key on your own
        return secp256k1Curve.genKeyPair().priv.toString(16);
    }

    static derivePublicKey(privateKeyString) {

        // point P = k * G
        return G.mul(privateKeyString);
    }

    static derivePublicKeyFromCompressedPublicKey(compressedPublicKey) {
        let publicKeyXHex = compressedPublicKey.substring(0, compressedPublicKey.length - 1);
        let odd = compressedPublicKey.substring(compressedPublicKey.length - 1);

        let publicKeyPoint = secp256k1Curve.curve.pointFromX(publicKeyXHex, odd);

        return secp256k1Curve.keyFromPublic(publicKeyPoint, 'hex');
    }

    // hex(publicKey.x) + compressed(publicKey.y)
    static compressPublicKey(publicKey) {
        let publicKeyCompressedYCoordinate = Crypto.isOdd(BigInteger(publicKey.y)) ? 1 : 0;
        let publicKeyXCoordinateHex = BigInteger(publicKey.x).toString(16);

        return publicKeyXCoordinateHex + publicKeyCompressedYCoordinate;
    }

    // address derived from the public key compacted to 40 symbols (RipeMD160)
    static createAddress(compressedPublicKey) {

        // let publicKeySha256Value = hash.sha256().update(publicKeyCompressed).digest('hex');
        // let senderAddress = new RipeMD160().update(publicKeySha256Value).digest('hex');

        let address = new RipeMD160().update(compressedPublicKey).digest('hex');

        return address;
    }

    static isOdd(bigInteger) {

        // https://en.wikipedia.org/wiki/Most_significant_bit
        // The Most Significant Bit can also correspond to the sign bit of a signed binary number in one's or two's
        // complement notation, "1" meaning negative and "0" meaning positive.
        return !bigInteger[0];
    };

    static signSHA256(transactionPayload) {
        if (!transactionPayload) {
            throw new Error("Invalid transaction payload.");
        }

        // remove whitespaces
        let transactionPayloadWithoutWhiteSpaces = transactionPayload.replace(/[\s]/g, "");

        // Transaction hash for signing (SHA-256)
        let transactionPayloadHash = hash.sha256().update(utf8.encode(transactionPayloadWithoutWhiteSpaces)).digest('hex');

        return transactionPayloadHash;
    }

    static createTransactionSignature(privateKeyStr, transactionPayloadHash) {
        let privateKey = secp256k1Curve.keyFromPrivate(privateKeyStr, 'hex');

        // Using deterministic ECDSA signature, based on the curve secp256k1and RFC-6979 with HMAC-SHA256
        let transactionSignature = privateKey.sign(transactionPayloadHash);

        return [transactionSignature.r, transactionSignature.s];
    }

    static verifySignature(compressedPublicKey, payloadHash, existingSignature) {
        let publicKey = Crypto.derivePublicKeyFromCompressedPublicKey(compressedPublicKey);
        return publicKey.verify(payloadHash, existingSignature);
    }
}

module.exports = Crypto;
