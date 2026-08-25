import axios from "axios";

// Instância base do Axios apontando para o seu Django
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para injetar o Token JWT em cada requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Objeto de compatibilidade temporário (evita que a aplicação quebre)
export const base44 = {
  // Substitua as chamadas do base44 nas suas páginas/componentes por chamadas diretas com 'api'
};

export default api;
