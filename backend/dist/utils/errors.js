"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutError = void 0;
class CheckoutError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'CheckoutError';
    }
}
exports.CheckoutError = CheckoutError;
