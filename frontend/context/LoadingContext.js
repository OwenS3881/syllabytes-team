import React, { createContext, useContext, useState } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);

    const showLoading = () => setLoading(true);
    const hideLoading = () => setLoading(false);

    return (
        <LoadingContext.Provider value={{ loading, showLoading, hideLoading }}>
            {children}
            {loading && <LoadingOverlay />}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
