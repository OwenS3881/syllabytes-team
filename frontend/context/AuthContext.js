import React, { createContext, useEffect, useState, useContext } from "react";
import API, {
    login as apiLogin,
    logout as apiLogout,
    getTokens,
} from "@/api/api";
import sessionEvents from "@/utils/SessionEventBus";

/**
 * Combination of these two provides Auth functions to all components
 * Allows access to the values in value={...} at the bottom
 */

const AuthContext = createContext();

const useAuth = () => {
    return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const tokens = await getTokens();
                if (!tokens) {
                    setIsAuthenticated(false);
                    setUserData(null);
                    setLoading(false);
                    return;
                }

                const res = await API.get("/auth/userdata");
                const { user } = res.data;

                setUserData(user);
                setIsAuthenticated(true);
            } catch (err) {
                console.log("Failed to load user session:", err);
                setIsAuthenticated(false);
                setUserData(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);
    const login = async (username, password) => {
        const user = await apiLogin(username, password);
        setIsAuthenticated(true);
        setUserData(user);
    };

    const logout = async () => {
        await apiLogout();
        setIsAuthenticated(false);
        setUserData(null);
    };

    useEffect(() => {
        const handleSessionExpired = async () => {
            logout();
        };

        sessionEvents.on("sessionExpired", handleSessionExpired);

        return () => {
            sessionEvents.off("sessionExpired", handleSessionExpired);
        };
    }, []);

    const refreshUserData = async () => {
        const res = await API.get("/auth/userdata");
        const { user } = res.data;
        setUserData(user);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                login,
                logout,
                loading,
                userData,
                refreshUserData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export { useAuth, AuthProvider };
