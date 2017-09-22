const express = require('express');
const shopsRouter = express.Router();

shopsRouter.get('/', function (req, res) {
    
});

// 取店家資料（所有相關（含菜單））
shopsRouter.get('/', function (req, res) {
    res.send(results);
});

module.exports = shopsRouter;