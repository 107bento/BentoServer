const moment = require('moment');
const shop = require('./shop');
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
            let shops = {};
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

// 拿到 today details 
function _getTodayDetails() {
    /// 建立今天的日期
    // 先寫死 date
    // const date = moment().format('YYYY-MM-DD hh:mm:ss');
    const date = '2017-12-01 00:00:00';
    // 搜尋所有當日的訂單 by 隨機
    const sql = 'select * from details where order_id IN(select order_id from orders where order_time > "' + date + '")';

    return new Promise((resolve, reject) => {
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            // 每一筆訂單
            let details = {};
            let i = 0;
            // 一筆一筆看訂單 (main, wish_1, wish_2)，把 results 寫進去 details
            for (let result of results) {
                // 設定要儲存訂單內容
                let detail_id = result.detail_id;
                let subTotal = result.subtotal;
                let amount = result.amount;
                let randomPick = result.random_pick != 0? true: false;
                let main = result.meal_id;
                let mainShop = null;
                let first = result.wish_id_1;
                let firstShop = null;
                let second = result.wish_id_2;
                let secondShop = null;
                let third = result.wish_id_3;
                let thirdShop = null;
                let final = result.final_meal;
                let state = result.state;

                details[i++] = {detail_id, subTotal, amount, randomPick, main, mainShop, first, firstShop, second, secondShop, third, thirdShop, final, state};
            }
            details.length = results.length;
            // console.log(details);
            resolve(details);
        });
    }) 
}

// 結算訂單的起點
function setOrders() {
    // 先拿到所有店家與餐點的金額表再開始排序
    Promise.all([_getShops(), _getMealsPrice(), _getTodayDetails()]).then((data) => {
        const shops = data[0];
        const mealsPrice = data[1];
        const details = data[2];
        for (let detailKey in details) {
            for (let shopKey in shops) {
                if (shops[shopKey].meals.indexOf(details[detailKey].main) != -1) {
                    details[detailKey].mainShop = shops[shopKey].shop_id;
                }
                if (shops[shopKey].meals.indexOf(details[detailKey].first) != -1) {
                    details[detailKey].firstShop = shops[shopKey].shop_id;
                }
                if (shops[shopKey].meals.indexOf(details[detailKey].second) != -1) {
                    details[detailKey].secondShop = shops[shopKey].shop_id;
                }
                if (shops[shopKey].meals.indexOf(details[detailKey].third) != -1) {
                    details[detailKey].thirdShop = shops[shopKey].shop_id;
                }
            }
        }
        // console.log(details);
        _sortOrders(shops, mealsPrice, details, 0);
    }).catch((error) => {
        throw error;
    });
}

// 排單演算法
bestShops = {};
maxScore = 0;
function _sortOrders(shops, mealsPrice, details, at) {
    // 如果全部處理完，把所有店家分數加起來
    if (at == details.length) {
        let totalScore = 0;
        for(let shopKey in shops) {
            if (shops[shopKey].current_amount >= shops[shopKey].lowest_amount) {
                totalScore += shops[shopKey].score;
            }
        }
        // 如果有大於最高分，把目前店家存起來
        if (totalScore > maxScore) {
            maxScore = totalScore;
            bestShops = shops;
            console.log(maxScore);
            for (let shopKey in bestShops) {
                console.log(bestShops[shopKey].details);
            }
        }
        return ;
    }

    let main = details[at].mainShop;
    if (shops[main].current_amount + details[at].amount <= shops[main].highest_amount) {
        shops[main].score += 3;
        shops[main].details.push(details[at].detail_id);
        shops[main].current_amount += details[at].amount;
        _sortOrders(shops, mealsPrice, details, at+1);
        shops[main].score -= 3;
        shops[main].details.pop();
        shops[main].current_amount -= details[at].amount;
    }
    
    if (details[at].firstShop) {
        let first = details[at].firstShop;
        if (shops[first].current_amount + details[at].amount <= shops[first].highest_amount) {
            shops[first].score += 2;
            shops[first].details.push(details[at].detail_id);
            shops[first].current_amount += details[at].amount;
            _sortOrders(shops, mealsPrice, details, at+1);
            shops[first].score -= 2;
            shops[first].details.pop();
            shops[first].current_amount -= details[at].amount;
        }
    } else {
        _sortOrders(shops, mealsPrice, details, at+1);
    }
    
    if (details[at].secondShop) {
        let second = details[at].secondShop;
        if (shops[second].current_amount + details[at].amount <= shops[second].highest_amount) {
            shops[second].score += 1;
            shops[second].details.push(details[at].detail_id);
            shops[second].current_amount += details[at].amount;
            _sortOrders(shops, mealsPrice, details, at+1);
            shops[second].score -= 1;
            shops[second].details.pop();
            shops[second].current_amount -= details[at].amount;
        }
    } else {
        _sortOrders(shops, mealsPrice, details, at+1);
    }
}

function greedy() {
    Promise.all([_getShops(), _getMealsPrice(), _getTodayDetails()]).then((data) => {
        const shops = data[0];
        const mealsPrice = data[1];
        const details = data[2];
        // 1.計算接受度
        // 全部訂單取出來
        // console.log(details);
        for (let detailKey in details) {
            if (detailKey == 'length') {
                break;
            }
            let wishNumber = 0;
            // 如果接受隨機
            // 所有店家 score++, 放 detail
            if (details[detailKey].randomPick) {
                wishNumber = Object.keys(shops).length-1;
                for (let shopKey in shops) {
                    shops[shopKey].score += wishNumber;
                    shops[shopKey].current_amount += details[detailKey].amount;
                    shops[shopKey].details.push(detail);
                }
            } else { // 無隨機者
                // 紀錄餐點對應店家 && 志願序個數
                for (let shopKey in shops) {
                    if (shops[shopKey].meals.indexOf(details[detailKey].main) != -1) {
                        details[detailKey].mainShop = shops[shopKey].shop_id;
                    }
                    if (shops[shopKey].meals.indexOf(details[detailKey].first) != -1) {
                        details[detailKey].firstShop = shops[shopKey].shop_id;
                        wishNumber++;
                    }
                    if (shops[shopKey].meals.indexOf(details[detailKey].second) != -1) {
                        details[detailKey].secondShop = shops[shopKey].shop_id;
                        wishNumber++;
                    }
                    if (shops[shopKey].meals.indexOf(details[detailKey].third) != -1) {
                        details[detailKey].thirdShop = shops[shopKey].shop_id;
                        wishNumber++;
                    }
                }
                // 將訂單放入 " 該訂單可接受的店家 "
                let mainShop = details[detailKey].mainShop;
                shops[mainShop].details.push(detailKey);
                shops[mainShop].current_amount += details[detailKey].amount;
                shops[mainShop].score += wishNumber;
                // console.log(shops[mainShop].details);

                if (details[detailKey].first != 0) {
                    let firstShop = details[detailKey].firstShop;
                    // console.log(shops[firstShop].details);
                    shops[firstShop].score += wishNumber;
                    shops[firstShop].details.push(detailKey);
                    shops[firstShop].current_amount += details[detailKey].amount;
                    
                    if (details[detailKey].second != 0) {
                        let secondShop = details[detailKey].secondShop;
                        // console.log(shops[secondShop].details);
                        shops[secondShop].score += wishNumber;
                        shops[secondShop].details.push(detailKey);
                        shops[secondShop].current_amount += details[detailKey].amount;

                        if (details[detailKey].third != 0) {
                            let thirdShop = details[detailKey].thirdShop;
                            // console.log(shops[thirdShop].details);
                            shops[thirdShop].score += wishNumber;
                            shops[thirdShop].details.push(detailKey);
                            shops[thirdShop].current_amount += details[detailKey].amount;
                        }
                    }    
                }
                
            }
            details[detailKey].wishNumber = wishNumber;
            // console.log(details[detailKey]);
        }
        // console.log("te");
        // 2. 事前準備
        for (let shopKey in shops) {
            // 如果數量小於 lowest, 篩選掉不可能店家
            // console.log(shops[shopKey].details);
            if (shops[shopKey].current_amount< shops[shopKey].lowest_amount) {
                delete shops.shopKey;
                continue;
            }
            // 數量歸 0，new 最後名單
            // 店家裡的 details 依志願序數量排序
            shops[shopKey].current_amount = 0;
            shops[shopKey].finalList = [];
            // console.log("OK");
            if (shops[shopKey].details.length > 1){
                // console.log(shops[shopKey].details);
                // for (let detail of shops[shopKey].details) {
                //     console.log(details[detail]);
                // }
                shops[shopKey].details.sort(function(a, b){console.log(a);console.log(b);return details[a].wishNumber-details[b].wishNumber});
                console.log(shops[shopKey].details);
            }
            // console.log("OK");
        }
        // 店家依互斥度排序 
        // keysSorted 為一個 object 裡面是店家互斥度排序的結果
        shopSorted = Object.keys(shops).sort(function(a,b){return shops[a].score-shops[b].score});

        // 3. 開始排單
        // first round 通通達低標就換下一家
        for (let key in shopSorted) {
            let shopid = shopSorted[key];
            for (let detail in shops[shopid].details) {
                let detailid = shops[shopid].details[detail];
                // 如果該 detail 還沒決定 && 加進去不會爆單
                // add 進該店家，然後改狀態
                if (details[detailid].state == 1 && shops[shopid].current_amount + details[detailid].amount <= shops[shopid].highest_amount) {
                    shops[shopid].current_amount += details[detailid].amount;
                    shops[shopid].finalList.push(detailid);
                    details[detailid].state = 2 ; 
                    if(shops[shopid].current_amount >= shops[shopid].lowest_amount) {
                        break;
                    }
                }
            }
        }
        // second round 把剩餘的都排一排
        for (let key in shopSorted) {
            let shopid = shopSorted[key];
            for (let detail in shops[shopid].details) {
                let detailid = shops[shopid].details[detail];
                if (details[detailid].state == 1 && shops[shopid].current_amount + details[detailid].amount <= shops[shopid].highest_amount) {
                    shops[shopid].current_amount += details[detailid].amount;
                    shops[shopid].finalList.push(detailid);
                    details[detailid].state = 2 ; 
                    if(shops[shopid].current_amount == shops[shopid].highest_amount) {
                        break;
                    }
                }
            }
        }

        // 目前的進度
        // 4. 最後一步把剩下 state 還是 = 1 的單變成流單
        for (let detailKey in details) {
            if (details[detailKey].state == 1) {
                details[detailKey].state = 4;
            }
        }
        console.log(shops);
        console.log(details);
    }).catch((error) => {
        throw error;
    });
}

// 拿到某一筆 order 的 details (要秀出的是 final)
function getOrderByAdmin(order_id, callback) {

    shop.getMealsInfo().then((mealsInfo) => {
        let sql = `select * from details where order_id = ${order_id};`;
        connection.query(sql, (err, results) => {
            if (err) {
                return callback({err, error: "something went wrong!"}, undefined);
            }
            let details = [];
            for (let result of results) {
                // console.log(result);
                let detail = {
                    "detail_id": result.detail_id,
                    "amount": result.amount,
                    "subtotal": result.subtotal,
                    "state": result.state,
                    "meal": result.meal_id != 0 ? mealsInfo[result.meal_id] : null,
                    "wish_1": result.wish_id_1 != 0 ? mealsInfo[result.wish_id_1] : null,
                    "wish_2": result.wish_id_2 != 0 ? mealsInfo[result.wish_id_2] : null,
                    "wish_3": result.wish_id_3 != 0 ? mealsInfo[result.wish_id_3] : null,
                    "random_pick": result.random_pick != 0 ? true : false,
                    "final_meal": result.final_meal != null ? mealsInfo[result.final_meal] : null,
                }
                details.push(detail);
            }
            // console.log(details);
            return callback(undefined, {order_id: order_id ,details});
        });
    }).catch((error) => {
        throw error;
    });
}

// admin 可以確認領餐
function checkOrderByAdmin(order_id, callback) {
    
    // transaction 如果有一個 error 全部 rollback
    connection.beginTransaction((err) => {
        if (err) { 
            return callback({"error": "Something went wrong."}, undefined);
        }
        // 使用 promise 確保事情做完才做下一件事情
        // 每個 function 回傳 promise 再丟給下一個人處理
        _getDetails(order_id).then((data) => {
            return _updateDetails(data);
        }).then(() => {
            return _commitTransactino();
        }).then(() => {
            callback(undefined, {"success": "Get this order."});
        }).catch((err) => {
            // promise 被 reject 就代表有錯誤，需要丟回來這裡處理
            // 有任何一個 error 都 rollback 回去
            connection.rollback(() => {
                return callback(err, undefined);
            });
        });
    });
}

function _getDetails(order_id) {
    let sql = `select * from details where order_id = ${order_id};`;
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err, {"error": "Something went wrong."});
            }
            if (results.length <= 0) {
                reject({"error": "The order is not existed."});
            }
            resolve(results);
        });
    });
}

function _updateDetails(details) {
    return new Promise((resolve, reject) => {
        let sql = '';
        let count = 0;
        async.each(details, (detail, callback) => {
            sql = `update details set state = 3 where detail_id = ${detail.detail_id} and state = 1`;
            connection.query(sql, (err, results) => {
                if (err) {
                    callback(err, {"error": "Something went wrong."});
                }
                console.log(detail);
                console.log(results);
                if (results.affectedRows == 0) {
                    callback({error:"The order has been recieved!"});
                }
                count++;
                if (count == details.length) {
                    resolve();
                }
            });
        }, (err) => {
            reject(err);
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

module.exports = {
    newOrder,
    setOrders,
    greedy,
    getOrderByAdmin,
    checkOrderByAdmin
};
