import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Square } from "lucide-react";

export default function TimerControls({
  running,
  onStart,
  onPause,
  onReset,
  onStop,
  isStopwatch,
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {running ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          className="h-9 gap-2 rounded-md px-4 text-[13px]"
        >
          <Pause className="h-3.5 w-3.5" /> Pausar
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onStart}
          className="h-9 gap-2 rounded-md px-4 text-[13px]"
        >
          <Play className="h-3.5 w-3.5" /> Iniciar
        </Button>
      )}
      {isStopwatch ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStop}
          className="h-9 gap-2 rounded-md px-4 text-[13px] text-muted-foreground"
        >
          <Square className="h-3.5 w-3.5" /> Registrar
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-9 gap-2 rounded-md px-4 text-[13px] text-muted-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
      </Button>
    </div>
  );
}
