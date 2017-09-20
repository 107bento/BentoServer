const express = require('express');
const bodyParser = require('body-parser'); // req.body transfer to json
const cors = require('cors');
const loginRoute = require('./login.js');
const usersRoute = require('./users.js');
const shopsRoute = require('./shops.js');

/**
 * Global variables
 */


// new a express
const app = express();

/**
 * Middleware
 */

app.use(bodyParser.json());

// cross domain access
app.use(cors({
	methods: ['GET', 'POST', 'PATCH', 'OPTIONS', 'DELETE'],
	credentials: true,
	origin: true
}));
 
/**
 * Routes
 */

app.use('/login', loginRoute);

app.use('/users', usersRoute);

app.use('/shops', shopsRoute);

app.get('/', function (req, res, next) {
	res.send('Hello world.');
});

app.use(function (req, res, next) {
	return res.status(404).json({
		message: 'method not found.'
	});
});

app.listen(3001, function () {
  console.log('http://localhost:3001');  
});