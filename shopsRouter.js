const express = require('express');
const shopsRouter = express.Router();
const shop = require('./models/shop');


// 取店家資料（所有相關（含菜單））
shopsRouter.get('/', (req, res) => {

    shop.showshop((error, results) => {

        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(401).json({
                error: error
            });
        }
    });
});

module.exports = shopsRouter;