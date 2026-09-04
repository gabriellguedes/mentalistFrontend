import React, { useMemo, useState } from "react";
import api from "@/api/mentalistClient";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import TechniqueCard from "@/components/techniques/TechniqueCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Techniques() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");

  const { data: techniques = [], isLoading } = useQuery({
    queryKey: ["techniques"],
    queryFn: async () => {
      const response = await api.get("entities/Technique/");
      return Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
    },
  });

  const categories = useMemo(
    () => [
      "Todas",
      ...new Set(techniques.map((t) => t.category).filter(Boolean)),
    ],
    [techniques],
  );

  const filtered = techniques.filter(
    (t) =>
      (cat === "Todas" || t.category === cat) &&
      ((t.title || "") + (t.what_it_is || "") + (t.how_it_works || ""))
        .toLowerCase()
        .includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <PageHeader
        eyebrow="Técnicas"
        title="Biblioteca de memorização"
        subtitle="18 técnicas com teoria, aplicação prática e prompt de IA pronto. Toque em um item para ver o método completo."
      />

      <div className="mb-6 flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar técnica..."
            className="h-9 rounded-md border-border bg-card pl-8 text-[13px]"
          />
        </div>
        <div className="mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {categories.map((c) => {
            const active = cat === c;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 whitespace-nowrap rounded-md border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "border-[#27272A] bg-[#27272A] text-[#FAFAFA]"
                    : "border-transparent text-[#A1A1AA] hover:text-foreground"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <p className="text-[13px] text-muted-foreground">Carregando...</p>
      ) : (
        <div className="border-t border-border">
          {filtered.map((t) => (
            <TechniqueCard key={t.id} technique={t} />
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-[13px] text-muted-foreground">
              Nenhuma técnica encontrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
