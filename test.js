const order = require('./models/order.js'); 
const mysql = require('mysql');

connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'bento107'
});
order.sortOrder((error, results) => {
    
    if (typeof(results) !== undefined && typeof(error) == "undefined") {
        console.log(results);
    } else {
        console.log( "error" );
    }
});
