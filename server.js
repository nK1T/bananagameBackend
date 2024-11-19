const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User'); 
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const playerRoutes = require('./routes/player');
dotenv.config();


// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/player', playerRoutes);

// Global socket state
let players = {};

// Socket.io events
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Player joins
  socket.on('join', (user) => {
    players[user._id] = { ...user, clickCount: user.clickCount || 0, socketId: socket.id };
    console.log('Players after join:', players);
    io.emit('updateRanks', Object.values(players));
  });

  // Player clicks banana
  socket.on('bananaClick', async (userId) => {
    console.log(`Received bananaClick from user: ${userId}`);

    if (players[userId]) {
      players[userId].clickCount++;

      try {
        const user = await User.findByIdAndUpdate(
          userId,
          { $inc: { clickCount: 1 } }, 
          { new: true } 
        );

        console.log(`Updated click count for user ${userId}: ${user.clickCount}`);

        io.to(players[userId].socketId).emit('updateClickCount', user.clickCount);

        io.emit('updateRanks', Object.values(players));
      } catch (error) {
        console.error(`Error updating click count for user ${userId}:`, error);
      }
    } else {
      console.error(`User with ID ${userId} is not in the players object`);
    }
  });

  socket.on('disconnect', () => {
    for (const userId in players) {
      if (players[userId].socketId === socket.id) {
        delete players[userId];
        break;
      }
    }
    io.emit('updateRanks', Object.values(players));
    console.log('Emitting rankings:', Object.values(players));
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
