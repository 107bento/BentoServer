const express = require('express');
const loginRouter = express.Router();
const user = require('./models/user');
const moment = require('moment');
const md5 = require('md5');

loginRouter.post('/', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            error: 'lost username or password.'
        });
    }

    user.validate(username, password, (error, results) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            // session id 加密 （username + 時間戳ㄋ）
            let uuid = md5(results.user_id + moment());
            //
            _cookies[uuid] = results.user_id;
            res.cookie(cookieName, uuid);
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});

module.exports = loginRouter;