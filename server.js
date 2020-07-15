const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`listening on port ${port}!`));

app.post('/create', (req, res) => {
  try {
    if (!req.body || !req.body.url)
      throw new Error('Invalid url');

    const hash = new Date().getTime().toString(36);

    console.log(`creating '${hash}' to '${req.body.url}'`);

    //todo save in db
    console.log(`SIMULATE DB SAVE: [HASH: ${hash} URL: ${req.body.url}]`);

    res.status(201).json( { hash } );
  } catch (e) {
    console.log(`Create failed: ${e.message}`);
    res.status(400).json( { fail: e.message } );
  }
});

app.get('/*', (req, res) => {
  const hash = req.url.replace('/', '');

  console.log(`Received hash: '${hash}'`);

  if (!hash)
    return createIndex(res);

  //todo read url from database
  const url = 'http://pilovieira.com.br'

  console.log(`Loaded from database: hash: '${hash}' url:'${url}'`);

  if (!url)
    return createIndex(res);

  res.writeHead(302, { 'Location': url } );
  res.end();

  //todo call count ++
  console.log(`SIMULATE LINK COUNT`);
});

function createIndex(res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(
    '<!DOCTYPE html>' +
    '<html>' +
    '  <head>' +
    '    <meta charset="utf-8">' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1">' +
    '    <title>Xablau Url Shortener</title>' +
    '    <link rel="icon" type="image/png" href="./public/image/favicon.png"/>' +
    '    <link rel="stylesheet" href="./public/css/main.css" />' +
    '  </head>' +
    '  <body>' +
    '    <div id="message">' +
    '      <div id="failPane" class="center"></div>' +
    '      <h1 class="center">XABLAU</h1>' +
    '      <p id="phrase" class="center">url shortener</p>' +
    '      <div id="mainPane"></div>' +
    '    </div>' +
    '    <script src="./public/js/clipboard.min.js"></script>' +
    '    <script defer src="./public/js/index.js"></script>' +
    '  </body>' +
    '</html>');
  res.end();
}