const { performance } = require('perf_hooks');

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${ms}`;
}

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[90m',
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  access: '\x1b[34m', // Blue
};

function requestLogger(req, res, next) {
  const start = performance.now();

  // Extract client IP address
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.headers['user-agent'] || req.headers['User-Agent'] || 'Unknown UA';

  res.on('finish', () => {
    const duration = (performance.now() - start).toFixed(2);
    const status = res.statusCode;

    // Color code status codes
    let statusColor = colors.info;
    if (status >= 500) {
      statusColor = colors.error;
    } else if (status >= 400) {
      statusColor = colors.warn;
    } else if (status >= 300) {
      statusColor = '\x1b[36m'; // Cyan for redirects
    }

    // Color code methods
    let methodColor = colors.info;
    if (method === 'POST') {
      methodColor = '\x1b[35m'; // Magenta for POST
    }

    const timestamp = getTimestamp();
    const formattedLog = `${colors.dim}[${timestamp}]${colors.reset} ${colors.access}[ACCESS]${colors.reset} ${methodColor}${method.padEnd(5)}${colors.reset} ${url} - Status: ${statusColor}${status}${colors.reset} - Duration: ${colors.dim}${duration}ms${colors.reset} - IP: ${colors.dim}${ip}${colors.reset} - UA: ${colors.dim}${userAgent}${colors.reset}`;

    console.log(formattedLog);
  });

  next();
}

const logger = {
  info(message) {
    const timestamp = getTimestamp();
    console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors.info}[INFO]${colors.reset} ${message}`);
  },
  warn(message) {
    const timestamp = getTimestamp();
    console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors.warn}[WARN]${colors.reset} ${message}`);
  },
  error(message) {
    const timestamp = getTimestamp();
    console.error(`${colors.dim}[${timestamp}]${colors.reset} ${colors.error}[ERROR]${colors.reset} ${message}`);
  },
  requestLogger
};

module.exports = logger;
