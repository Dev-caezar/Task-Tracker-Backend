import mongoose from "mongoose"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`n MondoDB connected  ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("DATABASE CONNECTION FAILED", error);
        process.exit(1)
    }
}

export default connectDB