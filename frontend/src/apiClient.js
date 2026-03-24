import axios from "axios";
import { getCurrentUser } from "./authUtils";

const normalizeBaseUrl = (url) => {
  if (!url) return "https://mern-chat-app-thwv.onrender.com";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

// Root address of the backend server (e.g. https://your-backend.onrender.com)
const API_URL = normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL);

// REST API base (server exposes routes under /api/*)
export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Attach auth token automatically when available
apiClient.interceptors.request.use((config) => {
  const user = getCurrentUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Socket URL should point to the server root (no /api prefix)
export const getSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL || API_URL;

