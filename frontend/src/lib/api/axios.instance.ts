import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

if (typeof window !== "undefined" && API_URL.startsWith("http")) {
  console.warn(
    "[Auth Safeguard] NEXT_PUBLIC_API_URL is an absolute URL. This will bypass the proxy and break cookie-based middleware authentication. Ensure it is relative (e.g., '/api/v1') in production."
  );
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANT: Allows cookies to be sent and received
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Avoid infinite loops if the refresh endpoint itself fails
    if (error.response?.status === 401 && !original._retry && original.url !== '/auth/refresh') {
      original._retry = true;

      try {
        // Attempt to refresh tokens via HttpOnly cookies
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        // Retry the original request
        return api(original);
      } catch {
        // Refresh failed, user needs to re-login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
