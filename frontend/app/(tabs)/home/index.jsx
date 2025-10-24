import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";

const HomePage = () => {
    const { logout } = useAuth();

    return (
        <View>
            <Text>HomePage</Text>
            <TouchableOpacity onPress={logout}>
                <Text>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

export default HomePage;

const styles = StyleSheet.create({});
