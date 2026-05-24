const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require("fs");
const path = require('path');
const Redis = require("ioredis");
const logger = require('./logger');

dotenv.config();

const redis = new Redis();

//const redis = new Redis(`rediss://default:${process.env.REDIS_PASS}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const app = express();
app.use(logger.requestLogger);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 5000;
app.listen(port, () => logger.info(`Service started. Listening on port ${port}!`));

const { adminPage, adminLogin, adminLogout, adminData, adminDeleteKey } = require('./admin');

const create = (req, res) => {
  if (!req.body?.url) redirect(req, res);
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

const redirect = (req, res) => {
  const key = req.url.replace('/', '');
  if (key) {
    logger.info(`Redirect requested - Key: ${key}`);
    redis.get(`xpto-url:keys:${key}`, (err, url) => {
      if (!err && url) {
        logger.info(`Redirect URL found - Key: ${key} -> URL: ${url}`);
        
        // Log access info to Redis
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const logData = JSON.stringify({
          key,
          url,
          ip,
          userAgent,
          timestamp: new Date().toISOString()
        });
        redis.lpush('xpto-url:logs', logData);
        redis.ltrim('xpto-url:logs', 0, 99);
        
        redis.incr('xpto-url:count'); // increment access count
        res.writeHead(302, { 'Location': url });
        res.end();
      } else {
        logger.warn(`Redirect URL invalid key - Key: ${key}`);
        writeHtml(res);
      }
    });
  } else {
    logger.info("Homepage access requested");
    writeHtml(res);
  }
}

const getCount = (req, res) => {
  redis.get('xpto-url:count', (err, count) => {
    if (err) {
      logger.error(`Failed to retrieve count: ${err.message}`);
      res.status(500).json({ fail: err.message });
    } else {
      res.status(200).json({ count: parseInt(count || 0, 10) });
    }
  });
};

const writeHtml = (res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(fs.readFileSync('./index.html', "utf-8"));
  res.end();
}

app.get('/admin', adminPage);
app.post('/admin/login', adminLogin);
app.get('/admin/logout', adminLogout);
app.get('/admin/data', adminData);
app.delete('/admin/keys/:key', adminDeleteKey);

app.post('/*', create);
app.get('/count', getCount);
app.get('/*', redirect);