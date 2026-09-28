import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import anirudhCharThinking from "@/assets/anirudh-char-thinking.png";
import anirudhCharPointing from "@/assets/anirudh-char-pointing.png";
import anirudhPhoto from "@/assets/anirudh-photo-1.png";
import { Github, Linkedin, Mail, Download, ChevronDown } from "lucide-react";
import { marioSfx } from "@/lib/mario-sfx";

const roles = [
  "Data Specialist",
  "Data Analyst",
  "Python & SQL Expert",
  "Business Intelligence Analyst",
];

const stats = [
  { value: 2000000, suffix: "+", label: "Daily Records", prefix: "" },
  { value: 35, suffix: "%", label: "Error Reduction", prefix: "" },
  { value: 50, suffix: "K+", label: "Records Analyzed", prefix: "" },
];

const useCounter = (target: number, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

const formatNumber = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(0)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
};

const Cloud3D = ({ top, left, delay, size = 1 }: { top: string; left: string; delay: number; size?: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ top, left, transform: `scale(${size})`, zIndex: 5 }}
    animate={{ x: [0, 40, 0] }}
    transition={{ duration: 12, delay, repeat: Infinity, ease: "easeInOut" }}
  >
    <div className="flex items-end">
      <div className="w-8 h-8 rounded-full bg-white shadow-[inset_-3px_-3px_0_hsl(200,20%,85%),_0_3px_0_hsl(200,30%,80%)]" />
      <div className="w-14 h-14 rounded-full bg-white -ml-3 shadow-[inset_-4px_-4px_0_hsl(200,20%,85%),_0_3px_0_hsl(200,30%,80%)]" />
      <div className="w-10 h-10 rounded-full bg-white -ml-4 shadow-[inset_-3px_-3px_0_hsl(200,20%,85%),_0_3px_0_hsl(200,30%,80%)]" />
      <div className="w-7 h-7 rounded-full bg-white -ml-2 shadow-[inset_-2px_-2px_0_hsl(200,20%,85%),_0_3px_0_hsl(200,30%,80%)]" />
    </div>
  </motion.div>
);

const Hill = ({ left, width, height, color, z }: { left: string; width: number; height: number; color: string; z: number }) => (
  <div className="absolute bottom-16 pointer-events-none" style={{ left, zIndex: z }}>
    <div className="relative" style={{
      width, height,
      background: `linear-gradient(180deg, ${color} 0%, hsl(120 50% 25%) 100%)`,
      borderRadius: `${width / 2}px ${width / 2}px 0 0`,
      boxShadow: `inset -${Math.round(width / 8)}px 0 0 hsla(120 40% 20% / 0.3), inset ${Math.round(width / 10)}px 0 0 hsla(120 80% 50% / 0.2)`,
    }}>
      <div className="absolute top-[30%] left-[20%] w-3 h-4 rounded-full" style={{ background: "hsla(120 70% 55% / 0.4)", transform: "rotate(-20deg)" }} />
      <div className="absolute top-[40%] left-[60%] w-2 h-3 rounded-full" style={{ background: "hsla(120 70% 55% / 0.3)", transform: "rotate(15deg)" }} />
    </div>
  </div>
);

const Castle = () => (
  <div className="absolute bottom-16 right-[5%] pointer-events-none z-[4]" style={{ width: 120 }}>
    <div className="relative">
      <motion.div className="absolute -top-10 left-1/2 -translate-x-1/2" animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
        <div className="w-1 h-8" style={{ background: "hsl(25 60% 30%)" }} />
        <div className="absolute top-0 left-1 w-6 h-4" style={{ background: "hsl(0 80% 50%)", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
      </motion.div>
      <div className="flex justify-center gap-1 mb-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-5 h-6" style={{
            background: "linear-gradient(180deg, hsl(15 70% 50%), hsl(15 65% 40%))",
            boxShadow: "inset -2px 0 0 hsla(15 50% 30% / 0.5), inset 2px 0 0 hsla(15 80% 60% / 0.3)",
            borderTop: "2px solid hsl(15 80% 55%)",
          }} />
        ))}
      </div>
      <div className="relative" style={{
        width: 120, height: 80,
        background: "repeating-linear-gradient(90deg, transparent 0px, transparent 14px, hsl(15 40% 35%) 14px, hsl(15 40% 35%) 16px), repeating-linear-gradient(0deg, transparent 0px, transparent 9px, hsl(15 40% 35%) 9px, hsl(15 40% 35%) 11px), linear-gradient(180deg, hsl(15 70% 48%), hsl(15 60% 38%))",
        boxShadow: "inset -6px 0 0 hsla(15 40% 25% / 0.4), inset 6px 0 0 hsla(15 80% 55% / 0.2), 4px 4px 0 hsl(25 60% 20%)",
      }}>
        <div className="absolute top-3 left-4 w-8 h-10" style={{ background: "hsl(220 30% 15%)", boxShadow: "inset 2px 2px 0 hsla(220 30% 25% / 0.5)" }} />
        <div className="absolute top-3 right-4 w-8 h-10" style={{ background: "hsl(220 30% 15%)", boxShadow: "inset 2px 2px 0 hsla(220 30% 25% / 0.5)" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-14" style={{ background: "hsl(220 20% 10%)", borderRadius: "10px 10px 0 0" }} />
      </div>
    </div>
  </div>
);

// Interactive Pipe with plant growth on hover
const Pipe3D = ({ side, bottom, height = 60 }: { side: "left" | "right"; bottom: string; height?: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`absolute ${side === "left" ? "left-6 sm:left-14" : "right-6 sm:right-14"} z-[6] cursor-pointer`}
      style={{ bottom }}
      onMouseEnter={() => { setHovered(true); marioSfx.pipe(); }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Piranha Plant growing out */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="absolute flex flex-col items-center"
            style={{ bottom: height + 18, left: "50%", transform: "translateX(-50%)" }}
            initial={{ y: 40, opacity: 0, scaleY: 0 }}
            animate={{ y: 0, opacity: 1, scaleY: 1 }}
            exit={{ y: 40, opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Plant head */}
            <div className="relative">
              <div style={{
                width: 28, height: 18,
                background: "linear-gradient(180deg, hsl(0 75% 45%), hsl(0 70% 35%))",
                borderRadius: "50% 50% 0 0",
                border: "2px solid hsl(0 50% 25%)",
              }}>
                {/* Teeth dots */}
                <div className="absolute top-2 left-1 w-1.5 h-1.5 rounded-full" style={{ background: "hsl(0 0% 95%)" }} />
                <div className="absolute top-2 left-3.5 w-1.5 h-1.5 rounded-full" style={{ background: "hsl(0 0% 95%)" }} />
                <div className="absolute top-2 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "hsl(0 0% 95%)" }} />
              </div>
              {/* Lips */}
              <div style={{
                width: 32, height: 8, marginLeft: -2,
                background: "linear-gradient(180deg, hsl(0 80% 50%), hsl(0 70% 40%))",
                border: "2px solid hsl(0 50% 25%)",
                borderTop: "none",
              }}>
                <div className="flex justify-around pt-0.5">
                  <div className="w-1 h-1" style={{ background: "hsl(0 0% 90%)" }} />
                  <div className="w-1 h-1" style={{ background: "hsl(0 0% 90%)" }} />
                  <div className="w-1 h-1" style={{ background: "hsl(0 0% 90%)" }} />
                </div>
              </div>
            </div>
            {/* Stem */}
            <div style={{
              width: 8, height: 30,
              background: "linear-gradient(90deg, hsl(120 50% 30%), hsl(120 65% 42%), hsl(120 50% 30%))",
              border: "1px solid hsl(120 40% 22%)",
            }} />
            {/* Leaves */}
            <motion.div
              className="absolute top-[22px] -left-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: -30 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{
                width: 10, height: 6,
                background: "hsl(120 60% 40%)",
                borderRadius: "50%",
                border: "1px solid hsl(120 40% 25%)",
              }} />
            </motion.div>
            <motion.div
              className="absolute top-[30px] -right-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 30 }}
              transition={{ delay: 0.3 }}
            >
              <div style={{
                width: 10, height: 6,
                background: "hsl(120 60% 38%)",
                borderRadius: "50%",
                border: "1px solid hsl(120 40% 25%)",
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipe top */}
      <div style={{
        width: 56, height: 20, marginLeft: -8,
        background: "linear-gradient(90deg, hsl(120 45% 28%), hsl(120 65% 42%), hsl(120 70% 50%), hsl(120 65% 42%), hsl(120 45% 28%))",
        border: "3px solid hsl(120 35% 22%)", borderRadius: "4px 4px 0 0",
        transition: "all 0.2s",
        boxShadow: hovered ? "0 0 16px hsla(120 70% 50% / 0.5)" : "none",
      }} />
      {/* Pipe body */}
      <div style={{
        width: 40, height,
        background: "linear-gradient(90deg, hsl(120 45% 25%), hsl(120 60% 38%), hsl(120 65% 45%), hsl(120 60% 38%), hsl(120 45% 25%))",
        border: "3px solid hsl(120 35% 22%)", borderTop: "none",
        boxShadow: hovered
          ? "4px 4px 0 hsl(25 60% 20%), 0 0 20px hsla(120 70% 50% / 0.3)"
          : "4px 4px 0 hsl(25 60% 20%)",
        transition: "box-shadow 0.2s",
      }} />
    </div>
  );
};

// Interactive Question Block - bumps on click, shows item
const QuestionBlock = ({ top, left, delay }: { top: string; left: string; delay: number }) => {
  const [hit, setHit] = useState(false);
  const [showItem, setShowItem] = useState(false);
  const [itemType] = useState(() => Math.random() > 0.5 ? "coin" : "mushroom");

  const handleClick = useCallback(() => {
    if (hit) return;
    setHit(true);
    setShowItem(true);
    window.dispatchEvent(new CustomEvent("mario-coin"));
    if (itemType === "coin") {
      marioSfx.coin();
    } else {
      marioSfx.powerup();
    }
    setTimeout(() => setShowItem(false), 1200);
    setTimeout(() => setHit(false), 300);
  }, [hit, itemType]);

  return (
    <motion.div
      className="absolute z-[3] cursor-pointer select-none"
      style={{ top, left }}
      animate={hit ? { y: [0, -12, 0] } : { y: [0, -6, 0] }}
      transition={hit ? { duration: 0.15 } : { duration: 3, delay, repeat: Infinity }}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
    >
      {/* Floating item */}
      <AnimatePresence>
        {showItem && (
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2"
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -50, opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {itemType === "coin" ? (
              <div className="flex items-center justify-center" style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, hsl(50 100% 70%), hsl(45 100% 50%))",
                border: "2px solid hsl(35 80% 40%)",
                boxShadow: "0 0 12px hsla(45 100% 50% / 0.6)",
              }}>
                <span className="text-[7px] font-bold" style={{ color: "hsl(25 60% 20%)" }}>$</span>
              </div>
            ) : (
              <div className="text-xl">🍄</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center" style={{
        width: 32, height: 32,
        background: hit
          ? "linear-gradient(180deg, hsl(30 40% 45%), hsl(25 35% 35%))"
          : "linear-gradient(180deg, hsl(45 100% 60%), hsl(40 90% 45%))",
        border: "3px solid hsl(25 70% 35%)",
        boxShadow: "inset -3px -3px 0 hsla(25 70% 30% / 0.5), inset 3px 3px 0 hsla(45 100% 70% / 0.5), 3px 3px 0 hsl(25 60% 20%)",
        transition: "background 0.15s",
      }}>
        <span className="font-heading text-[10px] font-bold" style={{ color: "hsl(25 60% 25%)" }}>
          {hit ? "" : "?"}
        </span>
      </div>
    </motion.div>
  );
};

// Interactive Brick Block - shakes on click
const BrickBlock = ({ top, left }: { top: string; left: string }) => {
  const [hit, setHit] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  const handleClick = () => {
    setHit(true);
    marioSfx.bump();
    setParticles([1, 2, 3, 4]);
    setTimeout(() => setHit(false), 200);
    setTimeout(() => setParticles([]), 600);
  };

  return (
    <motion.div
      className="absolute z-[3] cursor-pointer select-none"
      style={{ top, left }}
      animate={hit ? { y: [0, -6, 0], rotate: [0, -2, 2, 0] } : {}}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
    >
      {/* Brick particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p}
            className="absolute"
            initial={{ x: 16, y: 16, opacity: 1 }}
            animate={{
              x: 16 + (p % 2 === 0 ? 1 : -1) * (20 + Math.random() * 15),
              y: -20 - Math.random() * 30,
              opacity: 0,
              rotate: Math.random() * 360,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{
              width: 6, height: 6,
              background: "hsl(15 70% 48%)",
              border: "1px solid hsl(15 40% 30%)",
            }} />
          </motion.div>
        ))}
      </AnimatePresence>

      <div style={{
        width: 32, height: 32,
        background: "repeating-linear-gradient(90deg, transparent 0px, transparent 13px, hsl(15 40% 35%) 13px, hsl(15 40% 35%) 15px), repeating-linear-gradient(0deg, transparent 0px, transparent 6px, hsl(15 40% 35%) 6px, hsl(15 40% 35%) 8px), linear-gradient(180deg, hsl(15 70% 50%), hsl(15 60% 42%))",
        border: "2px solid hsl(15 40% 30%)",
        boxShadow: "inset -2px -2px 0 hsla(15 40% 25% / 0.4), inset 2px 2px 0 hsla(15 80% 60% / 0.3), 3px 3px 0 hsl(25 60% 20%)",
      }} />
    </motion.div>
  );
};

// Interactive Coin - collectable on click
const Coin = ({ top, left, delay }: { top: string; left: string; delay: number }) => {
  const [collected, setCollected] = useState(false);
  const [showScore, setShowScore] = useState(false);

  const handleClick = () => {
    if (collected) return;
    marioSfx.coin();
    setCollected(true);
    setShowScore(true);
    window.dispatchEvent(new CustomEvent("mario-coin"));
    setTimeout(() => setShowScore(false), 1000);
    setTimeout(() => setCollected(false), 3000); // respawn after 3s
  };

  return (
    <motion.div
      className="absolute z-[5] cursor-pointer select-none"
      style={{ top, left }}
      animate={collected ? {} : { rotateY: [0, 180, 360], y: [0, -5, 0] }}
      transition={{ duration: 2, delay, repeat: collected ? 0 : Infinity }}
      onClick={handleClick}
      whileHover={{ scale: 1.3 }}
    >
      {/* Score popup */}
      <AnimatePresence>
        {showScore && (
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -40, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-heading text-[10px] font-bold" style={{
              color: "hsl(45 100% 60%)",
              textShadow: "1px 1px 0 hsl(25 60% 20%)",
            }}>+200</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex items-center justify-center"
        animate={collected ? { scale: [1, 1.5, 0], y: -30 } : {}}
        transition={{ duration: 0.3 }}
        style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, hsl(50 100% 70%), hsl(45 100% 50%), hsl(40 90% 40%))",
          border: "2px solid hsl(35 80% 40%)",
          boxShadow: "0 0 8px hsla(45 100% 50% / 0.4)",
          opacity: collected && !showScore ? 0 : 1,
        }}
      >
        <span className="text-[8px] font-bold" style={{ color: "hsl(25 60% 20%)" }}>$</span>
      </motion.div>
    </motion.div>
  );
};

const HeroSection = () => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const current = roles[roleIndex];
    let timeout: NodeJS.Timeout;
    if (!deleting) {
      if (displayed.length < current.length) {
        timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60);
      } else {
        timeout = setTimeout(() => setDeleting(true), 2000);
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
      } else {
        setDeleting(false);
        setRoleIndex((i) => (i + 1) % roles.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, roleIndex]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      style={{ background: "linear-gradient(180deg, hsl(210 85% 72%) 0%, hsl(210 80% 65%) 30%, hsl(210 75% 58%) 60%, hsl(210 70% 50%) 100%)" }}>
      
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 20%, hsla(45 100% 90% / 0.15) 0%, transparent 60%)" }} />

      <Cloud3D top="6%" left="3%" delay={0} size={0.7} />
      <Cloud3D top="12%" left="55%" delay={2} size={1.3} />
      <Cloud3D top="22%" left="25%" delay={4} size={0.5} />
      <Cloud3D top="5%" left="78%" delay={1} size={0.9} />
      <Cloud3D top="18%" left="85%" delay={3} size={0.6} />

      <QuestionBlock top="35%" left="8%" delay={0} />
      <BrickBlock top="35%" left="calc(8% + 34px)" />
      <QuestionBlock top="35%" left="calc(8% + 68px)" delay={0.5} />
      <QuestionBlock top="28%" left="70%" delay={1} />
      <BrickBlock top="28%" left="calc(70% + 34px)" />
      <BrickBlock top="28%" left="calc(70% + 68px)" />

      <Coin top="28%" left="12%" delay={0} />
      <Coin top="22%" left="calc(8% + 34px)" delay={0.3} />
      <Coin top="21%" left="74%" delay={0.7} />

      <Hill left="-5%" width={300} height={140} color="hsl(120 55% 38%)" z={1} />
      <Hill left="25%" width={200} height={100} color="hsl(120 50% 35%)" z={1} />
      <Hill left="60%" width={250} height={120} color="hsl(120 55% 40%)" z={1} />
      <Hill left="10%" width={180} height={80} color="hsl(120 65% 42%)" z={2} />
      <Hill left="45%" width={220} height={95} color="hsl(120 60% 45%)" z={2} />
      <Hill left="75%" width={160} height={70} color="hsl(120 65% 40%)" z={2} />

      <Castle />
      <Pipe3D side="left" bottom="64px" height={70} />
      <Pipe3D side="right" bottom="64px" height={50} />

      {/* Character pose - left side (no photo frame) */}

      {/* Character pose - left side */}
      <motion.div 
        className="absolute bottom-24 left-[6%] sm:left-[10%] z-[7] hidden lg:block"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
      >
        <motion.img 
          src={anirudhCharThinking} 
          alt="Anirudh pixel character pose" 
          className="w-32 lg:w-40 pointer-events-none"
          style={{ 
            imageRendering: "pixelated",
            filter: "drop-shadow(6px 6px 0 hsla(25, 60%, 15%, 0.6))",
          }} 
          animate={{ y: [0, -8, 0] }} 
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeInOut" }} 
        />
      </motion.div>

      {/* 3D Ground */}
      <div className="absolute bottom-0 left-0 right-0 z-[3]">
        <div style={{ height: 4, background: "linear-gradient(90deg, hsl(120 65% 42%), hsl(120 70% 48%), hsl(120 65% 42%))" }} />
        <div style={{ height: 64, background: "repeating-linear-gradient(90deg, transparent 0px, transparent 28px, hsl(15 40% 32%) 28px, hsl(15 40% 32%) 30px), repeating-linear-gradient(0deg, transparent 0px, transparent 14px, hsl(15 40% 32%) 14px, hsl(15 40% 32%) 16px), linear-gradient(180deg, hsl(15 70% 48%), hsl(15 55% 35%))", borderTop: "4px solid hsl(25 60% 25%)", boxShadow: "inset 0 4px 0 hsla(15 80% 55% / 0.3)" }} />
      </div>

      {/* Main content */}
      <div ref={ref} className="section-container text-center relative z-10">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-accent font-heading text-[8px] sm:text-[10px] mb-6 tracking-widest uppercase drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">
          ⭐ Welcome to my world ⭐
        </motion.p>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="font-heading text-2xl sm:text-4xl lg:text-5xl font-bold mb-8 leading-relaxed" style={{ color: "hsl(0 0% 100%)", textShadow: "4px 4px 0 hsl(0 80% 40%), -1px -1px 0 hsl(0 80% 40%), 1px -1px 0 hsl(0 80% 40%), -1px 1px 0 hsl(0 80% 40%)" }}>
          ANIRUDH<br />SHARMA
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-xl sm:text-2xl mb-10 h-8" style={{ fontFamily: "'VT323', monospace" }}>
          <span className="text-foreground drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">{displayed}</span>
          <span className="animate-pulse text-accent">_</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10">
          {stats.map((s, i) => {
            const count = useCounter(s.value, 2000, inView);
            return (
              <motion.div
                key={i}
                className="p-4 sm:p-6 text-center cursor-pointer"
                style={{
                  background: "linear-gradient(180deg, hsl(45 100% 60%), hsl(40 90% 45%))",
                  border: "4px solid hsl(25 70% 35%)",
                  boxShadow: "inset -4px -4px 0 hsla(25 70% 30% / 0.5), inset 4px 4px 0 hsla(45 100% 70% / 0.5), 4px 4px 0 hsl(25 60% 20%)",
                }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                whileHover={{ scale: 1.1, rotate: [-1, 1, 0] }}
                onHoverStart={() => marioSfx.coin()}
              >
                <div className="font-heading text-sm sm:text-lg font-bold" style={{ color: "hsl(25 60% 20%)" }}>{s.prefix}{formatNumber(count)}{s.suffix}</div>
                <div className="text-xs mt-1" style={{ color: "hsl(25 50% 30%)", fontFamily: "'VT323', monospace", fontSize: "0.9rem" }}>{s.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex flex-wrap justify-center gap-4 mb-10">
          <motion.a
            href="#projects"
            className="glow-button inline-flex items-center gap-2 px-8 py-3 font-bold text-foreground hover:opacity-90 transition"
            style={{ fontFamily: "'VT323', monospace", fontSize: "1.3rem" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => marioSfx.powerup()}
          >
            🍄 View Projects
          </motion.a>
          <motion.a
            href="/Anirudh_Sharma_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="glow-ring inline-flex items-center gap-2 px-8 py-3 font-bold bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground transition"
            style={{ fontFamily: "'VT323', monospace", fontSize: "1.3rem" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => marioSfx.oneUp()}
          >
            <Download size={18} /> Download Resume
          </motion.a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex justify-center gap-6">
          {[
            { icon: Linkedin, href: "https://www.linkedin.com/in/-anirudh-sharma/", label: "LinkedIn" },
            { icon: Github, href: "https://github.com/aniiiii05", label: "GitHub" },
            { icon: Mail, href: "mailto:sharma.aniiirudh@gmail.com", label: "Email" },
          ].map(({ icon: Icon, href, label }) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 flex items-center justify-center text-accent-foreground transition-all"
              style={{
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, hsl(50 100% 70%), hsl(45 100% 50%))",
                border: "3px solid hsl(35 80% 40%)",
                boxShadow: "inset -2px -2px 0 hsla(35 70% 30% / 0.4), 0 0 12px hsla(45 100% 50% / 0.3)",
              }}
              whileHover={{ scale: 1.2, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onHoverStart={() => marioSfx.stomp()}
            >
              <Icon size={18} />
            </motion.a>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <ChevronDown className="animate-bounce text-accent" size={24} />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
