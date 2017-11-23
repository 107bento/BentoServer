const express = require('express'); 
const ordersRouter = express.Router(); 
const moment = require('moment'); 
const user = require('./models/user.js'); 
const order = require('./models/order.js'); 
const md5 = require('md5'); 
 
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
                message: results
            }); 
        } else { 
            return res.status(400).json({ 
                err: error.err,
                error: error.error
            }); 
        } 
    }); 
}); 


module.exports = ordersRouter;