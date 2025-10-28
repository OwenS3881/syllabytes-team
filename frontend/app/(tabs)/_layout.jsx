import React from "react";
import { Tabs } from "expo-router";
import Menu from "@/components/Menu";

/**
 * Sets up navigation and Auth for all pages
 */
export default function TabLayout() {
    return (
            <Tabs
                screenOptions={{
                    headerShown: false,
                }}
                tabBar={(props) => <Menu {...props} />} // Spread props to ensure proper tab behavior
                preserveNavigationState
            >
                <Tabs.Screen name="home" />
                <Tabs.Screen name="syllabus" />
                <Tabs.Screen name="calendar" />
                <Tabs.Screen name="timer" />
                <Tabs.Screen name="settings" />
            </Tabs>
    );
}
