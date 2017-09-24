// 店家 & 菜單
function showShop (callback) {
    // sql指令 -> 所有shop data
    let sql = `select shops.shop_id,shop_name,lowest_amount,highest_amount,shipping_fee,shop_discount,meals.meal_id,meal_name,meal_price,meal_discount from shops, meals where shops.shop_id = meals.shop_id Group by meals.meal_id;`;  
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        console.log(results);
        /*data = {

        }*/
        callback(undefined, { "ending" : "店家顯示ok" } );
        return;
    });
}

module.exports = {
    showShop
};