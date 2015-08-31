var express = require('express');
var app = express();
var P = require('bluebird');
var path = require('path');

var glob = P.promisify(require('glob'));
var fs = P.promisifyAll(require('fs'));

module.exports = app;

function mountPluginsOnApp(pluginDir, app) {
    return glob(path.resolve(pluginDir, 'plugins/lib/node_modules/*/package.json')).map(fs.readFileAsync).map(JSON.parse).map(attr('name')).map(function (p) {
        app.use('/' + p, requirePlugin(p));
    }).then(function () {
        app.emit('start');
    });

    function requirePlugin(p) {
        return require(path.resolve(pluginDir, 'plugins/lib/node_modules', p));
    }
};

mountPluginsOnApp(__dirname, app);

app.use('/', function (req, res) {
    res.send('hi');
});

function attr(name) {
    return function (o) {
        return o[name];
    };
}

function log(e) {
    console.log(e);
    return e;
}

