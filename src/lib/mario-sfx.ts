// Mario Sound Effects using Web Audio API
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.08,
  startDelay = 0
) => {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + startDelay + duration
  );
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration);
};

export const marioSfx = {
  coin: () => {
    playTone(988, 0.08, "square", 0.06);
    playTone(1319, 0.3, "square", 0.06, 0.08);
  },

  bump: () => {
    playTone(262, 0.08, "square", 0.06);
    playTone(196, 0.12, "square", 0.05, 0.06);
  },

  powerup: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => playTone(f, 0.12, "square", 0.05, i * 0.08));
  },

  pipe: () => {
    playTone(200, 0.15, "square", 0.06);
    playTone(280, 0.15, "square", 0.06, 0.1);
    playTone(350, 0.2, "square", 0.05, 0.2);
  },

  oneUp: () => {
    const notes = [330, 392, 523, 392, 523, 659];
    notes.forEach((f, i) => playTone(f, 0.1, "square", 0.05, i * 0.07));
  },

  fireball: () => {
    for (let i = 0; i < 8; i++) {
      playTone(800 - i * 80, 0.03, "sawtooth", 0.04, i * 0.025);
    }
  },

  stomp: () => {
    playTone(400, 0.06, "square", 0.07);
    playTone(200, 0.15, "triangle", 0.05, 0.05);
  },
};
