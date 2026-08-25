import React from "react";
import { formatClock } from "@/lib/timerModes";

export default function TimerRing({ seconds, progress, phase, label }) {
  const R = 140;
  const C = 2 * Math.PI * R;
  const stroke = "hsl(160 84% 39%)";
  return (
    <div className="relative grid place-items-center">
      <svg
        viewBox="0 0 320 320"
        className="-rotate-90 w-full max-w-[300px] h-auto"
      >
        <circle
          cx="160"
          cy="160"
          r={R}
          fill="none"
          stroke="hsl(240 6% 16%)"
          strokeWidth="1.5"
        />
        <circle
          cx="160"
          cy="160"
          r={R}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * progress) / 100}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </p>
        <p className="font-mono-timer text-[56px] font-light leading-none tabular-nums sm:text-[64px]">
          {formatClock(seconds)}
        </p>
      </div>
    </div>
  );
}
