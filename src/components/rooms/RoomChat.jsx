import React, { useEffect, useRef, useState } from "react";
import api from "@/api/mentalistClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function RoomChat({ roomId, userName, active = true }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const load = async () => {
    try {
      // Caso sua API suporte filtros na URL, você pode usar:
      // const res = await api.get(`/entities/RoomMessage/?room_id=${roomId}`);
      const res = await api.get("entities/RoomMessage/");
      const all = Array.isArray(res.data) ? res.data : res.data.results || [];

      const list = all
        .filter((m) => String(m.room_id) === String(roomId))
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.created_date || 0);
          const dateB = new Date(b.created_at || b.created_date || 0);
          return dateA - dateB;
        });

      setMessages(list);
    } catch (err) {
      console.error("Erro ao carregar chat:", err);
    }
  };

  useEffect(() => {
    load();
    // Substitui o subscribe do base44 por um polling a cada 3 segundos
    const intervalId = setInterval(load, 3000);
    return () => clearInterval(intervalId);
  }, [roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!active || !text.trim()) return;
    try {
      await api.post("entities/RoomMessage/", {
        room_id: String(roomId),
        user_name: userName || "Anônimo",
        text: text.trim(),
      });
      setText("");
      load();
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  return (
    <div className="flex h-[420px] flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Chat de intervalo
        </p>
        <span
          className={`text-[10px] uppercase tracking-wider ${active ? "text-emerald" : "text-dim"}`}
        >
          {active ? "aberto" : "fechado"}
        </span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-[12px] text-muted-foreground">
            Nenhuma mensagem ainda.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id}>
            <p className="text-[11px] text-muted-foreground">
              {m.user_name || "Anônimo"}
            </p>
            <p className="text-[13px] leading-relaxed text-foreground/90">
              {m.text}
            </p>
          </div>
        ))}
        {!active && (
          <p className="pt-2 text-[11px] text-dim">
            O chat abre automaticamente nas pausas do cronômetro.
          </p>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={!active}
          placeholder={
            active ? "Escreva uma mensagem..." : "Chat fechado durante o foco"
          }
          className="h-9 rounded-md border-border bg-secondary/40 text-[13px] disabled:opacity-50"
        />
        <Button
          size="icon"
          variant="outline"
          disabled={!active}
          className="h-9 w-9 shrink-0 rounded-md"
          onClick={send}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
