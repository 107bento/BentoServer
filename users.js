const express = require('express');
const users = express.Router();

//取個人資料
users.get('/', function (req, res) {
    res.send(result);
});

//修改個人資料
users.patch('/', function (req, res) {
    res.send(result);
});

//註冊
users.post('/', function (req, res) {
    res.send(result);
});

module.exports = users;