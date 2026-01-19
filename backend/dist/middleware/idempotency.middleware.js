"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = void 0;
const redis_1 = __importDefault(require("../lib/redis"));
const logger_1 = __importDefault(require("../lib/logger"));
const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;
const idempotencyMiddleware = async (req, res, next) => {
    const key = req.header('Idempotency-Key');
    if (!key) {
        return next();
    }
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return next();
    }
    const redisKey = `idempotency:${key}`;
    try {
        const cached = await redis_1.default.get(redisKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.headers) {
                Object.entries(parsed.headers).forEach(([k, v]) => {
                    if (k.toLowerCase() !== 'content-length' && v !== undefined) {
                        res.setHeader(k, v);
                    }
                });
            }
            return res.status(parsed.statusCode).send(parsed.body);
        }
        const originalSend = res.send.bind(res);
        res.send = function (body) {
            const payload = {
                statusCode: res.statusCode,
                body: body,
                headers: res.getHeaders()
            };
            // We store the body. If it's an object (res.json called), Express passes it here stringified?
            // Wait. res.json calls res.send(string). 
            // So body here is likely string if json was used.
            // If we store it, we can send it back.
            redis_1.default.set(redisKey, JSON.stringify(payload), 'EX', IDEMPOTENCY_TTL_SECONDS)
                .catch(err => logger_1.default.error('Failed to save idempotency key', { error: err }));
            return originalSend(body);
        };
        next();
    }
    catch (err) {
        logger_1.default.error('Idempotency error', { error: err });
        next();
    }
};
exports.idempotencyMiddleware = idempotencyMiddleware;
