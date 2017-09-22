const express = require('express');
const login = express.Router();

login.post('/', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            message: '缺少帳號或密碼'
        });
    }

    

    return res.status(401).json({
        message: '帳號或密碼錯誤'
    });
});

module.exports = login;