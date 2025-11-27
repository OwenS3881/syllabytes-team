import {
    StyleSheet,
    Text,
    View,
    TouchableWithoutFeedback,
    TouchableOpacity,
    TextInput,
    Platform,
    Keyboard,
} from "react-native";
import React, { useState } from "react";
import buttonStyles from "@/styles/button";
import Colors from "@/constants/Colors";
import API from "@/api/api";
import { useLoading } from "@/context/LoadingContext";
import CodeInput from "@/components/CodeInput";
import { CustomAlert } from "@/utils/CustomAlert";
import { useRouter } from "expo-router";
import textInputStyles from "@/styles/textInput";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [codeSent, setCodeSent] = useState(false);
    const [codeVerified, setCodeVerified] = useState(false);

    const router = useRouter();
    const { showLoading, hideLoading } = useLoading();

    //email validation
    const isValidEmail = (testEmail) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail);
    const isUflEmail = (testEmail) => /^[^\s@]+@ufl\.edu$/.test(testEmail);

    const sendResetCode = async () => {
        //input validation
        if (!email.trim()) {
            CustomAlert.alert("Error", "Email is required");
            return;
        }

        if (!isValidEmail(email)) {
            CustomAlert.alert("Error", "Email is not valid");
            return;
        }

        if (!isUflEmail(email)) {
            CustomAlert.alert("Error", "Email is not a UFL email");
            return;
        }

        try {
            showLoading();
            const res = await API.post("/auth/send-reset-code", {
                email,
            });
            setCodeSent(true);
        } catch (err) {
            console.log("Sending code failed", err);
            CustomAlert.alert(
                "Error",
                "Sending the code failed, please try again"
            );
        } finally {
            hideLoading();
        }
    };

    const onSubmitCode = async () => {
        //input validation
        if (!resetCode.trim()) {
            CustomAlert.alert("Error", "Please enter a code");
            return;
        }

        if (resetCode.trim().length !== 6) {
            CustomAlert.alert(
                "Error",
                "Please enter a code with exactly 6 digits"
            );
            return;
        }

        try {
            showLoading();
            const res = await API.post("/auth/check-reset-code", {
                email,
                code: resetCode,
            });
            setCodeVerified(true);
        } catch (err) {
            console.log("Code verification failed", err);
            CustomAlert.alert(
                "Error",
                "Code verification failed, please try again"
            );
        } finally {
            hideLoading();
        }
    };

    const onResetPassword = async () => {
        //input validation
        if (!password.trim()) {
            CustomAlert.alert("Error", "Password is required");
            return;
        }

        if (!confirmPassword.trim()) {
            CustomAlert.alert(
                "Error",
                "Confirm your password by entering it again"
            );
            return;
        }

        if (password != confirmPassword) {
            CustomAlert.alert("Error", "Passwords don't match");
            return;
        }

        try {
            showLoading();
            const res = await API.post("/auth/reset-password", {
                email,
                password,
                code: resetCode,
            });
            CustomAlert.alert(
                "Success!",
                "Your password has been reset! Go login!",
                [
                    {
                        text: "OK",
                        style: "positive",
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (err) {
            console.log("Password reset failed", err);
            CustomAlert.alert(
                "Error",
                "Password reset failed, please try again"
            );
        } finally {
            hideLoading();
        }
    };

    return (
        <TouchableWithoutFeedback
            onPress={() => {
                if (Platform.OS !== "web") {
                    Keyboard.dismiss();
                }
            }}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Forgot Password</Text>
                {!codeSent ? (
                    <>
                        <Text style={styles.subTitle}>
                            Enter the email you used to create your account
                            below, we'll send you a code to reset your password
                        </Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={textInputStyles.textInput}
                                placeholderTextColor={Colors.gray900}
                                placeholder="Email..."
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={buttonStyles.button}
                                onPress={sendResetCode}
                            >
                                <Text style={buttonStyles.buttonText}>
                                    Reset Password
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : !codeVerified ? (
                    <>
                        <Text
                            style={[
                                styles.subTitle,
                                {
                                    marginBottom: 10,
                                },
                            ]}
                        >
                            Check{" "}
                            <Text style={{ fontWeight: "bold" }}>
                                {email ? email : "your email"}
                            </Text>{" "}
                            for a code. Make sure to check your junk folder
                        </Text>
                        <CodeInput code={resetCode} setCode={setResetCode} />
                        <TouchableOpacity
                            style={[buttonStyles.button, { marginTop: 50 }]}
                            onPress={onSubmitCode}
                        >
                            <Text style={buttonStyles.buttonText}>Submit</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.subTitle}>
                            Enter your new password below
                        </Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={textInputStyles.textInput}
                                placeholderTextColor={Colors.gray900}
                                placeholder="Password..."
                                autoCapitalize="none"
                                secureTextEntry={true}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TextInput
                                style={textInputStyles.textInput}
                                placeholderTextColor={Colors.gray900}
                                placeholder="Confirm Password..."
                                autoCapitalize="none"
                                secureTextEntry={true}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={buttonStyles.button}
                                onPress={onResetPassword}
                            >
                                <Text style={buttonStyles.buttonText}>
                                    Reset Password
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

export default ForgotPasswordPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
    },

    title: {
        fontSize: 50,
        marginTop: 50,
        marginBottom: 20,
        textAlign: "center",
        color: Colors.white,
        fontFamily: "HoltwoodOneSC",
    },

    subTitle: {
        textAlign: "center",
        fontSize: 18,
        marginBottom: 20,
        marginHorizontal: 10,
        color: Colors.white,
    },

    inputContainer: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 20,
    },

    inputBox: {
        fontSize: 16,
        borderColor: Colors.gray700,
        backgroundColor: Colors.gray100,
        borderWidth: 1,
        padding: 10,
        marginVertical: 5,
        width: "70%",
    },

    buttonContainer: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
});
