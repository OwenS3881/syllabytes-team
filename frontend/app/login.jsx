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
import textInputStyles from "@/styles/textInput";

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
                <Text style={styles.titleIntro}>
                    It's time to blast off with
                </Text>
                <Text style={styles.title}>Orbit🚀</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={textInputStyles.textInput}
                        placeholderTextColor={Colors.gray900}
                        placeholder="Email..."
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={textInputStyles.textInput}
                        placeholderTextColor={Colors.gray900}
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

                    <TouchableOpacity onPress={() => router.push("/signup")}>
                        <Text style={styles.pageLink}>
                            First time? Sign up here!
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

    titleIntro: {
        fontSize: 64,
        marginTop: 20,
        color: Colors.white,
        fontFamily: "Gruppo",
        textAlign: "center",
    },

    title: {
        fontSize: 72,
        marginBottom: 50,
        color: Colors.white,
        fontFamily: "HoltwoodOneSC",
    },

    inputContainer: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 20,
    },

    buttonContainer: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },

    pageLink: {
        fontSize: 24,
        color: Colors.white,
        textDecorationLine: "underline",
        marginTop: 20,
    },
});

export default LoginPage;
