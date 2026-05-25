// shortener/index.js – core URL shortening logic
const logger = require('../logger');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// Initialize Redis (same config as app.js)
const redis = new Redis();

/** Create a short URL */
const create = (req, res) => {
  if (!req.body?.url) return redirect(req, res);
  try {
    const key = parseInt(Date.now() / 1000).toString(36);
    logger.info(`Save requested - Key: ${key}, URL: ${req.body.url}`);
    redis.set(`xpto-url:keys:${key}`, req.body.url);
    res.status(201).json({ key });
  } catch (e) {
    logger.error(`Failed to create short URL: ${e.message}`);
    res.status(400).json({ fail: e.message });
  }
};

/** Redirect to the original URL */
const redirect = (req, res) => {
  const key = req.url.replace('/', '');
  if (key) {
    logger.info(`Redirect requested - Key: ${key}`);
    redis.get(`xpto-url:keys:${key}`, (urlErr, url) => {
      if (urlErr || !url) {
        logger.warn(`Redirect URL invalid key - Key: ${key}`);
        return writeHtml(res);
      }

      const finalUrl = !url.startsWith("http") ? `https://${url}` : url;

      // Immediate redirect response
      res.writeHead(302, { Location: finalUrl });
      res.end();
      // Perform logging and count increment asynchronously without delaying redirect
      setImmediate(() => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const logData = JSON.stringify({ key, url, ip, userAgent, timestamp: new Date().toISOString() });
        redis.lpush('xpto-url:logs', logData);
        redis.ltrim('xpto-url:logs', 0, 99);
        const keyCountKey = `xpto-url:count:${key}`;
        redis.incr(keyCountKey, (incErr) => {
          if (incErr) {
            logger.error(`Failed to increment count for key ${key}: ${incErr.message}`);
          }
        });
      });
    });
  } else {
    logger.info("Homepage access requested");
    writeHtml(res);
  }
};

/** Helper to serve the main HTML page */
const writeHtml = (res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8'));
  res.end();
};

module.exports = { create, redirect };
