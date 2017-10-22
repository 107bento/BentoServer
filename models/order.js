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
                   "(" + detail.meal_id + "," + detail.amount + "," + detail.subtotal + ", 1 ," + detail.wish_id[0] + "," + detail.wish_id[1] + "," + detail.wish_id[2] + "," +detail.random_pick + "," +orderId+ ");";
            
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
    const sql = 'select details.*, meals.shop_id, shops.shop_name from details inner join meals,shops where order_id IN(select order_id from orders where order_time = "' + date + '")and details.meal_id = meals.meal_id and meals.shop_id = shops.shop_id;';

    // 計算有哪些店家
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        // 清空所有店家
        let shops = {};
        // 看每一筆訂單資料
        for (let result of results ) {
            // 先把餐點數量存起來
            let amount = result.amount;

            let shop_id = result.shop_id;
            // 若 shop 未存在 => 增加店家
            if(shops[shop_id] == null) {
                shops[shop_id] = {
                    "shop_name": result.shop_name,
                    "meals": {}
                };
            }

            let mealId = result.meal_id;
            // 若點家的 meal 不存在 => 新增餐點，並把數量存進去
            if(shops[shop_id].meals[mealId] == null) {
                shops[shop_id].meals[mealId] = amount;
            } else {
                // 已經存在就累加
                amount += result.meal_amount;
                shops[shop_id].meals[mealId] = amount;
            }
        }
        console.log(shops);
    });
}

module.exports = {
    newOrder,
    sortOrder
};