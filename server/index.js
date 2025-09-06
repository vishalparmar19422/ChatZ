import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

io.on("connection", (socket) => {
  console.log(`server connected ${socket.id}`);
});

app.get("/", (req, res) => {
  res.json({
    Connected: "hello boy",
  });
});

server.listen(port, () => {
  console.log(`\n server is listening at http://localhost:${port}`);
});
