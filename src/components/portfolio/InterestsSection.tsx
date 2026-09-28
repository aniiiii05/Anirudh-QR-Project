import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import anirudhPhoto1 from "@/assets/anirudh-photo-1.png";

const interests = [
  { emoji: "🏸", label: "Badminton" },
  { emoji: "✏️", label: "Sketching" },
  { emoji: "🎤", label: "Public Speaking" },
  { emoji: "📚", label: "Reading" },
  { emoji: "🌍", label: "Languages" },
];

const InterestsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24" style={{ background: "linear-gradient(180deg, hsl(45 80% 55%), hsl(45 70% 45%))" }}>
      <div className="section-container">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 text-center text-foreground drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">
            Bonus <span className="text-accent">Items</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg" style={{ fontFamily: "'VT323', monospace" }}>
            What keeps me powered up outside work! 🌟
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Photo as a "power-up" portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0"
          >
            <div className="relative" style={{
              border: "6px solid hsl(0 80% 50%)",
              boxShadow: "inset -4px -4px 0 hsla(0 60% 30% / 0.5), inset 4px 4px 0 hsla(0 80% 60% / 0.3), 6px 6px 0 hsl(25 60% 20%)",
              width: 180,
              height: 220,
              overflow: "hidden",
              background: "hsl(25 55% 35%)",
            }}>
              <img src={anirudhPhoto1} alt="Anirudh" className="w-full h-full object-cover" />
            </div>
            <div className="text-center mt-3">
              <span className="font-bold text-accent drop-shadow-[1px_1px_0_hsl(25,60%,20%)]" style={{ fontFamily: "'VT323', monospace", fontSize: "1.2rem" }}>
                ⭐ Off-duty mode ⭐
              </span>
            </div>
          </motion.div>

          {/* Interest blocks */}
          <div className="flex flex-wrap justify-center gap-6 flex-1">
            {interests.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="px-8 py-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform cursor-pointer"
                style={{
                  background: "linear-gradient(180deg, hsl(45 100% 60%) 0%, hsl(40 90% 45%) 100%)",
                  border: "4px solid hsl(25 70% 35%)",
                  boxShadow: "inset -4px -4px 0 hsla(25 70% 30% / 0.5), inset 4px 4px 0 hsla(45 100% 70% / 0.5), 4px 4px 0 hsl(25 60% 20%)",
                }}
              >
                <motion.span
                  className="text-4xl"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                >
                  {item.emoji}
                </motion.span>
                <span className="font-bold" style={{ color: "hsl(25 60% 20%)", fontFamily: "'VT323', monospace", fontSize: "1.2rem" }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InterestsSection;
