import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mario theme melody notes (frequency, duration in ms)
const MARIO_THEME: [number, number][] = [
  [659, 150], [659, 150], [0, 150], [659, 150], [0, 150], [523, 150], [659, 150], [0, 150],
  [784, 150], [0, 450], [392, 150], [0, 450],
  [523, 150], [0, 300], [392, 150], [0, 300], [330, 150], [0, 300],
  [440, 150], [0, 150], [494, 150], [0, 150], [466, 150], [440, 150], [0, 150],
  [392, 200], [659, 200], [784, 200], [880, 150], [0, 150],
  [698, 150], [784, 150], [0, 150], [659, 150], [0, 150],
  [523, 150], [587, 150], [494, 150], [0, 300],
  [523, 150], [0, 300], [392, 150], [0, 300], [330, 150], [0, 300],
  [440, 150], [0, 150], [494, 150], [0, 150], [466, 150], [440, 150], [0, 150],
  [392, 200], [659, 200], [784, 200], [880, 150], [0, 150],
  [698, 150], [784, 150], [0, 150], [659, 150], [0, 150],
  [523, 150], [587, 150], [494, 150], [0, 300],
];

const MarioMusic = () => {
  const [playing, setPlaying] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const timeoutIds = useRef<NodeJS.Timeout[]>([]);

  const playNote = useCallback((ctx: AudioContext, freq: number, startTime: number, duration: number) => {
    if (freq === 0) return; // rest
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "square";
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration / 1000 - 0.01);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration / 1000);
  }, []);

  const playMelody = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    isPlayingRef.current = true;

    const playLoop = () => {
      if (!isPlayingRef.current) return;
      const now = ctx.currentTime;
      let offset = 0;

      MARIO_THEME.forEach(([freq, dur]) => {
        playNote(ctx, freq, now + offset / 1000, dur);
        offset += dur;
      });

      // Schedule next loop
      const totalDuration = MARIO_THEME.reduce((sum, [, d]) => sum + d, 0);
      const tid = setTimeout(() => {
        if (isPlayingRef.current) playLoop();
      }, totalDuration);
      timeoutIds.current.push(tid);
    };

    playLoop();
  }, [playNote]);

  const stopMelody = useCallback(() => {
    isPlayingRef.current = false;
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (playing) {
      stopMelody();
      setPlaying(false);
    } else {
      playMelody();
      setPlaying(true);
      setShowPrompt(false);
    }
  }, [playing, playMelody, stopMelody]);

  const startMusic = useCallback(() => {
    playMelody();
    setPlaying(true);
    setShowPrompt(false);
  }, [playMelody]);

  useEffect(() => {
    return () => {
      stopMelody();
    };
  }, [stopMelody]);

  return (
    <>
      {/* Click-to-start overlay */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
            style={{ background: "hsla(210 75% 20% / 0.85)" }}
            onClick={startMusic}
          >
            <motion.div
              className="text-center p-8"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="text-6xl mb-6">🍄</div>
              <h2
                className="font-heading text-sm sm:text-lg text-accent mb-4 drop-shadow-[3px_3px_0_hsl(25,60%,20%)]"
              >
                PRESS START
              </h2>
              <p
                className="text-foreground text-lg"
                style={{ fontFamily: "'VT323', monospace", fontSize: "1.4rem" }}
              >
                Click anywhere to begin your adventure!
              </p>
              <motion.div
                className="mt-6 inline-block px-6 py-3"
                style={{
                  background: "linear-gradient(180deg, hsl(45 100% 60%), hsl(40 90% 45%))",
                  border: "4px solid hsl(25 70% 35%)",
                  boxShadow: "inset -3px -3px 0 hsla(25 70% 30% / 0.5), inset 3px 3px 0 hsla(45 100% 70% / 0.5), 4px 4px 0 hsl(25 60% 20%)",
                  fontFamily: "'VT323', monospace",
                  fontSize: "1.3rem",
                  color: "hsl(25 60% 20%)",
                }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎮 START GAME
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute/unmute toggle button */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 right-6 z-[60] w-12 h-12 flex items-center justify-center transition-all hover:scale-110"
        style={{
          borderRadius: "50%",
          background: playing
            ? "radial-gradient(circle at 35% 35%, hsl(50 100% 70%), hsl(45 100% 50%))"
            : "hsl(25 55% 35%)",
          border: "3px solid hsl(35 80% 40%)",
          boxShadow: "3px 3px 0 hsl(25 60% 20%)",
          color: playing ? "hsl(25 60% 20%)" : "hsl(45 100% 50%)",
        }}
        title={playing ? "Mute music" : "Play music"}
      >
        {playing ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </>
  );
};

export default MarioMusic;
