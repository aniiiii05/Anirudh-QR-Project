import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Enemy from "./Enemy";

const experiences = [
  {
    company: "PDF4me (Remote — Zürich, Switzerland)",
    role: "Data Specialist & Design Intern",
    period: "Oct 2025 – Present",
    achievements: [
      "Engineered data parsing algorithms in Python/SQL, boosting processing speed by 20% and reducing memory usage by 15% across 5+ production pipelines handling 2M+ daily records",
      "Implemented automated validation protocols, cutting parsing errors by 35% and increasing pipeline uptime from 92% to 98.5%",
      "Translated business requirements into technical specs, delivering 12+ features across 3 sprints with cross-functional teams of 8+ members",
      "Authored technical documentation for 15K+ lines of code and 8 REST APIs, reducing onboarding time by 40%",
      "Conducted 50+ code reviews and managed 200+ Git commits, maintaining 99% adherence to coding standards",
    ],
    emoji: "⭐",
    flag: "🇨🇭",
  },
  {
    company: "Tata Motors (India)",
    role: "Data Analyst Intern (Supply Chain)",
    period: "May 2025 – Jul 2025",
    achievements: [
      "Developed iterative Power BI dashboards with stakeholder feedback loops, increasing report adoption by 15% and reducing manual reporting time by 25 hours/week across 3 departments",
      "Automated ETL workflows using Python to consolidate data from 5+ sources, improving reporting accuracy by 30% and eliminating 40+ hours of monthly manual processing",
      "Conducted root cause analysis on 50K+ logistics records, improving OTIF metrics by 2% within 2 months",
      "Delivered 10+ executive-level presentations translating complex data insights into actionable recommendations",
    ],
    emoji: "🏎️",
    flag: "🇮🇳",
  },
  {
    company: "Cisco (Campus Ambassador)",
    role: "Strategic Partner",
    period: "Oct 2024 – Jun 2025",
    achievements: [
      "Executed campus brand awareness campaign engaging 1,000+ students and converting 100+ prospects",
      "Coordinated 2 technical information sessions end-to-end managing logistics, speakers, and attendee engagement",
      "Tracked campaign KPIs including attendance, engagement metrics, and conversion data to refine outreach strategies",
    ],
    emoji: "🌐",
    flag: "🌍",
  },
];

const ExperienceSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="experience" className="py-24 relative" style={{ background: "linear-gradient(180deg, hsl(140 30% 18%), hsl(140 25% 12%))" }}>
      <Enemy type="koopa" x="8%" bottom="8%" walkRange={100} delay={0.5} />
      <Enemy type="goomba" x="75%" bottom="8%" walkRange={70} delay={1.5} direction="left" />
      <Enemy type="bob-omb" x="45%" bottom="5%" walkRange={40} delay={2} />
      <div className="section-container relative z-10">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 text-center text-foreground drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">
            Work <span className="text-accent">Experience</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg" style={{ fontFamily: "'VT323', monospace" }}>
            Levels completed on the journey! 🏁
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-6 md:-translate-x-3 pipe-style" />

          <div className="space-y-12">
            {experiences.map((exp, i) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`relative flex flex-col md:flex-row items-start gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className="absolute left-4 md:left-1/2 w-8 h-8 -translate-x-1 md:-translate-x-4 mt-6 z-10 rounded-full bg-accent border-4 border-[hsl(35,80%,40%)] flex items-center justify-center text-sm">
                  {exp.emoji}
                </div>

                <div className={`ml-16 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"}`}>
                  <div className="glass-card p-6 hover:scale-[1.01] transition-transform">
                    <div className="flex items-center gap-2 mb-2 justify-start">
                      <span className="text-lg">{exp.flag}</span>
                      <span className="font-bold text-accent" style={{ fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}>{exp.period}</span>
                    </div>
                    <h3 className="font-heading text-[10px] sm:text-xs font-semibold text-start text-accent">{exp.role}</h3>
                    <p className="text-sm text-muted-foreground mb-3 text-start" style={{ fontFamily: "'VT323', monospace", fontSize: "1rem" }}>{exp.company}</p>
                    <ul className="space-y-2 text-start">
                      {exp.achievements.map((a, j) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2" style={{ fontFamily: "'VT323', monospace", fontSize: "1rem" }}>
                          <span className="flex-shrink-0">🍄</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
