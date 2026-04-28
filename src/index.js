import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/database.js";
import app from "./app.js";
import { startTaskNotifier } from "./cron/taskNotifier.js";

dotenv.config({
  path: "./.env",
});

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const startServer = async () => {
  try {
    await connectDB();

    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });

    startTaskNotifier();
  } catch (error) {
    console.log("MongoDB connection failed", error);
  }
};

startServer();
