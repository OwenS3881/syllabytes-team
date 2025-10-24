import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

const HomeLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.blue500,
                },
                headerTintColor: Colors.white,
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                },
                contentStyle: {
                    backgroundColor: Colors.gray100,
                },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Home" }} />
        </Stack>
    );
};

export default HomeLayout;
