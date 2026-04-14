import axios from "axios";
import { clearAuthStorage } from "../auth/authUtils";

const API = axios.create({
    baseURL: "http://localhost:8000/api/",
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        const hadAuthHeader = Boolean(error.config?.headers?.Authorization);

        // Wrong password on POST /token/ is also 401 — do not hard-redirect or clear tokens then.
        if (!hadAuthHeader) {
            return Promise.reject(error);
        }

        clearAuthStorage();

        const path = `${window.location.pathname}${window.location.search}`;
        if (
            window.location.pathname.startsWith("/login") ||
            window.location.pathname.startsWith("/register")
        ) {
            return Promise.reject(error);
        }

        window.location.assign(`/login?from=${encodeURIComponent(path)}`);
        return Promise.reject(error);
    }
);

export default API;
