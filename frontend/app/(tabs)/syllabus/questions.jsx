import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from "react-native";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useSyllabus } from "@/context/SyllabusContext";
import { useAuth } from "@/context/AuthContext";
import API from "@/api/api";

// keep footer above tab bar
const TAB_BAR_HEIGHT = 85;

const QuestionsScreen = () => {
    const router = useRouter();
    const { getSyllabusPayload } = useSyllabus();
    const { userData } = useAuth();

    const selectableTypes = useMemo(() => ([
        "Assignments",
        "Projects",
        "Exams",
        "Quizzes",
    ]), []);

    const [selectedTypes, setSelectedTypes] = useState(new Set());
    const [hoursByType, setHoursByType] = useState({});
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [calendarEntries, setCalendarEntries] = useState([]);
    const [isFetchingCalendar, setIsFetchingCalendar] = useState(false);

    const fetchCalendarEntries = async (retryCount = 0) => {
        setIsFetchingCalendar(true);
        try {
            const calendarRes = await API.get("/studyplans/calendar");
            console.log("[StudyPlan] Calendar entries:", calendarRes.data);
            setCalendarEntries(calendarRes.data.entries || []);
        } catch (calErr) {
            console.error("[StudyPlan] Failed to fetch calendar:", calErr);
            // retry on auth error
            if (calErr.response?.status === 401 && retryCount < 2) {
                console.log("[StudyPlan] Auth error, retrying in 1s...");
                await new Promise(r => setTimeout(r, 1000));
                return fetchCalendarEntries(retryCount + 1);
            }
            setCalendarEntries([]);
        } finally {
            setIsFetchingCalendar(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color={Colors.lightBlue} />
                <Text style={styles.loadingText}>Generating your study plans...</Text>
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
        {/* Result Modal for testing */}
        <Modal
            visible={showResultModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowResultModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Study Plan Generated!</Text>
                    <Text style={styles.modalSubtitle}>{calendarEntries.length} entries found</Text>
                    <ScrollView style={styles.modalScroll}>
                        {calendarEntries.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.modalEmpty}>No entries found. The workflow may still be processing.</Text>
                                <TouchableOpacity 
                                    style={[styles.retryBtn, isFetchingCalendar && styles.disabledBtn]} 
                                    onPress={fetchCalendarEntries}
                                    disabled={isFetchingCalendar}
                                >
                                    <Text style={styles.retryBtnText}>{isFetchingCalendar ? "Retrying..." : "Retry"}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            calendarEntries.map((entry, idx) => (
                                <View key={idx} style={styles.entryCard}>
                                    <View style={styles.entryHeader}>
                                        <Text style={styles.entryName}>{entry.assessmentName}</Text>
                                        <Text style={styles.entryCourse}>{entry.course}</Text>
                                    </View>
                                    {entry.dueDate && (
                                        <Text style={styles.entryDueDate}>Due: {entry.dueDate}</Text>
                                    )}
                                    {entry.tasks && entry.tasks.length > 0 && (
                                        <View style={styles.tasksList}>
                                            {entry.tasks.map((task, tIdx) => (
                                                <View key={tIdx} style={styles.taskItem}>
                                                    <Text style={styles.taskText}>
                                                        • {typeof task === 'string' ? task : task.task}
                                                    </Text>
                                                    {typeof task !== 'string' && task.estimatedTime && (
                                                        <Text style={styles.taskTime}>{task.estimatedTime}</Text>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </ScrollView>
                    <TouchableOpacity 
                        style={styles.modalCloseBtn} 
                        onPress={() => {
                            setShowResultModal(false);
                            router.push("/(tabs)/calendar");
                        }}
                    >
                        <Text style={styles.modalCloseBtnText}>Go to Calendar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}>
            <View style={styles.card}>
                <Text style={styles.title}>I want study plans for:</Text>
                <Text style={styles.subtitle}>(select all that apply)</Text>
                <View style={styles.chipsRow}>
                    {selectableTypes.map((label) => {
                        const isSelected = selectedTypes.has(label);
                        return (
                            <TouchableOpacity
                                key={label}
                                style={[styles.chip, isSelected && styles.chipSelected]}
                                onPress={() => {
                                    setOpenDropdown(null);
                                    setSelectedTypes((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(label)) {
                                            next.delete(label);
                                        } else {
                                            next.add(label);
                                        }
                                        return next;
                                    });
                                }}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {selectedTypes.size > 0 ? (
                <View style={styles.card}>
                    <Text style={styles.title}>I usually study about...</Text>
                    {[...selectedTypes].map((label) => {
                        const currentValue = hoursByType[label];
                        const isOpen = openDropdown === label;
                        const hourOptions = ["1","2","3","4","5","6","7","8","9","10+","N/A"];
                        return (
                            <View key={label} style={styles.dropdownGroup}>
                                <Text style={styles.dropdownLabel}>{label}</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setOpenDropdown(isOpen ? null : label)}
                                >
                                    <Text style={styles.dropdownButtonText}>
                                        {currentValue ? (currentValue === "N/A" ? "N/A" : `${currentValue} hours`) : "Select hours"}
                                    </Text>
                                </TouchableOpacity>
                                {isOpen ? (
                                    <View style={styles.dropdownList}>
                                        {hourOptions.map((opt) => (
                                            <TouchableOpacity
                                                key={`${label}-${opt}`}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setHoursByType((prev) => ({ ...prev, [label]: opt }));
                                                    setOpenDropdown(null);
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{opt === "N/A" ? "N/A" : `${opt} hours`}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            ) : null}

            <View style={styles.footerSpacer} />
        </ScrollView>
            <View style={styles.footerBar}>
                <TouchableOpacity style={[styles.backBtn, styles.footerBtn]} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Back to review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.generateBtn, styles.footerBtn, (selectedTypes.size === 0 || isLoading) && styles.disabledBtn]}
                    disabled={selectedTypes.size === 0 || isLoading}
                    onPress={async () => {
                        setIsLoading(true);
                        try {
                            const { syllabi, sourceFiles, uploadId } = getSyllabusPayload();

                            // build courses array with active/null sections
                            const courses = syllabi.map((course) => {
                                const buildSection = (key, label) => {
                                    const isActive = selectedTypes.has(label);
                                    if (!isActive) {
                                        return null;
                                    }
                                    return {
                                        active: true,
                                        studyTime: hoursByType[label] || null,
                                        items: course[key] || [],
                                    };
                                };

                                return {
                                    name: course.name,
                                    assignments: buildSection("assignments", "Assignments"),
                                    projects: buildSection("projects", "Projects"),
                                    exams: buildSection("exams", "Exams"),
                                    quizzes: buildSection("quizzes", "Quizzes"),
                                };
                            });

                            // debug
                            console.log("[StudyPlan] userData:", JSON.stringify(userData, null, 2));
                            
                            const payload = {
                                courses,
                                sourceFiles,
                                uploadId,
                                userId: userData?._id || userData?.id || null,
                                meta: { requestedAt: new Date().toISOString() },
                            };

                            console.log("[StudyPlan] Sending payload:", JSON.stringify(payload, null, 2));
                            const response = await API.post("/study-plan", payload);
                            console.log("[StudyPlan] Response:", response.data);
                            
                            // webhook responds after mongo insert, fetch now
                            await fetchCalendarEntries();
                            setShowResultModal(true);
                        } catch (e) {
                            console.error("[StudyPlan] Failed to send:", e);
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                >
                    <Text style={styles.generateBtnText}>Generate My Study Plans</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: Colors.backgroundBlue,
    },
    loadingWrapper: {
        flex: 1,
        backgroundColor: Colors.backgroundBlue,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loadingText: {
        color: Colors.lightBlue,
        fontSize: 16,
        fontWeight: "600",
    },
    container: {
        flex: 1,
        padding: 10,
    },
    card: {
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: Colors.borderGray,
        backgroundColor: "rgba(64, 71, 94, 0.25)",
        padding: 16,
        gap: 10,
        marginBottom: 12,
    },
    title: {
        color: Colors.lightBlue,
        fontWeight: "700",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        color: Colors.gray400,
        textAlign: "center",
        marginBottom: 8,
        fontSize: 12,
    },
    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
    },
    chip: {
        borderWidth: 1,
        borderColor: Colors.borderGray,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "transparent",
    },
    chipSelected: {
        backgroundColor: Colors.buttonBlue,
    },
    chipText: {
        color: Colors.white,
        fontWeight: "500",
    },
    chipTextSelected: {
        color: Colors.white,
        fontWeight: "700",
    },
    dropdownGroup: {
        marginTop: 8,
    },
    dropdownLabel: {
        color: Colors.white,
        marginBottom: 6,
        fontWeight: "600",
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: Colors.borderGray,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: Colors.menuBlue,
    },
    dropdownButtonText: {
        color: Colors.white,
        fontWeight: "600",
    },
    dropdownList: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: Colors.borderGray,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: Colors.menuBlue,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(255,255,255,0.15)",
    },
    dropdownItemText: {
        color: Colors.white,
    },
    generateBtn: {
        alignSelf: "stretch",
        paddingVertical: 12,
        backgroundColor: Colors.green600,
        borderRadius: 10,
        alignItems: "center",
    },
    generateBtnText: {
        color: Colors.white,
        fontWeight: "700",
        textAlign: "center",
    },
    backBtn: {
        alignSelf: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: Colors.buttonBlue,
        borderRadius: 10,
        alignItems: "center",
    },
    backBtnText: {
        color: Colors.white,
        fontWeight: "600",
        textAlign: "center",
    },
    disabledBtn: {
        opacity: 0.6,
    },
    footerBar: {
        position: "absolute",
        left: 10,
        right: 10,
        bottom: TAB_BAR_HEIGHT + 10,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    footerBtn: {
        flex: 1,
    },
    footerSpacer: {
        height: 140,
    },
    // modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.menuBlue,
        borderRadius: 16,
        padding: 20,
        width: "100%",
        maxHeight: "80%",
    },
    modalTitle: {
        color: Colors.lightBlue,
        fontSize: 20,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 4,
    },
    modalSubtitle: {
        color: Colors.gray400,
        fontSize: 14,
        textAlign: "center",
        marginBottom: 16,
    },
    modalScroll: {
        maxHeight: 400,
    },
    modalEmpty: {
        color: Colors.gray400,
        textAlign: "center",
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: "center",
        padding: 20,
    },
    retryBtn: {
        backgroundColor: Colors.green600,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryBtnText: {
        color: Colors.white,
        fontWeight: "600",
    },
    entryCard: {
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
    },
    entryHeader: {
        marginBottom: 6,
    },
    entryName: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: "700",
    },
    entryCourse: {
        color: Colors.lightBlue,
        fontSize: 12,
        fontWeight: "500",
        marginTop: 2,
    },
    entryDueDate: {
        color: Colors.yellowstar,
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 8,
    },
    tasksList: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
        paddingTop: 8,
        marginTop: 4,
    },
    taskItem: {
        marginBottom: 8,
    },
    taskText: {
        color: Colors.gray300 || "#d1d5db",
        fontSize: 13,
        lineHeight: 18,
    },
    taskTime: {
        color: Colors.green400,
        fontSize: 11,
        marginTop: 2,
        marginLeft: 12,
    },
    modalCloseBtn: {
        backgroundColor: Colors.buttonBlue,
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 16,
        alignItems: "center",
    },
    modalCloseBtnText: {
        color: Colors.white,
        fontWeight: "600",
    },
});

export default QuestionsScreen;


