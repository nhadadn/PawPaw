"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// Handle BigInt serialization
BigInt.prototype.toJSON = function () {
    return this.toString();
};
const morgan_1 = __importDefault(require("morgan"));
const checkout_routes_1 = __importDefault(require("./routes/checkout.routes"));
const admin_routes_1 = require("./routes/admin.routes");
const health_1 = __importDefault(require("./routes/health"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const prisma_1 = __importDefault(require("./lib/prisma"));
const redis_1 = __importDefault(require("./lib/redis"));
const stripe_1 = __importDefault(require("./lib/stripe"));
const logger_1 = __importDefault(require("./lib/logger"));
const express_prom_bundle_1 = __importDefault(require("express-prom-bundle"));
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
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
    app.use(metricsMiddleware);
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
            const stripeEvent = event;
            switch (stripeEvent.type) {
                case 'payment_intent.succeeded':
                    logger_1.default.info('Stripe payment_intent.succeeded', { id: stripeEvent.data.object.id });
                    break;
                case 'payment_intent.payment_failed':
                    logger_1.default.warn('Stripe payment_intent.payment_failed', { id: stripeEvent.data.object.id });
                    break;
                default:
                    logger_1.default.info('Unhandled Stripe event type', { type: stripeEvent.type });
            }
            return res.json({ received: true });
        }
        catch (err) {
            logger_1.default.error('Stripe webhook handling error', { error: err });
            return res.status(500).send('Webhook handling error');
        }
    });
    app.use(express_1.default.json());
    app.use((0, morgan_1.default)('dev'));
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
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
    app.use('/api/checkout', checkout_routes_1.default);
    app.use('/api/admin', admin_routes_1.adminRoutes);
    app.use('/api', health_1.default);
    return app;
};
exports.createApp = createApp;
