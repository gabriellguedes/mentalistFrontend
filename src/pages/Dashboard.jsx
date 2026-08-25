import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/mentalistClient";
import PageHeader from "@/components/PageHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, subDays, isSameDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLevel } from "@/lib/levels";

const Stat = ({ label, value, hint }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 font-mono-timer text-xl font-light tabular-nums">
      {value}
    </p>
    {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

export default function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const meRes = await api.get("/users/me/");
      const me = meRes.data;

      const sessionsRes = await api.get("/entities/StudySession/");
      const rawSessions = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : sessionsRes.data.results || [];

      // Filtra sessões pertencentes ao usuário logado
      const sessions = rawSessions.filter(
        (s) => s.created_by_id === me.id || s.created_by === me.id,
      );

      return { me, sessions };
    },
  });

  const sessions = data?.sessions || [];
  const daily = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const minutes = sessions
        .filter(
          (s) =>
            s.status === "completed" &&
            isSameDay(new Date(s.created_date || s.created_at), day),
        )
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      return {
        day: format(day, "dd/MM", { locale: ptBR }),
        minutos: Math.round(minutes),
      };
    });
  }, [sessions]);

  const completed = sessions.filter((s) => s.status === "completed");
  const interrupted = sessions.filter((s) => s.status === "interrupted");
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekMin = completed
    .filter((s) => new Date(s.created_date || s.created_at) >= weekStart)
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const total = data?.me?.total_focus_minutes || 0;
  const lvl = getLevel(total);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <PageHeader
        eyebrow="Dados"
        title="Estatísticas"
        subtitle="Métricas de foco, consistência e evolução."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Foco total"
          value={`${(total / 60).toFixed(1)}h`}
          hint={`Nível ${lvl.level} · ${lvl.name}`}
        />
        <Stat
          label="Esta semana"
          value={`${Math.round(weekMin)}m`}
          hint="Minutos líquidos"
        />
        <Stat
          label="Concluídas"
          value={completed.length}
          hint={`${interrupted.length} interrompidas`}
        />
        <Stat
          label="Média/sessão"
          value={`${completed.length ? Math.round(completed.reduce((s, x) => s + x.duration_minutes, 0) / completed.length) : 0}m`}
        />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <p className="mb-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Minutos de foco · últimos 14 dias
        </p>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid stroke="hsl(240 6% 14%)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="hsl(240 4% 45%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(240 4% 45%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(240 6% 14%)" }}
                contentStyle={{
                  background: "hsl(240 6% 10%)",
                  border: "1px solid hsl(240 6% 16%)",
                  borderRadius: 6,
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="minutos"
                fill="hsl(160 84% 39%)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Histórico de sessões
        </p>
        <div>
          {sessions.slice(0, 15).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between border-b border-border/50 py-2.5 text-[12.5px] last:border-0"
            >
              <div>
                <p className="text-foreground/90">{s.timer_type}</p>
                <p className="font-mono-timer text-[10.5px] text-muted-foreground">
                  {format(
                    new Date(s.created_date || s.created_at),
                    "dd/MM HH:mm",
                  )}
                  {s.technique_used ? ` · ${s.technique_used}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono-timer tabular-nums">
                  {Math.round(s.duration_minutes)}m
                </p>
                <p
                  className={`text-[10.5px] ${s.status === "completed" ? "text-emerald" : "text-destructive"}`}
                >
                  {s.status === "completed" ? "concluída" : "interrompida"}
                </p>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="py-3 text-[13px] text-muted-foreground">
              Nenhuma sessão registrada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
