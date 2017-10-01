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

module.exports = {
    newOrder
};