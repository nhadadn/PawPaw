"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
class MockRedis {
    constructor() {
        this.store = new Map();
        this.cleanupInterval = null;
        // Active expiration: Periodic cleanup every 1s
        // Using unref() to prevent blocking process exit (e.g. in tests)
        this.cleanupInterval = setInterval(() => {
            this.pruneExpired();
        }, 1000);
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }
    // Scan all keys to remove expired ones (Active Expiration)
    pruneExpired() {
        const now = Date.now();
        for (const [key, item] of this.store) {
            if (item.expiresAt && now > item.expiresAt) {
                this.store.delete(key);
            }
        }
    }
    // Helper to check and remove expired keys (Lazy Expiration)
    checkExpiration(key) {
        const item = this.store.get(key);
        if (item && item.expiresAt && Date.now() > item.expiresAt) {
            this.store.delete(key);
            return true;
        }
        return false;
    }
    async get(key) {
        if (this.checkExpiration(key)) {
            return null;
        }
        const item = this.store.get(key);
        return item ? item.value : null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async set(key, value, ...args) {
        let expiresAt;
        // Handle options like 'EX', 10
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === 'string' && args[i].toUpperCase() === 'EX') {
                const seconds = args[i + 1];
                if (typeof seconds === 'number') {
                    expiresAt = Date.now() + seconds * 1000;
                }
            }
        }
        this.store.set(key, { value, expiresAt });
        return 'OK';
    }
    async setex(key, seconds, value) {
        const expiresAt = Date.now() + seconds * 1000;
        this.store.set(key, { value, expiresAt });
        return 'OK';
    }
    async del(key) {
        return this.store.delete(key) ? 1 : 0;
    }
    async ttl(key) {
        if (this.checkExpiration(key)) {
            return -2;
        }
        const item = this.store.get(key);
        if (!item) {
            return -2;
        }
        if (!item.expiresAt) {
            return -1;
        }
        const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }
    async expire(key, seconds) {
        if (this.checkExpiration(key)) {
            return 0;
        }
        const item = this.store.get(key);
        if (!item) {
            return 0;
        }
        item.expiresAt = Date.now() + seconds * 1000;
        this.store.set(key, item);
        return 1;
    }
    async keys(pattern) {
        const keys = [];
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const [key] of this.store) {
            if (this.checkExpiration(key)) {
                continue;
            }
            if (regex.test(key)) {
                keys.push(key);
            }
        }
        return keys;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async eval(..._args) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    on(_event, _callback) {
        // No-op
        return this;
    }
    async quit() {
        return 'OK';
    }
    async disconnect() {
        // No-op
    }
    async ping() {
        return 'PONG';
    }
    // Set operations (Mock implementation)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async sadd(_key, ..._members) {
        // Basic mock: just return 1 to simulate success
        return 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async srem(_key, ..._members) {
        return 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async smembers(_key) {
        return [];
    }
    // Sorted Set operations (Mock implementation)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async zadd(_key, ..._args) {
        return 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async zrem(_key, ..._members) {
        return 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async zrangebyscore(_key, _min, _max) {
        return [];
    }
    // Multi/Pipeline (Mock implementation)
    multi() {
        return {
            set: () => this.multi(),
            get: () => this.multi(),
            del: () => this.multi(),
            sadd: () => this.multi(),
            srem: () => this.multi(),
            zadd: () => this.multi(),
            zrem: () => this.multi(),
            exec: async () => [['ok', 'OK']],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        };
    }
}
// Check if we should use real Redis or Mock
const useRealRedis = !!process.env.REDIS_URL;
if (useRealRedis && !process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required when Redis is enabled');
}
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = useRealRedis ? new ioredis_1.default(redisUrl) : new MockRedis();
exports.default = redis;
