"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const logger_1 = __importDefault(require("./lib/logger"));
const inventory_socket_1 = require("./websocket/inventory.socket");
const expiration_scheduler_1 = require("./scheduler/expiration.scheduler");
const webhookCleanup_1 = require("./scheduler/webhookCleanup");
const abandonedCartRecovery_job_1 = require("./scheduler/abandonedCartRecovery.job");
const port = process.env.PORT || 4000;
const startServer = async () => {
    const app = (0, app_1.createApp)();
    // Create HTTP server to support WebSockets
    const server = http_1.default.createServer(app);
    // Initialize WebSocket Server
    (0, inventory_socket_1.createInventoryServer)(server);
    (0, expiration_scheduler_1.startExpirationScheduler)();
    (0, webhookCleanup_1.startWebhookCleanupScheduler)();
    // Only start recovery job if enabled (or default to true in prod)
    if (process.env.ENABLE_RECOVERY_JOB !== 'false') {
        (0, abandonedCartRecovery_job_1.startAbandonedCartRecoveryJob)();
    }
    server.listen(port, () => {
        logger_1.default.info(`Server running on port ${port}`);
    });
};
startServer().catch((err) => {
    logger_1.default.error('Failed to start server', { error: err });
    process.exit(1);
});
