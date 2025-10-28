const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

//connect to mongodb
const connectDB = async () => {
    try {
        const uri = MONGODB_URI;

        await mongoose.connect(uri);

        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    }
};

module.exports = { connectDB, mongoose };
