var express = require('express');
var app = express();
var P = require('bluebird');
var path = require('path');
var VError = require('verror');

var glob = P.promisify(require('glob'));
var fs = P.promisifyAll(require('fs'));

mountPluginsOnApp(__dirname, app);

app.get('/', function(req, res) {
  res.send('hi');
});

app.get('/plugins', function(req, res) {
  res.send(app.plugins);
});

function mountPluginsOnApp(pluginDir, app) {
  return glob(path.resolve(pluginDir, 'plugins/lib/node_modules/*/package.json')).then(function(plugins) {
    return plugins.map(function(plugin) {
      return fs.readFileAsync(plugin).then(JSON.parse).then(attr('name')).then(function(p) {
        return {
          name: p,
          path: plugin,
          plugin: requirePlugin(p)
        };
      }).catch(function(e) {
        return {
          path: plugin,
          error: new VError(e, "plugin %s failed to load", plugin)
        };
      });
    });
  }).map(function(f) {
    if (f.error) {
      console.warn(f.error.message);
    } else {
      app.use('/' + f.name, f.plugin);
    }

    return f;
  }).then(function(plugins) {
    app.plugins = plugins;
    app.emit('start');
  });

  function requirePlugin(p) {
    return require(path.resolve(pluginDir, 'plugins/lib/node_modules', p));
  }
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

module.exports = app;
