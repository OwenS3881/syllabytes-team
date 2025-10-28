const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/db");

//Middleware imports
const corsMiddleware = require("./middleware/corsMiddleware");
const { userAuthMiddleware } = require("./middleware/authMiddleware");

//Routes imports
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.port || 3000;
const OUTPUT_REQUESTS = true; //set to true to output all requests received, useful for debugging

//config
connectDB();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    if (OUTPUT_REQUESTS) console.log(`${req.method} ${req.url}`);
    next();
});

app.get("/", (req, res) => {
    res.send("API is running!");
});

app.use("/api/auth", authRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Express app listening at http://localhost:${PORT}`);
});
