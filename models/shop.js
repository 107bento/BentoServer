// 全部店家 & 菜單
function showShops (callback) {
    // sql指令 -> 所有shop data
    let sql = `select shops.shop_id,shop_name,lowest_amount,highest_amount,shipping_fee,shop_discount,meals.meal_id,meal_name,meal_price,meal_discount from shops, meals where shops.shop_id = meals.shop_id Group by meals.meal_id;`;  
    connection.query(sql, (err, results) => {
        let tmp = {};
        if (err) {
            throw err;
        }

        //hash 
        for(let result of results) { // 讀每一筆 sql 查詢出來的資料
            if(tmp[result.shop_id] == null) {
                // shop 未存在,增加店家
                tmp[result.shop_id] = {
                    "shop_id": result.shop_id,
                    "shop_name": result.shop_name,
                    "lowest_amount": result.lowest_amount,
                    "highest_amount": result.highest_amount,
                    "shipping_fee": result.shipping_fee,
                    "shop_discount": result.shop_discount,
                    "meals": []
                };
            } 
            // 最後再加餐點
            // return answer ? "yes" : "no";
            // answer is true then return "yes" , answer is false then return "no"
            // shops[result.shop_id].meals ?= shops[result.shop_id].meals : {} ;
            // tmp[result.shop_id].meals =  typeof tmp[result.shop_id].meals === 'object' ? tmp[result.shop_id].meals : {} ;
            tmp[result.shop_id].meals.push({
                "meal_id": result.meal_id,
                "meal_name": result.meal_name,
                "meal_price": result.meal_price,
                "meal_discount": result.meal_discount
            });
        }

        let shops = [];
        for (let shopKey in tmp) {
            shops.push(tmp[shopKey]);
        }

        callback(undefined, shops);
        return;
    });
}

// 只拿到店家
function onlyshowShop (callback) {
    // sql指令 -> 所有shop data
    let sql = `select shops.shop_id,shop_name,lowest_amount,highest_amount,shipping_fee,shop_discount, (Select count(*) from details, meals where details.meal_id = meals.meal_id and shops.shop_id = meals.shop_id) as current_people from shops Group by shop_id;`;  
    connection.query(sql, (err, results) => {
        let tmp = {};
        if (err) {
            throw err;
        }

        //hash 
        for(let result of results) { // 讀每一筆 sql 查詢出來的資料
            if(tmp[result.shop_id] == null) {
                // shop 未存在,增加店家
                tmp[result.shop_id] = {
                    "shop_id": result.shop_id,
                    "shop_name": result.shop_name,
                    "lowest_amount": result.lowest_amount,
                    "highest_amount": result.highest_amount,
                    "shipping_fee": result.shipping_fee,
                    "shop_discount": result.shop_discount,
                    "current_people": result.current_people
                };
            }    
        }

        let shops = [];
        for (let shopKey in tmp) {
            shops.push(tmp[shopKey]);
        }

        callback(undefined, shops);
        return;
    });
}

// 拿到店家 id 對應的 Meal
function onlyshowMeal (shop_id, callback) {
    // sql指令 -> 所有shop data
    let sql = `select meals.meal_id,meal_name,meal_price,meal_discount from meals where meals.shop_id =` + shop_id +` Group by meals.meal_id;`;   
    connection.query(sql, (err, results) => {
        if (err) {
            callback("Something went wrong.", undefined);
            throw err;
            return;
        }
        if (results.length == 0) {
            callback("This shop doesn't have menu or not exist.", undefined);
            return;
        } else {
        //hash 
            let tmp = {};
            for(let result of results) { // 讀每一筆 sql 查詢出來的資料
                tmp[result.meal_id] = {
                    "meal_id": result.meal_id,
                    "meal_name": result.meal_name,
                    "meal_price": result.meal_price,
                    "meal_discount": result.meal_discount
                };  
            }

            let meals = [];

            for(let mealKey in tmp) {
                meals.push(tmp[mealKey]);
            }
            callback(undefined, meals);
            return;
        }
    });
}

// 拿到所有餐點的詳細資訊
function getMealsInfo() {
    return new Promise((resolve, reject) => {
        const sql = 'select meal_id, meal_name, meal_price, shop_name, shops.shop_id from shops, meals where meals.shop_id = shops.shop_id;';
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            let mealsInfo = {};
            // console.log(results);
            for (let result of results) {
                mealsInfo[result.meal_id] = {
                    "meal_id": result.meal_id,
                    "meal_name": result.meal_name,
                    "meal_price": result.meal_price,
                    "shop_name": result.shop_name,
                    "shop_id": result.shop_id,
                };
            }
            resolve(mealsInfo);
        });
    });
}

module.exports = {
    showShops,
    onlyshowShop,
    onlyshowMeal,
    getMealsInfo
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