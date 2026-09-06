import React from "react";

export default function PageHeader({
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  children,
}) {
  return (
    <div className="mb-10 flex items-center gap-4">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
      )}{" "}
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}

        <h1 className="text-[22px] font-medium tracking-tight sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
