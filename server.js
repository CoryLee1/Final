// the express package will run our server
const express = require("express");
const app = express();
app.use(express.static("public")); // this line tells the express app to 'serve' the public folder to clients

// HTTP will expose our server to the web
const http = require("http").createServer(app);

// start our server listening on port 8080 for now (this is standard for HTTP connections)
const server = app.listen(8080);
console.log("Server is running on http://localhost:8080");
const fs = require('fs');
const path = require('path');
const sttFilePath = path.join(__dirname, 'STT.txt');

/////SOCKET.IO///////
const io = require("socket.io")().listen(server);
const peers = {};
const transcripts = {}; // 新增:存储用户的语音识别结果
const userSpeakCounts = {};


io.on("connection", (socket) => {
  console.log(
    "Someone joined our server using socket.io.  Their socket id is",
    socket.id
  );

  // Make sure to send the client all existing peers
  socket.emit("introduction", peers);

  // tell other clients that a new peer joined
  io.emit("newPeerConnected", socket.id);

  peers[socket.id] = {
    position: [0, 0.5, 0],
    rotation: [0, 0, 0, 1], // stored as XYZW values of Quaternion
  };
  const currentCapacity = Object.keys(peers).length;
  const maxCapacity = 14;
  userSpeakCounts[socket.id] = 0;
  io.emit('updateCapacity', currentCapacity, maxCapacity);
    // 新增: 发送初始 STT.txt 文件内容给新用户
    fs.readFile(sttFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Failed to read STT.txt:', err);
      } else {
        socket.emit('initSttFile', data);
      }
    });
    // 读取STT.txt文件内容并发送给新用户
    fs.readFile(sttFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Failed to read STT.txt:', err);
      } else {
        socket.emit('existingTranscripts', data);
      }
    });
  // 新增:将已有的语音识别结果发送给新用户
  socket.emit("existingTranscripts", transcripts);


  socket.on('transcript', (transcript) => {
    transcripts[socket.id] = transcript;
    socket.broadcast.emit('peerTranscript', socket.id, transcript);
  
    // 将语音识别内容写入文件
    fs.appendFile(sttFilePath, `[${socket.id}]: ${transcript}\n`, (err) => {
      if (err) {
        console.error('Failed to write to STT.txt:', err);
      } else {
        console.log(`Transcript saved for ${socket.id}: ${transcript}`);
      }
    });
  
    if (!userSpeakCounts[socket.id]) {
      userSpeakCounts[socket.id] = 0;
    }
    userSpeakCounts[socket.id]++;
    io.sockets.emit('adjustFrameSize', userSpeakCounts);
  });

// 每隔 100 毫秒清理并发送 peers 对象
setInterval(() => {
  // 清理 peers 对象,删除任何不完整的对象
  const cleanedPeers = {};
  Object.keys(peers).forEach(id => {
    const peer = peers[id];
    if (peer && peer.position && peer.rotation) {
      cleanedPeers[id] = peer;
    }
  });

  // 发送清理后的对象
  io.sockets.emit('peers', cleanedPeers);
}, 100);

  socket.on("msg", (data) => {
    console.log("Got message from client with id ", socket.id, ":", data);
    let messageWithId = { from: socket.id, data: data };
    socket.broadcast.emit("msg", messageWithId);
  });

  // whenever the client moves, update their movements in the clients object
  socket.on("move", (data) => {
    if (peers[socket.id]) {
      peers[socket.id].position = data[0];
      peers[socket.id].rotation = data[1];
    }
  });

  // Relay simple-peer signals back and forth
  socket.on("signal", (to, from, data) => {
    if (to in peers) {
      io.to(to).emit("signal", to, from, data);
    } else {
      console.log("Peer not found!");
    }
  });

  socket.on("disconnect", () => {
    console.log("Someone with ID", socket.id, "left the server");

    io.sockets.emit("peerDisconnected", socket.id);

    // 从文件中读取所有的transcript
    fs.readFile(sttFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Failed to read STT.txt:', err);
      } else {
        // 过滤掉断开连接的用户的发言
        const updatedTranscripts = data
          .split('\n')
          .filter(line => !line.startsWith(`[${socket.id}]:`))
          .join('\n');

        // 将更新后的transcript写回文件
        fs.writeFile(sttFilePath, updatedTranscripts, (err) => {
          if (err) {
            console.error('Failed to write to STT.txt:', err);
          } else {
            console.log(`Transcripts updated after ${socket.id} left`);
          }
        });
      }
    });

    delete peers[socket.id];
    delete transcripts[socket.id];
    const currentCapacity = Object.keys(peers).length;
    io.emit('updateCapacity', currentCapacity, maxCapacity);
  });
});

// update all clients with peer data every 100 milliseconds (around 10 times per second)
setInterval(() => {
  io.sockets.emit("peers", peers);
}, 100);



// Database to store data, don't forget autoload: true
var Datastore = require('nedb');
var db = new Datastore({filename: "data.db", autoload: true});
			

// Create a JavaScript Object with data to store
var datatosave = {
	name: "Shawn",
	message: "Hello world",
  timestamp:Date.now(),
  name:data.name,
  video:
};
		
// Insert the data into the database
db.insert(datatosave, function (err, newDocs) {
	console.log("err: " + err);
	console.log("newDocs: " + newDocs);
});

// Find all of the existing docs in the database
db.find({}, function(err, docs) {
	// Loop through the results, send each one as if it were a new chat message
	for (var i = 0; i < docs.length; i++) {
		console.log(docs[i].name + " " + docs[i].message);
	}
});

