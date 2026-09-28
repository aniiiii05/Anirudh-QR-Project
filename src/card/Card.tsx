import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { profile } from "./profile";
import { contactSchema, qrDestination, tidyLines } from "./logic";
import "./card.css";
import Workspace3D from "./Workspace3D";
const capabilities = [
  ["DATA", "Find the signal. Make it useful."],
  ["AUTOMATION", "Give the repetitive work a better job."],
  ["PRODUCT", "Make the idea real enough to test."],
];
const Arrow = () => <span aria-hidden="true">↗</span>;
function Demo({ id }: { id: string }) {
  const [period, setPeriod] = useState(false);
  const [text, setText] = useState(
    "Map the process\n  Find the bottleneck\nMap the process\nTry one small change",
  );
  const [intention, setIntention] = useState("Make room for a good idea");
  const [step, setStep] = useState("Write one sentence about it");
  const [done, setDone] = useState(false);
  if (id === "operations")
    return (
      <div className="demo">
        <div className="demo-heading">
          <span>FICTIONAL ORDERS / OTIF</span>
          <button onClick={() => setPeriod(!period)}>
            Sample {period ? "B" : "A"} ↔
          </button>
        </div>
        <strong className="demo-number">
          {period ? "80" : "70"}
          <small>%</small>
        </strong>
        <p>{period ? "8" : "7"} of 10 orders arrived on time and in full.</p>
        <div className="order-bars" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={i < (period ? 8 : 7) ? "good" : ""} />
          ))}
        </div>
        <small>Illustrative data, not business performance.</small>
      </div>
    );
  if (id === "practice")
    return (
      <div className="demo">
        <label htmlFor="intention">ONE INTENTION</label>
        <input
          id="intention"
          maxLength={120}
          value={intention}
          onChange={(e) => {
            setIntention(e.target.value);
            setDone(false);
          }}
        />
        <label htmlFor="step">ONE SMALL STEP</label>
        <input
          id="step"
          maxLength={120}
          value={step}
          onChange={(e) => {
            setStep(e.target.value);
            setDone(false);
          }}
        />
        <button
          className="pill dark"
          disabled={!intention.trim() || !step.trim()}
          onClick={() => setDone(!done)}
        >
          {done ? "A little progress. ✓" : "Mark this step done ↗"}
        </button>
        <p role="status">
          {done
            ? "Small steps count. Keep going."
            : "A local-only prototype. Refresh to start again."}
        </p>
      </div>
    );
  const lines = tidyLines(text);
  return (
    <div className="demo">
      <label htmlFor="notes">YOUR MESSY LIST</label>
      <textarea
        id="notes"
        maxLength={2000}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div aria-live="polite">
        <p className="eyebrow">{lines.length} CLEAR NEXT STEPS</p>
        {lines.length ? (
          <ul className="clean-list">
            {lines.map((line) => (
              <li key={line}>
                <span aria-hidden="true">□</span> {line}
              </li>
            ))}
          </ul>
        ) : (
          <p>Add a line above to begin.</p>
        )}
      </div>
      <small>Everything stays in this tab. No AI, no upload.</small>
    </div>
  );
}
export default function Card() {
  const [capability, setCapability] = useState(0);
  const [openWork, setOpenWork] = useState("");
  const [sheet, setSheet] = useState<"contact" | "form" | null>(null);
  const [subject, setSubject] = useState("");
  const [copy, setCopy] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    contextUrl: "",
    consent: false,
    website: "",
  });
  const opener = useRef<HTMLElement | null>(null);
  const requestKey = useRef("");
  useEffect(() => {
    document.title = `${profile.name} — ${profile.tagline}`;
    const slug = location.hash.slice(1);
    if (profile.projects.some((p) => p.id === slug && p.publicApproval))
      setOpenWork(slug);
  }, []);
  function show(kind: "contact" | "form", topic = "") {
    opener.current = document.activeElement as HTMLElement;
    setSubject(topic);
    setSheet(kind);
    setResult("");
  }
  async function copyLink() {
    const link = new URL("/card", location.origin).href;
    try {
      await navigator.clipboard.writeText(link);
      setCopy("Copied!");
    } catch {
      setCopy(link);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const issues: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        issues[String(i.path[0])] = i.message;
      });
      setErrors(issues);
      return;
    }
    setErrors({});
    setBusy(true);
    setResult("");
    requestKey.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey.current,
        },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Not delivered");
      setResult("Received. I’ll read this and get back to you when I can.");
      setForm({
        name: "",
        email: "",
        message: "",
        contextUrl: "",
        consent: false,
        website: "",
      });
      requestKey.current = "";
    } catch {
      setResult(
        "That didn't send. Your message is still here—please retry or use email.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="handoff">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="card-header">
        <a className="monogram" href="/card" aria-label="Anirudh Sharma home">
          AS<span>.</span>
        </a>
        <span className="header-note">01 / A PERSON ON THE INTERNET</span>
        <nav aria-label="Main">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <button onClick={() => show("contact")}>
            Say hello <Arrow />
          </button>
        </nav>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-kicker">
            <span className="eyebrow">YOU FOUND MY OFFLINE PROFILE.</span>
            <span className="eyebrow">OFFLINE → ONLINE</span>
          </div>
          <h1>
            Hi, I'm
            <br />
            <span>Anirudh.</span>
            <span className="idea-tile" aria-hidden="true">
              ↗
            </span>
          </h1>
          <div className="hero-bottom">
            <p className="hero-statement">
              I turn messy ideas
              <br />
              into useful systems.
            </p>
            <div className="hero-detail">
              <p>
                Data brain. Product curiosity. A soft spot for automating the
                boring bits.
              </p>
              <div className="actions">
                <a className="pill dark" href="#work">
                  See what I make <Arrow />
                </a>
                <button className="text-link" onClick={() => show("contact")}>
                  Say hello <Arrow />
                </button>
              </div>
            </div>
          </div>
          <div className="hero-foot">
            <span>
              The card worked. Now let's make the conversation interesting.
            </span>
            <span>SCROLL TO EXPLORE ↓</span>
          </div>
        </section>
        <section className="capability" aria-label="Interests">
          <div className="capability-buttons">
            {capabilities.map(([label], i) => (
              <button
                key={label}
                aria-pressed={capability === i}
                onClick={() => setCapability(i)}
                onFocus={() => setCapability(i)}
              >
                {label}
                <span aria-hidden="true">{i !== 2 && "/"}</span>
              </button>
            ))}
          </div>
          <p aria-live="polite">{capabilities[capability][1]}</p>
        </section>
        <Workspace3D
          onExplore={(id) => {
            setOpenWork(id);
            history.replaceState(null, "", `#${id}`);
            requestAnimationFrame(() =>
              document
                .getElementById(id)
                ?.scrollIntoView({
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "auto"
                    : "smooth",
                  block: "start",
                }),
            );
          }}
        />
        <section id="work" className="work">
          <div className="section-top">
            <span className="eyebrow">02 / THE MAKING OF THINGS</span>
            <span className="eyebrow">
              SMALL EXPERIMENTS. USEFUL QUESTIONS.
            </span>
          </div>
          <h2>
            A few things I've made,
            <br />
            mapped, or made easier.
          </h2>
          <div className="work-list">
            {profile.projects
              .filter((p) => p.publicApproval)
              .map((project, i) => (
                <article
                  id={project.id}
                  className={`work-item ${openWork === project.id ? "expanded" : ""}`}
                  key={project.id}
                >
                  <button
                    className="work-toggle"
                    aria-expanded={openWork === project.id}
                    aria-controls={`${project.id}-detail`}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setOpenWork("");
                    }}
                    onClick={() => {
                      const next = openWork === project.id ? "" : project.id;
                      setOpenWork(next);
                      history.replaceState(
                        null,
                        "",
                        next ? `#${next}` : "#work",
                      );
                    }}
                  >
                    <span className="work-index">0{i + 1}</span>
                    <div
                      className={`work-visual visual-${i}`}
                      aria-hidden="true"
                    >
                      {i === 0 ? (
                        <div className="mini-bars">
                          {[40, 70, 50, 90, 65].map((h, n) => (
                            <i key={n} style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      ) : i === 1 ? (
                        <span className="practice-mark">1 → 1</span>
                      ) : (
                        <span className="workflow-mark">[ ] → [✓]</span>
                      )}
                    </div>
                    <div className="work-copy">
                      <span className="eyebrow">
                        {project.category}{" "}
                        <span className="badge">Exploring · demo</span>
                      </span>
                      <h3>{project.title}</h3>
                      <p>{project.summary}</p>
                    </div>
                    <span className="expand-icon" aria-hidden="true">
                      {openWork === project.id ? "−" : "+"}
                    </span>
                  </button>
                  <div
                    id={`${project.id}-detail`}
                    hidden={openWork !== project.id}
                    className="work-detail"
                  >
                    <div>
                      <p>{project.problem}</p>
                      <p>
                        <strong>What this is</strong>
                        <br />
                        {project.contribution}
                      </p>
                      <p>{project.outcome}</p>
                      <button
                        className="text-link"
                        onClick={() => show("contact", project.title)}
                      >
                        Ask me about this <Arrow />
                      </button>
                    </div>
                    <Demo id={project.id} />
                  </div>
                </article>
              ))}
          </div>
        </section>
        <section id="about" className="about">
          <div>
            <span className="eyebrow">03 / THE PERSON BEHIND THE PROCESS</span>
            <p className="about-sign">
              Human,
              <br />
              <em>But Automated.</em>
            </p>
          </div>
          <div>
            <h2>
              Curious by default.
              <br />
              Practical on purpose.
            </h2>
            <p>{profile.bio}</p>
            <p>
              I like thoughtful questions, useful experiments, and making a
              process easier to use.
            </p>
            <span className="about-label">DATA / AUTOMATION / PRODUCT</span>
          </div>
        </section>
        <section className="conversation">
          <span className="eyebrow">
            04 / GOOD THINGS START WITH A CONVERSATION
          </span>
          <h2>
            What should we make
            <br />
            <em>less annoying?</em>
          </h2>
          <div className="conversation-bottom">
            <p>
              Tell me about a small bottleneck or an interesting idea. I like
              thoughtful problems.
            </p>
            <div className="actions">
              <button className="pill dark" onClick={() => show("form")}>
                Share a thought <Arrow />
              </button>
              <button className="text-link" onClick={() => show("contact")}>
                Just connect <Arrow />
              </button>
            </div>
          </div>
        </section>
      </main>
      <footer className="card-footer">
        <p>You scanned. We should probably say hi.</p>
        <div>
          <span>
            {profile.name} © {new Date().getFullYear()}
          </span>
          <span>Built as a personal project</span>
          <a href="/privacy">Privacy</a>
          <button onClick={copyLink}>
            Copy link <Arrow />
          </button>
        </div>
        <small>
          Personal work and opinions; no employer affiliation implied.
        </small>
        <span role="status" className="copy-status">
          {copy}
        </span>
      </footer>
      <Dialog
        open={sheet !== null}
        onOpenChange={(value) => {
          if (!value) setSheet(null);
        }}
      >
        <DialogContent
          className="card-dialog"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            opener.current?.focus();
          }}
        >
          <DialogTitle>
            {sheet === "form"
              ? "What’s on your mind?"
              : "A good place to say hello."}
          </DialogTitle>
          <DialogDescription>
            {subject
              ? `Let’s talk about ${subject}.`
              : "A small thought, an interesting question, or simply hello."}
          </DialogDescription>
          {sheet === "contact" ? (
            <div className="contact-links">
              <a
                href={`${"mailto:" + profile.email}?subject=${encodeURIComponent(subject || "Hello from your card")}`}
              >
                Email <Arrow />
                <small>{profile.email}</small>
              </a>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                LinkedIn <Arrow />
              </a>
              <a href={profile.github} target="_blank" rel="noreferrer">
                GitHub <Arrow />
              </a>
              <a href="/contact.vcf" download>
                Save contact ↓
              </a>
              <button onClick={copyLink}>
                Copy page link <Arrow />
              </button>
              <p role="status">{copy}</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="thought-form">
              <p className="form-note">
                Direct delivery is pending setup. You can use{" "}
                <a href={`mailto:${profile.email}`}>email</a> now.
              </p>
              {(["name", "email", "message", "contextUrl"] as const).map(
                (key) => (
                  <label key={key} htmlFor={`contact-${key}`}>
                    {
                      {
                        name: "Your name",
                        email: "Email",
                        message: "What’s on your mind?",
                        contextUrl: "Context or link (optional HTTPS URL)",
                      }[key]
                    }
                    {key === "message" ? (
                      <textarea
                        id={`contact-${key}`}
                        rows={4}
                        maxLength={1200}
                        aria-invalid={!!errors[key]}
                        aria-describedby={
                          errors[key] ? `${key}-error` : undefined
                        }
                        value={form[key]}
                        onChange={(e) => {
                          setForm({ ...form, [key]: e.target.value });
                          requestKey.current = "";
                        }}
                      />
                    ) : (
                      <input
                        id={`contact-${key}`}
                        type={
                          key === "email"
                            ? "email"
                            : key === "contextUrl"
                              ? "url"
                              : "text"
                        }
                        autoComplete={
                          key === "name" || key === "email" ? key : "off"
                        }
                        maxLength={
                          key === "name" ? 80 : key === "email" ? 254 : 500
                        }
                        aria-invalid={!!errors[key]}
                        aria-describedby={
                          errors[key] ? `${key}-error` : undefined
                        }
                        value={form[key]}
                        onChange={(e) => {
                          setForm({ ...form, [key]: e.target.value });
                          requestKey.current = "";
                        }}
                      />
                    )}
                    {errors[key] && (
                      <span id={`${key}-error`} className="field-error">
                        {errors[key]}
                      </span>
                    )}
                  </label>
                ),
              )}
              <label className="honeypot" aria-hidden="true">
                Website
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                />
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) =>
                    setForm({ ...form, consent: e.target.checked })
                  }
                />
                I understand Anirudh may reply by email
              </label>
              {errors.consent && (
                <p className="field-error">{errors.consent}</p>
              )}
              <button className="pill dark" disabled={busy}>
                {busy ? "Sending…" : "Send thought ↗"}
              </button>
              <p role="status">{result}</p>
              <a href="/privacy">How your message is handled</a>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function QRRedirect() {
  useEffect(() => {
    location.replace(qrDestination(location.href));
  }, []);
  return (
    <p>
      Taking you to <a href="/card">Anirudh’s card</a>…
    </p>
  );
}
export function Privacy() {
  return (
    <div className="handoff privacy-page">
      <a className="text-link" href="/card">
        ← Back to the card
      </a>
      <h1>
        Privacy,
        <br />
        plainly.
      </h1>
      <p>
        This personal page uses no analytics cookies and collects no interaction
        analytics. The demos run in your browser tab; their text is not sent to
        a server or saved after a refresh.
      </p>
      <h2>Getting in touch</h2>
      <p>
        Direct form delivery is not enabled yet. Until a delivery provider and
        retention period are configured, the form does not accept messages. Use
        email or LinkedIn to connect.
      </p>
      <p>
        If you send an email, your email service and the recipient’s email
        service process it. Your details are used to read and reply. You can
        request deletion by emailing{" "}
        <a href={`mailto:${profile.email}`}>{profile.email}</a>.
      </p>
      <h2>Hosting and external links</h2>
      <p>
        The deployment host may process standard request information for
        security and delivery. GitHub and LinkedIn apply their own privacy
        policies when you follow those links.
      </p>
      <p>Last updated: 27 September 2026.</p>
    </div>
  );
}
