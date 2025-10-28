import { useCallback, useContext, useEffect } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator, View } from "react-native";

/**
 * Wrap this component around any page that needs to be protected
 * and only accessible to logged in users
 */

const AuthGuard = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            if (!loading && !isAuthenticated) {
                router.replace("/login");
            }
        }, [loading, isAuthenticated])
    );

    if (loading || !isAuthenticated) {
        return (
            <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <>{children}</>;
};

export default AuthGuard;
