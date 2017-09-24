const express = require('express');
const usersRouter = express.Router();
const user = require('./models/user');


//取個人資料
usersRouter.get('/', function (req, res) {
    let username = user.checkLogin(req.cookies);
    if (!username) {
        return res.status(401).json({
            error: 'please login!'
        });
    }
    user.showUser(username, (error, results) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(401).json({
                error: error
            });
        }
    });
});

//修改個人資料
usersRouter.patch('/', function (req, res) {
    let username = user.checkLogin(req.cookies);
    if (!username) {
        console.log(_cookie);
        return res.status(401).json({
            error: 'please login!'
        });
    }

    const password = req.body.password;
    const phone = req.body.phone;
    const email = req.body.email;
    const name = req.body.name;
    
    if (!password || !phone || !email || !name) {
        return res.status(400).json({
            error: ' data is not complete'
        });
    }
    user.modify(username, password, phone, email, name, (error, results) => {
            if (typeof(results) !== undefined && typeof(error) == "undefined") {
                return res.status(200).json(results);
            } else {
                return res.status(401).json({
                       error: error
                });
            }
    });
});

//註冊
usersRouter.post('/', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    console.log(name);
    const phone = req.body.phone;
    const email = req.body.email;

    if (!username || !password || !name || !phone || !email) {
        return res.status(400).json({
            error: ' username or password ??'
        });
    }

    user.register(username, password, name, phone, email, (error, results) => {

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