/* jshint esversion: 6 */
'use strict';

const net = require('net');
const WebSocketServer = require('ws').Server;
const StaticServer = require('static-server');

var staticServer = new StaticServer({
  rootPath: 'docs',
  name: 'hack',
  port: 8000,
  cors: '*',
  followSymlink: true
});

staticServer.start(() => {
  console.log('Server listening to', staticServer.port);
});

staticServer.on('request', (req, res) => {
  console.log(req.path);
});


var timeout;

class AutoReloader {
  constructor() {
    this.connections = [];
  }

  start() {
    const conns = this.connections;
    const host = this.host || '0.0.0.0';
    const port = 9485;

    this.server = new WebSocketServer({host: host, port: port});
    this.server.on('connection', conn => {
      console.log({ ws: conn.upgradeReq.connection.remotePort });
      conns.push(conn);
      conn.on('close', () => conns.splice(conn, 1));
    });

    const dispatch = this.dispatch;
    net.createServer((sock) => {
      console.log({ net: sock.remotePort });
      sock.on('data', (data) => {
        this.dispatch(data);
        sock.end('ok\n');
      });
    }).listen(9484, host);
  }

  dispatch(message) {
    clearTimeout(timeout);
    setTimeout(() => {
      console.log({ dispTo: this.connections.length });
      this.connections
        .filter(connection => connection.readyState === 1)
        .forEach(connection => connection.send(message));
    }, 1000);
  }
}

var reloader = new AutoReloader();
reloader.start();
