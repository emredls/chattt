const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const MESSAGE_FILE = path.join(__dirname, 'messages.json');
let messages = [];

if (fs.existsSync(MESSAGE_FILE)) {
  messages = JSON.parse(fs.readFileSync(MESSAGE_FILE));
}

// Kullanıcılar listesi
let users = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.emit('chat history', messages);

  socket.on('user joined', (data) => {
    socket.username = data.username;
    if (!users.includes(data.username)) {
      users.push(data.username);
    }
    io.emit('user list', users);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      users = users.filter(u => u !== socket.username);
      io.emit('user list', users);
    }
  });

  socket.on('chat message', (data) => {
    const now = Date.now();
    const newMsg = { ...data, timestamp: now };
    messages.push(newMsg);

    // 6 saatten eski mesajları sil
    messages = messages.filter(msg => now - msg.timestamp < 6 * 60 * 60 * 1000);

    // Dosyaya kaydet
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messages, null, 2));

    io.emit('chat message', newMsg);
  });
});


http.listen(3000, '0.0.0.0', () => {
  console.log('Sunucu çalışıyor: http://localhost:3000');
});
