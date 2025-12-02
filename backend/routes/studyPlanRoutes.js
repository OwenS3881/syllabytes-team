const express = require("express");
const router = express.Router();
const studyPlanController = require("../controllers/studyPlanController");
const { userAuthMiddleware } = require("../middleware/authMiddleware");

// all routes require auth
router.use(userAuthMiddleware);

router.get("/latest", studyPlanController.getLatestStudyPlan);
router.get("/calendar", studyPlanController.getCalendarEntries);
router.get("/history", studyPlanController.getStudyPlanHistory);
router.get("/:id", studyPlanController.getStudyPlanById);

module.exports = router;

