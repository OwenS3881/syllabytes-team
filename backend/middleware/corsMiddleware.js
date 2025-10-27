const cors = require("cors");

// Allow requests from frontend (adjust the origin as needed)
const allowedOrigins = ["http://localhost:8081"];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};

module.exports = cors(corsOptions);
