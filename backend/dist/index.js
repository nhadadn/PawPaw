"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const logger_1 = __importDefault(require("./lib/logger"));
const expiration_scheduler_1 = require("./scheduler/expiration.scheduler");
const webhookCleanup_1 = require("./scheduler/webhookCleanup");
const abandonedCartRecovery_job_1 = require("./scheduler/abandonedCartRecovery.job");
const port = process.env.PORT || 4000;
const startServer = async () => {
    const app = (0, app_1.createApp)();
    (0, expiration_scheduler_1.startExpirationScheduler)();
    (0, webhookCleanup_1.startWebhookCleanupScheduler)();
    // Only start recovery job if enabled (or default to true in prod)
    if (process.env.ENABLE_RECOVERY_JOB !== 'false') {
        (0, abandonedCartRecovery_job_1.startAbandonedCartRecoveryJob)();
    }
    app.listen(port, () => {
        logger_1.default.info(`Server running on port ${port}`);
    });
};
startServer().catch((err) => {
    logger_1.default.error('Failed to start server', { error: err });
    process.exit(1);
});
