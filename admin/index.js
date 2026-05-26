// admin/index.js - admin logic
const fs = require('fs');
const path = require('path');
const { isAuth, adminLogin, adminLogout, authRedis } = require('./auth');

/** Serve admin hub page or login */
const adminPage = async (req, res) => {
  if (await isAuth(req)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'hub.html'), 'utf-8'));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'login.html'), 'utf-8'));
  }
};

/** Serve admin shortener dashboard */
const shortenerAdminPage = async (req, res) => {
  if (await isAuth(req)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'shortener-admin.html'), 'utf-8'));
  } else {
    res.writeHead(302, { 'Location': '/admin' });
    res.end();
  }
};

/** Serve base58 encoder/decoder page */
const base58Page = async (req, res) => {
  if (await isAuth(req)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'base58.html'), 'utf-8'));
  } else {
    res.writeHead(302, { 'Location': '/admin' });
    res.end();
  }
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

module.exports = {
  isAuth,
  adminPage,
  shortenerAdminPage,
  base58Page,
  adminLogin,
  adminLogout,
  adminData,
  adminDeleteKey,
  adminCreateKey
};
