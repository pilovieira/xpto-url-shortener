// Initialize Redis client for admin auth
const Redis = require('ioredis');
const redisDb = new Redis();

module.exports = {
    redisDb
};