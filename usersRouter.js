const express = require('express');
const usersRouter = express.Router();
const user = require('./models/user');


//取個人資料
usersRouter.get('/', function (req, res) {

    const username = user.checkLogin(req.cookies);
    // 如果沒有 cookie
    if (!username) {
        return res.status(401).json({
            error: 'please login!'
        });
    }
    user.showUser(username, (error, results) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});

//修改個人資料
usersRouter.patch('/', function (req, res) {

    const username = user.checkLogin(req.cookies);
    // 如果沒有 cookie
    if (!username) {
        //console.log(_cookie);
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
            return res.status(400).json({
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
    const phone = req.body.phone;
    const email = req.body.email;

    if (!username || !password || !name || !phone || !email) {
        return res.status(400).json({
            error: 'data incomplete.'
        });
    }

    user.register(username, password, name, phone, email, (error, results) => {

        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json(error);
        }
    });
});

// 儲値
usersRouter.post('/store', (req, res) => {
    
    const username = user.checkLogin(req.cookies);
    //檢查有沒有 cookie
    if (!username) {
        //console.log(_cookie);
        return res.status(401).json({
            error: 'please login!'
        });
    }

    // 儲值金額是否為這些數字 100 250 400 900 1000
    const value = req.body.value;
    if (value != 100 && value != 250 && value != 400 && value != 900 && value != 1000) {
        return res.status(400).json({
            error: 'The value is incorrect.'
        });
    }

    // call function 儲值
    user.storeValue(username, value, (error, success) => {
        if (typeof(success) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(success);
        } else {
            return res.status(400).json(error);
        }
    });

});

usersRouter.get('/orders/:type', (req, res) => {
    const username = user.checkLogin(req.cookies);
    //檢查有沒有 cookie
    if (!username) {
        //console.log(_cookie);
        return res.status(401).json({
            error: 'please login!'
        });
    }
    const type = req.params.type;
    if (type != 'all' && type != 'today') {
        return res.status(403).json({
            error: 'something went wrong!'
        });
    }

    user.getOrders(username, type, (error, success) => {
        if (typeof(success) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(success);
        } else {
            return res.status(400).json(error);
        }
    });
});

usersRouter.get('/records', (req, res) => {
    const username = user.checkLogin(req.cookies);
    //檢查有沒有 cookie
    if (!username) {
        //console.log(_cookie);
        return res.status(401).json({
            error: 'please login!'
        });
    }

    user.getRecords(username, (error, success) => {
        if (typeof(success) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(success);
        } else {
            return res.status(400).json(error);
        }
    });
});

// admin 確認領餐的 route GET user/admin/{order_id}
usersRouter.get('/admin/:order_id', (req, res) => {
    const username = user.isAdmin(req.cookies);
    //檢查有沒有 cookie
    if (!username) {
        //console.log(_cookie);
        return res.status(401).json({
            error: 'please login!'
        });
    }

    const order_id = req.params.order_id;
    user.checkOrder(order_id, (error, success) => {
        if (typeof(success) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(success);
        } else {
            return res.status(400).json(error);
        }
    });
});

module.exports = usersRouter;