import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import CopyButton from "@/components/CopyButton";
import { ExternalLink } from "lucide-react";

const TOOL_LINKS = {
  ChatGPT: "https://chat.openai.com",
  Claude: "https://claude.ai",
  Gemini: "https://gemini.google.com",
  Perplexity: "https://www.perplexity.ai",
  NotebookLM: "https://notebooklm.google.com",
};

export default function PromptCard({ prompt = {} }) {
  const template = prompt.prompt_template || prompt.template || "";

  const vars = useMemo(
    () => [...new Set(template.match(/\[[^\]]+\]/g) || [])],
    [template],
  );

  const [values, setValues] = useState({});

  const filled = useMemo(
    () =>
      vars.reduce(
        (acc, v) => acc.replaceAll(v, values[v]?.trim() ? values[v] : v),
        template,
      ),
    [vars, values, template],
  );

  // Trata possíveis variações no array de ferramentas da API Django
  const tools = useMemo(() => {
    const rawTools = prompt.recommended_tools || prompt.tools || [];
    if (typeof rawTools === "string") {
      try {
        return JSON.parse(rawTools);
      } catch {
        return rawTools.split(",").map((t) => t.trim());
      }
    }
    return Array.isArray(rawTools) ? rawTools : [];
  }, [prompt]);

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[13.5px] font-medium">
          {prompt.title || "Prompt sem título"}
        </h3>
      </div>

      {tools.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tools.map((t) => (
            <a
              key={t}
              href={TOOL_LINKS[t] || "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground hover:text-foreground"
            >
              {t} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ))}
        </div>
      )}

      {vars.length > 0 && (
        <div className="mt-3 grid gap-1.5">
          {vars.map((v) => (
            <Input
              key={v}
              placeholder={v}
              value={values[v] || ""}
              onChange={(e) =>
                setValues((s) => ({ ...s, [v]: e.target.value }))
              }
              className="h-8 rounded-md border-border bg-secondary/40 text-[11.5px]"
            />
          ))}
        </div>
      )}

      <pre className="mt-3 max-h-36 flex-1 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-secondary/30 p-3 font-mono-timer text-[11px] leading-relaxed text-muted-foreground">
        {filled}
      </pre>

      <div className="mt-3">
        <CopyButton
          text={filled}
          label="Copiar Prompt"
          variant="outline"
          size="sm"
          className="h-7 rounded-md px-2.5 text-[11px]"
        />
      </div>
    </div>
  );
}
