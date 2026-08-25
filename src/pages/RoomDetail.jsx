import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/api/mentalistClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RoomChat from "@/components/rooms/RoomChat";
import ParticipantList from "@/components/rooms/ParticipantList";
import TimerRing from "@/components/timer/TimerRing";
import TimerControls from "@/components/timer/TimerControls";
import useRoomTimer from "@/hooks/useRoomTimer";
import CopyButton from "@/components/CopyButton";
import { getMode } from "@/lib/timerModes";
import { startOfWeek } from "date-fns";
import { ArrowLeft, LogOut, AlertTriangle, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const ROOM_MODES = ["pomodoro", "pomodoro_50", "flow90", "deepwork"];

export default function RoomDetail() {
  const { code } = useParams();
  const nav = useNavigate();
  const [room, setRoom] = useState(null);
  const [me, setMe] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [statusText, setStatusText] = useState("Focando nos estudos");
  const [notFound, setNotFound] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [focusLost, setFocusLost] = useState(false);

  const weekMinutes = useCallback(async (userId) => {
    const since = startOfWeek(new Date(), { weekStartsOn: 1 });
    try {
      const res = await api.get("/entities/StudySession/");
      const sessions = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      return sessions
        .filter(
          (s) =>
            (s.created_by_id === userId || s.created_by === userId) &&
            s.status === "completed" &&
            new Date(s.created_date || s.created_at) >= since,
        )
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    } catch {
      return 0;
    }
  }, []);

  const loadParticipants = useCallback(async (roomId) => {
    try {
      const res = await api.get("/entities/RoomParticipant/");
      const all = Array.isArray(res.data) ? res.data : res.data.results || [];
      const roomParts = all.filter((p) => p.room_id === String(roomId));
      setParticipants(roomParts);
    } catch (err) {
      console.error("Erro ao carregar participantes:", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const roomsRes = await api.get("/entities/StudyRoom/");
        const rooms = Array.isArray(roomsRes.data)
          ? roomsRes.data
          : roomsRes.data.results || [];
        const found = rooms.find((r) => r.invite_code === code);

        if (!found) return setNotFound(true);

        const meRes = await api.get("/users/me/");
        const user = meRes.data;
        const r = found;

        setRoom(r);
        setMe(user);

        const partsRes = await api.get("/entities/RoomParticipant/");
        const allParts = Array.isArray(partsRes.data)
          ? partsRes.data
          : partsRes.data.results || [];
        const existing = allParts.filter(
          (p) =>
            p.room_id === String(r.id) &&
            (p.user_id === String(user.id) || p.created_by === user.id),
        );

        const mins = await weekMinutes(user.id);
        const nowIso = new Date().toISOString();

        if (existing.length) {
          await api.patch(`/entities/RoomParticipant/${existing[0].id}/`, {
            last_ping: nowIso,
            week_minutes: mins,
          });
        } else {
          await api.post("/entities/RoomParticipant/", {
            room_id: String(r.id),
            user_id: String(user.id),
            user_name: user.full_name || user.email,
            is_focusing: false,
            status_text: "Entrou na sala",
            week_minutes: mins,
            last_ping: nowIso,
          });
        }
        loadParticipants(r.id);
      } catch (err) {
        console.error("Erro ao inicializar sala:", err);
        setNotFound(true);
      }
    })();
  }, [code, weekMinutes, loadParticipants]);

  const syncMe = useCallback(
    async (patch) => {
      if (!room || !me) return;
      try {
        const partsRes = await api.get("/entities/RoomParticipant/");
        const allParts = Array.isArray(partsRes.data)
          ? partsRes.data
          : partsRes.data.results || [];
        const rows = allParts.filter(
          (p) =>
            p.room_id === String(room.id) &&
            (p.user_id === String(me.id) || p.created_by === me.id),
        );

        if (rows.length) {
          await api.patch(`/entities/RoomParticipant/${rows[0].id}/`, {
            last_ping: new Date().toISOString(),
            week_minutes: await weekMinutes(me.id),
            ...patch,
          });
        }
        loadParticipants(room.id);
      } catch (err) {
        console.error("Erro ao sincronizar status:", err);
      }
    },
    [room, me, weekMinutes, loadParticipants],
  );

  const timer = useRoomTimer({ room, me, onSessionSaved: () => syncMe({}) });

  // Polling de presença e atualização a cada 5 segundos
  useEffect(() => {
    if (!room) return;
    const intervalId = setInterval(() => {
      loadParticipants(room.id);
      syncMe({
        is_focusing: timer.running && timer.phase === "focus",
        status_text:
          timer.running && timer.phase === "focus" ? statusText : "Em pausa",
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [room, timer.running, timer.phase, statusText, syncMe, loadParticipants]);

  // Perda de foco se trocar de aba durante sessão
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && timer.running && timer.phase === "focus") {
        setFocusLost(true);
        syncMe({ is_focusing: false, status_text: "Perdeu o foco" });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [timer.running, timer.phase, syncMe]);

  const leaveRoom = async () => {
    if (room && me) {
      try {
        const partsRes = await api.get("/entities/RoomParticipant/");
        const allParts = Array.isArray(partsRes.data)
          ? partsRes.data
          : partsRes.data.results || [];
        const rows = allParts.filter(
          (p) =>
            p.room_id === String(room.id) &&
            (p.user_id === String(me.id) || p.created_by === me.id),
        );
        if (rows.length) {
          await api.delete(`/entities/RoomParticipant/${rows[0].id}/`);
        }
      } catch (err) {
        console.error("Erro ao sair da sala:", err);
      }
    }
    nav("/salas");
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-[13px] text-muted-foreground">
          Sala não encontrada.
        </p>
        <Link
          to="/salas"
          className="mt-4 inline-block text-[13px] text-foreground underline"
        >
          Voltar para as salas
        </Link>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="px-6 py-20 text-[13px] text-muted-foreground">
        Entrando na sala...
      </div>
    );
  }

  const shareLink = `${window.location.origin}/salas/${room.invite_code}`;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/salas"
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Todas as salas
      </Link>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">{room.name}</h1>
          <p className="mt-1 font-mono-timer text-[11px] text-muted-foreground">
            código: {room.invite_code} ·{" "}
            {timer.isHost ? "você é o host" : "sincronizado com o host"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton
            text={shareLink}
            label="Copiar link"
            variant="outline"
            size="sm"
            className="h-7 rounded-md px-2.5 text-[11px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLeaveOpen(true)}
            className="h-7 gap-1.5 rounded-md px-2.5 text-[11px] text-destructive hover:text-destructive"
          >
            <LogOut className="h-3 w-3" /> Sair da sala
          </Button>
        </div>
      </div>

      {focusLost && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="flex-1 text-[12px] text-amber-200/90">
            Você saiu da aba durante o foco —{" "}
            <span className="font-medium">Perdeu o foco</span>. Seus amigos
            foram avisados.
          </p>
          <button
            onClick={() => {
              setFocusLost(false);
              syncMe({ status_text: statusText });
            }}
            className="rounded-md p-1 text-amber-200/70 hover:text-amber-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-6 rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {ROOM_MODES.map((id) => {
                const m = getMode(id);
                const active = id === timer.modeId;
                return (
                  <button
                    key={id}
                    disabled={!timer.isHost}
                    onClick={() => timer.changeMode?.(id)}
                    className={`text-[12px] transition-colors ${
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    } ${timer.isHost ? "" : "cursor-default"}`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
            <TimerRing
              seconds={timer.secondsLeft}
              progress={timer.progress}
              phase={timer.phase}
              label={timer.phase === "focus" ? "Foco" : "Descanso"}
            />
            {timer.isHost ? (
              <TimerControls
                running={timer.running}
                onStart={() => {
                  timer.start();
                  syncMe({ is_focusing: true, status_text: statusText });
                }}
                onPause={() => {
                  timer.pause();
                  syncMe({ is_focusing: false, status_text: "Em pausa" });
                }}
                onStop={timer.stop}
                onReset={timer.reset}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Apenas o host controla o cronômetro.
              </p>
            )}
            <div className="w-full max-w-xs">
              <label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                O que estou estudando agora
              </label>
              <Input
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                className="mt-2 h-9 rounded-md border-border bg-secondary/40 text-[13px]"
                placeholder="Ex: Patologia — inflamação"
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 w-full rounded-md text-[12px] text-muted-foreground"
                onClick={() => syncMe({ status_text: statusText })}
              >
                Atualizar status
              </Button>
            </div>
          </div>
          <RoomChat
            roomId={room.id}
            userName={me?.full_name || me?.email}
            active={timer.phase === "break"}
          />
        </div>
        <ParticipantList participants={participants} />
      </div>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da sala?</AlertDialogTitle>
            <AlertDialogDescription>
              Você vai sair da sala e parar de aparecer para os outros
              participantes. Pode voltar quando quiser com o mesmo código.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={leaveRoom}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair da sala
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
