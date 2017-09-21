const express = require('express');
const login = express.Router();

// 登入
login.post('/', function (req, res) {
    res.send(results);
});

module.exports = login;