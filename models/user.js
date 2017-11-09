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

module.exports = {
    validate,
    register,
    modify,
    showUser,
    checkLogin
};