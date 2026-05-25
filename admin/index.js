// admin/index.js - admin logic
const dotenv = require('dotenv');
dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN_TTL_MINUTES = Number(process.env.ADMIN_TOKEN_TTL_MINUTES) || 10;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD not defined in .env");
}

// Initialize Redis client for admin auth
const Redis = require('ioredis');
const authRedis = new Redis();

/** Checks admin session token stored in Redis */
const isAuth = async (req) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('='))
  );
  const token = cookies.admin_token;
  if (!token) return false;
  try {
    const exists = await authRedis.exists(`xpto-url:admin_token:${token}`);
    return exists === 1;
  } catch (e) {
    console.error(`Auth token validation error: ${e.message}`);
    return false;
  }
};

/** Serve admin page or login */
const adminPage = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  if (await isAuth(req)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf-8'));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'login.html'), 'utf-8'));
  }
};

/** Handle admin login */
const adminLogin = async (req, res) => {
  const { email, password } = req.body || {};
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');
    // Store token in Redis with TTL
    await authRedis.setex(`xpto-url:admin_token:${token}`, ADMIN_TOKEN_TTL_MINUTES * 60, '1');
    // Set token cookie
    res.cookie('admin_token', token, { path: '/', httpOnly: true, maxAge: (ADMIN_TOKEN_TTL_MINUTES * 60 * 1000) });
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ fail: 'Invalid credentials' });
  }
};

/** Handle admin logout */
const adminLogout = async (req, res) => {
  // Remove token from Redis if present
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('='))
  );
  const token = cookies.admin_token;
  if (token) {
    await authRedis.del(`xpto-url:admin_token:${token}`);
  }
  res.clearCookie('admin_token', { path: '/' });
  res.writeHead(302, { 'Location': '/admin' });
  res.end();
};

/** Provide admin data (keys, logs) */
const adminData = async (req, res) => {
  if (!await isAuth(req)) {
    return res.status(401).json({ fail: 'Unauthorized' });
  }
  authRedis.keys('xpto-url:keys:*', (err, keys) => {
    if (err) return res.status(500).json({ fail: err.message });
    const fetchKeys = () => new Promise(resolve => {
      if (keys.length === 0) return resolve([]);
      const pipeline = authRedis.pipeline();
      keys.forEach(k => pipeline.get(k));
      pipeline.exec((err, results) => {
        if (err) return resolve([]);
        const list = keys.map((k, index) => ({
          key: k.replace('xpto-url:keys:', ''),
          url: results[index][1]
        }));
        resolve(list);
      });
    });
    const fetchCounts = () => new Promise(resolve => {
      if (keys.length === 0) return resolve({});
      const countKeys = keys.map(k => `xpto-url:count:${k.replace('xpto-url:keys:', '')}`);
      const pipeline = authRedis.pipeline();
      countKeys.forEach(ck => pipeline.get(ck));
      pipeline.exec((err, results) => {
        if (err) return resolve({});
        const counts = {};
        results.forEach((res, idx) => {
          counts[keys[idx].replace('xpto-url:keys:', '')] = parseInt(res[1] || '0', 10);
        });
        resolve(counts);
      });
    });
    const fetchLogs = () => new Promise(resolve => {
      authRedis.lrange('xpto-url:logs', 0, 99, (err, logs) => {
        if (err || !logs) return resolve([]);
        resolve(logs.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
      });
    });
    Promise.all([fetchKeys(), fetchCounts(), fetchLogs()])
      .then(([keyList, counts, logList]) => {
        const enrichedKeys = keyList.map(k => ({ ...k, count: counts[k.key] || 0 }));
        res.status(200).json({ keys: enrichedKeys, logs: logList });
      });
  });
};

/** Delete a specific key */
const adminDeleteKey = async (req, res) => {
  if (!await isAuth(req)) {
    return res.status(401).json({ fail: 'Unauthorized' });
  }
  const key = req.params.key;
  if (!key) return res.status(400).json({ fail: 'Key is required' });
  authRedis.del(`xpto-url:keys:${key}`, err => {
    if (err) {
      res.status(500).json({ fail: err.message });
    } else {
      res.status(200).json({ success: true });
    }
  });
};

/** Create a new key with a custom slug — checks for conflicts first */
const adminCreateKey = async (req, res) => {
  if (!await isAuth(req)) {
    return res.status(401).json({ fail: 'Unauthorized' });
  }
  const { key, url } = req.body || {};
  if (!key || !url) return res.status(400).json({ fail: 'Both key and url are required' });
  // Validate key: alphanumeric + hyphens only
  if (!/^[a-zA-Z0-9-]+$/.test(key)) {
    return res.status(400).json({ fail: 'Key may only contain letters, numbers and hyphens' });
  }
  const redisKey = `xpto-url:keys:${key}`;
  const existing = await authRedis.get(redisKey);
  if (existing) {
    return res.status(409).json({ fail: `Key "${key}" already exists` });
  }
  await authRedis.set(redisKey, url);
  res.status(201).json({ key, url });
};

module.exports = { ADMIN_EMAIL, ADMIN_PASSWORD, isAuth, adminPage, adminLogin, adminLogout, adminData, adminDeleteKey, adminCreateKey };

