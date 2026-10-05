/**
 * Public configuration for the QR card experience.
 *
 * Only facts selected for publication belong here: this module is bundled into
 * the browser and imported by the server functions (vCard, metadata). Builder
 * context such as the current employer, residence or raw profile text must stay
 * out of this file — a visibility flag is display control, not privacy.
 * Provenance for every claim is recorded in docs/content-audit.md.
 */
export type EvidenceStatus =
  | "owner-supplied"
  | "link-checked"
  | "needs-clarification";

/** Honest project state: a demo is never presented as shipped work. */
export type ProjectState = "shipped" | "case-study" | "prototype" | "demo";

export type ProjectId = "operations" | "practice" | "workflow";

export type Project = {
  id: ProjectId;
  title: string;
  category: "DATA" | "PRODUCT" | "AUTOMATION";
  state: ProjectState;
  /** Visible badge text, e.g. "Exploring · demo". */
  label: string;
  /** One-line outcome shown in the collapsed list. */
  summary: string;
  problem: string;
  approach: string;
  /** What this is and who made it. */
  contribution: string;
  /** Short instruction for trying the demo. */
  prompt: string;
  /** Subject used by "Ask me about this". */
  askSubject: string;
  /** Draft display control only; never a privacy mechanism. */
  visible: boolean;
  evidenceStatus: EvidenceStatus;
};

export type SkillGroup = { group: string; items: string[] };

export const profile = {
  name: "Anirudh Sharma",
  givenName: "Anirudh",
  familyName: "Sharma",
  monogram: "AS",
  tagline: "Human, But Automated.",
  hook: "You found my offline profile.",
  description:
    "I turn messy ideas into useful systems. A personal introduction through data, automation and product experiments.",
  /** Owner-approved 4 Oct 2026: full-time data engineer; employer is never named. */
  role: "Data Engineer",
  employment: "Full-time",
  /** Owner-stated ambition (4 Oct 2026) — framed as aspiration, never as an established audience. */
  ambition: "Aspiring UGC creator and tech & marketing influencer",
  positioning:
    "Full-time data engineer and NIT Durgapur mechanical engineering graduate, building towards UGC and tech & marketing content. Python, SQL, ETL/ELT, cloud platforms and practical AI workflows by day; stories about them by night.",
  about: [
    "I’m Anirudh Sharma, a full-time data engineer and mechanical engineering graduate from NIT Durgapur, now building towards UGC and tech & marketing content. My interests sit at the intersection of data engineering, automation and product—from making data easier to work with to turning a small idea into something useful. I enjoy Python, SQL, cloud platforms and exploring practical applications of agentic AI. This space is for my personal projects and experiments.",
    "I like thoughtful questions, useful experiments, and making a process easier to use.",
  ],
  /** Owner-supplied public contact (4 Oct 2026); replaces the earlier Profile.pdf address. */
  email: "sharma.aniiirudh@gmail.com",
  linkedin: "https://www.linkedin.com/in/-anirudh-sharma/",
  github: "https://github.com/aniiiii05",
  pinterest: "https://in.pinterest.com/aniiiii07/",
  /** Owner supplied only the Instagram home page; replace with the profile URL once the handle is chosen. */
  instagram: "https://www.instagram.com/",
  education: {
    institution: "National Institute of Technology Durgapur",
    short: "NIT Durgapur",
    qualification: "B.Tech, Mechanical Engineering",
    start: "2022-11",
    end: "2026-06",
    evidenceStatus: "owner-supplied" as EvidenceStatus,
  },
  /** Self-described competencies from the owner's profile; no proficiency ratings by design. */
  skills: [
    {
      group: "Data engineering",
      items: ["Python", "SQL", "ETL/ELT pipelines", "Data modelling", "Data warehousing", "Azure Cloud"],
    },
    {
      group: "Practical automation",
      items: ["Workflow automation", "Exploring agentic AI", "Data automation platforms", "Git"],
    },
    {
      group: "Product curiosity",
      items: ["Statistical data analysis", "Business intelligence", "Digital strategy", "SEO", "Excel"],
    },
  ] satisfies SkillGroup[],
  /** Exact titles as listed; issuers and dates were not supplied, so none are shown. */
  learning: [
    "Master Zoho CRM: Sales, Automation & Management for Success",
    "Google AI Essentials",
    "Start Writing Prompts like a Pro",
    "Speed Up Data Analysis and Presentation Building",
    "Design Prompts for Everyday Work Tasks",
  ],
  languages: [
    { name: "Hindi", level: "Native or Bilingual" },
    { name: "English", level: "Full Professional" },
    { name: "Bengali", level: "Full Professional" },
  ],
  projects: [
    {
      id: "operations",
      title: "The operations lens",
      category: "DATA",
      state: "demo",
      label: "Exploring · demo",
      summary: "A clearer view of what arrives on time and what needs attention.",
      problem:
        "Delivery data gets useful when it points to the next question. On-time, in-full (OTIF) asks two things of every order: did it arrive by the promised date, and did it arrive complete?",
      approach:
        "Ten fictional orders per sample period. Each order is checked against both conditions and the percentage is calculated from those records, so the number and the list always agree.",
      contribution:
        "An interactive sample-data exploration built for this page by Anirudh. No employer data, no real results.",
      prompt: "Switch the sample period and see which orders change the number.",
      askSubject: "The operations lens",
      visible: true,
      evidenceStatus: "owner-supplied",
    },
    {
      id: "practice",
      title: "One small intention",
      category: "PRODUCT",
      state: "prototype",
      label: "Exploring · demo",
      summary: "A small idea turned into a testable product journey.",
      problem:
        "A big intention can be hard to act on. The interesting product question is how small the next step needs to be before it actually happens.",
      approach:
        "One intention, one concrete next step, one completion toggle. Nothing more until the smallest journey feels right.",
      contribution:
        "A local-only interaction prototype created for this page. It is not a launched product or an established case study.",
      prompt: "Write one intention and one small step. It stays in this tab and clears on refresh.",
      askSubject: "One small intention",
      visible: true,
      evidenceStatus: "owner-supplied",
    },
    {
      id: "workflow",
      title: "The useful workflow",
      category: "AUTOMATION",
      state: "demo",
      label: "Exploring · demo",
      summary: "Less copying between tabs. More time to think.",
      problem:
        "A messy list makes a simple task feel bigger. Copying notes between tabs and tidying them by hand is exactly the kind of work worth automating.",
      approach:
        "Deterministic rules: split into lines, trim whitespace and bullet marks, drop empty and duplicate lines, then output a checklist. No AI provider, no upload.",
      contribution:
        "A working browser-only demo built for this page. No external data and no claimed business results.",
      prompt: "Paste a few messy lines to get a cleaner next-step list.",
      askSubject: "The useful workflow",
      visible: true,
      evidenceStatus: "owner-supplied",
    },
  ] satisfies Project[],
};

export const visibleProjects = profile.projects.filter((p) => p.visible);

for (const url of [profile.github, profile.linkedin, profile.pinterest, profile.instagram]) {
  if (new URL(url).protocol !== "https:")
    throw new Error("Public links must use HTTPS");
}
