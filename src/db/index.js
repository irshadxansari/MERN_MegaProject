import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async() => {
    try {
        const connectionInstant = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\nMongoDB connected sucessfully || DB_HOST: ${connectionInstant.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB