const express = require('express');
const loginRouter = express.Router();
const user = require('./models/user');

loginRouter.post('/', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            error: 'lost username or password.'
        });
    }

    user.validate(username, password, (error, results) => {

        if (typeof(results) !== undefined && typeof(error) == "undefined") {
            return res.status(200).json(results);
        } else {
            return res.status(401).json({
                error: error
            });
        }
    });
});

module.exports = loginRouter;