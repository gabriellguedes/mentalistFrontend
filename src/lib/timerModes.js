export const TIMER_MODES = [
  {
    id: "pomodoro",
    name: "Pomodoro Clássico",
    desc: "25 min de foco / 5 min de pausa · pausa longa de 20 min a cada 4 ciclos",
    focus: 25,
    break: 5,
    longBreak: 20,
    cyclesToLongBreak: 4,
    kind: "cycle",
  },
  {
    id: "pomodoro_50",
    name: "Pomodoro Estendido 50/10",
    desc: "50 min de imersão / 10 min de pausa com alternância automática",
    focus: 50,
    break: 10,
    kind: "cycle",
  },
  {
    id: "pomodoro_52",
    name: "Pomodoro Estendido 52/17",
    desc: "52 min de foco / 17 min de descanso — ritmo de alta performance",
    focus: 52,
    break: 17,
    kind: "cycle",
  },
  {
    id: "flow90",
    name: "Flow 90 min (Ultradiano)",
    desc: "90 min de imersão profunda / 25 min de descanso biológico",
    focus: 90,
    break: 25,
    kind: "cycle",
  },
  {
    id: "deepwork",
    name: "Deep Work Mode",
    desc: "Blocos de 60 a 120 min em tela cheia, sem distrações",
    focus: 90,
    break: 20,
    kind: "cycle",
    deepwork: true,
  },
  {
    id: "custom",
    name: "Personalizado",
    desc: "Defina livremente os minutos de foco e de descanso",
    focus: 40,
    break: 8,
    kind: "cycle",
    custom: true,
  },
  {
    id: "countdown",
    name: "Contagem Regressiva",
    desc: "Tempo alvo único com alarme suave ao zerar",
    focus: 15,
    break: 0,
    kind: "countdown",
    custom: true,
  },
  {
    id: "stopwatch",
    name: "Cronômetro Progressivo",
    desc: "Contagem aberta para medir resolução de questões e leitura",
    focus: 0,
    break: 0,
    kind: "stopwatch",
  },
];

export const getMode = (id) =>
  TIMER_MODES.find((m) => m.id === id) || TIMER_MODES[0];

export const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};
