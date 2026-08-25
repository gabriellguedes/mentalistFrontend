import React from "react";

export default function SettingsGroup({ title, children }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2.5 px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {children}
      </div>
    </section>
  );
}
