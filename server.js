var express = require('express');
var panel = require('./');

var app = express();

app.use('/admin', panel);
app.get('/', function (req, res) {
    res.redirect('/admin');
});

panel.on('start', function () {
    console.warn('start');
    app.listen(process.env.PORT || 8000);
});
