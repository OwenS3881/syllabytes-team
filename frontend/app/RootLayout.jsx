import { Stack, Slot, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { useEffect } from "react";
import { useAlert } from "@/context/CustomAlertContext";
import { CustomAlert } from "@/utils/CustomAlert";
import { useFonts } from "expo-font";
import { Text } from "react-native";

/**
 * Sets up navigation and Auth for all pages
 */
const RootLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const { alert } = useAlert();

    const [fontsLoaded] = useFonts({
        Gruppo: require("@/assets/fonts/Gruppo-Regular.ttf"),
        HoltwoodOneSC: require("@/assets/fonts/HoltwoodOneSC-Regular.ttf"),
    });

    useEffect(() => {
        CustomAlert.setAlertFunction(alert);
    }, [alert]);

    useEffect(() => {
        if (loading) {
            return;
        }
        if (isAuthenticated) {
            router.replace("/home");
        } else {
            router.replace("/login");
        }
    }, [isAuthenticated, loading]);

    if (!isAuthenticated) {
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
                <Stack.Screen name="login" options={{ headerTitle: "Login" }} />
                <Stack.Screen
                    name="signup"
                    options={{ headerTitle: "Sign Up" }}
                />
                <Stack.Screen name="(tabs)" options={{ title: "Loading..." }} />
            </Stack>
        );
    }

    return <Slot />;
};

export default RootLayout;
