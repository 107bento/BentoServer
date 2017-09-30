const express = require('express');
const ordersRouter = express.Router();
const order = require('./models/order');
const user = require('./models/user');

// 使用者買單
ordersRouter.post('/', (req, res) => {
    let username = user.checkLogin(req.cookies);
    if (!username) {
        return res.status(401).json({
            error: 'please login!'
        });
    }
    /* 預想傳：
        total : ....
        ordertime : ....
        detail : [
        
        ]
    */
    const ordertime = req.body.ordertime;
    const total = req.body.total;
    const add = req.body.detail;

    order.check((error, results) => {    
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(401).json({
                error: error
            });
        }
    });
});
    
    module.exports = ordersRouter;