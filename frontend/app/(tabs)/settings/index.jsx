import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    Modal,
} from "react-native";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import { CustomAlert } from "@/utils/CustomAlert";
import API from "@/api/api";
import buttonStyles from "@/styles/button";
import textInputStyles from "@/styles/textInput";

export default function Settings() {
    const { logout } = useAuth();
    const { showLoading, hideLoading } = useLoading();

    const [modalVisible, setModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword.trim()) {
            CustomAlert.alert("Error", "Current password is required");
            return;
        }

        if (!newPassword.trim()) {
            CustomAlert.alert("Error", "New password is required");
            return;
        }

        if (!confirmPassword.trim()) {
            CustomAlert.alert("Error", "Please confirm your new password");
            return;
        }

        if (newPassword !== confirmPassword) {
            CustomAlert.alert("Error", "New passwords don't match");
            return;
        }

        try {
            showLoading();
            await API.post("/auth/change-password", {
                currentPassword,
                newPassword,
            });

            CustomAlert.alert("Success", "Password changed successfully");
            
            // Clear fields and close modal
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setModalVisible(false);
        } catch (err) {
            console.error("Password change error:", err);
            const errorMessage = err.response?.data?.message || "Failed to change password";
            CustomAlert.alert("Error", errorMessage);
        } finally {
            hideLoading();
        }
    };

    const handleLogout = () => {
        CustomAlert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: logout,
                },
            ]
        );
    };

    const openChangePasswordModal = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Change Password Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <TouchableOpacity
                        style={[buttonStyles.button, styles.compactButton]}
                        onPress={openChangePasswordModal}
                    >
                        <Text style={[buttonStyles.buttonText, styles.buttonText]}>Change Password</Text>
                    </TouchableOpacity>
                </View>

                {/* Account Actions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <TouchableOpacity
                        style={[buttonStyles.button, styles.compactButton, styles.logoutButton]}
                        onPress={handleLogout}
                    >
                        <Text style={[buttonStyles.buttonText, styles.buttonText]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback
                    onPress={() => {
                        if (Platform.OS !== "web") {
                            Keyboard.dismiss();
                        }
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>ORBIT🚀</Text>
                            <Text style={styles.modalSubtitle}>
                                Success! Enter your new password below
                            </Text>

                            <View style={styles.modalInputContainer}>
                                <TextInput
                                    style={textInputStyles.textInput}
                                    placeholderTextColor={Colors.gray900}
                                    placeholder="Password..."
                                    secureTextEntry={true}
                                    autoCapitalize="none"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                />
                                <TextInput
                                    style={textInputStyles.textInput}
                                    placeholderTextColor={Colors.gray900}
                                    placeholder="Confirm Password..."
                                    secureTextEntry={true}
                                    autoCapitalize="none"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                                <TextInput
                                    style={textInputStyles.textInput}
                                    placeholderTextColor={Colors.gray900}
                                    placeholder="Confirm Password..."
                                    secureTextEntry={true}
                                    autoCapitalize="none"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity
                                    style={[buttonStyles.button, styles.submitButton]}
                                    onPress={handleChangePassword}
                                >
                                    <Text style={buttonStyles.buttonText}>Submit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundBlue,
    },
    content: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
    },
    compactButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        maxWidth: 300,
    },
    buttonText: {
        fontSize: 18,
    },
    logoutButton: {
        backgroundColor: Colors.red500,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: Colors.menuBlue,
        borderRadius: 12,
        padding: 30,
        width: "85%",
        maxWidth: 400,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 48,
        color: Colors.white,
        fontFamily: "HoltwoodOneSC",
        marginBottom: 16,
    },
    modalSubtitle: {
        fontSize: 16,
        color: Colors.white,
        textAlign: "center",
        marginBottom: 24,
    },
    modalInputContainer: {
        width: "100%",
        marginBottom: 20,
    },
    modalButtonContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    submitButton: {
        marginBottom: 12,
        alignSelf: "center",
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        color: Colors.white,
        fontSize: 16,
        textDecorationLine: "underline",
    },
});
