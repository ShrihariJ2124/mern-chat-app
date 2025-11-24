import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",  // IMPORTANT!
});

// Add auth token if available
apiClient.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem("chatUser");
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch {}
  }
  return config;
});

export const getSocketUrl = () => "http://localhost:5000";
