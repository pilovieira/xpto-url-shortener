const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require("fs");
const path = require('path');
const Redis = require("ioredis");

dotenv.config();

const redis = new Redis();

//const redis = new Redis(`rediss://default:${process.env.REDIS_PASS}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`service started. listening on port ${port}!`));

const create = (req, res) => {
  if (!req.body?.url) redirect(req, res);
  try {
    const key = parseInt(Date.now() / 1000).toString(36);
    console.log("save requested key:", key, "url:", req.body.url);
    redis.set(key, req.body.url);
    res.status(201).json({ key });
  } catch (e) {
    res.status(400).json({ fail: e.message });
  }
};

const redirect = (req, res) => {
  const key = req.url.replace('/', '');
  if (key) {
    console.log("redirect requested key:", key);
    redis.get(key, (err, url) => {
      if (!err && url) {
        console.log("redirect url found:", url);
        res.writeHead(302, { 'Location': url });
        res.end();
      } else {
        console.log("redirect url invalid key:", key);
        writeHtml(res);
      }
    });
  } else {
    console.log("page access");
    writeHtml(res);
  }
}

const writeHtml = (res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(fs.readFileSync('./index.html', "utf-8"));
  res.end();
}

app.post('/*', create);
app.get('/*', redirect);