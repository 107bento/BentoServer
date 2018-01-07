const express = require('express');
const loginRouter = express.Router();
const user = require('./models/user');
const shop = require('./models/shop');
const moment = require('moment');
const md5 = require('md5');

// 登入
loginRouter.post('/', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            error: 'lost username or password.',
            "status_code" : 400
        });
    }

    user.validate(username, password, (error, results, isAdmin) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            // 如果是工讀生或使用者
            if (isAdmin) {
                // session id 加密 （username + 時間戳ㄋ）
                let uuid = md5(results.user_id + moment());
                _adminCookies[uuid] = results.user_id;
                res.cookie(adminCookieName, uuid);
                return res.status(200).json({"user_id": results.user_id,"status_code" : 200, isAdmin});
            }
            // session id 加密 （username + 時間戳ㄋ）
            let uuid = md5(results.user_id + moment());
            //
            _cookies[uuid] = results.user_id;
            res.cookie(cookieName, uuid);
            return res.status(200).json({"user_id": results.user_id,"status_code" : 200});
        } else {
            return res.status(400).json({
                error: error,
                "status_code" : 400
            });
        }
    });
});

// 店家登入
loginRouter.post('/shops', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(401).json({
            error: 'lost username or password.'
        });
    }

    shop.validate(username, password, (error, results) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            // session id 加密 （username + 時間戳ㄋ）
            let uuid = md5(results.user_id + moment());
            
            _shopCookies[uuid] = results.username;
            res.cookie(shopCookieName, uuid);
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});

module.exports = loginRouter;