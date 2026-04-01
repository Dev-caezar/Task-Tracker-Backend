import dotenv from "dotenv"
import connectDB from "./src/config/database.js";
import app from "./src/app.js";

dotenv.config({
    path: "./.env"
});

const startServer = async () => {
    try {
        console.log('MONGODB_URI:', process.env.MONGODB_URI);
        await connectDB();

        app.on("error", (error) =>{
            console.log("ERROR", error);
            throw error
        });

        app.listen(process.env.PORT || 8000, ()=> {
            console.log(`server is running on  ${process.env.PORT}`)
        });
    } catch (error) {
        console.log("MongoDB connecton failed", error)
    }
}
startServer();