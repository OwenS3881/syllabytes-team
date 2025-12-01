const mongoose = require("mongoose");
const { getStudyplansConnection } = require("../config/db");

// study plan schema - matches n8n workflow output

const taskSchema = new mongoose.Schema({
    task: { type: String },
    description: { type: String },
    estimatedTime: { type: String },
}, { _id: false });

const studyPeriodSchema = new mongoose.Schema({
    start: { type: String },
    end: { type: String },
}, { _id: false });

const entrySchema = new mongoose.Schema({
    assessmentName: { type: String, required: true },
    assessmentType: { type: String, required: true },
    dueDate: { type: String },
    studyPeriod: { type: studyPeriodSchema },
    tasks: [taskSchema],
}, { _id: false });

const courseSchema = new mongoose.Schema({
    course: { type: String, required: true },
    entries: [entrySchema],
}, { _id: false });

const studyPlanSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    courses: [courseSchema],
    totalCourses: { type: Number },
    savedAt: { type: Date, default: Date.now, index: true },
});

// index for getting most recent by user
studyPlanSchema.index({ userId: 1, savedAt: -1 });

// uses the studyplans database connection
let StudyPlan = null;

const getStudyPlanModel = () => {
    if (!StudyPlan) {
        const conn = getStudyplansConnection();
        if (conn) {
            StudyPlan = conn.model("StudyPlan", studyPlanSchema, "tasks");
        }
    }
    return StudyPlan;
};

module.exports = { getStudyPlanModel, studyPlanSchema };

