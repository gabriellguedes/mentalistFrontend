export const LEVELS = [
  { level: 1, name: "Aluno", min: 0, max: 10 },
  { level: 2, name: "Pesquisador", min: 10, max: 30 },
  { level: 3, name: "Estrategista", min: 30, max: 70 },
  { level: 4, name: "Mentalista", min: 70, max: 150 },
  { level: 5, name: "Mestre Mentalista", min: 150, max: 300 },
  { level: 6, name: "Lenda", min: 300, max: Infinity },
];

export function getLevel(totalMinutes = 0) {
  const hours = (totalMinutes || 0) / 60;
  const current =
    LEVELS.find((l) => hours >= l.min && hours < l.max) ||
    LEVELS[LEVELS.length - 1];
  const next = LEVELS.find((l) => l.level === current.level + 1) || null;
  const span = next ? current.max - current.min : 1;
  const progress = next
    ? Math.min(100, ((hours - current.min) / span) * 100)
    : 100;
  return {
    ...current,
    hours,
    next,
    progress,
    minutesToNext: next
      ? Math.max(0, Math.round(next.min * 60 - totalMinutes))
      : 0,
  };
}

export const BADGES = [
  {
    id: "first_pomodoro",
    name: "Primeiro Pomodoro",
    desc: "Complete sua primeira sessão Pomodoro.",
  },
  {
    id: "marathon_90",
    name: "Maratona 90min",
    desc: "Conclua um bloco Flow de 90 minutos.",
  },
  {
    id: "deep_worker",
    name: "Trabalho Profundo",
    desc: "Conclua um bloco de Deep Work.",
  },
  {
    id: "feynman_master",
    name: "Mestre do Feynman",
    desc: "Registre uma sessão usando o Método Feynman.",
  },
  {
    id: "ten_hours",
    name: "10 Horas de Foco",
    desc: "Acumule 10 horas de estudo.",
  },
  {
    id: "consistency",
    name: "Consistência",
    desc: "Complete 10 sessões de foco.",
  },
];

export function computeBadges(sessions = [], totalMinutes = 0) {
  const done = sessions.filter((s) => s.status === "completed");
  const earned = [];
  if (done.some((s) => s.timer_type?.startsWith("pomodoro")))
    earned.push("first_pomodoro");
  if (done.some((s) => s.timer_type === "flow90" && s.duration_minutes >= 85))
    earned.push("marathon_90");
  if (done.some((s) => s.timer_type === "deepwork")) earned.push("deep_worker");
  if (
    done.some((s) => (s.technique_used || "").toLowerCase().includes("feynman"))
  )
    earned.push("feynman_master");
  if (totalMinutes >= 600) earned.push("ten_hours");
  if (done.length >= 10) earned.push("consistency");
  return earned;
}
