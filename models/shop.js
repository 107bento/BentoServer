const moment = require('moment');
const async = require('async');
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
    let sql = `
        SELECT
            shops.shop_id,
                shop_name,
                lowest_amount,
                highest_amount,
                shipping_fee,
                shop_discount,
            meals.meal_id,
                meal_name,
                meal_price,
                meal_discount 
        FROM 
            shops, meals 
        WHERE 
            shops.shop_id = meals.shop_id 
        Group by 
            meals.meal_id;
        `;  
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
        const sql = `
            SELECT 
                meal_id,
                meal_name,
                meal_price,
                shop_name,
                shops.shop_id
            FROM 
                shops,
                meals
            WHERE
                meals.shop_id = shops.shop_id;
        `;
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

// 拿到某店家資訊
function getShop(id, callback) {
    const sql = `
        SELECT
            * 
        FROM
            shops, 
            meals 
        WHERE
            username = ?
        AND
            meals.shop_id = shops.shop_id;
    `;
    const values = [
        id,
    ];
    connection.query(sql, values, (err, results) => {
        if (err) {
            callback(err, undefined);
            return;
        }
        let shopInfo = {};
        shopInfo.shop_id = results[0].shop_id;
        shopInfo.shop_name = results[0].shop_name;
        shopInfo.shop_time = results[0].shop_time;
        shopInfo.shop_phone = results[0].shop_phone;
        shopInfo.shop_address = results[0].shop_address;
        shopInfo.lowest_amount = results[0].lowest_amount;
        shopInfo.highest_amount = results[0].highest_amount;
        shopInfo.shipping_fee = results[0].shipping_fee;
        shopInfo.payment = results[0].payment;
        shopInfo.settlement = results[0].settlement;
        shopInfo.shop_discount = results[0].shop_discount;
        shopInfo.password = results[0].password;
        shopInfo.username = results[0].username;
        shopInfo.meals = [];
        for (let result of results) {
            shopInfo.meals.push({
                "meal_id": result.meal_id,
                "meal_name": result.meal_name,
                "meal_price": result.meal_price,
                "meal_discount": result.meal_discount
            });
        }
        callback(undefined, shopInfo);
        return;
    });
}

// 改店家基本資料
function patchShop(shopInfo, username, callback) {
    // transaction 如果有一個 error 全部 rollback
    connection.beginTransaction((err) => {
        if (err) { 
            return callback({"error": "Something went wrong."}, undefined);
        }
        _patchShopInfo(shopInfo, username).then(() => {
        /* 更新店家基本資料、透過 username 拿 shop_id
        Promise.all([_patchShopInfo(shopInfo, username), _getShopIdbyUsername(username)]).then(([, id]) => {
            更新菜單
            return _patchShopMeals(shopInfo.meals, id);
        }).then(() => { 
            記得 commit ， 否則會 rollback (特別注意)*/
            return _commitTransactino();
        }).then(() => {
            callback(undefined, shopInfo);
        }).catch((err) => {
            // promise 被 reject 就代表有錯誤，需要丟回來這裡處理
            // 有任何一個 error 都 rollback 回去
            connection.rollback(() => {
                return callback(err, undefined);
            });
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

// 給 username 拿到該 shop 的 shop_id
// 用 promise
function _getShopIdbyUsername(username) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                shop_id
            FROM
                shops
            WHERE
                username = ?;
        `;

        const values = [
            username,
        ];
        connection.query(sql, values, (error, results) => {
            if (error) {
                reject(error);
            }
            
            let shopid = results[0].shop_id;
            resolve(shopid);
        });
    }); 
}

function _patchShopInfo(info, username) {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE 
                shops 
            SET 
                shop_name = ?, 
                shop_time = ?, 
                shop_phone = ?, 
                shop_address = ?, 
                lowest_amount = ?, 
                highest_amount = ?, 
                shipping_fee = ?, 
                payment = ?, 
                settlement = ?, 
                shop_discount = ?, 
                password = ? 
            WHERE 
                username = ?
        `;

        const values = [
            info.shop_name,
            info.shop_time,
            info.shop_phone,
            info.shop_address,
            info.lowest_amount,
            info.highest_amount,
            info.shipping_fee,
            info.payment,
            info.settlement,
            info.shop_discount,
            info.password,
            username,
        ];

        connection.query(sql, values, function (error, results, fields) {
            if (error) {
                reject(error);
            }
            resolve();
        });
    });
}


// 修改菜單
function patchMeal(meal, username, callback) {
    if (!meal.meal_name || typeof(meal.meal_price) !== 'number' || typeof(meal.meal_name) !== 'string') { 
        let error='your input is wrong !!';
        callback(error, undefined);
        return;
    }
    let sql, values;
    sql = `
        UPDATE
            meals
        SET
            meal_name = ?,
            meal_price = ?,
            meal_discount = 0
        WHERE
            meal_id = ?;
    `;

    values = [
        meal.meal_name,
        meal.meal_price,
        meal.meal_id,
    ];
    connection.query(sql, values, function (error, results) {
        if (error) {
            reject(error);
        }
        callback(undefined, meal);
    });
}

// 新增菜單
function newMeal(meal, username, callback) {
    if (!meal.meal_name || typeof(meal.meal_price) !== 'number' || typeof(meal.meal_name) !== 'string') { 
        let error='your input is wrong !!';
        callback(error, undefined);
        return;
    }
    _getShopIdbyUsername(username).then((shopid) => {
        let sql, values;
        sql = `
            INSERT INTO meals(
                shop_id, 
                meal_name, 
                meal_price, 
                meal_discount
            ) values(
                ?,?,?,0
            );
        `;

        values = [
            shopid,
            meal.meal_name,
            meal.meal_price,
        ];
        connection.query(sql, values, function (error, results) {
            if (error) {
                reject(error);
            }
            callback(undefined, meal);
        });
    });
    
}

// 刪除菜單
function delMeal(mealid, callback) {
    let sql, values;
    sql = `
        DELETE FROM
            meals
        WHERE
            meal_id = ?
        ;
    `;

    values = [
        mealid,
    ];
    connection.query(sql, values, (err, results) => {
        if (err) {
            callback(err, undefined);
            return;
        }
        callback(undefined, {"meal" : mealid, "message" : "delete OK!"});
        return;
    });
    
}

// _getMealsId(username) => 透過 shop 的 username 拿到所有 meal 的 id
function _getMealsId(username) {
    return new Promise((resolve, reject) => {
        let sql, values;
        sql = `
            SELECT
                meal_id
            FROM
                meals
            WHERE
                meals.shop_id = 
                (
                    SELECT
                        shop_id
                    FROM
                        shops
                    WHERE
                        username = ?
                );
        `;
        values = [username];
        connection.query(sql, values, (error, results) => {
            if (error) {
                reject(error);
            }
            let meals = [];
            for (let result of results) {
                meals.push(result);
            }
            resolve(meals);
        });
    });
}

// _getAllOrders() => 取所有 order_id 和 order_time
function _getAllOrders() {
    let sql = `
    SELECT 
        SUBSTRING(order_time,1,13) time,
        order_id 
    FROM 
        orders;
    `;

    return new Promise((resolve, reject) => {
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            }
            let orders = [];
            let i = 0;
            for (let result of results) {
                // 設定要儲存訂單內容
                let order_id = result.order_id;
                let time = result.time;
                orders[i++] = {order_id, time};
            }
            resolve(orders);
        });
    });
}

// _groupDate (orders) => 把 orders 拆成
// group : {
//      "2018-01-09 ": {
//          "1": [],
//          "2": [],
//          "3": [],
//          "4": [],
//          "5": [],
//          "6": [],
//          "7": [],
//          "8": []
//      },
//      "2018-01-10 ": {
//          "9": [],
//          "10": [],
//          "11": []
//      },
//      "定餐日期" ： {
//          "order_id 1" : [ 所屬 detail id ],
//          "order_id 2" : [ 所屬 detail id ],
//      }
// }
// 但是 [ 所屬 detail id ] 還沒做好

function _groupDate (orders) {
    return new Promise((resolve,reject) => {
        let group = {};
        for (let order of orders) {
            let date = order.time.substring(0,11);
            let orderid = order.order_id;
            if (group[date] == null) {
                group[date] = {};
                group[date][orderid] = [];
            } else {
                group[date][orderid] = [];
            }
        }
        resolve(group);
    });
}

// _getDetailsId(order_id) => 透過 order_id 拿到所屬 detail 的 id
function _getDetailsId(order_id) {
    return new Promise((resolve, reject) => {
        let sql, values;
        sql = `
            SELECT
                detail_id
            FROM
                details
            WHERE
                details.order_id = ? ;
        `;
        values = [
            order_id,
        ];
        connection.query(sql, values, (err, results) => {
            if (err) {
                reject(err);
            }
            let details = [];
            for (let result of results) {
                details.push(result);
            }
            resolve(details);
        });
    });
}

/* 已經用不到的 
function _patchShopMeals(meals, shop_id) {
    // 還沒更新店家訂單
    // 要記得用 async for 參考 patch 訂單
    let count = 0;
    return new Promise((resolve, reject) => {
        async.each(meals, (meal, callback) => {
            let sql, values;

            if (!meal.meal_id) { // 增加餐點
                sql = `
                    INSERT INTO meals(
                        shop_id, 
                        meal_name, 
                        meal_price, 
                        meal_discount
                    ) values(
                        ?, ?, ?, ?
                    );
                `;

                values = [
                    shop_id,
                    meal.meal_name,
                    meal.meal_price,
                    meal.meal_discount,
                ];
            } else { // 更新已有的餐點
                sql = `
                    UPDATE 
                        meals 
                    SET 
                        meal_name = ?,
                        meal_price = ?,
                        meal_discount = ?
                    WHERE
                        meal_id = ?
                    AND
                        shop_id = ?;
                `;

                values = [
                    meal.meal_name,
                    meal.meal_price,
                    meal.meal_discount,
                    meal.meal_id,
                    shop_id,
                ];
            }

            connection.query(sql, values, function (error, results) {
                if (error) {
                    reject(error);
                }
                count++;
                if (count == meals.length) {
                    resolve();
                }
            });
        }, (err) => {
            if (err) {
                reject({err, "error": "Something went wrong."});
            }
        });
    });
}*/

module.exports = {
    showShops,
    onlyshowShop,
    onlyshowMeal,
    getMealsInfo,
    validate,
    checkLogin,
    getShop,
    patchShop,
    patchMeal,
    newMeal,
    delMeal
};
