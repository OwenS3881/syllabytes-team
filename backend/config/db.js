const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

// separate connection for studyplans db
let studyplansConnection = null;

// connect to mongodb (default db for users, separate for studyplans)
const connectDB = async () => {
    try {
        const uri = MONGODB_URI;

        await mongoose.connect(uri);
        console.log("MongoDB connected successfully (default)");

        // studyplans lives in a different database
        studyplansConnection = mongoose.createConnection(uri, { dbName: "studyplans" });
        studyplansConnection.on("connected", () => {
            console.log("MongoDB connected to 'studyplans' database");
        });
        studyplansConnection.on("error", (err) => {
            console.error("Studyplans DB connection error:", err);
        });
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    }
};

const getStudyplansConnection = () => studyplansConnection;

module.exports = { connectDB, mongoose, getStudyplansConnection };
