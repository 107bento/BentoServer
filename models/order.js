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

function sortOrder (callback){ // 排單演算法
    // 先取當天日期 MyDateString
    var MyDate = new Date();
    var MyDateString;
    MyDate.setDate(MyDate.getDate());
    MyDateString = MyDate.getFullYear() + '/' + ('0' + (MyDate.getMonth()+1)).slice(-2) + '/' + ('0' + MyDate.getDate()).slice(-2);
    // console.log(MyDateString);
    // sql 取出當天 order_id 和 detail
    let sql = "select * from details where order_id IN("
         + "select order_id from orders where order_time = '" + MyDateString + "');";
    /* 創一個 shop 的 json {}
       shop - meal - num
    */
    let shops = {};
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        for (let result of results ) {
            amount = result.amount;
            let shop_id;
            _belongShop(1, (error, result) =>{
                shop_id = result;
                if(shops[shop_id] == null) {
                    // shop 未存在,增加店家
                    shops[shop_id] = {
                        "shop_id": shop_id,
                        "shop_name": result.shop_name
                    };
                }
                shops[shop_id].meals =  typeof shops[shop_id].meals === 'object' ? shops[shop_id].meals : {} ;
                if(shops[shop_id].meals[result.meal_id] == null) {
                    // meal 未存在,增加 meal
                    shops[shop_id].meals[result.meal_id] = {
                        "meal_id": result.meal_id,
                        "meal_name": result.meal_name,
                        "meal_amount": amount
                    };
                } else {
                    amount = amount + shops[shop_id].meals[meal_id].meal_amount;
                    shops[shop_id].meals[meal_id].meal_amount =  amount;
                }
            });
            
        }
        callback(undefined, shops);
        return;
    });
}
function _belongShop(meal_id,callback) { // 從 mealid 找到店家 shopid
    let sql = "select shop_id from meals where meal_id = " + meal_id + ";" ;
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        callback(undefined, results[0].shop_id);
        return;
    }); 
}
module.exports = {
    newOrder,
    sortOrder
};