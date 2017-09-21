const express = require('express');
const shops = express.Router();

/*
shops.get('/', function (req, res) {
    var sql2 = "select shop_name from shops";
    connection.query( sql2, function(err, results) {
      if (err) {
        res.send("mysql getshops error");  
      }
      res.send(results);
    });
});
*/

// 取店家資料（所有相關（含菜單））
shops.get('/', function (req, res) {
    res.send(results);
});

module.exports = shops;