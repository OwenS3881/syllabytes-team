import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import AuthGuard from "@/components/AuthGuard";

import React from "react";

//defines how tabs are set up
//For list of valid IonIcons: https://ionic.io/ionicons
const TabLayout = () => {
    const iconScaleFactor = 1.5;

    return (
        <AuthGuard>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: Colors.blue500,
                    tabBarInactiveTintColor: Colors.gray900,
                    tabBarStyle: {
                        paddingTop: 10,
                        height: 100,
                        borderTopWidth: 1,
                        borderTopColor: Colors.gray200,
                    },
                    tabBarIconStyle: {
                        height: 50,
                        width: 50,
                    },
                    tabBarShowLabel: false,
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ color, size, focused }) => (
                            <Ionicons
                                name={"home"}
                                size={size * iconScaleFactor}
                                color={color}
                            />
                        ),
                    }}
                />
            </Tabs>
        </AuthGuard>
    );
};

export default TabLayout;
