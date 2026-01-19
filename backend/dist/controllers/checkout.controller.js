"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutController = void 0;
const zod_1 = require("zod");
const checkout_service_1 = require("../services/checkout.service");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../lib/logger"));
const ReserveSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        product_variant_id: zod_1.z.number().positive(),
        quantity: zod_1.z.number().positive()
    })).nonempty()
});
const ConfirmSchema = zod_1.z.object({
    reservation_id: zod_1.z.string().uuid(),
    payment_intent_id: zod_1.z.string().startsWith('pi_')
});
const CancelSchema = zod_1.z.object({
    reservation_id: zod_1.z.string().uuid()
});
const StatusParamsSchema = zod_1.z.object({
    reservation_id: zod_1.z.string().uuid()
});
class CheckoutController {
    constructor() {
        this.reserve = async (req, res) => {
            try {
                const validated = ReserveSchema.parse(req.body);
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
                }
                const result = await this.service.reserve(userId, validated.items);
                return res.status(201).json(result);
            }
            catch (error) {
                this.handleError(res, error);
            }
        };
        this.confirm = async (req, res) => {
            try {
                const validated = ConfirmSchema.parse(req.body);
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
                }
                const result = await this.service.confirm(userId, validated.reservation_id, validated.payment_intent_id);
                return res.status(200).json(result);
            }
            catch (error) {
                this.handleError(res, error);
            }
        };
        this.cancel = async (req, res) => {
            try {
                const validated = CancelSchema.parse(req.body);
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
                }
                const result = await this.service.cancel(userId, validated.reservation_id);
                return res.status(200).json(result);
            }
            catch (error) {
                this.handleError(res, error);
            }
        };
        this.status = async (req, res) => {
            try {
                const params = StatusParamsSchema.parse(req.params);
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
                }
                const result = await this.service.getStatus(userId, params.reservation_id);
                return res.status(200).json(result);
            }
            catch (error) {
                this.handleError(res, error);
            }
        };
        this.service = new checkout_service_1.CheckoutService();
    }
    handleError(res, error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Validation failed', details: error.errors });
        }
        if (error instanceof errors_1.CheckoutError) {
            const statusMap = {
                'ACTIVE_RESERVATION_EXISTS': 409,
                'INSUFFICIENT_STOCK': 409,
                'MAX_PER_CUSTOMER_EXCEEDED': 409,
                'PRODUCT_VARIANT_NOT_FOUND': 400,
                'RESERVATION_NOT_FOUND': 404,
                'RESERVATION_EXPIRED': 404,
                'PAYMENT_FAILED': 402,
                'ORDER_ALREADY_CONFIRMED': 409,
                'RESERVATION_USER_MISMATCH': 403, // Default to 403
            };
            let status = statusMap[error.code] || 500;
            // Override for Confirm endpoint to match specific contract 409
            if (error.code === 'RESERVATION_USER_MISMATCH' && res.req.path.includes('/confirm')) {
                status = 409;
            }
            return res.status(status).json({ error: error.code, message: error.message });
        }
        logger_1.default.error('Unexpected error', { error });
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
    }
}
exports.CheckoutController = CheckoutController;
