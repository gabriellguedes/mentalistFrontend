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
    const sessions = await base44.entities.StudySession.filter(
      { created_by_id: userId, status: "completed" },
      "-created_date",
      200,
    );
    return sessions
      .filter((s) => new Date(s.created_date) >= since)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  }, []);

  const loadParticipants = useCallback(async (roomId) => {
    setParticipants(
      await base44.entities.RoomParticipant.filter(
        { room_id: roomId },
        "-last_ping",
        50,
      ),
    );
  }, []);

  useEffect(() => {
    (async () => {
      const found = await base44.entities.StudyRoom.filter({
        invite_code: code,
      });
      if (!found.length) return setNotFound(true);
      const r = found[0];
      const user = await base44.auth.me();
      setRoom(r);
      setMe(user);
      const existing = await base44.entities.RoomParticipant.filter({
        room_id: r.id,
        user_id: user.id,
      });
      const mins = await weekMinutes(user.id);
      if (existing.length) {
        await base44.entities.RoomParticipant.update(existing[0].id, {
          last_ping: new Date().toISOString(),
          week_minutes: mins,
        });
      } else {
        await base44.entities.RoomParticipant.create({
          room_id: r.id,
          user_id: user.id,
          user_name: user.full_name || user.email,
          is_focusing: false,
          status_text: "Entrou na sala",
          week_minutes: mins,
          last_ping: new Date().toISOString(),
        });
      }
      loadParticipants(r.id);
    })();
  }, [code, weekMinutes, loadParticipants]);

  const syncMe = useCallback(
    async (patch) => {
      if (!room || !me) return;
      const rows = await base44.entities.RoomParticipant.filter({
        room_id: room.id,
        user_id: me.id,
      });
      if (rows.length) {
        await base44.entities.RoomParticipant.update(rows[0].id, {
          last_ping: new Date().toISOString(),
          week_minutes: await weekMinutes(me.id),
          ...patch,
        });
      }
      loadParticipants(room.id);
    },
    [room, me, weekMinutes, loadParticipants],
  );

  const timer = useRoomTimer({ room, me, onSessionSaved: () => syncMe({}) });

  // presence + status sync
  useEffect(() => {
    if (!room) return;
    const unsub = base44.entities.RoomParticipant.subscribe(() =>
      loadParticipants(room.id),
    );
    const id = setInterval(
      () =>
        syncMe({
          is_focusing: timer.running && timer.phase === "focus",
          status_text:
            timer.running && timer.phase === "focus" ? statusText : "Em pausa",
        }),
      20000,
    );
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [room, timer.running, timer.phase, statusText, syncMe, loadParticipants]);

  // focus-lost detection (tab hidden during focus)
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
      const rows = await base44.entities.RoomParticipant.filter({
        room_id: room.id,
        user_id: me.id,
      });
      if (rows.length) await base44.entities.RoomParticipant.delete(rows[0].id);
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
  if (!room)
    return (
      <div className="px-6 py-20 text-[13px] text-muted-foreground">
        Entrando na sala...
      </div>
    );

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
