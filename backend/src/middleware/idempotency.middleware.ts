import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis';
import logger from '../lib/logger';

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
        const cached = await redis.get(redisKey);
        if (cached) {
            const parsed = JSON.parse(cached) as {
                statusCode: number;
                body: unknown;
                headers?: Record<string, string>;
            };
            if (parsed.headers) {
                Object.entries(parsed.headers).forEach(([k, v]) => {
                     if (k.toLowerCase() !== 'content-length' && v !== undefined) {
                         res.setHeader(k, v as string);
                     }
                });
            }
            return res.status(parsed.statusCode).send(parsed.body);
        }

        const originalSend = res.send.bind(res);

        res.send = function (body: unknown): Response {
            const payload = {
                statusCode: res.statusCode,
                body: body,
                headers: res.getHeaders()
            };
            
            // We store the body. If it's an object (res.json called), Express passes it here stringified?
            // Wait. res.json calls res.send(string). 
            // So body here is likely string if json was used.
            // If we store it, we can send it back.
            
            redis.set(redisKey, JSON.stringify(payload), 'EX', IDEMPOTENCY_TTL_SECONDS)
                .catch(err => logger.error('Failed to save idempotency key', { error: err }));

            return originalSend(body as never);
        };
        
        next();
    } catch (err) {
        logger.error('Idempotency error', { error: err });
        next();
    }
};
