const express = require('express');
const bodyParser = require('body-parser');
const fs = require("fs");
const path = require('path');
const redis = require("redis");

const redisCli = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASS
});
redisCli.on("error", (err) => console.log(err));
redisCli.connect();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`listening on port ${port}!`));

const create = (req, res) => {
  if (!req.body?.url) redirect(req, res);

  try{
    const key = parseInt(Date.now() / 1000).toString(36);
    console.log(`creating '${key}' to '${req.body.url}'`);
    redisCli.set(key, req.body.url);
    res.status(201).json({key});
  } catch(e){
    console.log(`create failed: ${e.message}`);
    res.status(400).json({fail: e.message});
  }
};

const redirect = (req, res) => {
  const key = req.url.replace('/', '');
  if(key){
    redisCli.get(key, (err, url) => {
      if(!err && url){
        console.log(`loaded key: '${key}' url:'${url}'`);
        res.writeHead(302, {'Location': url});
        res.end();
      } else{
        writeHtml(res);
      }
    });
  } else{
    writeHtml(res);
  }
}

const writeHtml = (res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.createReadStream("./public/index.html").pipe(res);
  res.end();
}

app.post('/*', create);
app.get('/*', redirect);