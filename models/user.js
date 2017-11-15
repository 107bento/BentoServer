const moment = require('moment');
const shop = require('./shop');
// 登入驗證
function validate (username, password, callback) { 
    
    // 帳密要求字串型態
    if (typeof(username) !== 'string' || typeof(password) !== 'string') { 
        let error='username and password must be string.';
        callback(error, undefined);
        return;
    }

    // sql指令 -> 確認帳密
    let sql = `select user_id from users where user_id='${username}' and password='${password}';`;  
    
    connection.query(sql, (err, results, fields) => {
        if (err) {
            throw err;
        }
        if (results.length <= 0) {
            let error = 'username or password is wrong.'
            callback(error, undefined);
            return;
        }
        callback(undefined, results[0]);
        return;
    });
}

// 註冊
function register (username, password, name, phone, email, callback) { 
    
    // 帳密字串型態
    if (typeof(username) !== 'string' || typeof(password) !== 'string' || typeof(name) !== 'string' || typeof(phone) !== 'string' || typeof(email) !== 'string') { 
        let error='username and password must be string.';
        callback(error, undefined);
        return;
    }

    // sql指令 -> 增加新使用者
    let sql = `INSERT INTO users (user_id , password , phone , email , money , name) VALUES ( '${username}' , '${password}' ,'${phone}','${email}', 0, '${name}');`;  
    connection.query(sql, (err, results) => {
        if (err) {
            callback({error: 'username has been existed.'}, undefined);
            return;
        }
        callback(undefined, { "success" : "register successfully." } );
        return;
    });
}

// 修改個資
function modify (username, password, phone, email, name, callback) {
    // sql指令 -> update 使用者資訊
    let sql = `update users set email = '${email}', password = '${password}', user_id = '${username}', name = '${name}', phone = '${phone}' where user_id = '${username}';`;  

    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        callback(undefined, { "success" : "edit successfully." } );
        return;
    });
}

// 取得個人資料
function showUser (username, callback) {

    // sql指令 -> 所有user data
    let sql = `select * from users where user_id = '${username}';`; 
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        callback(undefined, results[0]);
        return;
    });
}

// 對應 cookie 
function checkLogin(reqCookie) {
    let uuid = reqCookie.BENTOSESSIONID;
    if (_cookies[uuid]) {
        return _cookies[uuid];
    } else {
        return false;
    }
}

// 儲值
function storeValue(username, value, callback) {
    
    // transaction 如果有一個 error 全部 rollback
    connection.beginTransaction((err) => {
        if (err) { 
            callback({"error": "Something went wrong."}, undefined);
            throw err; 
        }

        // 先把帳號裡的錢加上去
        let sql = 'update users set money = money + ' + value + ' where user_id = "' + username +'";';
        connection.query(sql, (err, results) => {
            if (err) {
                callback({"error": "Something went wrong."}, undefined);
                return connection.rollback(function() {
                    throw err;
                });
            }
            // 紀錄該筆 record
            let time = moment().format('YYYY-MM-DD HH:mm:ss');
            sql = 'insert into records (time, remain, user_id, value) VALUES ("'+ time +'", (select money from users where user_id = "' + username + '"), "' + username + '", ' + value + ');';
            connection.query(sql, (err, results) => {
                if (err) {
                    callback({"error": "Something went wrong."}, undefined);
                    return connection.rollback(function() {
                        throw err;
                    });
                }
                callback(undefined, {"success": "store successfully!"});
                return;
            });
        });
    });
}

// 拿到個人的訂單資訊
function getOrders(username, callback) {
    let sql = 'select * from details, orders where details.order_id = orders.order_id and user_id = "' + username + '";';
    shop.getMealsInfo().then((mealsInfo) => {
        connection.query(sql, (err, results) => {
            if (err) {
                return callback({"error": "Something went wrong."}, undefined);
                throw err;
            }

            let tmp = [];
            for (let result of results) {
                let detail = {
                    "detail_id": result.detail_id,
                    "amount": result.amount,
                    "subtotal": result.subtotal,
                    "state": result.state,
                    "meal": result.meal_id != 0 ? mealsInfo[result.meal_id] : null,
                    "wish_1": result.wish_id_1 != 0 ? mealsInfo[result.wish_id_1] : null,
                    "wish_2": result.wish_id_2 != 0 ? mealsInfo[result.wish_id_2] : null,
                    "wish_3": result.wish_id_3 != 0 ? mealsInfo[result.wish_id_3] : null,
                    "random_pick": result.random_pick != 0 ? true : false,
                    "final_meal": result.final_meal != null ? mealsInfo[result.final_meal] : null,
                }
                if (tmp[result.order_id] != null) {
                    tmp[result.order_id].details.push(detail);
                } else {
                    let order_id = result.order_id;
                    let user_id = result.user_id;
                    let order_time = result.order_time;
                    let total = result.total;
                    tmp[result.order_id] = {
                        order_id,
                        user_id,
                        order_time,
                        total,
                        "details": [detail]
                    }
                }
            }

            let orders = [];
            for (let orderKey in tmp) {
                orders.push(tmp[orderKey]);
            }

            return callback(undefined, orders);
        });
    }).catch((error) => {
        throw error;
    });
}

// 拿到個人金錢紀錄
function getRecords(username, callback) {
    let sql = 'select * from records where user_id = "' + username + '";';
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        let records = [];
        for (let result of results) {
            records.push({
                "record_id": result.record_id,
                "time": result.time,
                "value": result.value,
                "remain": result.remain
            })
        }
        callback(undefined, records);
        return;
    });
}

module.exports = {
    validate,
    register,
    modify,
    showUser,
    checkLogin,
    storeValue,
    getOrders,
    getRecords
};