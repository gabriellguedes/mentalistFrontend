let ctx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, duration = 0.15, type = "sine", gain = 0.08, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g).connect(c.destination);
  const t = c.currentTime + delay;
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sounds = {
  click: () => tone(880, 0.06, "triangle", 0.04),
  start: () => {
    tone(523, 0.14);
    tone(784, 0.2, "sine", 0.07, 0.13);
  },
  end: () => {
    tone(660, 0.35, "sine", 0.09);
    tone(495, 0.4, "sine", 0.08, 0.3);
    tone(392, 0.6, "sine", 0.07, 0.6);
  },
};
