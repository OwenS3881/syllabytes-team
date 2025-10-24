import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
} from "react-native";
import React, { useState } from "react";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useLoading } from "@/context/LoadingContext";
import { CustomAlert } from "@/utils/CustomAlert";
import API from "@/api/api";
import buttonStyles from "@/styles/button";

const SignUpPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    //email code input fields

    const router = useRouter();
    const { showLoading, hideLoading } = useLoading();

    //email validation
    const isValidEmail = (testEmail) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail);

    const onSignUp = async () => {
        //input validation
        if (!email.trim()) {
            CustomAlert.alert("Error", "Email is required");
            return;
        }

        if (!isValidEmail(email)) {
            CustomAlert.alert("Error", "Email is not valid");
            return;
        }

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
            const res = await API.post("/auth/signup", {
                email,
                password,
            });
            CustomAlert.alert(
                "Success!",
                "Your account has been created! Go login!",
                [
                    {
                        text: "OK",
                        style: "positive",
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (err) {
            console.log("Sign Up failed", err);
            CustomAlert.alert("Error", "Sign up failed, please try again");
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
                <Text style={styles.title}>Sign Up</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="Email..."
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.inputBox}
                        placeholder="Password..."
                        autoCapitalize="none"
                        secureTextEntry={true}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TextInput
                        style={styles.inputBox}
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
                        onPress={onSignUp}
                    >
                        <Text style={buttonStyles.buttonText}>
                            Create Account
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: "row", marginTop: 10 }}>
                    <Text style={{ fontSize: 16 }}>
                        Already have an account?{" "}
                    </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text
                            style={{
                                color: Colors.blue500,
                                textDecorationLine: "underline",
                                fontSize: 16,
                            }}
                        >
                            Log in here!
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
    },

    title: {
        fontSize: 40,
        marginTop: 100,
        marginBottom: 50,
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

export default SignUpPage;
