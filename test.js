const db = require("./index.js");
const express = require('express')
const app = express();
const server = require("http").createServer(app);
app.get('/', function (req, res) {
  res.send('Apeiron Her Daim!')
})
server.listen(3000, function () {
  console.log('Modül mükemmel port: 3000!')
});
//db.createWebview("1234", 8443, "custom", {"server": server, "request": app});

