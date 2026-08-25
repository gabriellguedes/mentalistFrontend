import React from "react";

export default function SettingRow({ label, desc, control }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight">{label}</p>
        {desc && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {desc}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center">{control}</div>
    </div>
  );
}
