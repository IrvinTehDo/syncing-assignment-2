const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');
const xxh = require('xxhashjs');

const port = process.env.PORT || process.env.NODE_PORT || 55555;

const handler = (req, res) => {
  fs.readFile(`${__dirname}/../client/index.html`, (err, data) => {
    if (err) {
      throw err;
    }

    res.writeHead(200);
    res.end(data);
  });
};

const app = http.createServer(handler);

app.listen(port);

const io = socketio(app);

io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');

  socket.player = {
    hash: xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16),
    lastUpdate: new Date().getTime(),
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    destX: 0,
    destY: 0,
    alpha: 0,
    height: 100,
    width: 100,
    color: `rgb(${Math.floor(Math.random() * Math.floor(255))},${Math.floor(Math.random() * Math.floor(255))}, ${Math.floor(Math.random() * Math.floor(255))})`,
  };

  socket.emit('joined', socket.player);

  socket.on('movementUpdate', (data) => {
    socket.player = data;
    socket.player.lastUpdate = new Date().getTime();
    socket.broadcast.to('room1').emit('updatedMovement', socket.player);
  });

  socket.on('clearCanvas', () => {
    io.sockets.in('room1').emit('clear', {});
  });

  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('left', socket.player.hash);
    socket.leave('room1');
  });
});

