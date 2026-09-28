import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const achievements = [
  {
    emoji: "🎓",
    title: "Certifications",
    items: [
      "Google Data Analytics Professional Certificate",
      "Google Data Analytics Certification (Jan 2026)",
      "Microsoft Azure Fundamentals Badge (Jan 2026)",
      "Master Microsoft Excel (Sep 2025)",
      "CAPM (PMI) — In Progress",
    ],
  },
  {
    emoji: "🏅",
    title: "Awards & Recognition",
    items: [
      "Semi-Finalist — Smart India Hackathon (SIH)",
      "Campus Ambassador — Cisco",
      "Vice-President — Centre for Cognitive Activities, NIT Durgapur",
      "67+ GitHub contributions across 10+ repositories",
      "All projects open-sourced under MIT License",
    ],
  },
  {
    emoji: "📈",
    title: "Measurable Impact",
    items: [
      "35% reduction in parsing errors at PDF4me",
      "Pipeline uptime improved from 92% to 98.5%",
      "2M+ daily records processed across 5+ pipelines",
      "25 hours/week saved in manual reporting at Tata Motors",
      "30% improvement in reporting accuracy via ETL automation",
    ],
  },
  {
    emoji: "🏆",
    title: "Key Milestones",
    items: [
      "12+ features delivered across 3 sprints",
      "50+ code reviews, 200+ Git commits",
      "10+ executive-level presentations delivered",
      "1,000+ students engaged in Cisco campaigns",
      "8 SOPs authored for analytical tools",
    ],
  },
];

const AchievementsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="achievements" className="py-24" style={{ background: "linear-gradient(180deg, hsl(220 20% 10%), hsl(220 15% 6%))" }}>
      <div className="section-container">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 text-center text-foreground drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">
            Achievements <span className="text-accent">Unlocked</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg" style={{ fontFamily: "'VT323', monospace" }}>
            Trophies collected along the way! 🏆
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="question-block p-6 text-center"
            >
              <motion.div
                className="text-5xl mb-4"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              >
                {a.emoji}
              </motion.div>
              <h3 className="font-heading text-[10px] sm:text-xs font-semibold mb-4" style={{ color: "hsl(25 60% 20%)" }}>
                {a.title}
              </h3>
              <ul className="space-y-2 text-left">
                {a.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2" style={{ color: "hsl(25 50% 30%)", fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}>
                    <span className="flex-shrink-0">⭐</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
