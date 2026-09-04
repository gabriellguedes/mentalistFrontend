import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/mentalistClient";
import PageHeader from "@/components/PageHeader";
import { getLevel, LEVELS, BADGES, computeBadges } from "@/lib/levels";

export default function Profile() {
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const meRes = await api.get("users/me/");
      const me = meRes.data;

      const sessionsRes = await api.get("entities/StudySession/");
      const rawSessions = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : sessionsRes.data.results || [];

      const sessions = rawSessions.filter(
        (s) => s.created_by_id === me.id || s.created_by === me.id,
      );

      return { me, sessions };
    },
  });

  const total = data?.me?.total_focus_minutes || 0;
  const lvl = getLevel(total);
  const earned = computeBadges(data?.sessions || [], total);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <PageHeader
        eyebrow=""
        title=""
        subtitle="Seu nível evolui conforme o tempo de foco acumulado."
      />

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Nível {lvl.level}
          </p>
          <p className="font-mono-timer text-[13px] tabular-nums text-muted-foreground">
            {lvl.hours.toFixed(1)}h
          </p>
        </div>
        <h2 className="mt-1 text-2xl font-medium tracking-tight">{lvl.name}</h2>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-emerald"
            style={{ width: `${lvl.progress}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {lvl.next
            ? `Faltam ${Math.round((lvl.minutesToNext / 60) * 10) / 10}h para ${lvl.next.name}`
            : "Nível máximo alcançado"}
        </p>
      </div>

      <h3 className="mb-4 mt-10 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Trilha de níveis
      </h3>
      <div className="relative pl-4">
        <div className="absolute left-[3px] top-1 bottom-1 w-px bg-border" />
        {LEVELS.map((l) => {
          const reached = l.level <= lvl.level;
          const current = l.level === lvl.level;
          return (
            <div key={l.level} className="relative pb-5">
              <span
                className={`absolute -left-[13px] top-1.5 h-1.5 w-1.5 rounded-full ${current ? "bg-emerald" : reached ? "bg-foreground" : "bg-zinc-600"}`}
              />
              <p
                className={`text-[14px] ${current ? "text-foreground" : reached ? "text-foreground/70" : "text-dim"}`}
              >
                {l.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {l.max === Infinity ? "300h+" : `${l.min}–${l.max}h`}
              </p>
            </div>
          );
        })}
      </div>

      <h3 className="mb-4 mt-10 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Conquistas
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {BADGES.map((b) => {
          const has = earned.includes(b.id);
          return (
            <div
              key={b.id}
              className={`rounded-md border p-3 ${has ? "border-border bg-card" : "border-border bg-card opacity-50"}`}
            >
              <p
                className={`text-[12.5px] ${has ? "text-foreground" : "text-dim"}`}
              >
                {b.name}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {b.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
