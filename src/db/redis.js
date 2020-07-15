const redis = require("redis");

const client = redis.createClient ({
  host : process.env.REDIS_HOST,
  port : `${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASS
});

client.on("error", function(err) {
  throw err;
});

module.exports = client;