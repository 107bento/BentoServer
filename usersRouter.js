const express = require('express');
const usersRouter = express.Router();
const user = require('./models/user');


//取個人資料
usersRouter.get('/', function (req, res) {
    res.send(result);
});

//修改個人資料
usersRouter.patch('/', function (req, res) {
    res.send(result);
});

//註冊
usersRouter.post('/', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            error: ' username or password ?? '
        });
    }

    user.register(username, password, (error, results) => {

        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(401).json({
                error: error
            });
        }
    });
});

module.exports = usersRouter;