import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken");

    if (token) {
      // AJUSTE AQUI: Se o Django responder 401/403 com 'Bearer', mude para 'Token ${token}'
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Trata URLs da API preservando query params e evitando duplicação de barras
    if (config.url) {
      const [path, query] = config.url.split("?");
      const formattedPath = path.endsWith("/") ? path : `${path}/`;
      config.url = query ? `${formattedPath}?${query}` : formattedPath;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
