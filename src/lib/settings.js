export const DEFAULT_SETTINGS = {
  sessions: {
    pomodoroFocus: 25,
    pomodoroBreak: 5,
    flowFocus: 90,
    flowBreak: 25,
    autoStart: false,
    deepworkFullscreen: true,
  },
  audio: {
    alarmSound: "end",
    volume: 70,
    ambient: "none",
  },
  ai: {
    defaultAssistant: "chatgpt",
  },
  rooms: {
    invisible: false,
    friendsOnline: true,
  },
};

export function mergeSettings(s) {
  if (!s) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  return {
    sessions: { ...DEFAULT_SETTINGS.sessions, ...(s.sessions || {}) },
    audio: { ...DEFAULT_SETTINGS.audio, ...(s.audio || {}) },
    ai: { ...DEFAULT_SETTINGS.ai, ...(s.ai || {}) },
    rooms: { ...DEFAULT_SETTINGS.rooms, ...(s.rooms || {}) },
  };
}
