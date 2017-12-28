const express = require('express');
const shopsRouter = express.Router();
const shop = require('./models/shop');


// 取店家資料（所有相關（含菜單））
/*shopsRouter.get('/', (req, res) => {

    shop.showShop((error, results) => {
        
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});*/

// 只秀店家
shopsRouter.get('/', (req, res) => {
    shop.onlyshowShop( (error, results) => {    
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});

// 只秀店家id 對應 Meals or 全部店家的菜單含店家資訊
shopsRouter.get('/:id', (req, res) => {
    let shop_id = req.params.id;
    if (shop_id == 'all') {
        shop.showShops((error, results) => {    
            if (typeof(results) !== undefined && typeof(error) == "undefined") {
                return res.status(200).json(results);
            } else {
                return res.status(400).json({
                    error
                });
            }
        });
    } else {
        shop.onlyshowMeal(parseInt(shop_id), (error, results) => {    
            if (typeof(results) !== undefined && typeof(error) == "undefined") {
                return res.status(200).json(results);
            } else {
                return res.status(400).json({
                    error
                });
            }
        });
    }
});

// 店家登入拿自己店家資訊
shopsRouter.get('/:id/info', (req, res) => {
    // 判斷有沒有登入
    let username = shop.checkLogin(req.cookies);
    if (!username) {
        return res.status(401).json({
            error: 'please login!'
        });
    }
    // 拿到網址變數
    let id = req.params.id;
    // 判斷是不是 'me'
    if (id === 'me') {
        id = username;
    }
    shop.getShop(id, (error, results) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});

// 拿店家某資訊
shopsRouter.patch('/:id/info', (req, res) => {
    // 判斷有沒有登入
    let username = shop.checkLogin(req.cookies);
    if (!username) {
        return res.status(401).json({
            error: 'please login!'
        });
    }
    // 拿到網址變數
    let id = req.params.id;
    // 判斷是不是 'me'
    if (id === 'me') {
        id = username;
    }
    // 判斷資料齊不齊全
    const data = [
        'shop_name', 'shop_time', 'shop_phone', 'shop_address', 'lowest_amount', 'highest_amount', 'shipping_fee', 'payment', 'settlement', 'shop_discount', 'meals', 'password'
    ]
    const info = {}; // 拿來放店家資料的 object
    let miss = ""; // 確認是否有缺少資料
    for (let d of data) {
        if (!req.body.hasOwnProperty(d)) {
            miss += `${d}, `;
        }
        info[`${d}`] = req.body[`${d}`];
    }
    if (miss != "") {
        miss += `is missing`;
        return res.status(400).json({
            error: miss
        });
    }
    // console.log(info);
    // console.log (id);
    // call patch function
    shop.patchShop(info, id, (error, results) => {
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});
module.exports = shopsRouter;