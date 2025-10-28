import { StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

const textInputStyles = StyleSheet.create({
    textInput: {
        fontSize: 24,
        color: Colors.black,

        backgroundColor: Colors.lightBlue,

        borderColor: Colors.white,
        borderWidth: 1,
        borderRadius: 10,

        padding: 10,
        marginVertical: 15,
        width: "70%",
    },
});

export default textInputStyles;
