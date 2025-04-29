// utils/logger.js

const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

// Configuración básica
const logDir = path.join(__dirname, '../logs');
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = (level, message, metadata = {}) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
  const logId = uuidv4().substring(0, 8);
  return JSON.stringify({
    logId,
    timestamp,
    level,
    message,
    ...metadata,
    pid: process.pid
  });
};

const transports = {
  console: (logEntry) => {
    const { level, message } = JSON.parse(logEntry);
    const levelColors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[32m',
      debug: '\x1b[36m'
    };
    console.log(`${levelColors[level]}[${level.toUpperCase()}] ${message}\x1b[0m`);
  },
  file: (logEntry) => {
    const date = format(new Date(), 'yyyy-MM-dd');
    const logFile = path.join(logDir, `app-${date}.log`);
    fs.appendFileSync(logFile, logEntry + '\n');
  }
};

// Logger principal
class Logger {
  constructor(level = 'info') {
    this.level = logLevels[level] || logLevels.info;
  }

  log(level, message, metadata = {}) {
    if (logLevels[level] <= this.level) {
      const logEntry = logFormat(level, message, metadata);
      transports.file(logEntry);
      if (process.env.NODE_ENV !== 'production') {
        transports.console(logEntry);
      }
    }
  }

  error(message, error = {}) {
    this.log('error', message, {
      stack: error.stack || error.message || 'No stack trace',
      code: error.code || 'NO_ERROR_CODE'
    });
  }

  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }

  http(request) {
    this.info(`${request.method} ${request.originalUrl}`, {
      ip: request.ip,
      headers: {
        'user-agent': request.get('user-agent'),
        referer: request.get('referer')
      }
    });
  }
}

// Crear instancia correctamente
const logger = new Logger(process.env.LOG_LEVEL || 'info');

// Exportar el logger + el stream
module.exports = logger;

module.exports.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};
