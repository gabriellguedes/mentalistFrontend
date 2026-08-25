import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/api/mentalistClient";
import { getMode } from "@/lib/timerModes";
import { sounds } from "@/lib/sound";

const CUSTOM = { focus: 40, break: 8 };

function phaseMinutes(modeId, phase) {
  const m = getMode(modeId);
  if (m.custom) return phase === "focus" ? CUSTOM.focus : CUSTOM.break;
  return phase === "focus" ? m.focus : m.break;
}

export default function useRoomTimer({ room, me, onSessionSaved }) {
  const isHost = !!(
    me &&
    room &&
    (String(me.id) === String(room.host_user_id) ||
      String(me.id) === String(room.created_by))
  );
  const [modeId, setModeId] = useState("pomodoro");
  const [phase, setPhase] = useState("focus");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    phaseMinutes("pomodoro", "focus") * 60,
  );
  const [cycles, setCycles] = useState(0);
  const elapsedRef = useRef(0);
  const stateRef = useRef({});
  stateRef.current = { modeId, phase, running, secondsLeft, cycles };

  const saveSession = useCallback(
    async (minutes, status) => {
      const mins = Math.round(minutes * 10) / 10;
      if (mins < 0.2 || !room) return;
      try {
        await api.post("/entities/StudySession/", {
          timer_type: modeId,
          duration_minutes: mins,
          status,
          room_id: String(room.id),
        });

        // Atualiza o total de minutos acumulados do usuário
        const currentTotal = me?.total_focus_minutes || 0;
        await api.patch("/users/me/", {
          total_focus_minutes: currentTotal + mins,
        });

        onSessionSaved?.();
      } catch (err) {
        console.error("Erro ao salvar sessão de estudo:", err);
      }
    },
    [modeId, room, me, onSessionSaved],
  );

  const completePhase = useCallback(
    (completed) => {
      const wasFocus = phase === "focus";
      if (wasFocus && elapsedRef.current > 10) {
        saveSession(
          elapsedRef.current / 60,
          completed ? "completed" : "interrupted",
        );
      }
      elapsedRef.current = 0;
      const m = getMode(modeId);
      if (m.kind !== "cycle") {
        setRunning(false);
        setSecondsLeft(phaseMinutes(modeId, "focus") * 60);
        return;
      }
      const newCycles = wasFocus ? cycles + 1 : cycles;
      setCycles(newCycles);
      const np = wasFocus ? "break" : "focus";
      setPhase(np);
      setSecondsLeft(phaseMinutes(modeId, np) * 60);
      setRunning(completed);
    },
    [phase, cycles, modeId, saveSession],
  );

  // Tick do Host
  useEffect(() => {
    if (!isHost || !running) return;
    const id = setInterval(() => {
      if (phase === "focus") elapsedRef.current += 1;
      setSecondsLeft((s) => {
        if (s <= 1) {
          sounds.end();
          setTimeout(() => completePhase(true), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isHost, running, phase, completePhase]);

  // Transmissão de estado pelo Host
  useEffect(() => {
    if (!isHost || !room) return;
    const broadcast = async () => {
      const s = stateRef.current;
      const state = { ...s, hostId: me?.id, ts: Date.now() };
      if (s.running) state.endsAt = Date.now() + s.secondsLeft * 1000;
      try {
        await api.patch(`/entities/StudyRoom/${room.id}/`, {
          current_timer_status: JSON.stringify(state),
        });
      } catch (err) {
        console.error("Erro ao transmitir status da sala:", err);
      }
    };
    broadcast();
    const id = setInterval(broadcast, 3000);
    return () => clearInterval(id);
  }, [isHost, room, me]);

  // Polling dos participantes para buscar o timer do host
  const endsAtRef = useRef(null);
  useEffect(() => {
    if (isHost || !room) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.get(`/entities/StudyRoom/${room.id}/`);
        const r = res.data;
        if (cancelled) return;
        let st = null;
        try {
          st = JSON.parse(r.current_timer_status || "null");
        } catch {}
        if (!st) {
          endsAtRef.current = null;
          setRunning(false);
          return;
        }
        setModeId(st.modeId || "pomodoro");
        setPhase(st.phase || "focus");
        setCycles(st.cycles || 0);
        if (st.running && st.endsAt) {
          endsAtRef.current = st.endsAt;
          setRunning(true);
          setSecondsLeft(
            Math.max(0, Math.round((st.endsAt - Date.now()) / 1000)),
          );
        } else {
          endsAtRef.current = null;
          setRunning(false);
          setSecondsLeft(
            st.secondsLeft ?? phaseMinutes(st.modeId, st.phase) * 60,
          );
        }
      } catch (err) {
        console.error("Erro no polling da sala:", err);
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isHost, room]);

  // Atualização visual local para participantes
  useEffect(() => {
    if (isHost) return;
    const id = setInterval(() => {
      if (endsAtRef.current)
        setSecondsLeft(
          Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000)),
        );
    }, 1000);
    return () => clearInterval(id);
  }, [isHost]);

  const start = useCallback(() => {
    sounds.start();
    setRunning(true);
  }, []);
  const pause = useCallback(() => {
    sounds.click();
    setRunning(false);
  }, []);
  const stopAndLog = useCallback(() => {
    sounds.click();
    completePhase(true);
  }, [completePhase]);
  const reset = useCallback(() => {
    sounds.click();
    setRunning(false);
    elapsedRef.current = 0;
    setPhase("focus");
    setSecondsLeft(phaseMinutes(modeId, "focus") * 60);
  }, [modeId]);
  const changeMode = useCallback((id) => {
    sounds.click();
    setModeId(id);
    setCycles(0);
    setPhase("focus");
    setRunning(false);
    elapsedRef.current = 0;
    setSecondsLeft(phaseMinutes(id, "focus") * 60);
  }, []);

  const total = phaseMinutes(modeId, phase) * 60 || 1;
  const progress = Math.min(
    100,
    Math.max(0, ((total - secondsLeft) / total) * 100),
  );

  return {
    isHost,
    mode: getMode(modeId),
    modeId,
    phase,
    running,
    secondsLeft,
    cycles,
    progress,
    start: isHost ? start : undefined,
    pause: isHost ? pause : undefined,
    stop: isHost ? stopAndLog : undefined,
    reset: isHost ? reset : undefined,
    changeMode: isHost ? changeMode : undefined,
  };
}
