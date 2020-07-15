const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { shortUrl, redirect } = require('./src/xablau/xablau');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`listening on port ${port}!`));

app.post('/create', shortUrl);

app.get('/*', redirect);