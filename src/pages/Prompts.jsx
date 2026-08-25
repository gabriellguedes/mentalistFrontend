import React, { useMemo, useState } from "react";
import api from "@/api/mentalistClient";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import PromptCard from "@/components/prompts/PromptCard";

export default function Prompts() {
  const [goal, setGoal] = useState("Todos");
  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => base44.entities.AiPrompt.list("created_date", 100),
  });

  const goals = useMemo(
    () => ["Todos", ...new Set(prompts.map((p) => p.category_goal))],
    [prompts],
  );
  const filtered = prompts.filter(
    (p) => goal === "Todos" || p.category_goal === goal,
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <PageHeader
        eyebrow="Prompts"
        title="Central de prompts de IA"
        subtitle="Prompts de engenharia avançada por objetivo de aprendizado, com variáveis editáveis."
      />

      <div className="mb-8 flex flex-wrap gap-x-4 gap-y-1.5">
        {goals.map((g) => (
          <button
            key={g}
            onClick={() => setGoal(g)}
            className={`text-[12px] transition-colors ${goal === g ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {g}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-[13px] text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}
    </div>
  );
}
