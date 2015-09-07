var express = require('express');
var app = express();
var P = require('bluebird');
var path = require('path');
var VError = require('verror');

var glob = P.promisify(require('glob'));
var fs = P.promisifyAll(require('fs'));

app.on('pluginError', function(module) {
  console.warn(module.error.toString());
});

app.on('pluginLoad', function(module) {
  console.warn("Plugin loaded", module.name);
});

mountPluginsOnApp(__dirname, app);

app.get('/', function(req, res) {
  res.send('hi');
});

app.get('/plugins', function(req, res) {
  res.send(app.plugins);
});

function loadPluginsAndCollectErrors(pluginDir) {
  return glob(path.resolve(pluginDir, 'plugins/lib/node_modules/*/package.json')).then(function(plugins) {
    return plugins.map(function(plugin) {
      return fs.readFileAsync(plugin).then(JSON.parse).then(function(module) {
        module.implementation = requirePlugin(module.name);
        return module;
      }).catch(function(e) {
        return {
          name: path.basename(path.dirname(plugin)),
          error: new VError(e, "Plugin %s failed to load", path.basename(path.dirname(plugin)))
        };
      });
    });
  });

  function requirePlugin(p) {
    var module = require(path.resolve(pluginDir, 'plugins/lib/node_modules', p))({});
    if (!module.plugin || !module.name) {
      throw new Error("This doesn't look like a plugin");
    }
    return module;
  }
}

function mountPluginsOnApp(pluginDir, app) {
  loadPluginsAndCollectErrors(pluginDir).map(function(module) {
    if (module.error) {
      app.emit('pluginError', module);
    } else {
      app.emit('pluginLoad', module);
      app.use('/' + module.name, module.implementation.plugin);
    }

    return module;
  }).then(function(plugins) {
    app.plugins = plugins;
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

module.exports = app;
