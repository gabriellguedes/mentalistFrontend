import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initials = (name) => (name || "?").trim().slice(0, 2).toUpperCase();

export default function ParticipantList({ participants = [] }) {
  // Tratamento de segurança para garantir que participants seja um array
  const safeParticipants = Array.isArray(participants) ? participants : [];

  // Mapeamento tolerante aos nomes de campos vindos da API
  const normalizedParticipants = safeParticipants.map((p) => {
    const name = p.full_name || p.user_name || "Estudante";
    const minutes =
      p.week_minutes ?? p.total_focus_minutes ?? p.focus_minutes ?? 0;
    const isFocusing = p.is_focusing ?? p.is_active ?? false;
    const statusText = p.status_text || p.status || "";

    return {
      ...p,
      id: p.id || Math.random().toString(),
      display_name: name,
      minutes: Number(minutes),
      is_focusing: Boolean(isFocusing),
      status_text: statusText,
    };
  });

  // Ordenação para o ranking semanal
  const ranked = [...normalizedParticipants].sort(
    (a, b) => b.minutes - a.minutes,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Presença · {normalizedParticipants.length}
        </p>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {normalizedParticipants.map((p) => {
            const lost = p.status_text === "Perdeu o foco";
            return (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <Avatar className="h-11 w-11 rounded-full border border-border">
                    <AvatarFallback className="rounded-full bg-secondary text-[11px] text-muted-foreground">
                      {initials(p.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-card ${
                      p.is_focusing
                        ? "bg-emerald"
                        : lost
                          ? "bg-amber-500"
                          : "bg-zinc-600"
                    }`}
                  />
                </div>
                <p className="max-w-full truncate text-[10.5px] text-muted-foreground">
                  {p.display_name}
                </p>
                {lost && (
                  <p className="text-[9px] text-amber-500/80">foco perdido</p>
                )}
              </div>
            );
          })}
          {normalizedParticipants.length === 0 && (
            <p className="col-span-full text-[12px] text-muted-foreground">
              Ninguém na sala ainda.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Ranking semanal
        </p>
        <table className="w-full font-mono-timer text-[12px]">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 pr-2 font-normal">#</th>
              <th className="pb-2 pr-2 font-normal">Nome</th>
              <th className="pb-2 text-right font-normal">Tempo</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p, i) => (
              <tr
                key={p.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                <td className="py-2 pr-2 font-sans text-foreground/90">
                  {p.display_name}
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  {Math.round(p.week_minutes)}m
                </td>
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-3 font-sans text-[12px] text-muted-foreground"
                >
                  Sem dados nesta semana.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
