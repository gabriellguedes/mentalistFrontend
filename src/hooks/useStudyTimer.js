import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/api/mentalistClient";
import { getMode } from "@/lib/timerModes";
import { sounds } from "@/lib/sound";

const KEY = "em_timer_state_v1";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

export default function useStudyTimer({
  onSessionSaved,
  technique = "",
  roomId = "",
} = {}) {
  const saved = load();
  const [modeId, setModeId] = useState(saved?.modeId || "pomodoro");
  const [custom, setCustom] = useState(
    saved?.custom || { focus: 40, break: 8 },
  );
  const [phase, setPhase] = useState(saved?.phase || "focus");
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(saved?.cycles || 0);
  const mode = getMode(modeId);
  const isStopwatch = mode.kind === "stopwatch";

  const phaseMinutes = useCallback(
    (p, m = mode, cyc = cycles) => {
      if (m.custom) return p === "focus" ? custom.focus : custom.break;
      if (
        p === "break" &&
        m.longBreak &&
        cyc > 0 &&
        cyc % (m.cyclesToLongBreak || 4) === 0
      )
        return m.longBreak;
      return p === "focus" ? m.focus : m.break;
    },
    [mode, custom, cycles],
  );

  const [seconds, setSeconds] = useState(
    saved?.seconds != null
      ? saved.seconds
      : isStopwatch
        ? 0
        : (getMode(saved?.modeId || "pomodoro").focus || 25) * 60,
  );
  const elapsedRef = useRef(saved?.elapsed || 0);
  const tickRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        modeId,
        custom,
        phase,
        seconds,
        cycles,
        elapsed: elapsedRef.current,
      }),
    );
  }, [modeId, custom, phase, seconds, cycles]);

  const saveSession = useCallback(
    async (minutes, status) => {
      const mins = Math.round(minutes * 10) / 10;
      if (mins < 0.2) return;
      await base44.entities.StudySession.create({
        timer_type: modeId,
        duration_minutes: mins,
        status,
        technique_used: technique || undefined,
        room_id: roomId || undefined,
      });
      const me = await base44.auth.me();
      await base44.auth.updateMe({
        total_focus_minutes: (me.total_focus_minutes || 0) + mins,
      });
      onSessionSaved?.();
    },
    [modeId, technique, roomId, onSessionSaved],
  );

  const resetTimer = useCallback(
    (newModeId = modeId, newPhase = "focus") => {
      const m = getMode(newModeId);
      setPhase(newPhase);
      setRunning(false);
      elapsedRef.current = 0;
      setSeconds(
        m.kind === "stopwatch"
          ? 0
          : (m.custom
              ? newPhase === "focus"
                ? custom.focus
                : custom.break
              : newPhase === "focus"
                ? m.focus
                : m.break) * 60,
      );
    },
    [modeId, custom],
  );

  const nextPhase = useCallback(
    (completed) => {
      const wasFocus = phase === "focus";
      if (wasFocus && elapsedRef.current > 10) {
        saveSession(
          elapsedRef.current / 60,
          completed ? "completed" : "interrupted",
        );
      }
      elapsedRef.current = 0;
      if (mode.kind !== "cycle") {
        setRunning(false);
        setSeconds(mode.kind === "stopwatch" ? 0 : phaseMinutes("focus") * 60);
        return;
      }
      const newCycles = wasFocus ? cycles + 1 : cycles;
      setCycles(newCycles);
      const np = wasFocus ? "break" : "focus";
      setPhase(np);
      setSeconds(phaseMinutes(np, mode, newCycles) * 60);
      setRunning(completed);
    },
    [phase, cycles, mode, phaseMinutes, saveSession],
  );

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      if (phase === "focus") elapsedRef.current += 1;
      setSeconds((s) => {
        if (isStopwatch) return s + 1;
        if (s <= 1) {
          sounds.end();
          setTimeout(() => nextPhase(true), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, phase, isStopwatch, nextPhase]);

  useEffect(() => {
    const onLeave = () => {
      if (running && phase === "focus" && elapsedRef.current > 10) {
        localStorage.setItem(
          "em_pending_interrupt",
          JSON.stringify({ modeId, minutes: elapsedRef.current / 60 }),
        );
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [running, phase, modeId]);

  const start = () => {
    sounds.start();
    setRunning(true);
  };
  const pause = () => {
    sounds.click();
    setRunning(false);
  };
  const skip = () => {
    sounds.click();
    if (isStopwatch) {
      nextPhase(true);
      return;
    }
    nextPhase(false);
  };
  const stopAndLog = () => {
    sounds.click();
    nextPhase(true);
  };

  const changeMode = (id) => {
    sounds.click();
    if (running && phase === "focus" && elapsedRef.current > 10)
      saveSession(elapsedRef.current / 60, "interrupted");
    setModeId(id);
    setCycles(0);
    resetTimer(id, "focus");
  };

  const total = isStopwatch ? Math.max(seconds, 1) : phaseMinutes(phase) * 60;
  const progress = isStopwatch
    ? 0
    : Math.min(100, ((total - seconds) / total) * 100);

  return {
    mode,
    modeId,
    changeMode,
    custom,
    setCustom,
    phase,
    seconds,
    running,
    cycles,
    progress,
    start,
    pause,
    skip,
    stopAndLog,
    reset: () => {
      sounds.click();
      resetTimer(modeId, phase);
    },
    elapsedMinutes: elapsedRef.current / 60,
  };
}
