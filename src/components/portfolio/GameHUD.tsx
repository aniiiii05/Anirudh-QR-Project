import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const GameHUD = () => {
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [currentWorld, setCurrentWorld] = useState("1-1");
  const [time, setTime] = useState(999);
  const [scrollProgress, setScrollProgress] = useState(0);

  const worldMap: Record<string, string> = {
    "": "1-1",
    about: "1-2",
    skills: "2-1",
    experience: "3-1",
    projects: "4-1",
    achievements: "5-1",
    contact: "8-4",
  };

  // Listen for coin collection events
  useEffect(() => {
    const handleCoin = () => {
      setScore((s) => s + 200);
      setCoins((c) => c + 1);
    };
    window.addEventListener("mario-coin", handleCoin);
    return () => window.removeEventListener("mario-coin", handleCoin);
  }, []);

  // Track current section/world + scroll progress
  useEffect(() => {
    const onScroll = () => {
      // Progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min((window.scrollY / docHeight) * 100, 100) : 0);

      // World tracking
      const sections = Object.keys(worldMap);
      for (const id of [...sections].reverse()) {
        if (id === "") {
          setCurrentWorld("1-1");
          continue;
        }
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 300) {
          setCurrentWorld(worldMap[id]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 999));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed top-0 left-0 right-0 z-[55] pointer-events-none"
    >
      <div
        className="flex items-center justify-between px-4 sm:px-8 py-2"
        style={{
          background: "hsla(0 0% 0% / 0.75)",
          fontFamily: "'Press Start 2P', cursive",
          fontSize: "0.55rem",
          color: "hsl(0 0% 100%)",
          letterSpacing: "1px",
        }}
      >
        <div className="text-center">
          <div className="text-[0.45rem] sm:text-[0.55rem] opacity-80">ANIRUDH</div>
          <div className="text-[0.5rem] sm:text-[0.6rem]">{String(score).padStart(7, "0")}</div>
        </div>
        <div className="text-center flex items-center gap-1">
          <span className="text-[0.55rem]" style={{ color: "hsl(45 100% 50%)" }}>●</span>
          <span className="text-[0.5rem] sm:text-[0.6rem]">x{String(coins).padStart(2, "0")}</span>
        </div>
        <div className="text-center">
          <div className="text-[0.45rem] sm:text-[0.55rem] opacity-80">WORLD</div>
          <div className="text-[0.5rem] sm:text-[0.6rem]">{currentWorld}</div>
        </div>
        <div className="text-center">
          <div className="text-[0.45rem] sm:text-[0.55rem] opacity-80">TIME</div>
          <div className="text-[0.5rem] sm:text-[0.6rem]">{time}</div>
        </div>
      </div>
      {/* Scroll progress bar */}
      <div className="w-full h-3 relative" style={{ background: "hsla(0 0% 100% / 0.15)" }}>
        <motion.div
          className="h-full"
          style={{
            width: `${scrollProgress}%`,
            background: "linear-gradient(90deg, hsl(120 100% 40%), hsl(45 100% 50%), hsl(0 100% 50%))",
          }}
          transition={{ duration: 0.1 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: `${scrollProgress}%`,
            transform: `translateX(-50%) translateY(-50%)`,
            fontSize: "0.75rem",
            lineHeight: 1,
            filter: "drop-shadow(0 0 2px hsla(0 0% 0% / 0.8))",
          }}
        >
          🏃
        </div>
      </div>
    </motion.div>
  );
};

export default GameHUD;
