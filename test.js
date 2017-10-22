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

});*/
//只是我們要把 return 的東西，再拿來指給一個變數，這方面一直出問題， console 老是 undefined
//試過了，依然無法，可以執行變成抓到空白，但又沒噴錯，覺得難過反正就是有一堆不知道的問題
// 剛剛李悅教我的 try 了一下但無法 各一筆 或是明天來搞懂一下阿~/
// 喔，我好了
// 加個 '-1'  ,日期問題已經過12點了沒有阿 你的result先印看看有嗎 不行，這樣真的不方便討論，明天來努力研究吧
// 而且我發現我的順序也錯了，最後也是空的嗚嗚
就order和detail各一條資料阿
我抓到的其實是李悅的sql result 