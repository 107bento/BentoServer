const mysql = require('mysql');
const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'bento107'
});
 
connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
 
  console.log('connected as id ' + connection.threadId);

  console.log('connect successfully!');
  connection.query('select * from users where user_id = "ast850328";', function (error, results, fields) {
  if (error) throw error;
  console.log(results[0].user_id);
  });
});

