const express = require('express');
const shopsRouter = express.Router();
const shop = require('./models/shop');


// 取店家資料（所有相關（含菜單））
/*shopsRouter.get('/', (req, res) => {

    shop.showShop((error, results) => {
        
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});*/

// 只秀店家
shopsRouter.get('/', (req, res) => {
    shop.onlyshowShop( (error, results) => {    
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error: error
            });
        }
    });
});

// 只秀店家id 對應 Meals
shopsRouter.get('/:id', (req, res) => {
    const shop_id = parseInt(req.params.id);
    shop.onlyshowMeal(shop_id, (error, results) => {    
        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(400).json({
                error
            });
        }
    });
});

module.exports = shopsRouter;