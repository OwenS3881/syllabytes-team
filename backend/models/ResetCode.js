const mongoose = require("mongoose");

//store password reset code
const resetCodeSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("ResetCode", resetCodeSchema);
