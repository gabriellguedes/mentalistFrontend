import React, { createContext, useState, useContext, useEffect } from "react";
import api from "@/api/mentalistClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();
  }, []);

  // Verifica se o usuário tem token válido no localStorage
  const checkUserAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      return;
    }

    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Garante a rota completa para a API do Django
      const response = await api.get("users/me/");
      const userData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("User auth check failed:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({
          type: "auth_required",
          message: "Sessão expirada. Faça login novamente.",
        });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  // Função de Login
  const login = async (email, password) => {
    try {
      setAuthError(null);

      // Envia tanto 'username' quanto 'email' para garantir compatibilidade com o SimpleJWT
      const response = await api.post("auth/login/", {
        username: email,
        email: email,
        password: password,
      });

      const token = response.data.access || response.data.token;
      const userData = response.data.user || null;

      localStorage.setItem("token", token);

      // Se a resposta de login não trouxer os dados completos do usuário, busca via /users/me/
      if (userData) {
        setUser(userData);
      } else {
        await checkUserAuth();
      }

      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        "Erro ao realizar login. Verifique suas credenciais.";
      setAuthError({
        type: "invalid_credentials",
        message: errorMsg,
      });
      throw new Error(errorMsg);
    }
  };

  // Função de Logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Função de Registro
  const register = async (fullName, email, password) => {
    try {
      setAuthError(null);
      const response = await api.post("auth/register/", {
        full_name: fullName,
        email: email,
        password: password,
      });

      const token = response.data.access || response.data.token;
      const userData = response.data.user || null;

      if (token) {
        localStorage.setItem("token", token);
        setIsAuthenticated(true);
      }

      setUser(userData);
      return userData;
    } catch (error) {
      const errorMsg =
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        "Erro ao criar conta. Verifique os dados.";
      setAuthError({
        type: "register_error",
        message: errorMsg,
      });
      throw new Error(errorMsg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        authChecked,
        login,
        register,
        logout,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
