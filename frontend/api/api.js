import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import sessionEvents from "@/utils/SessionEventBus";

//local ip needs to be update with computers ip in order to work on expo go app
//if not testing on expo go, set it to null or empty
const LOCAL_IP = "10.136.83.10";
const DEV_URL =
    LOCAL_IP && LOCAL_IP !== ""
        ? `http://${LOCAL_IP}:3000/api`
        : "http://localhost:3000/api";
const PROD_URL = "https://universityoffreestuff.onrender.com/api";

const BACKEND_URL = __DEV__ ? DEV_URL : PROD_URL;
const STORAGE_KEY = "tokens";

//initliaze the API
const API = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: Platform.OS === "web",
    headers: {
        ...(Platform.OS === "web" && { "X-Client-Platform": "web" }),
    },
});

//Store auth tokens in a secure storage
let inMemoryAccessToken = null;

const storeTokens = async (accessToken, refreshToken) => {
    const tokenData = JSON.stringify({ accessToken, refreshToken });

    if (Platform.OS === "web") {
        inMemoryAccessToken = accessToken;
    } else {
        await SecureStore.setItemAsync(STORAGE_KEY, tokenData);
    }
};

//Retrieve tokens from storage
const getTokens = async () => {
    let tokenData;

    if (Platform.OS === "web") {
        return inMemoryAccessToken
            ? { accessToken: inMemoryAccessToken }
            : null;
    } else {
        tokenData = await SecureStore.getItemAsync(STORAGE_KEY);
    }
    return tokenData ? JSON.parse(tokenData) : null;
};

//clear tokens
const clearTokens = async () => {
    if (Platform.OS === "web") {
        inMemoryAccessToken = null;
    } else {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
};

//Attach tokens to all sent requests automatically
API.interceptors.request.use(async (config) => {
    const tokens = await getTokens();

    //attach token
    if (tokens?.accessToken) {
        config.headers.authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
});

//Auto refresh access token if it was expired
//Occurs if request returns a 401 error
API.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        console.log("Error when sending request:", error);
        // Don't refresh if it's login or refresh token request
        if (
            originalRequest.url.includes("/login") ||
            originalRequest.url.includes("/refresh")
        ) {
            return Promise.reject(error);
        }
        //401 error that hasn't been retired
        if (error.response?.status == 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                console.log("Got new tokens");
                const newTokens = await getTokens();
                originalRequest.headers.authorization = `Bearer ${newTokens.accessToken}`;
                return API(originalRequest);
            } else {
                console.log("Did not get new tokens");
                await clearTokens();
                sessionEvents.emit("sessionExpired");
                return Promise.reject("Session expired. Please log in again.");
            }
        }
        console.log("Didn't try again");
        return Promise.reject(error);
    }
);

//refresh the tokens
const tryRefreshToken = async () => {
    if (Platform.OS === "web") {
        try {
            const res = await API.post(
                "/auth/refresh",
                {},
                {
                    withCredentials: true,
                    headers: {
                        "X-Client-Platform": "web",
                    },
                }
            );
            const newAccessToken = res.data.accessToken;
            await storeTokens(newAccessToken, null);
            return true;
        } catch (err) {
            console.log("Web refresh failed:", err);
            return false;
        }
    } else {
        const tokens = await getTokens();
        if (!tokens?.refreshToken) return false;

        try {
            const res = await API.post("/auth/refresh", {
                refreshToken: tokens.refreshToken,
            });

            const newAccessToken = res.data.accessToken;
            const newRefreshToken = res.data.refreshToken;
            await storeTokens(newAccessToken, newRefreshToken);

            return true;
        } catch (err) {
            console.log("Mobile refresh failed:", err);
            return false;
        }
    }
};

//Auth functions
const login = async (email, password) => {
    try {
        const res = await API.post("/auth/login", { email, password });
        const { accessToken, refreshToken, user } = res.data;
        await storeTokens(accessToken, refreshToken || null);
        return user;
    } catch (err) {
        if (err.response && err.response.status === 401) {
            throw new Error("Invalid email or password");
        }
        if (err.response?.status == 403) {
            throw new Error(err.response?.data?.message);
        }

        throw new Error("Login failed. Please try again later.");
    }
};

const logout = async () => {
    const tokens = await getTokens();

    if (Platform.OS === "web") {
        await API.post(
            "/auth/logout",
            {},
            {
                headers: { "X-Client-Platform": "web" },
                withCredentials: true,
            }
        );
    } else if (tokens?.refreshToken) {
        await API.post("/auth/logout", {
            refreshToken: tokens.refreshToken,
        });
    }

    await clearTokens();
};

export { login, logout, getTokens, BACKEND_URL };

export default API;
