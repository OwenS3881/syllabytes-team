const nodemailer = require("nodemailer");
require("dotenv").config();

// Email transporter
module.exports = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});
