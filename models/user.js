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

function validate (username, password, callback) {
    if (typeof(username) !== 'string' || typeof(password) !== 'string') {
        let error='username and password must be string.';
        callback(error, undefined);
        return;
    }
    let sql = `select user_id from users where user_id='${username}' and password='${password}';`;
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



module.exports.validate = validate;