// admin/auth.js - shared admin authentication helper
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

module.exports = {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  isAuth,
  adminLogin,
  adminLogout,
  authRedis
};
