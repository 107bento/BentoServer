const moment = require('moment');
// 登入驗證
function validate (username, password, callback) { 
    // 帳密要求字串型態
    if (typeof(username) !== 'string' || typeof(password) !== 'string') { 
        let error='username and password must be string.';
        callback(error, undefined);
        return;
    }

    // sql指令 -> 確認帳密
    let sql = `select * from shops where username='${username}' and password='${password}';`;  
    
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length <= 0) {
            let error = 'username or password is wrong.'
            callback(error, undefined);
            return;
        }
        // console.log(results);
        delete results[0].password;
        callback(undefined, results[0]);
        return;
    });
}

// 對應 shopCookie 
function checkLogin(reqCookie) {
    let uuid = reqCookie.BENTOSESSIONSHOPID;
    if (_shopCookies[uuid]) {
        return _shopCookies[uuid];
    } else {
        return false;
    }
}

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
    // 設定訂單開始的起訖時間
    const start = moment().add(-1, 'days').format('YYYY-MM-DD 18:00:00');
    const end = moment().format('YYYY-MM-DD 09:59:59');

    // sql指令 -> 所有shop data
    let sql = `select shops.shop_id, shop_name, lowest_amount, highest_amount, shipping_fee, shop_discount from shops Group by shop_id;`;

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
                    "shop_discount": result.shop_discount
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

function patchShop(shopInfo, username, callback) {
    // transaction 如果有一個 error 全部 rollback
    connection.beginTransaction((err) => {
        if (err) { 
            return callback({"error": "Something went wrong."}, undefined);
        }
        // 使用 promise 確保事情做完才做下一件事情
        // 每個 function 回傳 promise 再丟給下一個人處理
        _patchShopInfo(shopInfo, username).then(() => {
            return _patchShopMeals(shopInfo.meals, username);
        }).then(() => {
            return callback(undefined, {"success": "Patch successfully."});
        }).catch((err) => {
            // promise 被 reject 就代表有錯誤，需要丟回來這裡處理
            // 有任何一個 error 都 rollback 回去
            connection.rollback(() => {
                return callback(err, undefined);
            });
        });
    });
}

function _patchShopInfo(info, username) {
    return new Promise((resolve, reject) => {
        delete info.meals;
        let infoArray = [];
        for (let data of info) {
            infoArray.push(data);
        }
        const sql = ``;
        connection.query(`UPDATE shops SET shop_name = ?, shop_time = ?, shop_phone = ?, shop_address = ?, lowest_amount = ?, highest_amount = ?, shipping_fee = ?, payment = ?, settlement = ?, shop_discount = ?, password = ? WHERE username = ${username}`, infoArray, function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve();
        });
    });
}

function _patchShopMeals(meals, username) {
    // 還沒更新店家訂單
    // 要記得用 async for 參考 patch 訂單
}
module.exports = {
    showShops,
    onlyshowShop,
    onlyshowMeal,
    getMealsInfo,
    validate,
    checkLogin,
    getShop,
    patchShop
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