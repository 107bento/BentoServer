// const mysql = require('mysql');
// connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'root',
//     password : '',
//     database : 'bento107'
// });

// validate('ast850328', '666666', (error, results)=>{
//     console.log()
//     console.log(results);
// });

function validate (username, password, callback) { // 登入驗證
    if (typeof(username) !== 'string' || typeof(password) !== 'string') { // 帳密要求字串型態
        let error='username and password must be string.';
        callback(error, undefined);
        return;
    }
    let sql = `select user_id from users where user_id='${username}' and password='${password}';`;  // sql指令 -> 確認帳密
    // console.log(sql);
    connection.query(sql, (err, results, fields) => {
        if (err) {
            throw err;
        }
        if (results.length <= 0) {
            let error = 'username or password is wrong.'
            callback(error, undefined);
            return;
        }
        callback(undefined, {id: results[0].user_id} );
        return;
    });
}
//module.exports = {validate};
 module.exports.validate = validate;


function register (username, password, callback) { // 註冊
    if (typeof(username) !== 'string' || typeof(password) !== 'string') { // 帳密字串型態
        let error='username and password must be string.';
        callback(error, undefined);
        return;
    }
    // sql指令 -> 增加新使用者
    let sql = `INSERT INTO users (user_id , password , phone , email , money , name) VALUES ( '${username}' , '${password}' ,'298445637','ughoji',50,'李悅');`;  
    connection.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        // if (results.length > 0) {
        //     let error = 'username exist.'
        //     callback(error, undefined);
        //     return;
        // }
        callback(undefined, { "ending" : "註冊成功" } );
        return;
    });
}
//module.exports = {register};
module.exports.register = register;
