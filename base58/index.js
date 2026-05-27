const { redisDb } = require('../util/db');

/** Log base58 actions */
const logBase58Action = async (req, res) => {
  const { type, input, output } = req.body || {};
  if (!type || !input || output === undefined) {
    return res.status(400).json({ fail: 'Missing logging parameters' });
  }
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const logData = JSON.stringify({
      type,
      input: input.length > 2000 ? input.substring(0, 2000) + '...' : input,
      output: output.length > 2000 ? output.substring(0, 2000) + '...' : output,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
    redisDb.lpush('xpto-base58:logs', logData, (err) => {
      if (err) {
        console.error(`Failed to push base58 log: ${err.message}`);
        return res.status(500).json({ fail: 'Database error' });
      }
      redisDb.ltrim('xpto-base58:logs', 0, 99);
      res.status(201).json({ success: true });
    });
  } catch (e) {
    res.status(500).json({ fail: e.message });
  }
};
module.exports = { logBase58Action };
