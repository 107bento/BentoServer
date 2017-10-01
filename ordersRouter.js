const express = require('express'); 
const ordersRouter = express.Router(); 
const moment = require('moment'); 
const user = require('./models/user.js'); 
const order = require('./models/order.js'); 
const md5 = require('md5'); 
 
ordersRouter.post('/', (req, res) => { 
     
    let username = user.checkLogin(req.cookies); 
    let orderTime = moment().format('YYYY/MM/DD HH:mm:ss'); 
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
                message: 'order successfully.' 
            }); 
        } else { 
            return res.status(401).json({ 
                error: error 
            }); 
        } 
    }); 
}); 
module.exports = ordersRouter;