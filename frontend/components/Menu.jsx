import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";
import { useRouter, usePathname } from "expo-router";

// Icon imports
import home from "@/assets/images/home.png";
import syllabus from "@/assets/images/syllabus.png";
import calendar from "@/assets/images/calendar.png";
import timer from "@/assets/images/timer.png";
import setting from "@/assets/images/settings.png";

export default function Menu({ state, navigation }) {
    const router = useRouter();
    const pathname = usePathname(); // <-- current path

    const menuItems = [
        { label: "Home", icon: home, route: "home" },
        { label: "Syllabus", icon: syllabus, route: "syllabus" },
        { label: "Calendar", icon: calendar, route: "calendar" },
        { label: "Timer", icon: timer, route: "timer" },
        { label: "Settings", icon: setting, route: "setting" },
    ];

    return (
        <View style={styles.bottomRectangle}>
            {menuItems.map((item, index) => {
                return (
                    <TouchableOpacity
                        key={item.label}
                        style={styles.menuItem}
                        onPress={() => {
                            if (!state.index !== index) {
                                navigation.navigate(item.route);
                            }
                        }}
                    >
                        <Image source={item.icon} style={styles.icon} />
                        <Text style={styles.label}>{item.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bottomRectangle: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 85,
        backgroundColor: Colors.menuBlue,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    menuItem: {
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        width: 24,
        height: 30,
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: "white", 
    },
});
