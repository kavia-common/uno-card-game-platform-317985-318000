let audioCtx = null;

function getCtx() {
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}

function envelope(gain, now, attack = 0.01, release = 0.12) {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
}

function tone(freq, dur = 0.16, type = "sine") {
  const ctx = getCtx();
  if (!ctx) return;

  // Some browsers start AudioContext suspended until user interaction.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  envelope(gain, now, 0.01, dur);

  osc.start(now);
  osc.stop(now + dur + 0.05);
}

/**
 * Simple procedural sounds so we don't need binary assets.
 */
const SFX = {
  click() {
    tone(880, 0.08, "square");
  },
  draw() {
    tone(392, 0.12, "triangle");
  },
  play() {
    tone(523.25, 0.11, "sine");
    setTimeout(() => tone(659.25, 0.11, "sine"), 40);
  },
  error() {
    tone(196, 0.2, "sawtooth");
  },
  win() {
    tone(523.25, 0.12, "sine");
    setTimeout(() => tone(659.25, 0.12, "sine"), 90);
    setTimeout(() => tone(783.99, 0.14, "sine"), 180);
  },
};

// PUBLIC_INTERFACE
export function createSoundController() {
  /** Persist preference under a stable key. */
  const KEY = "uno:soundEnabled";
  const stored = localStorage.getItem(KEY);
  let enabled = stored == null ? true : stored === "true";

  return {
    // PUBLIC_INTERFACE
    isEnabled() {
      return enabled;
    },
    // PUBLIC_INTERFACE
    setEnabled(v) {
      enabled = Boolean(v);
      localStorage.setItem(KEY, String(enabled));
    },
    // PUBLIC_INTERFACE
    play(name) {
      if (!enabled) return;
      const fn = SFX[name];
      if (typeof fn === "function") fn();
    },
  };
}
