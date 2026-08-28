import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/mentalistClient";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, LogIn } from "lucide-react";

const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function Rooms() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");

  const { data: rooms = [], refetch } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await api.get("entities/StudyRoom/");
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const create = async () => {
    if (!name.trim()) return;
    try {
      const meRes = await api.get("users/me/");
      const roomRes = await api.post("entities/StudyRoom/", {
        name: name.trim(),
        invite_code: code(),
        host_user_id: meRes.data.id.toString(),
      });
      setName("");
      refetch();
      nav(`salas/${roomRes.data.invite_code}`);
    } catch (err) {
      console.error("Erro ao criar sala:", err);
    }
  };

  const join = async () => {
    setError("");
    const searchCode = invite.trim().toUpperCase();
    if (!searchCode) return;

    try {
      const res = await api.get("entities/StudyRoom/");
      const allRooms = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      const found = allRooms.find((r) => r.invite_code === searchCode);

      if (!found) {
        return setError("Nenhuma sala encontrada com esse código.");
      }
      nav(`/salas/${found.invite_code}`);
    } catch (err) {
      setError("Erro ao pesquisar a sala.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <PageHeader
        eyebrow="Salas"
        title="Salas de estudo compartilhadas"
        subtitle="Veja quem está focando em tempo real, troque dúvidas nas pausas e dispute o ranking semanal."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-[12px] text-muted-foreground">
            <Plus className="h-3.5 w-3.5" /> Criar nova sala
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da sala"
            className="h-9 rounded-md border-border bg-secondary/40 text-[13px]"
          />
          <Button
            onClick={create}
            className="mt-3 h-9 w-full rounded-md bg-emerald text-black text-[13px] hover:opacity-90"
          >
            Criar Nova Sala
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-[12px] text-muted-foreground">
            <LogIn className="h-3.5 w-3.5" /> Entrar com código
          </p>
          <Input
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            placeholder="CÓDIGO"
            className="h-9 rounded-md border-border bg-secondary/40 font-mono-timer text-[13px] uppercase"
          />
          <Button
            variant="outline"
            onClick={join}
            className="mt-3 h-9 w-full rounded-md text-[13px]"
          >
            Entrar na sala
          </Button>
          {error && (
            <p className="mt-2 text-[11px] text-destructive">{error}</p>
          )}
        </div>
      </div>

      <h2 className="mb-2 mt-10 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Salas recentes
      </h2>
      <div className="border-t border-border">
        {rooms.length === 0 && (
          <p className="py-5 text-[13px] text-muted-foreground">
            Nenhuma sala criada ainda.
          </p>
        )}
        {rooms.map((r) => (
          <button
            key={r.id}
            onClick={() => nav(`/salas/${r.invite_code}`)}
            className="flex w-full items-center justify-between border-b border-border px-1 py-3.5 text-left hover:bg-secondary/30"
          >
            <span className="text-[13.5px] text-foreground">{r.name}</span>
            <span className="font-mono-timer text-[11px] text-muted-foreground">
              {r.invite_code}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
