// 新增訂單
function newOrder (username, orderTime, total, details, callback) {
    // sql指令 -> 新增購物車
    let sql = "insert into orders  (user_id, order_time, total) values ('" + username + "','" + orderTime + "'," + total + ");";
    //console.log(sql);
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        //console.log(results.insertId);
        let orderId = results.insertId;
        for (let detail of details) {
            let sql2 = "insert into details (meal_id, amount, subtotal, state, wish_id_1, wish_id_2, wish_id_3, random_pick, order_id) values" +
                   "(" + detail.meal_id + "," + detail.amount + "," + detail.subtotal + ", 1 ," + detail.wish_id_1 + "," + detail.wish_id_2 + "," + detail.wish_id_3 + "," +detail.random_pick + "," +orderId+ ");";
            
            connection.query(sql2, (err, results) => {
                if (err) {
                    throw err;
                }
            });
        }
        callback(undefined, results);
        return;
    });
}

// 排單演算法
function sortOrder() {
    // 建立今天的日期
    const date = moment().format('YYYY-MM-DD');
    // 搜尋所有當日的訂單
    const sql = 'select details.*, meals.shop_id, shops.* from details inner join meals,shops where order_id IN(select order_id from orders where order_time = "' + date + '")and details.meal_id = meals.meal_id and meals.shop_id = shops.shop_id;';

    // 計算有哪些店家
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        // 清空所有店家
        let orderedShops = {};

        // orderedShops[0] = other
        orderedShops[0] = {
            "shop_name" : "other",
            "total_amount" : 0,
            "lowest_amount": 0,
            "highest_amount": 10000,
            "meals" : {}
        };

        // 看每一筆訂單資料(第一輪)
        for (let result of results ) {
            // 先把餐點數量, 餐點Id, shop_id 存起來
            let amount = result.amount;
            let mealId = result.meal_id;
            let shop_id = result.shop_id;
            // 若 shop 未存在 => 增加店家
            if(orderedShops[shop_id] == null) {
                orderedShops[shop_id] = {
                    "shop_name": result.shop_name,
                    "total_amount": 0,
                    "lowest_amount": result.lowest_amount,
                    "highest_amount": result.highest_amount,
                    "meals": {}
                };
            }
            // 若點家的 meal 不存在 && 加入不超過上限 => 新增餐點，並把數量存進去
            // 若點家的 meal 不存在 but 加入會超過上限 => 丟進other 變成 state : F
            if(orderedShops[shop_id].meals[mealId] == null) {
                if (amount + orderedShops[shop_id].total_amount <= orderedShops[shop_id].highest_amount) {
                    orderedShops[shop_id].meals[mealId] = {
                        amount,
                        // detail_id =>誰訂, state =>確定了沒, round=>第幾輪
                        // T 1 排第1輪就確定, F 2 排第2輪但不成功要進第3輪
                        "details": [ { "result.detail_id" : result.detail_id, "subamount" : amount, "state" : "F", "round" : 1} ]
                    };
                    orderedShops[shop_id].total_amount += amount;
                } else {
                    if (orderedShops[0].meals[mealId] == null) {
                        orderedShops[0].meals[mealId] = {
                            amount,
                            "details": [ { "result.detail_id" : result.detail_id, "subamount" : amount, "state" : "F", "round" : 1} ]
                        };
                    } else {
                        orderedShops[0].meals[mealId].amount += amount;
                        orderedShops[0].meals[mealId].details.push( { "result.detail_id" : result.detail_id, "subamount" : amount, "state": "F", "round" : 1 } ) ;
                    }
                    orderedShops[0].total_amount += amount;
                }
            } else {  // 店家存在 && 餐點也存在
                // amount += result.meal_amount;(不確定-無義)
                // 檢查加入會不會超過上限
                // OK => 存紀錄（mealId.amount, datail_id, total_amount)
                // 會爆 => 丟other & 存紀錄
                if (orderedShops[shop_id].total_amount + result.meal_amount <= orderedShops[shop_id].highest_amount) {
                    orderedShops[shop_id].meals[mealId].amount += amount;
                    orderedShops[shop_id].meals[mealId].details.push( { "result.detail_id" : result.detail_id, "subamount" : amount, "state": "F", "round" : 1 } );
                    orderedShops[shop_id].total_amount += amount;
                } else {
                    if (orderedShops[0].meals[mealId] == null) {
                        orderedShops[0].meals[mealId] = {
                            amount,
                            "details": [ { "result.detail_id" : result.detail_id, "subamount" : amount, "state" : "F", "round" : 1} ]
                        };
                    } else {
                        orderedShops[0].meals[mealId].amount += amount;
                        orderedShops[0].meals[mealId].details.push( { "result.detail_id" : result.detail_id, "subamount" : amount, "state": "F", "round" : 1 } ) ;
                    }
                    orderedShops[0].total_amount += amount;
                }
            }  
        }
        // console.log(orderedShops['1'].meals['2']);
        // 
    });
}

module.exports = {
    newOrder,
    sortOrder
};
