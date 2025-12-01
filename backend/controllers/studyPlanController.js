const { getStudyPlanModel } = require("../models/StudyPlan");

// get most recent study plan for user
// GET /api/studyplans/latest
exports.getLatestStudyPlan = async (req, res) => {
    try {
        const StudyPlan = getStudyPlanModel();
        if (!StudyPlan) {
            return res.status(503).json({ error: "Database not ready" });
        }

        const userId = req.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const studyPlan = await StudyPlan.findOne({ userId })
            .sort({ savedAt: -1 })
            .lean();

        if (!studyPlan) {
            return res.status(404).json({ error: "No study plan found for this user" });
        }

        res.json({ studyPlan });
    } catch (err) {
        console.error("[StudyPlan] Error fetching latest:", err);
        res.status(500).json({ error: "Failed to fetch study plan" });
    }
};

// get study plan history for user
// GET /api/studyplans/history
exports.getStudyPlanHistory = async (req, res) => {
    try {
        const StudyPlan = getStudyPlanModel();
        if (!StudyPlan) {
            return res.status(503).json({ error: "Database not ready" });
        }

        const userId = req.user?._id?.toString();

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const limit = parseInt(req.query.limit) || 10;

        const studyPlans = await StudyPlan.find({ userId })
            .sort({ savedAt: -1 })
            .limit(limit)
            .lean();

        res.json({ studyPlans, count: studyPlans.length });
    } catch (err) {
        console.error("[StudyPlan] Error fetching history:", err);
        res.status(500).json({ error: "Failed to fetch study plan history" });
    }
};

// get specific study plan by id
// GET /api/studyplans/:id
exports.getStudyPlanById = async (req, res) => {
    try {
        const StudyPlan = getStudyPlanModel();
        if (!StudyPlan) {
            return res.status(503).json({ error: "Database not ready" });
        }

        const userId = req.user?._id?.toString();
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const studyPlan = await StudyPlan.findById(id).lean();

        if (!studyPlan) {
            return res.status(404).json({ error: "Study plan not found" });
        }

        // check ownership
        if (studyPlan.userId !== userId) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json({ studyPlan });
    } catch (err) {
        console.error("[StudyPlan] Error fetching by ID:", err);
        res.status(500).json({ error: "Failed to fetch study plan" });
    }
};

// get calendar entries from latest study plan
// GET /api/studyplans/calendar
exports.getCalendarEntries = async (req, res) => {
    try {
        const StudyPlan = getStudyPlanModel();
        if (!StudyPlan) {
            return res.status(503).json({ error: "Database not ready" });
        }

        const userId = req.user?._id?.toString();
        console.log("[StudyPlan] getCalendarEntries - userId:", userId);

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        // debug: check whats in the collection
        const allPlans = await StudyPlan.find({}).lean();
        console.log("[StudyPlan] all plans in db:", allPlans.length, "userIds:", allPlans.map(p => p.userId));

        const studyPlan = await StudyPlan.findOne({ userId })
            .sort({ savedAt: -1 })
            .lean();

        console.log("[StudyPlan] Found plan:", studyPlan ? "yes" : "no");

        if (!studyPlan) {
            return res.status(404).json({ error: "No study plan found" });
        }

        // group entries by assessment
        const calendarEntries = [];

        for (const course of studyPlan.courses || []) {
            for (const entry of course.entries || []) {
                calendarEntries.push({
                    course: course.course,
                    assessmentName: entry.assessmentName,
                    assessmentType: entry.assessmentType,
                    dueDate: entry.dueDate || null,
                    studyPeriod: entry.studyPeriod || null,
                    tasks: entry.tasks || [],
                });
            }
        }

        // sort by due date (nulls last)
        calendarEntries.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        res.json({
            entries: calendarEntries,
            count: calendarEntries.length,
            studyPlanId: studyPlan._id,
            savedAt: studyPlan.savedAt,
        });
    } catch (err) {
        console.error("[StudyPlan] Error fetching calendar entries:", err);
        res.status(500).json({ error: "Failed to fetch calendar entries" });
    }
};

