import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

const SettingsLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.menuBlue,
                },
                headerTintColor: Colors.white,
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                    fontFamily: "HoltwoodOneSC",
                },
                contentStyle: {
                    paddingHorizontal: 10,
                    paddingTop: 10,
                    backgroundColor: Colors.backgroundBlue,
                },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Settings" }} />
        </Stack>
    );
};

export default SettingsLayout;
