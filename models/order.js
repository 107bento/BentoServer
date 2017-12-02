const moment = require('moment');
const async = require('async');
// 新增訂單
function newOrder (username, orderTime, total, details, callback) {

    // transaction 如果有一個 error 全部 rollback
    connection.beginTransaction((err) => {
        if (err) { 
            return callback({"error": "Something went wrong."}, undefined);
        }
        // 使用 promise 確保事情做完才做下一件事情
        // 每個 function 回傳 promise 再丟給下一個人處理
        _newCart(username, orderTime, total).then((orderId) => {
            return _newDetails(details, orderId);
        }).then((cartTotal) => {
            return _checkMoney(username, cartTotal);
        }).then((cartTotal) => {
            return _updateUser(username, cartTotal);
        }).then(() => {
            return _commitTransactino();
        }).then(() => {
            return callback(undefined, {"success": "Order successfully."});
        }).catch((err) => {
            // promise 被 reject 就代表有錯誤，需要丟回來這裡處理
            // 有任何一個 error 都 rollback 回去
            connection.rollback(() => {
                return callback(err, undefined);
            });
        });
    });
}

function _checkMoney(username, cartTotal) {
    let sql = `select remain from users where user_id = '${username}'`;
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, results) => {
            if (err) {
                reject({err, "error": "Something went wrong."});
            }
            if (results[0].remain < cartTotal) {
                reject({err, "error": "Sorry, you don't have enough money, please store your account."});
            }
            resolve(cartTotal);
        })
    });
}

function _newCart(username, orderTime, total) {
    // sql指令 -> 新增購物車
    let sql = `insert into orders  (user_id, order_time, total) values ('${username}', '${orderTime}', '${total}');`;
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, results) => {
            if (err) {
                reject({err, "error": "Something went wrong."});
            }
            console.log(results);
            resolve(results.insertId);
        });
    });
    
}

function _newDetails(details, orderId) {
    let sql = '';
    let count = 0;
    return new Promise((resolve, reject) => {
        // 用 async 去跑每一筆 detail 的 query，確保 query 有完成
        _getMealsPrice().then((mealsPrice) => {
            let cartTotal = 0;
            async.each(details, (detail, callback) => {
                // 找最高金額
                let highestPrice = mealsPrice[detail.meal_id];
                if (detail.wish_id_1 != 0 && highestPrice < mealsPrice[detail.wish_id_1]) {
                    highestPrice = mealsPrice[detail.wish_id_1];
                } else if (detail.wish_id_2 != 0 && highestPrice < mealsPrice[detail.wish_id_2]) {
                    highestPrice = mealsPrice[detail.wish_id_2];
                } else if (detail.wish_id_3 != 0 && highestPrice < mealsPrice[detail.wish_id_3]) {
                    highestPrice = mealsPrice[detail.wish_id_3];
                }
                cartTotal += highestPrice * detail.amount;

                sql = `insert into details (meal_id, amount, subtotal, state, wish_id_1, wish_id_2, wish_id_3, random_pick, order_id) values (${detail.meal_id}, ${detail.amount}, ${detail.subtotal}, 1 , ${detail.wish_id_1}, ${detail.wish_id_2}, ${detail.wish_id_3}, ${detail.random_pick}, ${orderId});`;

                connection.query(sql, (err, results) => {
                    if (err) {
                        callback(err);
                    }
                    count++;
                    if (count == details.length) {
                        resolve(cartTotal);
                    }
                });
            }, (err) => {
                if (err) {
                    reject({err, "error": "Something went wrong."});
                }
            });
        });
        
    });
}
            
function _updateUser(username, cartTotal) {
    return new Promise((resolve, reject) => {
        let sql = `update users set remain = remain - ${cartTotal}, block = block + ${cartTotal} where user_id = '${username}';`;
        connection.query(sql, (err, results) => {
            if (err) {
                reject({err, "error": "Something went wrong."});
            }
            console.log(results);
            resolve();
        });
    });
}

function _commitTransactino() {
    return new Promise((resolve, reject) => {
        connection.commit(function(err) {
            if (err) {
                reject({err, "error": "Something went wrong."});
            }
            resolve();
        });
    });
}

// 拿到所有店家，並初始變數的值
function _getShops() {
    return new Promise((resolve, reject) => {
        const sql = 'select meal_id, shops.* from meals, shops where meals.shop_id = shops.shop_id;';
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            let shops = [];
            for (let result of results) {
                let shop_id = result.shop_id;
                if (shops[shop_id] != null) {
                    shops[shop_id].meals.push(result.meal_id);
                } else {
                    let shop_name = result.shop_name;
                    let lowest_amount = result.lowest_amount;
                    let highest_amount = result.highest_amount;
                    shops[shop_id] = {
                        shop_id,
                        shop_name,
                        lowest_amount,
                        highest_amount,
                        "current_amount": 0,
                        "meals": [result.meal_id],
                        "details": [],
                        "score": 0
                    };
                }
            }
            resolve(shops);
        });
    });
}

// 拿到餐點的金額表
function _getMealsPrice() {
    return new Promise((resolve, reject) => {
        const sql = 'select meal_id, meal_price from meals;'
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            let mealsPrice = {};
            for (let result of results) {
                mealsPrice[result.meal_id] = result.meal_price;
            }
            resolve(mealsPrice);
        });
    });
}

module.exports = {
    newOrder,
    setOrders
};
