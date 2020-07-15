const redis = require('../db/redis');
const createIndex = require('./index-creator');

const shortUrl = (req, res) => {
  try {
    if (!req.body || !req.body.url)
      throw new Error('Invalid url');

    const hash = new Date().getTime().toString(36);

    console.log(`creating '${hash}' to '${req.body.url}'`);

    redis.set(hash, req.body.url);

    res.status(201).json( { hash } );
  } catch (e) {
    console.log(`Create failed: ${e.message}`);
    res.status(400).json( { fail: e.message } );
  }
};

const redirect = (req, res) => {
  const hash = req.url.replace('/', '');

  if (!hash)
    return createIndex(res);

  console.log(`Received hash: '${hash}'`);

  redis.get(hash, (err, url) => {
    console.log(`Loaded from database: hash: '${hash}' url:'${url}'`);

    if (!url)
      return createIndex(res);

    res.writeHead(302, { 'Location': url } );
    res.end();

    countCall(hash);
  });
};

const countCall = async (hash) => {
  //todo implement count
  console.log(`Counting call of ${hash}`);
}

module.exports = {
  shortUrl,
  redirect
};