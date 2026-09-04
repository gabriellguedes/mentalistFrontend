import React, { useState } from "react";
import api from "@/api/mentalistClient";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  AtSign,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import { GoogleLogin } from "@react-oauth/google";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, loginWithToken } = useAuth();
  const navigate = useNavigate();

  // Critérios de validação da senha
  const passwordRequirements = [
    { id: 1, label: "Pelo menos 8 caracteres", test: (p) => p.length >= 8 },
    { id: 2, label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
    { id: 3, label: "Um número", test: (p) => /[0-9]/.test(p) },
    {
      id: 4,
      label: "Um caractere especial (@, #, $, etc.)",
      test: (p) => /[^A-Za-z0-9]/.test(p),
    },
  ];

  // Checa se todos os critérios foram atendidos
  const isPasswordValid = passwordRequirements.every((req) =>
    req.test(password),
  );

  const gerarUsername = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

  const handleFullNameChange = (e) => {
    const value = e.target.value;
    setFullName(value);
    setUsername(gerarUsername(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("A senha não atende a todos os requisitos de segurança.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await register(fullName, username, email, password);
      navigate(safeReturnTo() || "/");
    } catch (err) {
      setError(err.message || "Falha ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await api.post("auth/google/", {
        token: credentialResponse.credential,
      });

      await loginWithToken(res.data.token, res.data.refresh);
      navigate(safeReturnTo() || "/");
    } catch (err) {
      setError("Falha na autenticação via Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crie sua conta"
      subtitle="Cadastre-se para começar"
      footer={
        <>
          Já tem uma conta?{" "}
          <Link
            to={
              "/login" +
              (safeReturnTo() !== "/"
                ? "?returnTo=" + encodeURIComponent(safeReturnTo())
                : "")
            }
            className="text-primary font-medium hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <div className="h-12 w-full rounded-md text-[14px] font-medium text-background">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Erro ao conectar ao Google")}
          useOneTap
          width="100%"
          text="continue_with"
          theme="white"
        />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome Completo</Label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="fullName"
              type="text"
              autoFocus
              placeholder="Seu Nome"
              value={fullName}
              onChange={handleFullNameChange}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2" style={{ display: "none" }}>
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <AtSign
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="username"
              type="text"
              placeholder="username"
              value={username}
              className="pl-10 h-12 bg-muted/50 cursor-not-allowed"
              readOnly
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Feedback Visual dos Requisitos de Senha */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-card/50 p-3 text-xs">
              <p className="font-medium text-muted-foreground mb-1">
                Requisitos da senha:
              </p>
              {passwordRequirements.map((req) => {
                const met = req.test(password);
                return (
                  <div
                    key={req.id}
                    className={`flex items-center gap-2 transition-colors duration-200 ${
                      met ? "text-emerald font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {met ? (
                      <Check className="h-3.5 w-3.5 text-emerald" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                    <span>{req.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar Senha</Label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-medium"
          disabled={loading || !isPasswordValid}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
