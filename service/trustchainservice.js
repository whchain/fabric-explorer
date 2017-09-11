/**
 * Created by grapebaba on 8/18/17.
 */


var helper = require('../app/helper.js');
var path = require('path');

var config = require('../config.json');

var query = require('../app/query.js');
var invoke = require('../app/invoke-transaction');
var logger = helper.getLogger('trustchainservice');

// var bcserver = require('./bcservice');


var enrollDevice = function (uid, channelName, ccName) {
    return invoke.invokeChaincode('peer1', channelName, ccName, "enrollDevice", [uid, "test", "test"], 'admin', 'org1')
};

var queryDevice = function (uid, channelName, ccName) {
    return query.queryChaincode('peer1', channelName, ccName, [uid], "queryDevice", 'admin', 'org1')
};

var enrollWine = function (uid, owner, model, produceDate, producePlace, outDate, outPlace, location, channelName, ccName) {
    return invoke.invokeChaincode('peer1', channelName, ccName, "enrollWine", [uid, owner, model, produceDate, producePlace, outDate, outPlace, location], 'admin', 'org1')
};

var queryWine = function (uid, channelName, ccName) {
    return query.queryChaincode('peer1', channelName, ccName, [uid], "queryWine", 'admin', 'org1')
};

var transferWine = function (uid, owner, location, channelName, ccName) {
    return invoke.invokeChaincode('peer1', channelName, ccName, "transferWine", [uid, owner, location], 'admin', 'org1')

};


module.exports.enrollDevice = enrollDevice;
module.exports.queryDevice = queryDevice;
module.exports.enrollWine = enrollWine;
module.exports.queryWine = queryWine;
module.exports.transferWine = transferWine;

