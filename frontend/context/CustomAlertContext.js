import React, { createContext, useState, useContext } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

const AlertContext = createContext();

export function useAlert() {
    return useContext(AlertContext);
}

//Show a custom alert on all platforms
export function CustomAlertProvider({ children }) {
    const [alertState, setAlertState] = useState({});
    const [alertVisible, setAlertVisible] = useState(false);

    const showAlert = (title, message, buttons = [{ text: "OK" }]) => {
        setAlertState({
            title,
            message,
            buttons,
        });
        setAlertVisible(true);
    };

    const hideAlert = () => {
        setAlertVisible(false);
    };

    const handleButtonPress = (onPress) => {
        hideAlert();
        if (onPress) onPress();
    };

    return (
        <AlertContext.Provider value={{ alert: showAlert }}>
            {children}
            <Modal transparent visible={alertVisible} animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        {alertState.title && (
                            <Text style={styles.title}>{alertState.title}</Text>
                        )}
                        <Text style={styles.message}>{alertState.message}</Text>
                        <View style={styles.buttonRow}>
                            {/* Render the buttons */}
                            {alertState.buttons?.map((btn, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() =>
                                        handleButtonPress(btn.onPress)
                                    }
                                    style={[
                                        styles.button,
                                        btn.style === "destructive" &&
                                            styles.destructiveButton,
                                        btn.style === "positive" &&
                                            styles.positiveButton,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            btn.style === "destructive" &&
                                                styles.destructiveButtonText,
                                            btn.style === "positive" &&
                                                styles.positiveButtonText,
                                        ]}
                                    >
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "#00000066",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "80%",
        backgroundColor: Colors.lightBlue,
        borderRadius: 10,
        padding: 20,
        elevation: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        textAlign: "center",
    },
    message: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: "center",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    button: {
        marginLeft: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: Colors.buttonBlue,
        borderRadius: 4,
        marginBottom: 5,
    },
    buttonText: {
        color: Colors.white,
        fontWeight: "600",
        fontSize: 20,
    },
    destructiveButton: {
        backgroundColor: Colors.red500,
    },
    destructiveButtonText: {
        color: Colors.white,
    },
    positiveButton: {
        backgroundColor: Colors.green600,
    },
    positiveButtonText: {
        color: Colors.white,
    },
});
