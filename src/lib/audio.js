let ctx;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Call from a user gesture so iOS Safari allows audio later. */
export function unlockAudio() {
  getCtx();
}

function tone(c, freq, start, dur, gain = 0.18) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Soothing ascending pentatonic chime (E5 – G#5 – B5 – E6). */
export function playChime(bonus = false) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = bonus ? [659.25, 830.61, 987.77, 1318.51, 1661.22] : [659.25, 830.61, 987.77];
  notes.forEach((f, i) => tone(c, f, t + i * 0.09, 1.1 - i * 0.1));
  tone(c, 329.63, t, 1.4, 0.08); // soft low bed
}

/** Subtle blip when a spark enters range. */
export function playPing() {
  const c = getCtx();
  if (!c) return;
  tone(c, 1174.66, c.currentTime, 0.35, 0.1);
}

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}
