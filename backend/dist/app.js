"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const webhook_service_1 = require("./services/webhook.service");
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const notFound_middleware_1 = require("./middleware/notFound.middleware");
// Handle BigInt serialization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
BigInt.prototype.toJSON = function () {
    return this.toString();
};
const morgan_1 = __importDefault(require("morgan"));
const shop_routes_1 = __importDefault(require("./routes/shop.routes"));
const checkout_routes_1 = __importDefault(require("./routes/checkout.routes"));
const recovery_routes_1 = require("./routes/recovery.routes");
const admin_routes_1 = require("./routes/admin.routes");
const health_1 = __importDefault(require("./routes/health"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const prisma_1 = __importDefault(require("./lib/prisma"));
const redis_1 = __importDefault(require("./lib/redis"));
const stripe_1 = __importDefault(require("./lib/stripe"));
const logger_1 = __importDefault(require("./lib/logger"));
const express_prom_bundle_1 = __importDefault(require("express-prom-bundle"));
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const createApp = () => {
    const app = (0, express_1.default)();
    // Trust proxy is required when running behind a load balancer (like Railway/Heroku/AWS ELB)
    // to correctly identify client IP addresses for rate limiting and logging
    app.set('trust proxy', 1);
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    const envOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim());
    // Explicitly add production domains to ensure they are always allowed
    const allowedOrigins = [
        ...envOrigins,
        'https://pawpawtrc.com',
        'https://www.pawpawtrc.com',
        'https://pawpaw-production-d636.up.railway.app',
    ];
    logger_1.default.info(`CORS configured with allowed origins: ${allowedOrigins.join(', ')}`);
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, or server-to-server webhooks)
            if (!origin)
                return callback(null, true);
            // Check for wildcard '*' to allow any origin (use with caution in production)
            if (allowedOrigins.includes('*')) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else if (origin.endsWith('.vercel.app')) {
                // Allow Vercel preview deployments dynamically
                callback(null, true);
            }
            else {
                logger_1.default.warn(`CORS blocked for origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'idempotency-key',
        ],
    }));
    // Prometheus metrics middleware
    const metricsMiddleware = (0, express_prom_bundle_1.default)({
        includeMethod: true,
        includePath: true,
        includeStatusCode: true,
        includeUp: true,
        customLabels: { project_name: 'pawpaw', project_version: '1.0.0' },
        metricsPath: '/metrics',
        autoregister: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use(metricsMiddleware);
    // Apply Global Rate Limiter
    app.use(rateLimit_middleware_1.globalLimiter);
    const webhookService = new webhook_service_1.WebhookService();
    app.post('/api/webhooks/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
        const signature = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            logger_1.default.error('STRIPE_WEBHOOK_SECRET is not configured');
            return res.status(500).send('Webhook not configured');
        }
        if (!signature || typeof signature !== 'string') {
            return res.status(400).send('Missing stripe-signature header');
        }
        let event;
        try {
            event = stripe_1.default.webhooks.constructEvent(req.body, signature, webhookSecret);
        }
        catch (err) {
            logger_1.default.error('Stripe webhook signature verification failed', { error: err });
            const message = err instanceof Error ? err.message : 'Unknown error';
            return res.status(400).send(`Webhook Error: ${message}`);
        }
        try {
            await webhookService.handleEvent(event);
            return res.json({ received: true });
        }
        catch (err) {
            logger_1.default.error('Stripe webhook handling error', { error: err });
            return res.status(500).send('Webhook handling error');
        }
    });
    app.use(express_1.default.json());
    const uploadDir = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads');
    app.use('/uploads', express_1.default.static(uploadDir));
    logger_1.default.info(`Serving static files from: ${uploadDir}`);
    if (process.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
    // Root endpoint for health checks
    app.get('/', (_req, res) => {
        res.status(200).send('PawPaw Backend API is running');
    });
    app.get('/health', async (req, res) => {
        try {
            await prisma_1.default.$queryRaw `SELECT 1`;
            await redis_1.default.ping();
            res.json({ status: 'ok' });
        }
        catch (error) {
            res.status(500).json({ status: 'error', details: String(error) });
        }
    });
    // Specific Rate Limiters
    app.use('/api/checkout', rateLimit_middleware_1.checkoutLimiter);
    app.use('/api/auth/login', rateLimit_middleware_1.authLimiter);
    app.use('/api/auth/register', rateLimit_middleware_1.authLimiter);
    app.use('/api/admin/login', rateLimit_middleware_1.authLimiter);
    app.use('/api', shop_routes_1.default);
    app.use('/api/checkout', checkout_routes_1.default);
    app.use('/api/recovery', recovery_routes_1.recoveryRouter);
    app.use('/api/admin', admin_routes_1.adminRoutes);
    app.use('/api', health_1.default);
    // 404 Handler
    app.use(notFound_middleware_1.notFoundHandler);
    // Global Error Handler
    app.use(errorHandler_middleware_1.errorHandler);
    return app;
};
exports.createApp = createApp;
