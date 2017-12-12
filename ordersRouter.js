const express = require('express'); 
const ordersRouter = express.Router(); 
const moment = require('moment'); 
const user = require('./models/user.js'); 
const order = require('./models/order.js'); 
const md5 = require('md5');
const env = require('./env.json');
const encrypter = require('object-encrypter');
const engine = encrypter(env.key, {ttl: false});

ordersRouter.post('/', (req, res) => { 
      
    let username = user.checkLogin(req.cookies);
    if (!username) {
        return res.status(401).json({
            error: 'please login!'
        });
    }
    let orderTime = moment().format('YYYY-MM-DD HH:mm:ss');

    // 設定可以訂餐的時間
    // if (orderTime > moment().format('YYYY-MM-DD 09:59:59') && orderTime < moment().format('YYYY-MM-DD 18:00:00') ) {
    //     return res.status(400).json({
    //         error: 'You can not order now.'
    //     });
    // }

    let total = req.body.total; 
    let details = req.body.details; 
    /* 
        details: [ 
            { 
                meal_id, 
                amout, 
                subtotal, 
                //state(1), 
                wish_id_1, 
                wish_id_2, 
                wish_id_3, 
                random_pick, 
                //final_meal, 
                //order_id 
            } 
        ] 
    */ 
    order.newOrder(username, orderTime, total, details, (error, results) => { 
        if (typeof(results) !== undefined && typeof(error) == "undefined") { 
            return res.status(200).json({ 
                success: results.success
            }); 
        } else { 
            return res.status(400).json({ 
                err: error.err,
                error: error.error
            }); 
        } 
    }); 
}); 

// admin 掃 QR code 時，拿到訂單資訊
ordersRouter.post('/admin', (req, res) => {
    const username = user.isAdmin(req.cookies);
    // 檢查有沒有 cookie
    if (!username) {
        //console.log(_cookie);
        return res.status(401).json({
            error: 'Admin only!'
        });
    }
    // 檢查有沒有 hex 
    let data = {};
    if (req.body.hex) {
        data = engine.decrypt(req.body.hex);
        console.log(data);
    } else {
        return res.status(404).json({
            error: 'Something went wrong.'
        });
    }

    order.getOrderByAdmin(data.order_id, (error, results) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") { 
            // console.log(results);
            return res.status(200).json(results); 
        } else { 
            return res.status(400).json({ 
                err: error.err, // throw error
                error: error.error // error message
            }); 
        }
    });
});

// admin 確認領餐
ordersRouter.patch('/admin', (req, res) => {
    const username = user.isAdmin(req.cookies);
    // 檢查有沒有 cookie
    if (!username) {
        //console.log(_cookie);
        return res.status(401).json({
            error: 'Admin only!'
        });
    }
    // 檢查有沒有 hex 
    let data = {};
    if (req.body.hex) {
        data = engine.decrypt(req.body.hex);
        console.log(data);
    } else {
        return res.status(404).json({
            error: 'Something went wrong.'
        });
    }

    order.checkOrderByAdmin(data.order_id, (error, results) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") { 
            // console.log(results);
            return res.status(200).json(results); 
        } else { 
            return res.status(400).json({ 
                err: error.err, // throw error
                error: error.error // error message
            }); 
        }
    });
});


module.exports = ordersRouter;