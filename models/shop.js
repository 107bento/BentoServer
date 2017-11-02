// 全部店家 & 菜單
function showShop (callback) {
    // sql指令 -> 所有shop data
    let sql = `select shops.shop_id,shop_name,lowest_amount,highest_amount,shipping_fee,shop_discount,meals.meal_id,meal_name,meal_price,meal_discount from shops, meals where shops.shop_id = meals.shop_id Group by meals.meal_id;`;  
    connection.query(sql, (err, results) => {
        let shops = {};
        if (err) {
            throw err;
        }

        //hash 
        for(let result of results) { // 讀每一筆 sql 查詢出來的資料
            if(shops[result.shop_id] == null) {
                // shop 未存在,增加店家
                shops[result.shop_id] = {
                    "shop_id": result.shop_id,
                    "shop_name": result.shop_name,
                    "lowest_amount": result.lowest_amount,
                    "highest_amount": result.highest_amount,
                    "shipping_fee": result.shipping_fee,
                    "shop_discount": result.shop_discount
                };
            } 
            // 最後再加餐點
            // return answer ? "yes" : "no";
            // answer is true then return "yes" , answer is false then return "no"
            // shops[result.shop_id].meals ?= shops[result.shop_id].meals : {} ;
            shops[result.shop_id].meals =  typeof shops[result.shop_id].meals === 'object' ? shops[result.shop_id].meals : {} ;
            shops[result.shop_id].meals[result.meal_id] = {
                "meal_id": result.meal_id,
                "meal_name": result.meal_name,
                "meal_price": result.meal_price,
                "meal_discount": result.meal_discount
            };
            
            
        }
        callback(undefined, shops);
        return;
    });
}

// 只拿到店家
function onlyshowShop (callback) {
    // sql指令 -> 所有shop data
    let sql = `select shops.shop_id,shop_name,lowest_amount,highest_amount,shipping_fee,shop_discount from shops Group by shop_id;`;  
    connection.query(sql, (err, results) => {
        let shops = {};
        if (err) {
            throw err;
        }

        //hash 
        for(let result of results) { // 讀每一筆 sql 查詢出來的資料
            if(shops[result.shop_id] == null) {
                // shop 未存在,增加店家
                shops[result.shop_id] = {
                    "shop_id": result.shop_id,
                    "shop_name": result.shop_name,
                    "lowest_amount": result.lowest_amount,
                    "highest_amount": result.highest_amount,
                    "shipping_fee": result.shipping_fee,
                    "shop_discount": result.shop_discount
                };
            }    
        }
        callback(undefined, shops);
        return;
    });
}

// 拿到店家 id 對應的 Meal
function onlyshowMeal (shop_id,callback) {
    // sql指令 -> 所有shop data
    let sql = `select meals.meal_id,meal_name,meal_price,meal_discount from meals where meals.shop_id =` + shop_id +` Group by meals.meal_id;`;   
    connection.query(sql, (err, results) => {
        let meals = {};
        if (err) {
            throw err;
        }

        //hash 
        for(let result of results) { // 讀每一筆 sql 查詢出來的資料
            meals[result.meal_id] = {
                "meal_id": result.meal_id,
                "meal_name": result.meal_name,
                "meal_price": result.meal_price,
                "meal_discount": result.meal_discount
            };  
        }
        callback(undefined, meals);
        return;
    });
}
module.exports = {
    showShop,
    onlyshowShop,
    onlyshowMeal
};





/*
all_shops = {
    1: {
        "shop_id": 1,
        "shop_name": "山園",
        "lowest_amount": 15,
        "highest_amount": 50,
        "shipping_fee": 20,
        "shop_discount": "0",
        "meals": {
            1: {
                "meal_id": 1,
                "meal_name": "雞腿飯",
                "meal_price": 95,
                "meal_discount": 0
            }
        }
    },



all_shops = {
    "1": {
        "shop_id": 1,
        "shop_name": "山園",
        "lowest_amount": 15,
        "highest_amount": 50,
        "shipping_fee": 20,
        "shop_discount": "0",
        "1": {
            "meal_id": 1,
            "meal_name": "雞腿飯",
            "meal_price": 95,
            "meal_discount": 0
        },
        "2":{

        }
    },


let all_shops = {};
results.forEach(function(element) {
    all_shops[element.shop_id][element.meal_id] = {
        "mael_name":    "雞腿飯",
        "A__A":         "QAQ"
    }

    all_shops[element.shop_id] = {
        "shop_name": "山園",
        "lowest_amount": 15,
        "highest_amount": 50,
        "shipping_fee": 20,
        "shop_discount": "0"
    }

    all_shops[element.shop_id].meals[element.meal_id] = {

    }

}, this);
*/