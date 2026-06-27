import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAuthStorage } from "../auth/authUtils";

const API = axios.create({
    baseURL: "http://localhost:8000/api/",
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

function redirectToLogin(): void {
    const path = `${window.location.pathname}${window.location.search}`;
    if (
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register")
    ) {
        return;
    }
    window.location.assign(`/login?from=${encodeURIComponent(path)}`);
}

async function refreshAccessToken(): Promise<string | null> {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return null;

    if (!refreshPromise) {
        refreshPromise = axios
            .post<{ access: string }>("http://localhost:8000/api/token/refresh/", { refresh })
            .then((res) => {
                const access = res.data.access;
                localStorage.setItem("access", access);
                return access;
            })
            .catch(() => null)
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        const config = error.config as RetriableConfig | undefined;
        const hadAuthHeader = Boolean(config?.headers?.Authorization);
        const requestUrl = config?.url ?? "";

        // Wrong password on login, or refresh failed — do not retry in a loop.
        if (
            !hadAuthHeader ||
            !config ||
            config._retry ||
            requestUrl.includes("token/refresh/") ||
            requestUrl.endsWith("token/")
        ) {
            if (hadAuthHeader && !requestUrl.endsWith("token/")) {
                clearAuthStorage();
                redirectToLogin();
            }
            return Promise.reject(error);
        }

        const newAccess = await refreshAccessToken();
        if (!newAccess) {
            clearAuthStorage();
            redirectToLogin();
            return Promise.reject(error);
        }

        config._retry = true;
        config.headers.Authorization = `Bearer ${newAccess}`;
        return API.request(config);
    }
);

export default API;
