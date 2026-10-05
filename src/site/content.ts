/**
 * Homepage copy. Every section has a "base" layer (what visitors read) and an
 * "alt" layer (the honest, self-roasting version revealed by the cursor
 * spotlight). Facts come from src/card/profile.ts and docs/content-audit.md;
 * the current employer is never named.
 *
 * Text wrapped in *asterisks* is rendered as a highlight.
 */
import { profile } from "@/card/profile";

export const site = {
  name: profile.name,
  monogram: profile.monogram,
  email: profile.email,
  title: `${profile.name} — Data Engineer & Creator`,

  hero: {
    kicker: "Anirudh Sharma",
    lines: ["Data", "by day.", "*Stories*", "by night."],
    altLines: ["SQL", "by day.", "*Selfies*", "by night."],
    sub: "Full-time data engineer · aspiring UGC & tech-marketing creator",
    altSub: "Currently arguing with a ring light",
  },

  about: {
    label: "About me",
    text: "I’m a *full-time data engineer* who builds pipelines by day — and a *creator in the making*, learning to turn tech and marketing into stories people actually stop scrolling for.",
    alt: "I write SQL that machines love and captions that humans skip. *Working on the second part.*",
    facts: [
      { k: "Day job", v: `${profile.role} · ${profile.employment}` },
      { k: "Studied", v: `B.Tech, ${profile.education.short}` },
      { k: "Speaks", v: profile.languages.map((l) => l.name).join(" · ") },
      { k: "Building", v: "UGC · tech · marketing content" },
    ],
  },

  services: {
    label: "What I do",
    items: [
      {
        key: "ugc",
        title: "UGC",
        text: "Honest, product-first content for brands — unboxings, reviews and demos that feel like a friend’s recommendation.",
        alt: "Honest reviews, minus the fake “OMG”.",
      },
      {
        key: "shortform",
        title: "Short-form",
        text: "Reels and shorts built around a hook, one idea and a clean payoff.",
        alt: "15 seconds. One idea. Zero filler (working on it).",
      },
      {
        key: "explainers",
        title: "Tech talk",
        text: "AI, data and automation explained in plain language, for people who don’t write code.",
        alt: "I explain AI like I’d explain it to my mom. Mom approves.",
      },
      {
        key: "marketing",
        title: "Marketing",
        text: "Digital strategy and SEO with a data engineer’s habit of measuring what actually worked.",
        alt: "Hooks that earn the next three seconds. Then the next three.",
      },
      {
        key: "data",
        title: "Data",
        text: "Python, SQL and ETL/ELT pipelines — the day job, and the reason the content is grounded in how tech really works.",
        alt: "Pipelines that run while I sleep. Allegedly.",
      },
    ],
  },

  experience: {
    label: "Experience",
    text: "A *full-time data engineer* with three internships, a campus-ambassador stint and an engineering degree behind me — now pointing all of it at *content*.",
    alt: "Mechanical engineer by degree. Data engineer by job. *Content creator by stubbornness.*",
  },

  history: {
    label: "History",
    rows: [
      { when: "Now", role: profile.role, org: profile.employment, altRole: "Pipeline Babysitter", altOrg: "Still employed. Still posting." },
      { when: "Now", role: "UGC & Tech Creator", org: "Aspiring · building in public", altRole: "Ring-light Apprentice", altOrg: "Weekends & late nights" },
      { when: "2025", role: "Data Specialist Intern", org: "PDF4me", altRole: "Documentation Whisperer", altOrg: "PDF4me" },
      { when: "2025", role: "Data Analyst Intern · Supply Chain", org: "Tata Motors", altRole: "OTIF Detective", altOrg: "Tata Motors" },
      { when: "2024", role: "Campus Ambassador", org: "Cisco", altRole: "Professional Hype Person", altOrg: "Cisco" },
      { when: "2024", role: "Development Intern", org: "OctaNet", altRole: "Junior Bug Producer", altOrg: "OctaNet" },
      { when: "2022", role: "B.Tech, Mechanical Engineering", org: profile.education.institution, altRole: "Learned thermodynamics. Chose SQL.", altOrg: profile.education.short },
    ],
  },

  stack: {
    label: "Under the hood",
    text: "The tech behind the content.",
    alt: "Yes, I can automate your content calendar. *No, I won’t automate the personality.*",
    groups: profile.skills,
    learning: profile.learning,
  },

  work: {
    label: "Work",
    title: ["First reel", "in production"],
    altTitle: ["Many drafts.", "Zero regrets."],
    note: "The first UGC and tech-explainer pieces are being filmed now. These slots fill up as they ship — nothing here is a mock-up of someone else’s work.",
    /** Replace a slot with { video, poster, brand, href } once real work exists. */
    slots: [
      { format: "UGC · product review", ratio: "9 / 16" },
      { format: "Tech explainer · AI", ratio: "9 / 16" },
      { format: "Marketing breakdown", ratio: "9 / 16" },
      { format: "Data, made visual", ratio: "9 / 16" },
    ],
  },

  motto: {
    label: "My motto",
    lines: ["Data tells.", "*Stories sell.*"],
    altLines: ["Trust the data.", "*Then add a hook.*"],
    by: profile.name,
  },

  connect: {
    label: "Connect",
    links: [
      { name: "LinkedIn", note: "Serious me", alt: "Where I pretend I’m always this focused", href: profile.linkedin },
      { name: "Instagram", note: "Behind the scenes", alt: "Mostly drafts, for now", href: profile.instagram },
      { name: "Pinterest", note: "Mood boards", alt: "Where ideas go to marinate", href: profile.pinterest },
      { name: "GitHub", note: "Where the code lives", alt: "Green squares, some days", href: profile.github },
    ],
    emailNote: "100% chance I read it",
    emailAlt: "Brand collabs get a faster reply. Just saying.",
  },
} as const;

export type ServiceKey = (typeof site.services.items)[number]["key"];

/**
 * Splits "*highlight* text" into word tokens. `glue` marks a token that follows
 * the previous one without a space (punctuation right after a highlight).
 */
export function tokens(text: string): { word: string; hl: boolean; glue: boolean }[] {
  const out: { word: string; hl: boolean; glue: boolean }[] = [];
  let prevEndsWithSpace = true;
  for (const part of text.split(/(\*[^*]+\*)/g)) {
    if (!part) continue;
    const hl = part.startsWith("*") && part.endsWith("*");
    const clean = hl ? part.slice(1, -1) : part;
    const startsWithSpace = /^\s/.test(clean);
    clean
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word, i) =>
        out.push({ word, hl, glue: i === 0 && out.length > 0 && !startsWithSpace && !prevEndsWithSpace }),
      );
    prevEndsWithSpace = /\s$/.test(clean);
  }
  return out;
}
