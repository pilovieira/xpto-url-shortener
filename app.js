const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require("fs");
const path = require('path');
const Redis = require("ioredis");
const logger = require('./logger');

dotenv.config();

const redis = new Redis();

//const redis = new Redis(`rediss://default:${process.env.REDIS_PASS}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const app = express();
app.use(logger.requestLogger);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 5000;
app.listen(port, () => logger.info(`Service started. Listening on port ${port}!`));

const { adminPage, shortenerAdminPage, base58Page, base58AdminPage, adminLogin, adminLogout, adminData, base58AdminData, adminDeleteKey, adminCreateKey, logBase58Action } = require('./admin');

const { create, redirect } = require('./shortener');

app.get('/admin', adminPage);
app.get('/admin/shortener', shortenerAdminPage);
app.get('/admin-shortener', shortenerAdminPage);
app.get('/admin/base58', base58Page);
app.get('/base58', base58Page);
app.get('/admin/base58-admin', base58AdminPage);

app.post('/admin/login', adminLogin);
app.get('/admin/logout', adminLogout);
app.get('/admin/data', adminData);
app.get('/admin/base58/data', base58AdminData);
app.post('/base58/log', logBase58Action);
app.delete('/admin/keys/:key', adminDeleteKey);
app.post('/admin/keys', adminCreateKey);

app.post('/*', create);

app.get('/*', redirect);
