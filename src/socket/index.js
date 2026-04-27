import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware for JWT authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
      socket.userId = decoded.id || decoded._id;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`[v0] User ${socket.userId} connected with socket ID: ${socket.id}`);

    // Join user-specific room for targeted broadcasts
    socket.join(`user:${socket.userId}`);

    // Handle marking notification as read
    socket.on("mark-notification-read", async (notificationId) => {
      try {
        // Import here to avoid circular dependency
        const Notification = (await import("../models/notifications.js")).default;
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        socket.emit("notification-marked-read", { notificationId });
      } catch (error) {
        console.error("[v0] Error marking notification as read:", error);
      }
    });

    // Handle getting unread notifications
    socket.on("get-unread-notifications", async () => {
      try {
        const Notification = (await import("../models/notifications.js")).default;
        const unread = await Notification.find({
          userId: socket.userId,
          isRead: false,
        }).sort({ createdAt: -1 });
        socket.emit("unread-notifications", unread);
      } catch (error) {
        console.error("[v0] Error fetching unread notifications:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[v0] User ${socket.userId} disconnected`);
    });
  });

  return io;
};

// Get io instance
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

export default io;
