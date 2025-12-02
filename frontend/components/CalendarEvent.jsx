import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    Pressable,
} from "react-native";
import React, { useState } from "react";
import { format } from "date-fns";
import Colors from "@/constants/Colors";

const CalendarEvent = (taskData) => {
    const [modalOpen, setModalOpen] = useState(false);

    const defaultTaskData = {
        title: "TASK TITLE",
        description: "TASK DESCRIPTION THAT IS A BIT LONGER THAN THE TITLE",
        date: Date.now(),
    };

    const task = Object.keys(taskData).length > 0 ? taskData : defaultTaskData;

    return (
        <>
            <TouchableOpacity
                onPress={() => setModalOpen(true)}
                style={styles.buttonContainer}
            >
                <Text style={styles.taskText}>TASK NAME</Text>
            </TouchableOpacity>

            <Modal transparent visible={modalOpen} animationType="fade">
                <Pressable
                    style={styles.overlay}
                    onPress={() => setModalOpen(false)}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalOpen(false)}
                        >
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                        <Pressable onPress={() => {}}>
                            <Text style={styles.title}>{task.title}</Text>
                            <Text style={styles.dateText}>
                                {format(task.date, "MMMM d, yyyy")}
                            </Text>
                            <Text style={styles.description}>
                                {task.description}
                            </Text>
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
        height: "90%",
        width: "90%",
        margin: 2,
    },

    taskText: {
        fontSize: 12,
    },

    overlay: {
        flex: 1,
        backgroundColor: "#00000066",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "80%",
        backgroundColor: Colors.lightBlue,
        borderRadius: 10,
        padding: 20,
        elevation: 4,
        zIndex: 5,

        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    dateText: {
        marginBottom: 8,
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.darkGray600,
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
    },

    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: Colors.buttonBlue,
        width: 25,
        height: 25,
        borderRadius: 25,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    closeButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default CalendarEvent;
