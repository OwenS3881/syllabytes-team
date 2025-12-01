require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const { connectDB } = require("./config/db");
const corsMiddleware = require("./middleware/corsMiddleware");
const { userAuthMiddleware } = require("./middleware/authMiddleware");
const authRoutes = require("./routes/authRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");

const app = express();
const PORT = process.env.port || 3000;
const WEBHOOK_URL = "https://scual.app.n8n.cloud/webhook/syllabite-parser";
const STUDYPLAN_WEBHOOK_URL = "https://scual.app.n8n.cloud/webhook/syllabite-studyplan";

connectDB();

app.use(corsMiddleware);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}-${safeBase}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, cb) => {
        const allowed = new Set([
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]);
        if (allowed.has(file.mimetype)) return cb(null, true);
        return cb(new Error("Unsupported file type"));
    },
});

const jobs = new Map();

app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
    res.send("API is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/studyplans", studyPlanRoutes);

app.post("/api/uploads", upload.array("files"), (req, res) => {
    const id = randomUUID();
    const files = (req.files || []).map((f) => ({
        originalName: f.originalname,
        storedName: path.basename(f.filename),
        size: f.size,
        mimetype: f.mimetype,
        path: f.path,
    }));

    if (files.length === 0) {
        return res.status(400).json({ error: "No valid files uploaded" });
    }

    // public urls for static access
    const fileUrls = files.map((f) => ({
        originalName: f.originalName,
        storedName: f.storedName,
        size: f.size,
        mimetype: f.mimetype,
        url: `${req.protocol}://${req.get("host")}/uploads/${f.storedName}`,
    }));

    // internal entries with disk paths
    const internalFiles = files.map((f) => ({
        originalName: f.originalName,
        storedName: f.storedName,
        size: f.size,
        mimetype: f.mimetype,
        diskPath: f.path,
    }));

    jobs.set(id, { status: "processing", result: null, files: fileUrls, _internalFiles: internalFiles, uploadId: id });
    res.status(200).json({ uploadId: id });

    // keep paths for webhook streaming

    const webhookUrl = WEBHOOK_URL;

    (async () => {
        try {
            if (webhookUrl) {
                const meta = {
                    uploadId: id,
                    receivedAt: new Date().toISOString(),
                    summary: {
                        totalFiles: files.length,
                        totalBytes: files.reduce((acc, f) => acc + (f.size || 0), 0),
                        types: Array.from(new Set(files.map((f) => f.mimetype))),
                    },
                };
                const form = new FormData();
                for (const f of files) {
                    const buf = await fs.promises.readFile(f.path);
                    const blob = new Blob([buf], { type: f.mimetype || "application/octet-stream" });
                    const filename = f.originalName || f.storedName;
                    form.append("files", blob, filename);
                }
                form.append("meta", JSON.stringify(meta));

                const resp = await fetch(webhookUrl, { method: "POST", body: form });
                let webhookResult = null;
                try {
                    webhookResult = await resp.json();
                } catch (_e) {
                    webhookResult = { ok: resp.ok };
                }
                const prev = jobs.get(id) || {};
                jobs.set(id, { ...prev, status: "completed", result: webhookResult });
            } else {
                setTimeout(() => {
                    const resultPayload = {
                        uploadId: id,
                        processedAt: new Date().toISOString(),
                        files: fileUrls,
                        summary: {
                            totalFiles: files.length,
                            totalBytes: files.reduce((acc, f) => acc + (f.size || 0), 0),
                            types: Array.from(new Set(files.map((f) => f.mimetype))),
                        },
                    };
                    const prev = jobs.get(id) || {};
                    jobs.set(id, { ...prev, status: "completed", result: resultPayload });
                }, 1200);
            }
        } catch (err) {
            jobs.set(id, { status: "error", message: err.message || "Webhook error" });
        }
    })();
});

app.post("/api/webhook", (req, res) => {
    const { uploadId, result } = req.body || {};
    if (!uploadId || !jobs.has(uploadId)) return res.status(400).json({ error: "Unknown uploadId" });
    jobs.set(uploadId, { status: "completed", result: result || null });
    res.json({ ok: true });
});

app.get("/api/uploads/:id", (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).json({ status: "not_found" });
    res.json(job);
});

app.post("/api/study-plan", async (req, res) => {
    console.log("[StudyPlan] Received request");
    try {
        const payload = req.body || {};
        console.log("[StudyPlan] Payload:", JSON.stringify(payload, null, 2));
        
        console.log("[StudyPlan] Sending to webhook:", STUDYPLAN_WEBHOOK_URL);
        const resp = await fetch(STUDYPLAN_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        console.log("[StudyPlan] Webhook response status:", resp.status);

        let data = null;
        try {
            data = await resp.json();
            console.log("[StudyPlan] Webhook response data:", JSON.stringify(data, null, 2));
        } catch (_e) {
            data = { ok: resp.ok };
            console.log("[StudyPlan] Webhook returned non-JSON response");
        }
        res.json({ ok: true, forwarded: true, status: resp.status, data });
    } catch (err) {
        console.error("[StudyPlan] Error:", err);
        res.status(500).json({ ok: false, error: err.message || "Failed to forward study plan" });
    }
});

app.listen(PORT, () => {
    console.log(`Express app listening at http://localhost:${PORT}`);
});
