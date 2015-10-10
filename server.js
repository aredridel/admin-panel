var express = require('express');
var Panel = require('./');

var app = express();

var config = tryRequire('./config.json') || {};
var panel = Panel(config);

app.use('/admin', panel);
app.get('/', function(req, res) {
  res.redirect('/admin');
});

panel.on('start', function() {
  console.warn('start');
  app.listen(process.env.PORT || 8000);
});

panel.on('pluginError', function(module) {
  console.warn(module.error);
});

panel.on('pluginLoad', function(module) {
  console.warn("Plugin loaded", module.name);
});

function tryRequire(n) {
  try {
    return require(n);
  } catch (e) {
    return null;
  }
}
