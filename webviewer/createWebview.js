const app = require('express')(),
  Database = require('better-sqlite3'),
  fetch = require('../src/functions/fetch.js'),
  fetchAll = require('../src/functions/fetchAll.js'),
  push = require('../src/functions/push.js'),
  tables = require('../src/functions/tables.js');
let ioR = require('socket.io');
/*
 * NOTEPAD:
 *
 * - Need to call queue.js file using require
 * - ^ Don't do that it creates a circular require path (infinite loop)
 *
 *
 */
module.exports = function(password, port, suburl, options = {}) {
  //setup which server to get
  if(options.server && !options.request || options.request && !options.server) 
    return console.log("Seçenekler hem sunucu hem de istek gerektirir.");
 const serverT = options.request ? options.request : app;
  suburl = options.request && options.server && !suburl ? "quick" : suburl;
  // Verify Data
  if (!password) return console.log('Geçersiz Şifre');
  if (isNaN(port)) return console.log('Geçersiz Port');
  // Routing
  // If no suburl
  if (!suburl) {
    serverT.get("/", function(request, response) {
      response.sendFile(__dirname + '/index.html')
    });
    serverT.get("/data", function(request, response) {
      response.sendFile(__dirname + '/data.html')
    });
  } else {
    // If suburl is a string
    if (typeof suburl === 'string') {
      serverT.get(`/${suburl}/`, function(request, response) {
        response.sendFile(__dirname + '/index.html')
      });
      serverT.get(`/${suburl}/data`, function(request, response) {
        response.sendFile(__dirname + '/data.html')
      });
    } else {
      // If it's not a string, convert suburl to a string
      let suburlString = String(suburl)
      serverT.get(`/${suburlString}/`, function(request, response) {
        response.sendFile(__dirname + '/index.html')
      });
      serverT.get(`/${suburl}/data`, function(request, response) {
        response.sendFile(__dirname + '/data.html')
      });
    };
  };
  // Listening
  let server;
  if(!options.server)server = serverT.listen(port, function() {
    console.log(`arron.db Web Görüntüleyici: Port dinleniyor ${port}`)
  });
  if(!server) server = options.server;
  let io = ioR.listen(server);
  io.on('connection', function(socket) {
    console.log('Bağlantı Alındı ...');
    socket.on('emitPassword', function(pass) {
      if (password !== pass) {
        console.log(`Soket yanlış girildi şifre: ${pass}`);
        socket.emit('respPassword', false);
      } else {
        console.log(`Soket doğru şifreyi girmiş şifre: ${pass}`);
        socket.emit('respPassword', true);
        let db = new Database('./json.sqlite');
        push(`WEB GÖRÜNTÜLEYİCİ AKTİF SOKETLER`, socket.id, undefined, db);
      }
    });
    socket.on('requestData', function(tableName) {
      let db = new Database('./json.sqlite');
      fetch(`WEB GÖRÜNTÜLEYİCİ AKTİF SOKETLER`, {}, db).then(activeSockets => {
        if (activeSockets === null) return;
        if (!activeSockets.includes(socket.id)) return;
        let db = new Database('./json.sqlite');
        fetchAll({
          table: tableName
        }, db).then(i => {
          tables(db).then(o => {
            i.unshift(o);
            socket.emit('recievedData', i);
            db.close();
          });
        });
      });
    });
  });
};
