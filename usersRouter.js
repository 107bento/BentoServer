const express = require('express');
const usersRouter = express.Router();

//取個人資料
usersRouter.get('/', function (req, res) {
    res.send(result);
});

//修改個人資料
usersRouter.patch('/', function (req, res) {
    res.send(result);
});

//註冊
usersRouter.post('/', function (req, res) {
    res.send(result);
});

module.exports = usersRouter;