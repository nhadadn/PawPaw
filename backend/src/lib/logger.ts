import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'test' ? 'warn' : process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'checkout-service' },
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === 'test',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

export default logger;
