import { StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

const buttonStyles = StyleSheet.create({
    button: {
        marginVertical: 10,
        backgroundColor: Colors.blue500,
        padding: 10,
        borderRadius: 5,
    },

    buttonText: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: "bold",
    },
});

export default buttonStyles;
