import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const competencies = [
  { title: "Data Analysis & Visualization", desc: "Power BI dashboards, Tableau analytics, and Python visualizations driving 15%+ report adoption.", emoji: "📊" },
  { title: "Python & SQL Development", desc: "Data parsing algorithms boosting processing speed by 20%, reducing memory usage by 15% across 5+ pipelines.", emoji: "🐍" },
  { title: "ETL & Data Engineering", desc: "Automated ETL workflows consolidating 5+ data sources, improving accuracy by 30% and eliminating 40+ hours of manual processing.", emoji: "🏗️" },
  { title: "Business Intelligence", desc: "Executive-level presentations translating complex data into actionable recommendations across 3 departments.", emoji: "📈" },
  { title: "NLP & AI Tools", desc: "LLM-based summarization, text-to-speech synthesis, and AI research assistants processing 1000+ academic papers.", emoji: "🧠" },
  { title: "Agile Project Management", desc: "Delivering 12+ features across 3 sprints, 50+ code reviews, and 200+ Git commits with 99% standards adherence.", emoji: "👥" },
];

const CompetenciesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" style={{ background: "linear-gradient(180deg, hsl(25 60% 30%), hsl(25 50% 22%))" }}>
      <div className="section-container relative z-10">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 text-center text-foreground drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">
            Core <span className="text-accent">Competencies</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg" style={{ fontFamily: "'VT323', monospace" }}>
            Key areas of expertise — power-ups collected along the journey!
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {competencies.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="question-block p-6 group hover:scale-[1.03] transition-all duration-300 cursor-pointer"
            >
              <div className="text-3xl mb-4">{c.emoji}</div>
              <h3 className="font-heading text-[10px] sm:text-xs font-semibold mb-2" style={{ color: "hsl(25 60% 20%)" }}>
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(25 50% 30%)", fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}>
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompetenciesSection;
