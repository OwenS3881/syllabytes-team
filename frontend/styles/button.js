import { StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

const buttonStyles = StyleSheet.create({
    button: {
        marginVertical: 10,
        backgroundColor: Colors.buttonBlue,
        padding: 20,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.white,
    },

    buttonText: {
        color: Colors.white,
        fontSize: 32,
        fontWeight: "bold",
    },
});

export default buttonStyles;
