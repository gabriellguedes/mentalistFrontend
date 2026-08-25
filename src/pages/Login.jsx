import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/mentalistClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import BrandLogo from "@/components/BrandLogo";
import { safeReturnTo } from "@/lib/authReturnTo";

function AppleIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 3.02-.78.93-2.06 1.64-3.14 1.55-.13-1.07.42-2.2 1.1-2.95.74-.82 2.04-1.45 3.16-1.62zM20.5 17.2c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.39 3.52-4.12 3.53-1.54.02-1.94-1-4.02-.99-2.08.01-2.51 1.01-4.05.99-1.73-.02-3.05-1.77-4.04-3.33C-.3 16.78-.6 11.2 1.2 8.24 2.47 6.16 4.5 4.95 6.4 4.95c1.93 0 3.14 1.06 4.73 1.06 1.54 0 2.48-1.06 4.71-1.06 1.69 0 3.48.92 4.76 2.51-4.18 2.29-3.5 8.26.9 9.74z" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", returnTo);
  const handleApple = () => base44.auth.loginWithProvider("apple", returnTo);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <BrandLogo size={72} />
        </div>

        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bem-vindo, Mentalista.
          </h1>
          <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-relaxed text-muted-foreground">
            Domine sua retenção. Alcance o hiperfoco diário com neurociência e
            IA.
          </p>
        </div>

        {/* Google */}
        <Button
          type="button"
          onClick={handleGoogle}
          className="h-12 w-full rounded-md bg-foreground text-[14px] font-medium text-background hover:bg-foreground/90"
        >
          <GoogleIcon className="mr-2 h-5 w-5" />
          Continuar com o Google
        </Button>

        {/* Apple */}
        <Button
          type="button"
          variant="outline"
          onClick={handleApple}
          className="mt-3 h-12 w-full rounded-md border-border bg-card text-[14px] font-medium text-foreground hover:bg-secondary"
        >
          <AppleIcon className="mr-2 h-4 w-4" />
          Continuar com Apple
        </Button>

        {/* Divisória */}
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
                htmlFor="password"
                className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                Senha
              </Label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Esqueci a senha
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-md border-border bg-card pl-10 text-[14px]"
                required
              />
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

        {/* Convidado / Demo */}
        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-[12px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Entrar como convidado (Modo Demo)
          </Link>
        </div>

        {/* Criar conta */}
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
