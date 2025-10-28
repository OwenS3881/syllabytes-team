import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";

export default function Home() {
    return (
        <View style={styles.homepage}>
            <Text>Home</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    homepage: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.backgroundBlue,
        color: Colors.backgroundBlue,
    },
});
