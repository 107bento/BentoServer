var mysql      = require('mysql');
var connection = mysql.createConnection({
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
  connection.query('select * from users;', function (error, results, fields) {
  if (error) throw error;
  console.log(results);
  });
});