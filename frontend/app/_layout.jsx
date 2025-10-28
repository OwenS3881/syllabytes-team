import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { CustomAlertProvider } from "@/context/CustomAlertContext";
import RootLayout from "./RootLayout";
import { useEffect } from "react";

/**
 * Wraps the RootLayout in AuthProvider
 */
const RootLayoutWrapper = () => {
    useEffect(() => {
        if (typeof document !== "undefined") {
            document.title = "Orbit";
        }
    }, []);

    return (
        <LoadingProvider>
            <CustomAlertProvider>
                <AuthProvider>
                    <RootLayout />
                </AuthProvider>
            </CustomAlertProvider>
        </LoadingProvider>
    );
};

export default RootLayoutWrapper;
