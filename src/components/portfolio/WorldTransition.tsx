import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type TransitionType = "pipe-down" | "underground-entry" | "sky-exit" | "castle-entry" | "flagpole" | "water-entry";

interface WorldTransitionProps {
  type: TransitionType;
  worldLabel?: string;
  fromColor?: string;
  toColor?: string;
}

const PipeDown = ({ worldLabel }: { worldLabel?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ height: 120 }}>
      {/* Ground strip */}
      <div className="absolute top-0 left-0 right-0" style={{
        height: 4,
        background: "linear-gradient(90deg, hsl(120 65% 42%), hsl(120 70% 48%), hsl(120 65% 42%))",
      }} />
      <div className="absolute top-1 left-0 right-0" style={{
        height: 40,
        background: "repeating-linear-gradient(90deg, transparent 0px, transparent 28px, hsl(15 40% 32%) 28px, hsl(15 40% 32%) 30px), repeating-linear-gradient(0deg, transparent 0px, transparent 14px, hsl(15 40% 32%) 14px, hsl(15 40% 32%) 16px), linear-gradient(180deg, hsl(15 70% 48%), hsl(15 55% 35%))",
        borderTop: "4px solid hsl(25 60% 25%)",
      }} />

      {/* Center pipe going down */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10">
        <div style={{
          width: 64, height: 24,
          background: "linear-gradient(90deg, hsl(120 45% 28%), hsl(120 65% 42%), hsl(120 70% 50%), hsl(120 65% 42%), hsl(120 45% 28%))",
          border: "3px solid hsl(120 35% 22%)",
          borderRadius: "4px 4px 0 0",
        }} />
        <div style={{
          width: 48, height: 96, marginLeft: 8,
          background: "linear-gradient(90deg, hsl(120 45% 25%), hsl(120 60% 38%), hsl(120 65% 45%), hsl(120 60% 38%), hsl(120 45% 25%))",
          border: "3px solid hsl(120 35% 22%)",
          borderTop: "none",
        }} />
      </div>

      {/* World label */}
      {worldLabel && (
        <motion.div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 text-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div
            className="px-4 py-2 whitespace-nowrap"
            style={{
              background: "hsla(0 0% 0% / 0.8)",
              border: "2px solid hsl(45 100% 50%)",
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "0.6rem",
              color: "hsl(45 100% 50%)",
              boxShadow: "0 0 20px hsla(45 100% 50% / 0.3)",
            }}
          >
            {worldLabel}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const UndergroundEntry = ({ worldLabel }: { worldLabel?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ height: 80 }}>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, hsl(25 60% 30%) 0%, hsl(220 20% 8%) 100%)",
      }} />
      {/* Brick ceiling */}
      <div className="absolute top-0 left-0 right-0" style={{
        height: 32,
        background: "repeating-linear-gradient(90deg, transparent 0px, transparent 28px, hsl(15 40% 22%) 28px, hsl(15 40% 22%) 30px), repeating-linear-gradient(0deg, transparent 0px, transparent 14px, hsl(15 40% 22%) 14px, hsl(15 40% 22%) 16px), linear-gradient(180deg, hsl(15 50% 32%), hsl(15 40% 25%))",
      }} />
      {worldLabel && (
        <motion.div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          <div className="px-4 py-2 whitespace-nowrap" style={{
            background: "hsla(0 0% 0% / 0.8)",
            border: "2px solid hsl(45 100% 50%)",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "0.6rem",
            color: "hsl(45 100% 50%)",
          }}>
            {worldLabel}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const CastleEntry = ({ worldLabel }: { worldLabel?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ height: 100 }}>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, hsl(210 70% 52%) 0%, hsl(0 20% 12%) 100%)",
      }} />
      {/* Castle battlements */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            width: 24, height: i % 2 === 0 ? 40 : 28,
            background: "repeating-linear-gradient(90deg, transparent 0px, transparent 10px, hsl(0 10% 18%) 10px, hsl(0 10% 18%) 12px), repeating-linear-gradient(0deg, transparent 0px, transparent 8px, hsl(0 10% 18%) 8px, hsl(0 10% 18%) 10px), linear-gradient(180deg, hsl(0 15% 30%), hsl(0 10% 20%))",
            borderTop: "2px solid hsl(0 15% 35%)",
          }} />
        ))}
      </div>
      {worldLabel && (
        <motion.div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <div className="px-4 py-2 whitespace-nowrap" style={{
            background: "hsla(0 0% 0% / 0.85)",
            border: "2px solid hsl(0 80% 50%)",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "0.6rem",
            color: "hsl(0 80% 50%)",
            boxShadow: "0 0 20px hsla(0 80% 50% / 0.3)",
          }}>
            {worldLabel}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const NightSkyTransition = ({ worldLabel }: { worldLabel?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ height: 80 }}>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, hsl(210 70% 52%) 0%, hsl(230 50% 15%) 100%)",
      }} />
      {/* Stars */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() > 0.7 ? 3 : 2,
            height: Math.random() > 0.7 ? 3 : 2,
            background: `hsl(${[45, 200, 0, 120, 280][i % 5]} 80% 70%)`,
            top: `${10 + Math.random() * 70}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5 + Math.random() * 2, delay: Math.random() * 2, repeat: Infinity }}
        />
      ))}
      {worldLabel && (
        <motion.div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          <div className="px-4 py-2 whitespace-nowrap" style={{
            background: "hsla(0 0% 0% / 0.8)",
            border: "2px solid hsl(200 80% 60%)",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "0.6rem",
            color: "hsl(200 80% 60%)",
          }}>
            {worldLabel}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const WorldTransition = ({ type, worldLabel }: WorldTransitionProps) => {
  switch (type) {
    case "pipe-down":
      return <PipeDown worldLabel={worldLabel} />;
    case "underground-entry":
      return <UndergroundEntry worldLabel={worldLabel} />;
    case "castle-entry":
      return <CastleEntry worldLabel={worldLabel} />;
    case "sky-exit":
    case "water-entry":
      return <NightSkyTransition worldLabel={worldLabel} />;
    case "flagpole":
      return <NightSkyTransition worldLabel={worldLabel} />;
    default:
      return null;
  }
};

export default WorldTransition;
