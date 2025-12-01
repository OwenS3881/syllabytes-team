import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

const SyllabusContext = createContext();

export const SyllabusProvider = ({ children }) => {
    const [rawResult, setRawResult] = useState(null);
    const [courses, setCourses] = useState([]);
    const [studyPlan, setStudyPlan] = useState(null);
    const [uploadId, setUploadId] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // persist to localstorage on web
    useEffect(() => {
        if (Platform.OS === "web") {
            try {
                if (rawResult) {
                    localStorage.setItem("syllabus.rawResult", JSON.stringify(rawResult));
                }
                localStorage.setItem("syllabus.courses", JSON.stringify(courses || []));
                if (studyPlan) {
                    localStorage.setItem("syllabus.studyPlan", JSON.stringify(studyPlan));
                }
                if (uploadId) {
                    localStorage.setItem("syllabus.uploadId", String(uploadId));
                }
                localStorage.setItem("syllabus.uploadedFiles", JSON.stringify(uploadedFiles || []));
            } catch (_e) {
                // ignore
            }
        }
    }, [rawResult, courses, studyPlan, uploadId, uploadedFiles]);

    useEffect(() => {
        if (Platform.OS === "web") {
            try {
                const savedCourses = localStorage.getItem("syllabus.courses");
                const savedRaw = localStorage.getItem("syllabus.rawResult");
                const savedPlan = localStorage.getItem("syllabus.studyPlan");
                const savedUploadId = localStorage.getItem("syllabus.uploadId");
                const savedUploadedFiles = localStorage.getItem("syllabus.uploadedFiles");
                if (savedCourses) setCourses(JSON.parse(savedCourses));
                if (savedRaw) setRawResult(JSON.parse(savedRaw));
                if (savedPlan) setStudyPlan(JSON.parse(savedPlan));
                if (savedUploadId) setUploadId(savedUploadId);
                if (savedUploadedFiles) setUploadedFiles(JSON.parse(savedUploadedFiles));
            } catch (_e) {
                // ignore
            }
        }
    }, []);

    const value = useMemo(() => ({
        rawResult,
        setRawResult,
        courses,
        setCourses,
        studyPlan,
        setStudyPlan,
        uploadId,
        setUploadId,
        uploadedFiles,
        setUploadedFiles,
        // helper to build payload for webhooks
        getSyllabusPayload: () => ({
            syllabi: courses || [],
            studyPlan: studyPlan || null,
            sourceFiles: uploadedFiles || [],
            uploadId: uploadId || null,
            meta: { savedAt: new Date().toISOString() },
        }),
    }), [rawResult, courses, studyPlan, uploadId, uploadedFiles]);

    return <SyllabusContext.Provider value={value}>{children}</SyllabusContext.Provider>;
};

export const useSyllabus = () => useContext(SyllabusContext);



