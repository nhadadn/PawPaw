"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
// Mock Redis implementation for environments without Redis
class MockRedis {
    constructor() {
        this.store = new Map();
    }
    async get(key) {
        return this.store.get(key) || null;
    }
    async set(key, value, ...args) {
        this.store.set(key, value);
        return 'OK';
    }
    async del(key) {
        return this.store.delete(key) ? 1 : 0;
    }
    async setex(key, seconds, value) {
        this.store.set(key, value);
        return 'OK';
    }
    async eval(...args) {
        return null;
    }
    on(event, callback) {
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
}
// Check if we should use real Redis or Mock
const useRealRedis = process.env.USE_REAL_REDIS === 'true';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = useRealRedis ? new ioredis_1.default(redisUrl) : new MockRedis();
exports.default = redis;
