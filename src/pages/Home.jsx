import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/mentalistClient";
import { getLevel } from "@/lib/levels";
import { startOfWeek } from "date-fns";
import { Timer, Library, Bot, Users, ArrowRight, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initials = (name) => (name || "?").trim().slice(0, 2).toUpperCase();

const SHORTCUTS = [
  { to: "/foco", label: "Cronômetros", desc: "7 modos de foco", icon: Timer },
  {
    to: "/tecnicas",
    label: "Biblioteca de Técnicas",
    desc: "18 métodos de memorização",
    icon: Library,
  },
  {
    to: "/prompts",
    label: "Central de Prompts de IA",
    desc: "15 prompts avançados",
    icon: Bot,
  },
  {
    to: "/salas",
    label: "Salas Compartilhadas",
    desc: "Estude em grupo",
    icon: Users,
  },
];

export default function Home() {
  const { data: profile } = useQuery({
    queryKey: ["home-profile"],
    queryFn: async () => {
      const meRes = await api.get("users/me/");
      const me = meRes.data;

      const sessionsRes = await api.get("entities/StudySession/");
      const allSessions = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : sessionsRes.data.results || [];

      const sessions = allSessions.filter(
        (s) =>
          (String(s.created_by) === String(me.id) ||
            String(s.created_by_id) === String(me.id) ||
            String(s.user) === String(me.id)) &&
          s.status === "completed",
      );

      return { me, sessions };
    },
  });

  const { data: techniques = [] } = useQuery({
    queryKey: ["techniques"],
    queryFn: async () => {
      const res = await api.get("entities/Technique/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const { data: focusing = [] } = useQuery({
    queryKey: ["home-focusing"],
    queryFn: async () => {
      const res = await api.get("entities/RoomParticipant/");
      const all = Array.isArray(res.data) ? res.data : res.data.results || [];
      return all.filter((p) => p.is_focusing);
    },
    refetchInterval: 15000,
  });

  const me = profile?.me;
  const total = me?.total_focus_minutes || 0;
  const lvl = getLevel(total);

  const weekMin = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    return (profile?.sessions || [])
      .filter((s) => {
        const sessionDate = new Date(s.created_at || s.created_date);
        return sessionDate >= ws;
      })
      .reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);
  }, [profile]);

  const recommended = useMemo(() => {
    if (!techniques.length) return null;
    const day = Math.floor(Date.now() / 86400000);
    return techniques[day % techniques.length];
  }, [techniques]);

  const firstName = (
    me?.full_name ||
    me?.username ||
    me?.email ||
    "Estudante"
  ).split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      {/* Topo */}
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Início
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight">
          Olá, {firstName}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Nível {lvl.level} · {lvl.name} <span className="text-dim">·</span>{" "}
          {(weekMin / 60).toFixed(1)}h estudadas esta semana
        </p>
      </div>

      {/* Bloco principal */}
      <Link
        to="/foco"
        className="group mb-8 flex items-center justify-between rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald">
            Pronto para focar?
          </p>
          <p className="mt-1.5 text-lg font-medium tracking-tight">
            Iniciar Sessão de Foco
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Escolha um modo e comece agora
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors group-hover:border-foreground/30">
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>

      {/* Grid de atalhos */}
      <div className="grid grid-cols-2 gap-3">
        {SHORTCUTS.map(({ to, label, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="mt-3 text-[13px] font-medium leading-tight">
              {label}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {/* Técnica recomendada */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Técnica do dia
          </p>
          {recommended ? (
            <Link to="/tecnicas" className="mt-2.5 block">
              <p className="text-[14px] font-medium">{recommended.title}</p>
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                {recommended.what_it_is}
              </p>
              <p className="mt-2 text-[11px] text-foreground/70 group-hover:text-foreground">
                Ver na biblioteca →
              </p>
            </Link>
          ) : (
            <p className="mt-2.5 text-[12px] text-muted-foreground">
              Carregando...
            </p>
          )}
        </div>

        {/* Amigos ativos */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald" /> Estudando
            agora
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {focusing.length === 0 && (
              <p className="text-[12px] text-muted-foreground">
                Ninguém em foco no momento.
              </p>
            )}
            {focusing.slice(0, 8).map((p) => {
              const name = p.user_name || p.username || "—";
              return (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Avatar className="h-9 w-9 rounded-full border border-border">
                      <AvatarFallback className="rounded-full bg-secondary text-[10px] text-muted-foreground">
                        {initials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-card bg-emerald" />
                  </div>
                  <p className="max-w-[64px] truncate text-[10px] text-muted-foreground">
                    {name.split(" ")[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
