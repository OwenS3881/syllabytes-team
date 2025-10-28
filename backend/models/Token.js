const mongoose = require("mongoose");

/**
 * Scheme for storing refresh tokens in the database
 */

const tokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: "30d" },
});

module.exports = mongoose.model("Token", tokenSchema);
