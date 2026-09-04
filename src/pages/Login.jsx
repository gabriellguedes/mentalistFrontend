import React, { useState } from "react";
import api from "@/api/mentalistClient";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { safeReturnTo } from "@/lib/authReturnTo";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const { loginWithToken } = useAuth(); // Importe a nova função
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(returnTo || "/");
    } catch (err) {
      setError(err.message || "E-mail ou senha inválidos");
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
      navigate(returnTo || "/");
    } catch (err) {
      setError("Falha na autenticação via Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <BrandLogo size={72} />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bem-vindo, Mentalista.
          </h1>
          <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-relaxed text-muted-foreground">
            Domine sua retenção. Alcance o hiperfoco diário com neurociência e
            IA.
          </p>
        </div>

        {/* Botão Oficial do Google */}

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
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              ou continue com e-mail
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              E-mail
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-md border-border bg-card pl-10 text-[14px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                htmlFor="password"
              >
                Senha
              </Label>
              <Link
                className="text-[11px] text-muted-foreground hover:text-foreground"
                to="/forgot-password"
              >
                Esqueci a senha
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-md border-border bg-card pl-10 pr-10 text-[14px]"
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
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-md bg-emerald text-[14px] font-medium text-background hover:bg-emerald/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          Não tem conta?{" "}
          <Link
            to={
              "/register" +
              (returnTo !== "/"
                ? "?returnTo=" + encodeURIComponent(returnTo)
                : "")
            }
            className="font-medium text-foreground hover:underline"
          >
            Criar uma
          </Link>
        </p>
      </div>
    </div>
  );
}
