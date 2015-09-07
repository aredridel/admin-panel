var express = require('express');
var panel = require('./');

var app = express();

app.use('/admin', panel);
app.get('/', function(req, res) {
  res.redirect('/admin');
});

panel.on('start', function() {
  console.warn('start');
  app.listen(process.env.PORT || 8000);
});

panel.on('pluginError', function(module) {
  console.warn(module.error.toString());
});

panel.on('pluginLoad', function(module) {
  console.warn("Plugin loaded", module.name);
});
