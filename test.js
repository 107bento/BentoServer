const order = require('./models/order.js'); 
const mysql = require('mysql');
fs = require('fs');
util = require('util');
moment = require('moment');

connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'bento107'
});
order.setOrders();