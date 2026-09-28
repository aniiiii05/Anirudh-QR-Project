import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const activities = [
  {
    emoji: "👑",
    title: "VP Operations & Strategy",
    desc: "Led operations and strategy for 50+ volunteers and organizers at CCA, NIT Durgapur, across multiple events with cumulative footfall of 30,000+.",
    stat: "30,000+ footfall",
  },
  {
    emoji: "💰",
    title: "Budget & Vendor Management",
    desc: "Managed event budgets of approximately ₹5-10L and negotiated vendor contracts to optimize cost and delivery.",
    stat: "₹5-10L budgets",
  },
  {
    emoji: "🎪",
    title: "Event Logistics",
    desc: "Planned logistics and resource allocation to meet tight timelines while maintaining event quality across multiple events.",
    stat: "50+ volunteers",
  },
];

const LeadershipSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24" style={{ background: "linear-gradient(180deg, hsl(210 80% 65%), hsl(210 75% 55%))" }}>
      <div className="section-container">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 text-center text-foreground drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">
            Leadership <span className="text-accent">Quests</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg" style={{ fontFamily: "'VT323', monospace" }}>
            Centre for Cognitive Activities (CCA), NIT Durgapur — May 2025 – Present 🚩
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {activities.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{a.emoji}</span>
                <span className="font-bold text-accent" style={{ fontFamily: "'VT323', monospace", fontSize: "1.2rem" }}>{a.stat}</span>
              </div>
              <h3 className="font-heading text-[10px] sm:text-xs font-semibold mb-2 text-accent">{a.title}</h3>
              <p className="text-muted-foreground" style={{ fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}>{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeadershipSection;
