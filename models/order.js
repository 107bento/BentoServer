const moment = require('moment');
const async = require('async');
// 新增訂單
function newOrder (username, orderTime, total, details, callback) {

    // transaction 如果有一個 error 全部 rollback
    connection.beginTransaction((err) => {
        if (err) { 
            return callback({"error": "Something went wrong."}, undefined);
        }
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
        connection.query(sql, (err, results) => {
            if (err) {
            }


                connection.query(sql, (err, results) => {
                    if (err) {
                    }
                });
            }, (err) => {
                if (err) {
                }
            });
            
function _updateUser(username, cartTotal) {

        });
    });
}

// 結算訂單的起點
function setOrders() {
    // 先拿到所有店家與餐點的金額表再開始排序
    Promise.all([_getShops(), _getMealsPrice()]).then((data) => {
        const shops = data[0];
        const mealsPrice = data[1];
        _sortOrders(shops, mealsPrice);
    }).catch((error) => {
        throw error;
    });
}

// 排單演算法s
function _sortOrders(shops, mealsPrice) {
    // 建立今天的日期
    // 先寫死 date
    // const date = moment().format('YYYY-MM-DD');
    date = '2017-10-29';
    // 搜尋所有當日的訂單 by 隨機
    const sql = 'select * from details where order_id IN(select order_id from orders where order_time = "' + date + '")';
    
    /*
        這邊還差要確認店家的是否有營業
    */

    // 拿到所有訂單
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        // 每一筆訂單
        let details = {};
        // 一筆一筆看訂單 (main, wish_1, wish_2)，把 results 寫進去 details
        for (let result of results) {
            // 設定要儲存訂單內容
            let detail_id = result.detail_id;
            let subTotal = result.subtotal;
            let amount = result.amount;
            let randomPick = result.random_pick != 0? true: false;
            let main = result.meal_id;
            let first = result.wish_id_1;
            let second = result.wish_id_2;
            let third = result.wish_id_3;
            let final = result.final_meal;
            let state = result.state;

            details[detail_id] = {detail_id, subTotal, amount, randomPick, main, first, second, third, final, state};
            
            // 主要餐點 +4 分
            for (let shopIndex in shops) {
                if (shops[shopIndex].meals.indexOf(main) != -1) {
                    shops[shopIndex].score += (4 * amount);
                    details[detail_id].main_shop = shopIndex;
                    break;
                }
            }

            // 如果沒有第一志願序，直接跳下一訂單
            if (first == 0) {
                continue;
            } else {
                // 找到店家，第一志願 +3 分
                for (let shopIndex in shops) {
                    if (shops[shopIndex].meals.indexOf(first) != -1) {
                        shops[shopIndex].score += (3 * amount);
                        details[detail_id].first_shop = shopIndex;
                        break;
                    }
                }
            }

            // 如果沒有第二志願序，直接跳下一訂單
            if (second == 0) {
                continue;
            } else {
                // 找到店家，第二志願 +2 分
                for (let shopIndex in shops) {
                    if (shops[shopIndex].meals.indexOf(second) != -1) {
                        shops[shopIndex].score += (2 * amount);
                        details[detail_id].second_shop = shopIndex;
                        break;
                    }
                }
            }

            // 如果沒有第三志願序，直接跳下一訂單
            if (third == 0) {
                continue;
            } else {
                // 找到店家，第三志願 +1 分
                for (let shopIndex in shops) {
                    if (shops[shopIndex].meals.indexOf(third) != -1) {
                        shops[shopIndex].score += (1 * amount);
                        details[detail_id].third_shop = shopIndex;
                        break;
                    }
                }
            }
        }

        // 把大家有點的店家挑出來（用分數判斷）
        let orderedShops = [];
        for (let shopIndex in shops) {
            if (shops[shopIndex].score <= 0){
                continue;
            } else {
                orderedShops.push(shops[shopIndex]);
            }
        }

        // 按照分數排店家順序
        orderedShops.sort((a, b) => {
            if (a.score > b.score) {
                return -1;
            } else if (a.score <= b.score) {
                return 1;
            }
        });

        // 一筆一筆訂單看每個主要 & 志願，如果有找到對應的店家，檢查有沒有超過 highest 後就可以加進去，否則換下一志願
        for (let detailKey in details) {
            for (let shopIndex in orderedShops) {
                if (orderedShops[shopIndex].shop_id == details[detailKey].main_shop) {
                    if (orderedShops[shopIndex].current_amount + details[detailKey].amount <= orderedShops[shopIndex].highest_amount) {
                        orderedShops[shopIndex].details.push(details[detailKey].detail_id);
                        orderedShops[shopIndex].current_amount += details[detailKey].amount;
                        break;
                    }
                }

                if (details[detailKey].first == 0) {continue;}
                else {
                    if (orderedShops[shopIndex].shop_id == details[detailKey].first_shop) {
                        if (orderedShops[shopIndex].current_amount + details[detailKey].amount <= orderedShops[shopIndex].highest_amount) {
                            orderedShops[shopIndex].details.push(details[detailKey].detail_id);
                            orderedShops[shopIndex].current_amount += details[detailKey].amount;
                            break;
                        }
                    }
                }

                if (details[detailKey].second == 0) {continue;}
                else {
                    if (orderedShops[shopIndex].shop_id == details[detailKey].second_shop) {
                        if (orderedShops[shopIndex].current_amount + details[detailKey].amount <= orderedShops[shopIndex].highest_amount) {
                            orderedShops[shopIndex].details.push(details[detailKey].detail_id);
                            orderedShops[shopIndex].current_amount += details[detailKey].amount;
                            break;
                        }
                    }
                }
                
                if (details[detailKey].third == 0) {continue;}
                else {
                    if (orderedShops[shopIndex].shop_id == details[detailKey].third_shop) {
                        if (orderedShops[shopIndex].current_amount + details[detailKey].amount <= orderedShops[shopIndex].highest_amount) {
                            orderedShops[shopIndex].details.push(details[detailKey].detail_id);
                            orderedShops[shopIndex].current_amount += details[detailKey].amount;
                            break;
                        }
                    }
                }
            }
        }

        // 店家確定有達底標的，把那些 meals 的 state 設成 2 （已成單），並設定已成單的 final_meal
        for (let shopIndex in orderedShops) {
            // 判斷有沒有超過低標
            if (orderedShops[shopIndex].current_amount >= orderedShops[shopIndex].lowest_amount) {
                // 如果有的話，看這個店家有哪些 details
                for (let detailIndex in orderedShops[shopIndex].details) {
                    // 設定該筆訂單的狀態 2 表示已成單
                    details[orderedShops[shopIndex].details[detailIndex]].state = 2;

                    // 找到是哪一個主要 or 志願是這個店家，如果是，填上 final_meal
                    if (details[orderedShops[shopIndex].details[detailIndex]].main_shop == orderedShops[shopIndex].shop_id) {
                        details[orderedShops[shopIndex].details[detailIndex]].final = details[orderedShops[shopIndex].details[detailIndex]].main;
                        continue;
                    } else if (details[orderedShops[shopIndex].details[detailIndex]].first_shop == orderedShops[shopIndex].shop_id) {
                        details[orderedShops[shopIndex].details[detailIndex]].final = details[orderedShops[shopIndex].details[detailIndex]].first;
                        continue;
                    } else if (details[orderedShops[shopIndex].details[detailIndex]].second_shop == orderedShops[shopIndex].shop_id) {
                        details[orderedShops[shopIndex].details[detailIndex]].final = details[orderedShops[shopIndex].details[detailIndex]].second;
                        continue;
                    } else if (details[orderedShops[shopIndex].details[detailIndex]].third_shop == orderedShops[shopIndex].shop_id) {
                        details[orderedShops[shopIndex].details[detailIndex]].final = details[orderedShops[shopIndex].details[detailIndex]].third;
                        continue;
                    }
                }
            }
        }

        // 處理 random_pick 的人
        for (let detailKey in details) {
            if (details[detailKey].state == 1) {
                details[detailKey].state = 4;
            }
            // 如果有 random_pick 又還沒成單的 detail
            if (details[detailKey].randomPick && details[detailKey].state != 2) {
                // 初始狀態
                let state = 4;
                // 預設還沒有 final_meal
                let hasfinal = false;
                // 看每一間店家
                for (let shopIndex in orderedShops) {
                    // 先判斷店家有沒有達低標，如果沒有就忽略
                    if (orderedShops[shopIndex].current_amount < orderedShops[shopIndex].lowest_amount){continue;}
                    // 加上去又不會超過最大數量
                    if (orderedShops[shopIndex].current_amount + details[detailKey].amount <= orderedShops[shopIndex].highest_amount) {
                        // 隨機取餐！！！！！！！！！！
                        for (let mealIndex in orderedShops[shopIndex].meals) {
                            let price = mealsPrice[orderedShops[shopIndex].meals[mealIndex]];
                            if (price <= (details[detailKey].subTotal / details[detailKey].amount))  {
                                orderedShops[shopIndex].details.push(details[detailKey].detail_id);
                                orderedShops[shopIndex].current_amount += details[detailKey].amount;
                                state = 2;
                                details[detailKey].final = orderedShops[shopIndex].meals[mealIndex];
                                hasfinal = true;
                                break;
                            }
                        }
                    }
                    // 如果有 final，就不用再選店家了
                    if (hasfinal) {break;}
                }
                details[detailKey].state = state;
            }
        }
        
        // 寫檔測試
        // console.log(orderedShops);
        // console.log(util.inspect(details, {"showHidden": true, "depth": null}));
        // fs.writeFile('details.json', JSON.stringify(details));
        // fs.writeFile('shops.json', JSON.stringify(orderedShops));

        /*
            還差寫入資料庫
        */
        
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
