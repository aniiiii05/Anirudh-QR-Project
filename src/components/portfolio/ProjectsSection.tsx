import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import { X, ExternalLink } from "lucide-react";
import Enemy from "./Enemy";

type Project = {
  title: string;
  desc: string;
  longDesc: string;
  tags: string[];
  category: string[];
  tech: string[];
  emoji: string;
  github?: string;
};

const projects: Project[] = [
  {
    title: "Research.AI Insight Tool",
    desc: "End-to-end AI research assistant processing 1000+ academic papers with LLM-based summarization and text-to-speech synthesis.",
    longDesc: "Developed an end-to-end AI research assistant processing 1000+ academic papers, integrating LLM-based summarization and text-to-speech synthesis to generate audio summaries in under 30 seconds. Architected scalable backend with modular design supporting multiple LLM providers (OpenAI, HuggingFace) and RESTful APIs, deployed with modern React frontend featuring real-time audio playback.",
    tags: ["AI & NLP"],
    category: ["ai"],
    tech: ["Python", "OpenAI", "HuggingFace", "React", "LangChain", "REST APIs"],
    emoji: "🧠",
    github: "https://github.com/aniiiii05/research.ai",
  },
  {
    title: "MOODFLIX — Movie Recommender",
    desc: "Movie recommendation system using NLP and collaborative filtering with Scikit-learn, NLTK, and Streamlit.",
    longDesc: "A Movie Recommendation System built with Scikit-learn, NLTK, and Streamlit that delivers personalized suggestions using Natural Language Processing (NLP) and collaborative filtering. The system processes movie metadata and user preferences to generate accurate recommendations.",
    tags: ["AI & NLP"],
    category: ["ai"],
    tech: ["Python", "Scikit-learn", "NLTK", "Streamlit", "Jupyter"],
    emoji: "🎬",
    github: "https://github.com/aniiiii05/Movie-Recommendation-System-",
  },
  {
    title: "YouTube Channel Analytics",
    desc: "End-to-end analytics pipeline using Python and YouTube Data API v3 to process 10K+ video metrics with interactive dashboards.",
    longDesc: "Developed end-to-end YouTube analytics pipeline using Python and YouTube Data API v3 to extract, process, and visualize 10K+ video metrics including views, engagement rates, and subscriber growth. Built interactive Power BI/Tableau dashboard with statistical analysis and trend forecasting for content optimization.",
    tags: ["Data Engineering", "Business Intelligence"],
    category: ["de", "bi"],
    tech: ["Python", "YouTube API v3", "Power BI", "Jupyter", "Pandas"],
    emoji: "📺",
    github: "https://github.com/aniiiii05/YouTube-Channel-Analytics-Performance-Insights-Dashboard",
  },
  {
    title: "PowerBI Dashboards — Tata Motors",
    desc: "Interactive OTIF dashboard monitoring delivery efficiency and supply chain bottlenecks with real-time visibility.",
    longDesc: "Built an interactive dashboard to monitor On-Time In-Full (OTIF) performance, enabling real-time visibility of delivery efficiency and supply chain bottlenecks. Also created an Annual Tata Motors performance analysis dashboard tracking key metrics across departments.",
    tags: ["Business Intelligence"],
    category: ["bi"],
    tech: ["Power BI", "DAX", "SQL", "Data Modeling"],
    emoji: "📊",
    github: "https://github.com/aniiiii05/PowerBI-Dashboards-TataMotors",
  },
  {
    title: "Eco-Friendly E-Commerce Platform",
    desc: "Full-stack eco-friendly marketplace with MERN stack, 95%+ mobile compatibility and scalable backend.",
    longDesc: "Developed a full-stack eco-friendly e-commerce website designed to promote and sell sustainable products. The platform emphasizes environmental consciousness and provides users with a seamless shopping experience. Built with MongoDB, Express.js, React, and Node.js achieving 95%+ mobile compatibility.",
    tags: ["Full Stack"],
    category: ["fs"],
    tech: ["MongoDB", "Express.js", "React", "Node.js"],
    emoji: "🛒",
    github: "https://github.com/aniiiii05/-Eco-Friendly-E-Commerce-Platform",
  },
  {
    title: "News Search Platform",
    desc: "High-performance web app delivering sub-second search across 1M+ news articles using Elasticsearch.",
    longDesc: "A high-performance web application designed to deliver sub-second search results across 1M+ news articles using Elasticsearch. Built with mobile-first design principles to ensure seamless cross-device experience with advanced filtering and sorting capabilities.",
    tags: ["Full Stack", "Data Engineering"],
    category: ["fs", "de"],
    tech: ["Elasticsearch", "HTML", "CSS", "JavaScript"],
    emoji: "📰",
    github: "https://github.com/aniiiii05/News-Search-Platform",
  },
  {
    title: "Google Docs Clone",
    desc: "Real-time collaborative document editor with PyQt5, Supabase, and Sockets — live text formatting & cursor sync.",
    longDesc: "A Python-based Google Docs Clone developed with PyQt5, Supabase, and Sockets, enabling real-time collaborative editing. It features live text formatting, cursor synchronization, and multi-user support for seamless document collaboration.",
    tags: ["Full Stack"],
    category: ["fs"],
    tech: ["Python", "PyQt5", "Supabase", "Sockets"],
    emoji: "📝",
    github: "https://github.com/aniiiii05/Google-Documents-Clone-",
  },
  {
    title: "J.A.R.V.I.S. Desktop Assistant",
    desc: "Python-based voice-controlled personal assistant for desktop — automated tasks via voice commands.",
    longDesc: "J.A.R.V.I.S. is a Python-based voice-controlled personal assistant for your desktop. Inspired by the AI from the Iron Man movies, this project is designed to perform various automated tasks based on voice commands including web searches, app launching, and system controls.",
    tags: ["AI & NLP"],
    category: ["ai"],
    tech: ["Python", "Speech Recognition", "pyttsx3", "APIs"],
    emoji: "🤖",
    github: "https://github.com/aniiiii05/J.A.R.V.I.S.---A-Voice-Controlled-Desktop-Assistant",
  },
  {
    title: "Data Warehouse & Analytics",
    desc: "Modern data warehouse with SQL Server including ETL processes, data modeling and analytics.",
    longDesc: "Building a modern data warehouse with SQL Server, including ETL processes, data modeling and analytics. Designed star schema, implemented SSIS packages for data integration, and built analytical queries for business reporting.",
    tags: ["Data Engineering"],
    category: ["de"],
    tech: ["T-SQL", "SQL Server", "ETL", "Data Modeling"],
    emoji: "🏗️",
    github: "https://github.com/aniiiii05/Data-Warehouse-and-Analytics-Project",
  },
  {
    title: "Time Series Forecasting",
    desc: "Stock price prediction using ARIMA methodology with preprocessing of time-indexed financial data.",
    longDesc: "Developed a time series forecasting model to predict future stock prices using the ARIMA (AutoRegressive Integrated Moving Average) methodology. The project involved preprocessing time-indexed data, stationarity testing, parameter optimization, and model evaluation.",
    tags: ["Data Engineering", "AI & NLP"],
    category: ["de", "ai"],
    tech: ["Python", "ARIMA", "Pandas", "Matplotlib"],
    emoji: "📉",
    github: "https://github.com/aniiiii05/Time-series-forecasting",
  },
];

const filters = ["All", "AI & NLP", "Business Intelligence", "Data Engineering", "Full Stack"];
const filterMap: Record<string, string> = { "All": "all", "AI & NLP": "ai", "Business Intelligence": "bi", "Data Engineering": "de", "Full Stack": "fs" };

const ProjectsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Project | null>(null);

  const stars = useMemo(() => Array.from({ length: 35 }).map((_, i) => ({
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() > 0.7 ? 3 : 2,
    delay: Math.random() * 3,
    color: [45, 200, 0, 120, 280][i % 5],
  })), []);

  const filtered = filter === "All" ? projects : projects.filter((p) => p.category.includes(filterMap[filter]));

  return (
    <section id="projects" className="py-24 relative" style={{ background: "linear-gradient(180deg, hsl(230 60% 18%), hsl(230 50% 12%))" }}>
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
      <Enemy type="bob-omb" x="6%" bottom="5%" walkRange={60} delay={0.5} />
      <Enemy type="koopa" x="88%" bottom="5%" walkRange={50} delay={1.5} direction="left" />
      <div className="section-container relative z-10">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 text-center text-foreground drop-shadow-[2px_2px_0_hsl(25,60%,20%)]">
            Featured <span className="text-accent">Projects</span>
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto text-lg" style={{ fontFamily: "'VT323', monospace" }}>
            Worlds explored and conquered! 🏰
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-sm font-bold transition-all border-4 ${
                filter === f
                  ? "question-block text-accent-foreground"
                  : "glass-card text-foreground hover:border-accent"
              }`}
              style={{ fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.div
                key={p.title}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-6 cursor-pointer group hover:scale-[1.03] transition-all duration-300"
                onClick={() => setSelected(p)}
              >
                <div className="text-4xl mb-3">{p.emoji}</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {p.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 text-xs font-bold bg-accent text-accent-foreground border-2 border-[hsl(35,80%,40%)]" style={{ fontFamily: "'VT323', monospace", fontSize: "0.9rem" }}>
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="font-heading text-[10px] sm:text-xs font-semibold mb-2 text-accent group-hover:text-foreground transition">{p.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2" style={{ fontFamily: "'VT323', monospace", fontSize: "1rem" }}>{p.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tech.slice(0, 4).map((t) => (
                    <span key={t} className="px-2 py-0.5 text-xs bg-muted/50 text-muted-foreground border border-mario-brick" style={{ fontFamily: "'VT323', monospace", fontSize: "0.85rem" }}>{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "hsla(210 75% 30% / 0.8)" }}
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="question-block p-8 max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selected.emoji}</span>
                    <h3 className="font-heading text-xs sm:text-sm font-bold" style={{ color: "hsl(25 60% 20%)" }}>{selected.title}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="hover:opacity-70"><X size={20} style={{ color: "hsl(25 60% 20%)" }} /></button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selected.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 text-xs font-bold bg-primary text-foreground border-2 border-[hsl(0,60%,35%)]" style={{ fontFamily: "'VT323', monospace" }}>{t}</span>
                  ))}
                </div>
                <p className="mb-6 leading-relaxed" style={{ color: "hsl(25 50% 30%)", fontFamily: "'VT323', monospace", fontSize: "1.2rem" }}>{selected.longDesc}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selected.tech.map((t) => (
                    <span key={t} className="px-3 py-1 text-xs font-bold bg-secondary text-foreground border-2 border-[hsl(120,40%,25%)]" style={{ fontFamily: "'VT323', monospace" }}>{t}</span>
                  ))}
                </div>
                {selected.github && (
                  <a href={selected.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 font-bold transition-all hover:scale-105" style={{ background: "hsl(25 55% 35%)", border: "3px solid hsl(25 70% 35%)", boxShadow: "3px 3px 0 hsl(25 60% 20%)", color: "hsl(45 100% 50%)", fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}>
                    <ExternalLink size={14} /> View on GitHub
                  </a>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ProjectsSection;
