import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initials = (name) => (name || "?").trim().slice(0, 2).toUpperCase();

export default function ParticipantList({ participants }) {
  const ranked = [...participants].sort(
    (a, b) => (b.week_minutes || 0) - (a.week_minutes || 0),
  );
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Presença · {participants.length}
        </p>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {participants.map((p) => {
            const lost = p.status_text === "Perdeu o foco";
            return (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <Avatar className="h-11 w-11 rounded-full border border-border">
                    <AvatarFallback className="rounded-full bg-secondary text-[11px] text-muted-foreground">
                      {initials(p.user_name)}
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
                  {p.user_name || "—"}
                </p>
                {lost && (
                  <p className="text-[9px] text-amber-500/80">foco perdido</p>
                )}
              </div>
            );
          })}
          {participants.length === 0 && (
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
                  {p.user_name || "Estudante"}
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  {Math.round(p.week_minutes || 0)}m
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
