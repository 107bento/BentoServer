const express = require('express');
const bodyParser = require('body-parser'); // req.body transfer to json
const cors = require('cors');
const loginRouter = require('./loginRouter.js');
const usersRouter = require('./usersRouter.js');
const shopsRouter = require('./shopsRouter.js');
const ordersRouter = require('./ordersRouter.js');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const env = require('./env.json');
const CronJob = require('cron').CronJob;
const job = new CronJob({
  cronTime: '00 00 10 * * 1-5',
  onTick: () => {
    /*
     * Runs every weekday (Monday through Friday)
     * at 11:30:00 AM. It does not run on Saturday
     * or Sunday.
     */
	console.log('hi');
  },
  start: false,
  timeZone: 'Asia/Taipei'
});
job.start();

// 跟 DB 建立連線
connection = mysql.createConnection({
    host     : 'localhost',
    user     : env.DBuser,
    password : env.DBpassword,
    database : 'bento107',
    timezone: 'Asia/Taipei'
});

/**
 * Global variables
 */

// 存在 client 端的 cookie name
cookieName = 'BENTOSESSIONID';
_cookies = {};

// 存在 client 端的 cookie name
adminCookieName = 'BENTOSESSIONADMINID';
_adminCookies = {};

// new a express
const app = express();

/**
 * Middleware
 */

app.use(bodyParser.json());
app.use(cookieParser());

// cross domain access
app.use(cors({
	methods: ['GET', 'POST', 'PATCH', 'OPTIONS', 'DELETE'],
	credentials: true,
	origin: true
}));

/**
 * Routes
 */

app.use('/login', loginRouter);

app.use('/user', usersRouter);

app.use('/shops', shopsRouter);

app.use('/orders', ordersRouter);

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