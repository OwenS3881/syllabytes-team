import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    Pressable,
} from "react-native";
import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import Colors from "@/constants/Colors";

const CalendarEvent = ({ 
    event,
    style,
    compact = false,
}) => {
    const [modalOpen, setModalOpen] = useState(false);

    if (!event) return null;

    const isDeadline = event.type === "deadline";
    const eventColor = event.color || Colors.lightBlue;
    
    // Determine text color based on background brightness
    const getContrastColor = (hexColor) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000' : '#fff';
    };
    
    const textColor = getContrastColor(eventColor);

    const formatEventDate = (dateStr) => {
        try {
            return format(parseISO(dateStr), "MMMM d, yyyy");
        } catch {
            return dateStr;
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={() => setModalOpen(true)}
                style={[
                    styles.buttonContainer,
                    { backgroundColor: eventColor },
                    isDeadline && styles.deadlineContainer,
                    style,
                ]}
            >
                <Text 
                    style={[
                        styles.taskText, 
                        { color: textColor },
                        compact && styles.compactText,
                    ]}
                    numberOfLines={compact ? 1 : 2}
                >
                    {event.title}
                </Text>
                {!compact && event.estimatedTime && (
                    <Text style={[styles.timeText, { color: textColor }]}>
                        {event.estimatedTime}
                    </Text>
                )}
            </TouchableOpacity>

            <Modal transparent visible={modalOpen} animationType="fade">
                <Pressable
                    style={styles.overlay}
                    onPress={() => setModalOpen(false)}
                >
                    <View style={[styles.modalContainer, { borderLeftColor: eventColor, borderLeftWidth: 4 }]}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalOpen(false)}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                        
                        <Pressable onPress={() => {}}>
                            {/* Assessment Type Badge */}
                            <View style={[styles.typeBadge, { backgroundColor: eventColor }]}>
                                <Text style={[styles.typeBadgeText, { color: textColor }]}>
                                    {event.assessmentType || (isDeadline ? "Due Date" : "Task")}
                                </Text>
                            </View>
                            
                            {/* Title */}
                            <Text style={styles.title}>{event.title}</Text>
                            
                            {/* Course */}
                            {event.course && (
                                <Text style={styles.courseText}> {event.course}</Text>
                            )}
                            
                            {/* Date */}
                            <Text style={styles.dateText}>
                                {isDeadline ? "Due: " : ""}
                                {formatEventDate(event.date)}
                            </Text>
                            
                            {/* Parent Assessment (for tasks) */}
                            {!isDeadline && event.parentAssessment && (
                                <Text style={styles.parentText}>
                                     For: {event.parentAssessment}
                                </Text>
                            )}
                            
                            {/* Due Date (for tasks) */}
                            {!isDeadline && event.dueDate && (
                                <Text style={styles.dueDateText}>
                                     Due: {formatEventDate(event.dueDate)}
                                </Text>
                            )}
                            
                            {/* Estimated Time */}
                            {event.estimatedTime && (
                                <Text style={styles.estimatedText}>
                                     Estimated: {event.estimatedTime}
                                </Text>
                            )}
                            
                            {/* Description */}
                            {event.description && (
                                <Text style={styles.description}>
                                    {event.description}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        backgroundColor: Colors.lightBlue,
        borderRadius: 4,
        padding: 4,
        margin: 1,
        overflow: "hidden",
    },
    deadlineContainer: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.red500,
    },
    taskText: {
        fontSize: 10,
        fontWeight: "600",
    },
    compactText: {
        fontSize: 8,
    },
    timeText: {
        fontSize: 8,
        marginTop: 2,
        opacity: 0.8,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "85%",
        maxWidth: 400,
        backgroundColor: Colors.backgroundBlue,
        borderRadius: 12,
        padding: 20,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    typeBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
        color: Colors.white,
    },
    courseText: {
        fontSize: 14,
        color: Colors.gray400,
        marginBottom: 6,
    },
    dateText: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.lightBlue,
        marginBottom: 4,
    },
    parentText: {
        fontSize: 13,
        color: Colors.gray500,
        marginBottom: 4,
    },
    dueDateText: {
        fontSize: 13,
        color: Colors.yellow500,
        marginBottom: 4,
    },
    estimatedText: {
        fontSize: 13,
        color: Colors.green400,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: Colors.gray300,
        marginTop: 8,
        lineHeight: 20,
    },
    closeButton: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: Colors.darkGray500,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    closeButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 14,
    },
});

export default CalendarEvent;
