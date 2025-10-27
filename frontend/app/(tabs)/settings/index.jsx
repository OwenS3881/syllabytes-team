import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
    const { logout } = useAuth();

    return (
        <View style={styles.mockpage}>
            <Text>Settings</Text>
            <TouchableOpacity onPress={logout}>
                <Text style={{ color: Colors.white }}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    mockpage: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.backgroundBlue,
        color: Colors.backgroundBlue,
    },
});
