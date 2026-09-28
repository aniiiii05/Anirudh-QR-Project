import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { marioSfx } from "@/lib/mario-sfx";

type EnemyType = "goomba" | "koopa" | "piranha" | "bob-omb";

interface EnemyProps {
  type: EnemyType;
  x: string;
  y?: string;
  bottom?: string;
  direction?: "left" | "right";
  walkRange?: number;
  delay?: number;
  size?: number;
}

const Goomba = ({ size = 1 }: { size: number }) => (
  <div style={{ transform: `scale(${size})`, width: 32, height: 32 }}>
    {/* Head */}
    <div style={{
      width: 32, height: 18,
      background: "linear-gradient(180deg, hsl(25 70% 40%), hsl(25 60% 30%))",
      borderRadius: "50% 50% 0 0",
      border: "2px solid hsl(25 40% 20%)",
      position: "relative",
    }}>
      {/* Eyes */}
      <div style={{ position: "absolute", bottom: 2, left: 5, display: "flex", gap: 6 }}>
        <div style={{ width: 6, height: 7, background: "hsl(0 0% 100%)", borderRadius: "50%", position: "relative" }}>
          <div style={{ width: 3, height: 3, background: "hsl(0 0% 0%)", borderRadius: "50%", position: "absolute", bottom: 1, right: 0 }} />
        </div>
        <div style={{ width: 6, height: 7, background: "hsl(0 0% 100%)", borderRadius: "50%", position: "relative" }}>
          <div style={{ width: 3, height: 3, background: "hsl(0 0% 0%)", borderRadius: "50%", position: "absolute", bottom: 1, left: 0 }} />
        </div>
      </div>
      {/* Eyebrows */}
      <div style={{ position: "absolute", top: 3, left: 4, width: 10, height: 2, background: "hsl(25 40% 20%)", transform: "rotate(15deg)" }} />
      <div style={{ position: "absolute", top: 3, right: 4, width: 10, height: 2, background: "hsl(25 40% 20%)", transform: "rotate(-15deg)" }} />
    </div>
    {/* Body */}
    <div style={{
      width: 24, height: 10, marginLeft: 4,
      background: "linear-gradient(180deg, hsl(35 50% 45%), hsl(35 40% 35%))",
      border: "2px solid hsl(25 40% 20%)",
      borderTop: "none",
    }} />
    {/* Feet */}
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: -1 }}>
      <div style={{ width: 12, height: 6, background: "hsl(25 30% 20%)", borderRadius: "0 0 4px 4px", border: "1px solid hsl(25 20% 12%)" }} />
      <div style={{ width: 12, height: 6, background: "hsl(25 30% 20%)", borderRadius: "0 0 4px 4px", border: "1px solid hsl(25 20% 12%)" }} />
    </div>
  </div>
);

const KoopaTroopa = ({ size = 1 }: { size: number }) => (
  <div style={{ transform: `scale(${size})`, width: 28, height: 38 }}>
    {/* Head */}
    <div style={{
      width: 16, height: 14, marginLeft: 6,
      background: "linear-gradient(180deg, hsl(50 70% 55%), hsl(50 60% 45%))",
      borderRadius: "50% 50% 0 0",
      border: "2px solid hsl(50 40% 30%)",
      position: "relative",
    }}>
      <div style={{ position: "absolute", bottom: 2, left: 2, width: 4, height: 5, background: "hsl(0 0% 100%)", borderRadius: "50%" }}>
        <div style={{ width: 2, height: 2, background: "hsl(0 0% 0%)", borderRadius: "50%", position: "absolute", bottom: 1, right: 0 }} />
      </div>
    </div>
    {/* Shell */}
    <div style={{
      width: 28, height: 20,
      background: "linear-gradient(180deg, hsl(120 60% 40%), hsl(120 50% 30%))",
      borderRadius: "6px 6px 50% 50%",
      border: "2px solid hsl(120 40% 20%)",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 3, left: 4, width: 20, height: 12,
        background: "hsl(50 60% 50%)",
        borderRadius: "4px",
        border: "1px solid hsl(50 40% 35%)",
      }} />
    </div>
    {/* Feet */}
    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: -1 }}>
      <div style={{ width: 10, height: 5, background: "hsl(30 50% 50%)", borderRadius: "0 0 3px 3px", border: "1px solid hsl(30 30% 30%)" }} />
      <div style={{ width: 10, height: 5, background: "hsl(30 50% 50%)", borderRadius: "0 0 3px 3px", border: "1px solid hsl(30 30% 30%)" }} />
    </div>
  </div>
);

const BobOmb = ({ size = 1 }: { size: number }) => (
  <div style={{ transform: `scale(${size})`, width: 28, height: 32 }}>
    {/* Fuse */}
    <div style={{ width: 2, height: 8, marginLeft: 13, background: "hsl(30 40% 40%)" }}>
      <motion.div
        style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(45 100% 60%)", marginLeft: -2, marginTop: -3 }}
        animate={{ opacity: [1, 0.3, 1], scale: [1, 0.7, 1] }}
        transition={{ duration: 0.4, repeat: Infinity }}
      />
    </div>
    {/* Body */}
    <div style={{
      width: 28, height: 22,
      background: "linear-gradient(180deg, hsl(220 20% 20%), hsl(220 15% 12%))",
      borderRadius: "50%",
      border: "2px solid hsl(220 10% 8%)",
      position: "relative",
    }}>
      {/* Eyes */}
      <div style={{ position: "absolute", top: 5, left: 5, width: 5, height: 5, background: "hsl(0 0% 100%)", borderRadius: "50%" }}>
        <div style={{ width: 2, height: 2, background: "hsl(0 0% 0%)", borderRadius: "50%", position: "absolute", bottom: 1, right: 0 }} />
      </div>
      {/* Wind-up key */}
      <div style={{ position: "absolute", right: -6, top: 6, width: 8, height: 4, background: "hsl(45 80% 50%)", border: "1px solid hsl(45 60% 35%)", borderRadius: 2 }} />
    </div>
    {/* Feet */}
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: -2 }}>
      <div style={{ width: 8, height: 5, background: "hsl(30 50% 50%)", borderRadius: "0 0 3px 3px" }} />
      <div style={{ width: 8, height: 5, background: "hsl(30 50% 50%)", borderRadius: "0 0 3px 3px" }} />
    </div>
  </div>
);

const FlatGoomba = () => (
  <div style={{ width: 32, height: 6, background: "hsl(25 50% 35%)", borderRadius: 2, opacity: 0.7 }} />
);

const ShellOnly = () => (
  <motion.div
    animate={{ x: [0, 200, 0], rotate: [0, 720, 0] }}
    transition={{ duration: 3, repeat: Infinity }}
    style={{
      width: 20, height: 16,
      background: "linear-gradient(180deg, hsl(120 60% 40%), hsl(120 50% 30%))",
      borderRadius: "50%",
      border: "2px solid hsl(120 40% 20%)",
    }}
  />
);

const Enemy = ({ type, x, y, bottom, direction = "right", walkRange = 60, delay = 0, size = 1 }: EnemyProps) => {
  const [stomped, setStomped] = useState(false);
  const [showScore, setShowScore] = useState(false);

  const handleStomp = useCallback(() => {
    if (stomped) return;
    marioSfx.stomp();
    setStomped(true);
    setShowScore(true);
    window.dispatchEvent(new CustomEvent("mario-coin"));
    setTimeout(() => setShowScore(false), 1000);
    setTimeout(() => setStomped(false), 5000); // respawn after 5s
  }, [stomped]);

  const posStyle: React.CSSProperties = { left: x };
  if (bottom) posStyle.bottom = bottom;
  if (y) posStyle.top = y;

  return (
    <motion.div
      className="absolute z-[4] cursor-pointer select-none"
      style={posStyle}
      onClick={handleStomp}
      whileHover={{ scale: stomped ? 1 : 1.1 }}
    >
      {/* Score popup */}
      <AnimatePresence>
        {showScore && (
          <motion.div
            className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -40, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "0.5rem",
              color: "hsl(45 100% 60%)",
              textShadow: "1px 1px 0 hsl(25 60% 20%)",
            }}>+100</span>
          </motion.div>
        )}
      </AnimatePresence>

      {stomped ? (
        <motion.div
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0.2, y: 10 }}
          transition={{ duration: 0.15 }}
        >
          {type === "koopa" ? <ShellOnly /> : <FlatGoomba />}
        </motion.div>
      ) : (
        <motion.div
          animate={{
            x: direction === "right" ? [0, walkRange, 0] : [0, -walkRange, 0],
            scaleX: direction === "right"
              ? [1, 1, -1, -1, 1]
              : [-1, -1, 1, 1, -1],
          }}
          transition={{ duration: 4 + delay, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            {type === "goomba" && <Goomba size={size} />}
            {type === "koopa" && <KoopaTroopa size={size} />}
            {type === "bob-omb" && <BobOmb size={size} />}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Enemy;
