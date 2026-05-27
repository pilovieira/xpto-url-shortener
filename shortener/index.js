// shortener/index.js – core URL shortening logic
const logger = require('../logger');
const { redisDb } = require('../util/db');
const fs = require('fs');
const path = require('path');

/** Create a short URL */
const createShortUrl = (req, res) => {
  if (!req.body?.url) return redirect(req, res);
  try {
    const key = parseInt(Date.now() / 1000).toString(36);
    logger.info(`Save requested - Key: ${key}, URL: ${req.body.url}`);
    redisDb.set(`xpto-url:keys:${key}`, req.body.url);
    res.status(201).json({ key });
  } catch (e) {
    logger.error(`Failed to create short URL: ${e.message}`);
    res.status(400).json({ fail: e.message });
  }
};

/** Redirect to the original URL */
const redirectToUrl = (key = "", req, res) => {
  let urlParams = null;
  if (key.includes("?")) {
    const spl = key.split("?");
    key = spl[0];
    urlParams = spl[1];
  }

  logger.info(`Redirect requested - Key[${key}] | Params[${urlParams}]`);
  redisDb.get(`xpto-url:keys:${key}`, (urlErr, url) => {
    if (urlErr || !url) {
      logger.warn(`Redirect URL invalid key - Key[${key}] Params[${urlParams}]`);
      res.writeHead(302, { 'Location': '/' });
      res.end();
      return;
    }

    let finalUrl = !url.startsWith("http") ? `https://${url}` : url;
    finalUrl += urlParams ? (url.includes("?") ? `&${urlParams}` : `?${urlParams}`) : "";

    // Immediate redirect response
    res.writeHead(302, { Location: finalUrl });
    res.end();
    // Perform logging and count increment asynchronously without delaying redirect
    setImmediate(() => {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const logData = JSON.stringify({ key, url, ip, userAgent, timestamp: new Date().toISOString() });
      redisDb.lpush('xpto-url:logs', logData);
      redisDb.ltrim('xpto-url:logs', 0, 99);
      const keyCountKey = `xpto-url:count:${key}`;
      redisDb.incr(keyCountKey, (incErr) => {
        if (incErr) {
          logger.error(`Failed to increment count for key ${key}: ${incErr.message}`);
        }
      });
    });
  });
};

/** Helper to serve the main HTML page */
const shortenerPage = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8'));
  res.end();
};

module.exports = { createShortUrl, redirectToUrl, shortenerPage };
