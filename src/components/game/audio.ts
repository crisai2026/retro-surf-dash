export function getAudioCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
  if (!ref.current) ref.current = new AudioContext();
  return ref.current;
}

function playNote(ctx: AudioContext, freq: number, type: OscillatorType, start: number, dur: number, vol = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

export function playWaveSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => playNote(ctx, f, "square", t + i * 0.08, 0.12, 0.12));
}

export function playBigWaveSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  [392, 523, 659, 784, 1047].forEach((f, i) => playNote(ctx, f, "square", t + i * 0.06, 0.15, 0.15));
}

export function playRescueSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  playNote(ctx, 262, "triangle", t, 0.15, 0.18);
  playNote(ctx, 330, "triangle", t + 0.12, 0.18, 0.18);
}

export function playTurtleSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  playNote(ctx, 330, "triangle", t, 0.12, 0.2);
  playNote(ctx, 440, "triangle", t + 0.1, 0.12, 0.2);
  playNote(ctx, 523, "triangle", t + 0.2, 0.15, 0.2);
}

export function playLocalSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  playNote(ctx, 200, "sawtooth", t, 0.12, 0.15);
  playNote(ctx, 250, "square", t + 0.08, 0.1, 0.12);
}

export function playSharkSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = "sawtooth";
  osc2.type = "square";
  osc1.frequency.setValueAtTime(800, t);
  osc1.frequency.exponentialRampToValueAtTime(200, t + 0.3);
  osc2.frequency.setValueAtTime(850, t);
  osc2.frequency.exponentialRampToValueAtTime(180, t + 0.3);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc1.start(t); osc1.stop(t + 0.35);
  osc2.start(t); osc2.stop(t + 0.35);
}

export function playGreatWhiteSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = "sawtooth";
  osc2.type = "sawtooth";
  osc1.frequency.setValueAtTime(900, t);
  osc1.frequency.exponentialRampToValueAtTime(100, t + 0.5);
  osc2.frequency.setValueAtTime(920, t);
  osc2.frequency.exponentialRampToValueAtTime(90, t + 0.5);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc1.start(t); osc1.stop(t + 0.55);
  osc2.start(t); osc2.stop(t + 0.55);
}

export function playSharkHitFollower(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(250, t + 0.15);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.2);
}

export function playGameOverSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  [330, 262, 220].forEach((f, i) => playNote(ctx, f, "square", t + i * 0.2, 0.25, 0.15));
}
