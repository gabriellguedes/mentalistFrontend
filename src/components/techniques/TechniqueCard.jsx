import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import CopyButton from "@/components/CopyButton";
import { ChevronRight } from "lucide-react";

export default function TechniqueCard({ technique }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-1 py-3.5">
        <button
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] text-foreground">
              {technique.title}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
              {technique.what_it_is}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
        <CopyButton
          text={technique.recommended_ai_prompt}
          label="Copiar Prompt"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 rounded-md px-2.5 text-[11px]"
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="text-left">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {technique.category}
            </p>
            <SheetTitle className="text-lg">{technique.title}</SheetTitle>
            <SheetDescription className="text-[13px] leading-relaxed">
              {technique.what_it_is}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Como funciona
              </p>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/85">
                {technique.how_it_works}
              </p>
            </div>
            {technique.recommended_ai_prompt && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Prompt de IA recomendado
                </p>
                <div className="rounded-md border border-border bg-secondary/40 p-3">
                  <p className="whitespace-pre-line text-[12px] leading-relaxed text-muted-foreground">
                    {technique.recommended_ai_prompt}
                  </p>
                </div>
                <CopyButton
                  text={technique.recommended_ai_prompt}
                  label="Copiar Prompt"
                  className="mt-3"
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
