"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    // Allow bypassing auth in test environment
    if (process.env.NODE_ENV === 'test') {
        const testRole = req.headers['x-test-role'] || 'user';
        req.user = {
            id: 'user-123',
            email: 'test@example.com',
            role: testRole
        };
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const secret = process.env.JWT_SECRET || 'changeme_jwt_secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = {
            id: decoded.id || decoded.user_id || decoded.sub || '',
            email: decoded.email || '',
            role: decoded.role || ''
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
