const winston = require('winston');
require('winston-daily-rotate-file');

const cmdLogger = winston.createLogger({
    level: "debug",
    format: winston.format.cli(),
    transports: [new winston.transports.Console()],
});

const appTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/app/%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

const errorTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/errors/%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'warn',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

const persistentLogger = winston.createLogger({
    transports: [appTransport, errorTransport]
});

module.exports = {cmdLogger, persistentLogger};