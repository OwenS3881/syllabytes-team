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
import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import { CustomAlert } from "@/utils/CustomAlert";
import buttonStyles from "@/styles/button";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();

    //access the login function from Auth
    const { login } = useAuth();
    const { showLoading, hideLoading } = useLoading();

    const onSubmit = async () => {
        //input validation
        if (!email.trim()) {
            CustomAlert.alert("Error", "Email is required");
            return;
        }

        if (!password.trim()) {
            CustomAlert.alert("Error", "Password is required");
            return;
        }

        showLoading();
        try {
            await login(email, password);
        } catch (err) {
            console.log(err);
            CustomAlert.alert("Error", "Login failed, please try again");
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
                <Text style={styles.title}>Login</Text>
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
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={buttonStyles.button}
                        onPress={onSubmit}
                    >
                        <Text style={buttonStyles.buttonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={buttonStyles.button}
                        onPress={() => router.push("/signup")}
                    >
                        <Text style={buttonStyles.buttonText}>Sign Up</Text>
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

export default LoginPage;
