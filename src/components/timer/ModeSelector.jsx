import React from "react";
import { TIMER_MODES } from "@/lib/timerModes";

export default function ModeSelector({ modeId, onChange }) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      {TIMER_MODES.map((m) => {
        const active = m.id === modeId;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-background"
                : "border-border bg-card text-[#A1A1AA] hover:text-foreground"
            }`}
          >
            {m.name}
          </button>
        );
      })}
    </div>
  );
}
