import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

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
