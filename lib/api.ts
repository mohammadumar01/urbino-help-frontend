import axios, { AxiosError } from "axios";
import { clearSession, getToken } from "./auth";

/** Backend ka URL .env.local ke NEXT_PUBLIC_API_URL se aata hai. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5500";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const path = window.location.pathname;
      const onAuthPage = path === "/login" || path === "/register" || path.startsWith("/admin/login");
      // Login request ka 401 matlab galat password hai, session expire nahi
      const isLoginCall = error.config?.url?.includes("/api/auth/login");
      if (!onAuthPage && !isLoginCall) {
        clearSession();
        window.location.assign(`/login?next=${encodeURIComponent(path + window.location.search)}`);
      }
    }
    return Promise.reject(error);
  }
);

/** Backend ka error message nikaalo, warna fallback. */
export function apiError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = error as AxiosError<{ message?: string }>;
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
  if (e?.request && !e?.response) return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

export default api;
