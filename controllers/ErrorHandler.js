'use strict';

module.exports = {

    handle(err, request, response, next) {

        console.error(err);

        // TODO find a more elegant way for error handling - Error/Exception classes / Error Types etc.
        switch (err.message) {
            case "Invalid address.":
            case "Invalid sender address.":
            case "Invalid sender public key.":
            case "Invalid recipient address.":
            case "Invalid transaction amount.":
            case "Invalid transaction fee.":
            case "Wallet already exists.":
            case "Compromised transaction.":
                response.status(400);
                break;
            case "Wallet not found.":
                response.status(404);
                break;
            default:
                response.status(500);
                break;
        }

        let error = new Error();
        error.message = err.message;

        response.send(JSON.stringify(error));
    }

};