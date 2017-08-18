/**
 *
 * Created by shouhewu on 6/8/17.
 *
 */
var express = require("express");
var path = require('path');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var trustchain = require('./service/trustchainservice.js');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

require('./socket/websocketserver.js')(http)

var timer = require('./timer/timer.js')
timer.start()


var query = require('./app/query.js');
var ledgerMgr = require('./utils/ledgerMgr.js')

var statusMertics = require('./service/metricservice.js')

app.use(express.static(path.join(__dirname, 'explorer_client')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var identityKey = 'grapebaba';

app.use(session({
    name: identityKey,
    secret: 'heatonn1',  // 用来对session id相关的cookie进行签名
    store: new FileStore(),  // 本地存储session（文本文件，也可以选择其他store，比如redis的）
    saveUninitialized: false,  // 是否自动保存未初始化的会话，建议false
    resave: false,  // 是否每次都重新保存会话，建议false
    cookie: {
        maxAge: 10 * 1000  // 有效期，单位是毫秒
    }
}));

var query = require('./app/query.js')
var sql = require('./db/mysqlservice.js')

var config = require('./config.json');
var host = process.env.HOST || config.host;
var port = process.env.PORT || config.port;
// =======================   控制器绑定  ===================

app.post("/api/tx/getinfo", function (req, res) {

    let txid = req.body.txid
    if (txid != '0') {
        query.getTransactionByID('peer1', ledgerMgr.getCurrChannel(), txid, 'admin', 'org1').then(response_payloads => {

            var header = response_payloads['transactionEnvelope']['payload']['header']
            var data = response_payloads['transactionEnvelope']['payload']['data']
            var signature = response_payloads['transactionEnvelope']['signature'].toString("hex")

            res.send({
                'tx_id': header.channel_header.tx_id,
                'timestamp': header.channel_header.timestamp,
                'channel_id': header.channel_header.channel_id,
                'type': header.channel_header.type,
            })
        })

    } else {
        res.send({})
    }


});

app.post("/api/tx/json", function (req, res) {

    let txid = req.body.number
    if (txid != '0') {
        query.getTransactionByID('peer1', ledgerMgr.getCurrChannel(), txid, 'admin', 'org1').then(response_payloads => {

            var header = response_payloads['transactionEnvelope']['payload']['header']
            var data = response_payloads['transactionEnvelope']['payload']['data']
            var signature = response_payloads['transactionEnvelope']['signature'].toString("hex")

            var blockjsonstr = JSON.stringify(response_payloads['transactionEnvelope'])

            res.send(blockjsonstr)

        })

    } else {

        res.send({})

    }

});

app.post("/api/block/json", function (req, res) {

    let number = req.body.number
    query.getBlockByNumber('peer1', ledgerMgr.getCurrChannel(), parseInt(number), 'admin', 'org1').then(block => {

        var blockjsonstr = JSON.stringify(block)

        res.send(blockjsonstr)
    })
});


app.post("/api/block/getinfo", function (req, res) {

    let number = req.body.number
    query.getBlockByNumber('peer1', ledgerMgr.getCurrChannel(), parseInt(number), 'admin', 'org1').then(block => {
        res.send({
            'number': block.header.number.toString(),
            'previous_hash': block.header.previous_hash,
            'data_hash': block.header.data_hash,
            'transactions': block.data.data
        })
    })
});

/*app.post("/api/block/get", function(req, res) {
 let number=req.body.number
 query.getBlockByNumber('peer1',ledgerMgr.getCurrChannel(),parseInt(number),'admin','org1').then(block=>{
 res.send({
 'number':number,
 'txCount':block.data.data.length
 })
 })
 });*/
app.post("/api/block/get", function (req, res) {
    let number = req.body.number
    sql.getRowByPkOne(`select blocknum ,txcount from blocks where channelname='${ledgerMgr.getCurrChannel()}' and blocknum='${number}'`).then(row => {
        if (row) {
            res.send({
                'number': row.blocknum,
                'txCount': row.txcount
            })
        }
    })

});

//return latest status
app.post("/api/status/get", function (req, res) {
    statusMertics.getStatus(ledgerMgr.getCurrChannel(), function (status) {
        res.send(status)
    })
});

app.post('/chaincodelist', function (req, res) {
    statusMertics.getTxPerChaincode(ledgerMgr.getCurrChannel(), function (data) {
        res.send(data)
    })
})

app.post('/changeChannel', function (req, res) {
    let channelName = req.body.channelName
    ledgerMgr.changeChannel(channelName)
    res.end()
})

app.post('/curChannel', function (req, res) {
    res.send({'currentChannel': ledgerMgr.getCurrChannel()})
})

app.post('/channellist', function (req, res) {
    res.send({'channelList': ledgerMgr.getChannellist()})
})

app.post('/querybyuid', function (req, res) {
    var uid = req.body.uid;
    var sess = req.session;
    var loginUser = sess.loginUser;
    if (!loginUser) {
        res.status(401).send('not login');
    } else {
        if ('manu' === loginUser.owner) {
            trustchain.queryDevice(uid,'mychannel','mycc').then(function (msg) {
                res.status(200).send(msg)
            }).catch(function (e) {
                res.status(400).json({err: e})
            })
        } else {
            trustchain.queryWine(uid,'mychannel','mycc').then(function (msg) {
                res.status(200).send(msg)
            }).catch(function (e) {
                res.status(400).json({err: e})
            })
        }
    }
});

app.post('/wines',function (req,res) {
    var uid=req.body.uid;
    var owner=req.body.owner;
    var model=req.body.model;
    var produceDate=req.body.produce_date;
    var producePlace=req.body.produce_place;
    var outDate=req.body.out_date;
    var outPlace=req.body.out_place;

    var sess = req.session;
    var loginUser = sess.loginUser;
    if (!loginUser) {
        res.status(401).send({err:"not login"});
    }else{
        if(loginUser.owner!=="manu"){
            res.status(401).send({err:"invalid user"});
        }

        trustchain.enrollWine(uid,owner,model,produceDate,producePlace,outDate,outPlace,'mychannel','mycc').then(function (msg) {
            res.status(200).send(msg)
        }).catch(function (e) {
            res.status(400).json({err:e})
        })
    }

});

app.put('/wines',function (req,res) {
    var uid=req.body.uid;

    var sess = req.session;
    var loginUser = sess.loginUser;
    if (!loginUser) {
        res.status(401).send({err:"not login"});
    }else{
        if(loginUser.owner!=="dealer"){
            res.status(401).send({err:"invalid user"});
        }

        trustchain.transferWine(uid,loginUser.owner).then(function (msg) {
            res.status(200).send(msg)
        }).catch(function (e) {
            res.status(400).json({err:e})
        })
    }

});

var users = require('./utils/user').items;

var findUser = function(name, password){
    return users.find(function(item){
        return item.name === name && item.password === password;
    });
};

// 登录接口
app.post('/login', function(req, res, next){
    var user = findUser(req.body.username, req.body.password);

    if(user){
        req.session.regenerate(function(err) {
            if(err){
                return res.status(400).json({err: '登录失败'});
            }

            req.session.loginUser = user;
            res.status(200).json({err: '登录成功'});
        });
    }else{
        res.status(400).json({err: '账号或密码错误'});
    }
});

// 退出登录
app.get('/logout', function(req, res, next){
    // 备注：这里用的 session-file-store 在destroy 方法里，并没有销毁cookie
    // 所以客户端的 cookie 还是存在，导致的问题 --> 退出登陆后，服务端检测到cookie
    // 然后去查找对应的 session 文件，报错
    // session-file-store 本身的bug

    req.session.destroy(function(err) {
        if(err){
            res.status(400).json({err: '退出登录失败'});
            return;
        }

        // req.session.loginUser = null;
        res.clearCookie(identityKey);
        res.status(200).send("")
    });
});

// ============= 启动服务器 =======================

var server = http.listen(port, function () {
    console.log(`请在浏览器访问：http://${host}:${port}/`);
});





