import dotenv from "dotenv"
import http from "http";
import connectDB from "./src/config/database.js";
import app from "./src/app.js";
import { initializeSocket } from "./src/socket/index.js";
import { initializeTaskScheduler } from "./src/services/taskNotificationScheduler.js";

dotenv.config({
    path: "./.env"
});

const startServer = async () => {
    try {
        console.log('MONGODB_URI:', process.env.MONGODB_URI);
        await connectDB();

        // Create HTTP server for Socket.IO
        const server = http.createServer(app);

        // Initialize Socket.IO
        initializeSocket(server);

        // Initialize task notification scheduler
        initializeTaskScheduler();

        server.on("error", (error) =>{
            console.log("ERROR", error);
            throw error
        });

        server.listen(process.env.PORT || 8000, ()=> {
            console.log(`server is running on  ${process.env.PORT}`)
        });
    } catch (error) {
        console.log("MongoDB connecton failed", error)
    }
}
startServer();
