import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import TimerRing from "@/components/timer/TimerRing";
import TimerControls from "@/components/timer/TimerControls";
import ModeSelector from "@/components/timer/ModeSelector";
import useStudyTimer from "@/hooks/useStudyTimer";
import { Input } from "@/components/ui/input";

export default function Timers() {
  const [technique, setTechnique] = useState("");
  const t = useStudyTimer({ technique });
  const label =
    t.mode.kind === "stopwatch"
      ? "Decorrido"
      : t.phase === "focus"
        ? "Foco"
        : "Descanso";

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <PageHeader
        eyebrow="Foco"
        title="Cronômetros"
        subtitle="Cada bloco de foco concluído é registrado automaticamente e alimenta seu nível."
      />

      <div className="mb-6">
        <ModeSelector modeId={t.modeId} onChange={t.changeMode} />
      </div>

      <div className="flex flex-col items-center gap-8 py-6">
        <TimerRing
          seconds={t.seconds}
          progress={t.progress}
          phase={t.phase}
          label={label}
        />
        <TimerControls
          running={t.running}
          isStopwatch={t.mode.kind === "stopwatch"}
          onStart={t.start}
          onPause={t.pause}
          onStop={t.stopAndLog}
          onReset={t.reset}
        />
        <p className="text-[11px] text-muted-foreground">
          Ciclos concluídos: {t.cycles}
        </p>
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Técnica desta sessão
        </label>
        <Input
          value={technique}
          onChange={(e) => setTechnique(e.target.value)}
          placeholder="Ex: Palácio da Memória, Método Feynman..."
          className="mt-2 h-9 rounded-md border-border bg-card text-[13px]"
        />
        {t.mode.custom && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground">
                Min. de foco
              </label>
              <Input
                type="number"
                min="1"
                value={t.custom.focus}
                onChange={(e) =>
                  t.setCustom({
                    ...t.custom,
                    focus: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="mt-1 h-9 rounded-md border-border bg-card text-[13px]"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">
                Min. de descanso
              </label>
              <Input
                type="number"
                min="0"
                value={t.custom.break}
                onChange={(e) =>
                  t.setCustom({
                    ...t.custom,
                    break: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="mt-1 h-9 rounded-md border-border bg-card text-[13px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
