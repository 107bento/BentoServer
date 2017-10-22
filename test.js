const order = require('./models/order.js'); 
const mysql = require('mysql');
moment = require('moment');

connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'bento107'
});
order.sortOrder();
