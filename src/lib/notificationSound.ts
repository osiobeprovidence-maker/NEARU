// Lightweight in-app notification chime generated with the Web Audio API.
// No audio asset is shipped — the tone is synthesized on demand. The
// AudioContext is created lazily and only resumed after a user gesture so the
// browser won't block it (autoplay policy). Playback is best-effort and
// silently swallows any errors (e.g. unsupported environments).

let ctx: AudioContext | null = null;
let resumed = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = (window.AudioContext ||
    (window as any).webkitAudioContext) as typeof AudioContext | undefined;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  // Resume once the user has interacted so the context is allowed to play.
  if (ctx.state === 'suspended' && !resumed) {
    resumed = true;
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Play a short two-tone notification chime. */
export function playNotificationSound() {
  try {
    const ac = getContext();
    if (!ac || ac.state !== 'running') return;
    // Classic "message" ding: higher note call, slightly softer echo.
    tone(ac, 880, 0, 0.22, 0.18, 'sine');
    tone(ac, 1320, 0.12, 0.28, 0.12, 'sine');
  } catch {
    /* best-effort only */
  }
}

/** Warm the AudioContext as soon as the user first interacts with the page. */
export function initNotificationSound() {
  if (typeof window === 'undefined') return;
  const warm = () => {
    getContext();
    window.removeEventListener('pointerdown', warm);
    window.removeEventListener('keydown', warm);
    window.removeEventListener('touchstart', warm);
  };
  window.addEventListener('pointerdown', warm);
  window.addEventListener('keydown', warm);
  window.addEventListener('touchstart', warm);
}
