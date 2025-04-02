const http = require("http");
const mongoose = require('mongoose');
const express = require("express");
const {Server} = require("socket.io");
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
const io = new Server(server); 
require('dotenv').config()

// Static Folder
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// // Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  age: Number,
  chatroom: String,
});

// Create the model
const User = mongoose.model('User', userSchema);

// Handle form submission
app.post('/submit-form', (req, res) => {
  const { firstName, lastName, username, email, age, chatroom } = req.body;

  // Create a new User document
  const newUser = new User({
    firstName,
    lastName,
    username,
    email,
    age,
    chatroom,
  });

  // Save the user to the database
  newUser.save()
    .then(() => res.json({ message: 'User data saved successfully!' }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Setup Websocket
let users = [];

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const id = 123456
});

const chatNameSpace = io.of("/chat");

chatNameSpace.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listening
  socket.on("disconnect", (data) => {
    const index = users.findIndex((s) => s.id == socket.id);
    if (index != -1) users.splice(index, 1);
    chatNameSpace.emit("online", users);
    console.log("User Disconnected");
  });

  socket.on("chat message", (data) => {
    const date = new Date();
    let hours = date.getHours();
    let miniutes = date.getMinutes();
    if (+hours <= 9) {
      hours = `0${hours}`;
    }
    if (+miniutes <= 9) {
      miniutes = `0${hours}`;
    }
    data.date = `${hours}:${miniutes}`;
    chatNameSpace.to(data.roomNumber).emit("chat message", data);
  });

  socket.on("typing", (data) => {
    socket.broadcast.in(data.roomNumber).emit("typing", `${data.name} is typing...`);
  });

  socket.on("login", (data) => {
    users.push({
      id: socket.id,
      name: data.nickname,
      roomNumber: data.roomNumber,
    });
    socket.join(data.roomNumber);

    chatNameSpace.emit("online", users);
    console.log(`${data.nickname} connected`);
  });
  
  socket.on("send-image", (data) => {
    chatNameSpace.to(data.roomNumber).emit("receive-image", {
      nickname: data.nickname,
      imageData: data.imageData  // This is the base64 image
    });
  });
  socket.on("send-location", (data) => {
    const { nickname, roomNumber, latitude, longitude } = data;

    // Broadcast the location to all users in the same room
    chatNameSpace.to(roomNumber).emit("receive-location", {
      nickname,
      latitude,
      longitude
    });
  });
  
  socket.on("pvChat", (data) => {
    chatNameSpace.to(data.to).emit("pvChat", data);
  });
});
