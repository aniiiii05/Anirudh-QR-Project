import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Github, Linkedin, Mail, ArrowUp } from "lucide-react";
import { marioSfx } from "@/lib/mario-sfx";

const Firework = ({ delay, x }: { delay: number; x: string }) => (
  <motion.div
    className="absolute"
    style={{ left: x, bottom: "60%" }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0, 0.5, 1.5, 2],
      y: [0, -60, -120, -160],
    }}
    transition={{ duration: 2, delay, repeat: Infinity, repeatDelay: 3 }}
  >
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <motion.div
        key={angle}
        className="absolute w-2 h-2 rounded-full"
        style={{
          background: `hsl(${angle} 80% 60%)`,
          boxShadow: `0 0 6px hsl(${angle} 80% 60%)`,
        }}
        animate={{
          x: Math.cos((angle * Math.PI) / 180) * 30,
          y: Math.sin((angle * Math.PI) / 180) * 30,
          opacity: [1, 0],
        }}
        transition={{ duration: 1, delay: delay + 0.5, repeat: Infinity, repeatDelay: 4 }}
      />
    ))}
  </motion.div>
);

const CastleVictory = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    if (inView) {
      setTimeout(() => {
        setShowClear(true);
        marioSfx.oneUp();
      }, 500);
    }
  }, [inView]);

  return (
    <footer ref={ref} className="relative overflow-hidden" style={{ background: "hsl(0 10% 8%)" }}>
      {/* Castle structure */}
      <div className="relative min-h-[400px]">
        {/* Starry sky background */}
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() > 0.8 ? 3 : 2,
                height: Math.random() > 0.8 ? 3 : 2,
                background: "hsl(0 0% 90%)",
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.5 + Math.random() * 2, delay: Math.random() * 3, repeat: Infinity }}
            />
          ))}
        </div>

        {/* Fireworks */}
        <Firework delay={0} x="20%" />
        <Firework delay={1} x="50%" />
        <Firework delay={2} x="80%" />
        <Firework delay={1.5} x="35%" />
        <Firework delay={2.5} x="65%" />

        {/* Castle building */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: 300 }}>
          {/* Flag */}
          <motion.div
            className="absolute -top-16 left-1/2 -translate-x-1/2"
            initial={{ y: 40, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="w-1 h-20" style={{ background: "hsl(0 0% 80%)" }} />
            <motion.div
              className="absolute top-0 left-1"
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-8 h-6" style={{
                background: "linear-gradient(180deg, hsl(0 80% 50%) 50%, hsl(0 0% 100%) 50%)",
                clipPath: "polygon(0 0, 100% 25%, 0 50%, 0 100%, 100% 75%, 0 50%)",
              }} />
            </motion.div>
          </motion.div>

          {/* Battlements */}
          <div className="flex justify-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                width: 25, height: i % 2 === 0 ? 32 : 20,
                background: "repeating-linear-gradient(90deg, transparent 0px, transparent 11px, hsl(0 10% 18%) 11px, hsl(0 10% 18%) 12px), repeating-linear-gradient(0deg, transparent 0px, transparent 8px, hsl(0 10% 18%) 8px, hsl(0 10% 18%) 9px), linear-gradient(180deg, hsl(0 15% 30%), hsl(0 10% 20%))",
              }} />
            ))}
          </div>

          {/* Main wall */}
          <div className="relative" style={{
            width: 300, height: 140,
            background: "repeating-linear-gradient(90deg, transparent 0px, transparent 22px, hsl(0 10% 15%) 22px, hsl(0 10% 15%) 24px), repeating-linear-gradient(0deg, transparent 0px, transparent 12px, hsl(0 10% 15%) 12px, hsl(0 10% 15%) 14px), linear-gradient(180deg, hsl(0 12% 28%), hsl(0 8% 18%))",
            boxShadow: "inset -8px 0 0 hsla(0 0% 0% / 0.3), inset 8px 0 0 hsla(0 20% 40% / 0.2)",
          }}>
            {/* Windows */}
            <div className="absolute top-4 left-8 w-10 h-12" style={{ background: "hsl(220 30% 12%)", boxShadow: "inset 2px 2px 0 hsla(220 30% 20% / 0.5)" }} />
            <div className="absolute top-4 right-8 w-10 h-12" style={{ background: "hsl(220 30% 12%)", boxShadow: "inset 2px 2px 0 hsla(220 30% 20% / 0.5)" }} />
            {/* Door */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-20" style={{ background: "hsl(220 20% 8%)", borderRadius: "14px 14px 0 0" }}>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={inView ? { opacity: [0, 1] } : {}}
                transition={{ delay: 1.5 }}
              >
                <span className="text-2xl">⭐</span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* COURSE CLEAR text */}
        {showClear && (
          <motion.div
            className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-center"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <h2
              className="text-xl sm:text-2xl mb-2"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                color: "hsl(45 100% 50%)",
                textShadow: "3px 3px 0 hsl(25 60% 20%), -1px -1px 0 hsl(25 60% 20%)",
              }}
            >
              COURSE CLEAR!
            </h2>
            <motion.p
              className="text-sm sm:text-base"
              style={{ fontFamily: "'VT323', monospace", color: "hsl(0 0% 85%)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              You've reached the end of the adventure! 🏰
            </motion.p>
          </motion.div>
        )}

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0" style={{
          height: 32,
          background: "repeating-linear-gradient(90deg, transparent 0px, transparent 28px, hsl(15 40% 22%) 28px, hsl(15 40% 22%) 30px), repeating-linear-gradient(0deg, transparent 0px, transparent 14px, hsl(15 40% 22%) 14px, hsl(15 40% 22%) 16px), linear-gradient(180deg, hsl(15 50% 32%), hsl(15 40% 22%))",
        }}>
          <div className="absolute -top-1 left-0 right-0 h-1" style={{ background: "hsl(120 40% 25%)" }} />
        </div>
      </div>

      {/* Footer content overlay */}
      <div className="relative z-10 py-6 px-4" style={{ background: "hsla(0 0% 0% / 0.7)" }}>
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold" style={{
            fontFamily: "'VT323', monospace",
            fontSize: "1.1rem",
            color: "hsl(45 100% 50%)",
            textShadow: "1px 1px 0 hsl(25 60% 20%)",
          }}>
            © 2025 Anirudh Sharma — THANK YOU MARIO! 🍄
          </p>

          <div className="flex items-center gap-4">
            {[
              { icon: Linkedin, href: "https://www.linkedin.com/in/-anirudh-sharma/" },
              { icon: Github, href: "https://github.com/aniiiii05" },
              { icon: Mail, href: "mailto:sharma.aniiirudh@gmail.com" },
            ].map(({ icon: Icon, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition"
                style={{
                  background: "radial-gradient(circle at 35% 35%, hsl(50 100% 70%), hsl(45 100% 50%))",
                  border: "2px solid hsl(35 80% 40%)",
                  color: "hsl(25 60% 20%)",
                }}
              >
                <Icon size={16} />
              </a>
            ))}

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-10 h-10 flex items-center justify-center hover:scale-110 transition ml-2"
              style={{
                background: "hsl(120 65% 38%)",
                border: "3px solid hsl(120 40% 25%)",
                color: "hsl(0 0% 100%)",
              }}
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CastleVictory;
