"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    // In development/test we might not have it, but for production it's critical.
    // We'll warn or throw depending on strictness. For now, let's allow it to fail at runtime if used.
    console.warn('STRIPE_SECRET_KEY is missing from environment variables');
}
const stripe = new stripe_1.default(stripeSecretKey || '', {
    apiVersion: '2023-10-16',
    typescript: true,
});
exports.default = stripe;
