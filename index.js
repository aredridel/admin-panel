var express = require('express');
var P = require('bluebird');
var path = require('path');
var VError = require('verror');

var glob = P.promisify(require('glob'));
var fs = P.promisifyAll(require('fs'));

var loadPluginsAndCollectErrors = require('plugin-module-loader').loadPluginsAndCollectErrors;

module.exports = function(config) {
  var app = express();

  mountPluginsOnApp(path.resolve(__dirname, 'plugins'), app);

  app.get('/plugins', function(req, res) {
    res.send(app.plugins);
  });

  function mountPluginsOnApp(pluginDir, app) {
    loadPluginsAndCollectErrors(pluginDir).map(function(plugin) {
      if (plugin.error) {
        app.emit('pluginError', plugin);
      } else {
        app.emit('pluginLoad', plugin);
        app.use('/' + plugin.name, plugin.module);
      }

      return plugin;
    }).then(function(plugins) {
      app.plugins = plugins;
      if (!plugins.some(function(plugin) {
          if (plugin.name === config.theme && !plugin.error) {
            console.warn(plugin);
            app.use(plugin.module);
            return true;
          }
        })) {
        console.warn('no theme loaded');
      }
      app.emit('start');
    });

  }

  function attr(name) {
    return function(o) {
      return o[name];
    };
  }

  function log(e) {
    console.log(e);
    return e;
  }

  return app;
};
