import { motion, useInView } from "framer-motion";
import { useMemo } from "react";
import { useRef } from "react";
import Enemy from "./Enemy";

const skillCategories = [
  {
    title: "Programming",
    emoji: "🐍",
    barColor: "hsl(0 80% 50%)",
    skills: [
      { name: "Python (pandas, NumPy, scikit-learn)", level: 90 },
      { name: "SQL", level: 92 },
    ],
  },
  {
    title: "Analytics & BI",
    emoji: "📊",
    barColor: "hsl(120 65% 38%)",
    skills: [
      { name: "Power BI", level: 88 },
      { name: "Tableau", level: 82 },
      { name: "Advanced Excel (VBA, Pivot Tables)", level: 90 },
    ],
  },
  {
    title: "Data Engineering",
    emoji: "🏗️",
    barColor: "hsl(45 100% 50%)",
    skills: [
      { name: "ETL & Data Pipelines", level: 85 },
      { name: "Time Series Forecasting (ARIMA)", level: 75 },
      { name: "Data Modeling & Validation", level: 80 },
    ],
  },
  {
    title: "AI & NLP",
    emoji: "🧠",
    barColor: "hsl(0 80% 50%)",
    skills: [
      { name: "NLP Fundamentals", level: 75 },
      { name: "LLMs (OpenAI, HuggingFace)", level: 78 },
      { name: "Dashboarding", level: 88 },
    ],
  },
  {
    title: "Tools & Practices",
    emoji: "🔧",
    barColor: "hsl(120 65% 38%)",
    skills: [
      { name: "Git / GitHub", level: 85 },
      { name: "Agile / Scrum", level: 80 },
      { name: "Stakeholder Management", level: 88 },
    ],
  },
];

const SkillsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const stars = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() > 0.7 ? 3 : 2,
    delay: Math.random() * 3,
    color: [45, 200, 0, 120, 280][i % 5],
  })), []);

  return (
    <section id="skills" className="py-24 relative" style={{ background: "linear-gradient(180deg, hsl(230 50% 15%), hsl(230 45% 10%))" }}>
      {/* Ambient stars */}
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ width: s.size, height: s.size, background: `hsl(${s.color} 80% 70%)`, top: s.y, left: s.x }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5 + Math.random() * 2, delay: s.delay, repeat: Infinity }}
        />
      ))}
      <Enemy type="koopa" x="10%" bottom="6%" walkRange={90} delay={1} />
      <Enemy type="goomba" x="80%" bottom="6%" walkRange={50} delay={0} direction="left" />
      <div className="section-container relative z-10">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 text-center text-foreground drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">
            Technical <span className="text-accent">Skills</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg" style={{ fontFamily: "'VT323', monospace" }}>
            Power-up levels unlocked! 🍄
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skillCategories.map((cat, ci) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: ci * 0.1 }}
              className="glass-card p-6"
            >
              <h3 className="font-heading text-[10px] font-semibold mb-4 text-accent drop-shadow-[1px_1px_0_hsl(25,60%,20%)]">
                {cat.emoji} {cat.title}
              </h3>
              <div className="space-y-4">
                {cat.skills.map((skill, si) => (
                  <div key={skill.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground" style={{ fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}>{skill.name}</span>
                      <span className="font-bold text-accent" style={{ fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}>{skill.level}%</span>
                    </div>
                    <div className="h-4 bg-muted border-2 border-mario-brick overflow-hidden">
                      <motion.div
                        className="h-full"
                        style={{
                          background: cat.barColor,
                          boxShadow: `inset 0 -2px 0 hsla(0 0% 0% / 0.2), inset 0 2px 0 hsla(0 0% 100% / 0.2)`,
                        }}
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${skill.level}%` } : {}}
                        transition={{ duration: 1.2, delay: ci * 0.1 + si * 0.15, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
