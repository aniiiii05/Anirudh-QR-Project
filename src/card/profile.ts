export type Project = {
  id: string;
  title: string;
  category: string;
  status: "shipped" | "case-study" | "exploring";
  summary: string;
  problem: string;
  contribution: string;
  outcome: string;
  publicApproval: boolean;
};
export const profile = {
  name: "Anirudh Sharma",
  tagline: "Human, But Automated.",
  bio: "I'm Anirudh Sharma, a mechanical engineering graduate who likes building at the intersection of data, automation and product.",
  email: "sharma.aniiirudh@gmail.com",
  linkedin: "https://www.linkedin.com/in/-anirudh-sharma/",
  github: "https://github.com/aniiiii05",
  projects: [
    {
      id: "operations",
      title: "The operations lens",
      category: "DATA",
      status: "exploring",
      summary:
        "A clearer view of what arrives on time and what needs attention.",
      problem:
        "Delivery data gets useful when it points to the next question. This small dashboard uses fictional orders to explore on-time, in-full delivery.",
      contribution:
        "An interactive sample-data exploration built for this page; no employer data or results.",
      outcome: "Switch the sample period to see how the calculation changes.",
      publicApproval: true,
    },
    {
      id: "practice",
      title: "One small intention",
      category: "PRODUCT",
      status: "exploring",
      summary: "A small idea turned into a testable product journey.",
      problem:
        "A big intention can be hard to act on. This concept turns one intention into a small, concrete next step.",
      contribution:
        "A local-only interaction prototype created for this page, not a launched product or an Alignaa case study.",
      outcome: "Try writing one intention below. It stays in this browser tab.",
      publicApproval: true,
    },
    {
      id: "workflow",
      title: "The useful workflow",
      category: "AUTOMATION",
      status: "exploring",
      summary: "Less copying between tabs. More time to think.",
      problem:
        "A messy list makes a simple task feel bigger. This rule-based demo trims whitespace, removes duplicate lines and turns notes into a checklist.",
      contribution:
        "A working browser-only demo; no AI provider, external data or claimed business results.",
      outcome: "Paste a few lines to get a cleaner next-step list.",
      publicApproval: true,
    },
  ] satisfies Project[],
};
for (const url of [profile.github, profile.linkedin]) {
  if (new URL(url).protocol !== "https:")
    throw new Error("Public links must use HTTPS");
}
