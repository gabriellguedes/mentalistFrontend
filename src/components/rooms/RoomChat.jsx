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
    const list = await base44.entities.RoomMessage.filter(
      { room_id: roomId },
      "created_date",
      100,
    );
    setMessages(list);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.RoomMessage.subscribe(() => load());
    return unsub;
  }, [roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!active || !text.trim()) return;
    await base44.entities.RoomMessage.create({
      room_id: roomId,
      user_name: userName,
      text: text.trim(),
    });
    setText("");
    load();
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
