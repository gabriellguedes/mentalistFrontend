import axios from "axios";

// Instância base do Axios apontando para o Django
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para injetar o Token JWT em cada requisição
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Garante que URLs terminem com '/' para compatibilidade com Django REST Framework
    if (config.url && !config.url.endsWith("/") && !config.url.includes("?")) {
      config.url += "/";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
