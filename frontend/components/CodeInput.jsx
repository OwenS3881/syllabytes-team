import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
} from "react-native";
import React, { useRef } from "react";
import Colors from "@/constants/Colors";

//Used for entering 6 digit codes from email verifcation
const CodeInput = ({ code, setCode }) => {
    const codeInputRef = useRef(null);

    const handleCodeChange = (text) => {
        const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
        setCode(cleaned);
    };

    const focusCodeInput = () => {
        codeInputRef.current?.focus();
    };

    return (
        <TouchableOpacity activeOpacity={1} onPress={focusCodeInput}>
            <View style={styles.emailCodeContainer}>
                <TextInput
                    ref={codeInputRef}
                    value={code}
                    onChangeText={handleCodeChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    style={styles.hiddenInput}
                />
                {Array.from({ length: 6 }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.codeDigitBox,
                            index === code.length && code.length !== 6
                                ? styles.activeBox
                                : null,
                        ]}
                    >
                        <Text style={styles.digit}>{code[index] || ""}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    emailCodeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginTop: 20,
    },
    hiddenInput: {
        position: "absolute",
        opacity: 0,
        width: 1,
        height: 1,
        fontSize: 16,
    },
    codeDigitBox: {
        width: 50,
        height: 60,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.gray400,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.white,
    },
    activeBox: {
        borderColor: Colors.blue500,
    },
    digit: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.darkGray600,
    },
});

export default CodeInput;
