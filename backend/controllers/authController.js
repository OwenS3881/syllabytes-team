const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Token = require("../models/Token");
const ResetCode = require("../models/ResetCode");
const transporter = require("../utils/transporter");

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

//Helper functions
const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
        expiresIn: "30d",
    });
};

//email validation
const isValidEmail = (testEmail) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail);

const checkEmailAvailable = async (email) => {
    try {
        const emailTaken = await User.findOne({ email });
        return !!emailTaken;
    } catch (err) {
        console.error(err);
        res.status(500);
    }
};

//sign up user
exports.handleSignup = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email" });
        }

        const availabilityCheck = await checkEmailAvailable(email);
        if (availabilityCheck) {
            return res.status(409).json({ message: "Email already taken" });
        }

        if (!password.trim()) {
            return res.status(400).json({ message: "Password is required" });
        }

        //create user
        const user = User({
            email,
            password,
        });
        await user.save();

        res.status(201).json({ message: "User created" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Server error. ${err}` });
    }
};

//login handler
exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        await new Token({ userId: user._id, token: refreshToken }).save();

        const isWebClient = req.get("X-Client-Platform") === "web";

        if (isWebClient) {
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });
            res.json({ accessToken, user });
        } else {
            res.json({ accessToken, refreshToken, user });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Server error. ${err}` });
    }
};

//refresh access token
exports.handleRefresh = async (req, res) => {
    try {
        const isWebClient = req.get("X-Client-Platform") === "web";
        const refreshToken = isWebClient
            ? req.cookies.refreshToken
            : req.body.refreshToken;

        if (isWebClient)
            console.log("Web client detected! Token:", refreshToken);

        if (!refreshToken) return res.sendStatus(401);

        const storedToken = await Token.findOne({ token: refreshToken });
        if (!storedToken) return res.sendStatus(403);

        jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.sendStatus(403);

            const userId = decoded.userId;

            //rotate refresh token
            await Token.deleteOne({ token: refreshToken });

            //make new tokens
            const accessToken = generateAccessToken(userId);
            const newRefreshToken = generateRefreshToken(userId);

            //store new refresh token
            const newToken = new Token({ token: newRefreshToken, userId });
            await newToken.save();

            if (isWebClient) {
                res.cookie("refreshToken", newRefreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "Strict",
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });
                res.json({ accessToken });
            } else {
                res.json({ accessToken, refreshToken: newRefreshToken });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Server error. ${err}` });
    }
};

//gets the users data for refresh purposes
exports.refreshUserData = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const user = await User.findById(payload.userId);
        res.json({ user });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: "Invalid token" });
    }
};

//logout
exports.handleLogout = async (req, res) => {
    try {
        const isWebClient = req.get("X-Client-Platform") === "web";
        const refreshToken = isWebClient
            ? req.cookies.refreshToken
            : req.body.refreshToken;

        if (refreshToken) {
            await Token.deleteOne({ token: refreshToken });
        }
        if (isWebClient) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
            });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Server error. ${err}` });
    }
};

//change password
exports.handleChangePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const user = await User.findById(payload.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Validate new password
        if (!newPassword || !newPassword.trim()) {
            return res.status(400).json({ message: "New password is required" });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Server error. ${err}` });
    }
};
