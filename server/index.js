import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

const rooms = new Map();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

io.on("connection", (socket) => {
  console.log(`Server connected: ${socket.id}`);

  socket.on("joinRoom", ({ roomId, username }) => {
    socket.username = username;
    socket.roomId = roomId;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(username);

    console.log(`${username} joined room: ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit("user_joined", username);
    
    // Welcome the user
    socket.emit("join_success");
  });

  // --- NEW: Listen for and broadcast messages ---
  socket.on("send_message", (data) => {
    const { roomId, message, author } = data;
    // Emit the received message to everyone in that room
    io.in(roomId).emit("receive_message", data);
    console.log(`Message from ${author} in room ${roomId}: ${message}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const { username, roomId } = socket;

    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(username);

      socket.to(roomId).emit("user_left", username);

      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} is now empty and has been closed.`);
      }
    }
  });
});

app.get("/", (req, res) => {
  res.json({
    Connected: "true",
  });
});

server.listen(port, () => {
  console.log(`\nServer is listening at http://localhost:${port}`);
});

