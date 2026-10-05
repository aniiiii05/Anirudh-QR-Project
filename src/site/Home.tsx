import { Github, Instagram, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import Lenis from "lenis";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { site } from "./content";
import { Reveal, SpotlightProvider, useSpotlight } from "./spotlight";
import { Label, Lines, Rich, ScrubText } from "./text";
import { LottieClip, LottieStage } from "./LottieStage";
import { Chip3D } from "./Chip3D";
import "./site.css";

const NAV = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "connect", label: "Contact" },
] as const;

let lenis: Lenis | null = null;
function scrollToId(e: MouseEvent, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(el, { offset: id === "top" ? 0 : -40 });
  else el.scrollIntoView({ behavior: "smooth" });
  history.replaceState(null, "", id === "top" ? "/" : `#${id}`);
}

function Pinterest({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M10.6 8.6c2.6-1.2 5.2.3 4.9 2.9-.3 2.4-2.3 3.4-3.7 2.6M11.9 10.6 9.7 19.8" />
    </svg>
  );
}

const SOCIALS = [
  { href: site.connect.links[0].href, label: "LinkedIn", Icon: Linkedin },
  { href: site.connect.links[1].href, label: "Instagram", Icon: Instagram },
  { href: site.connect.links[2].href, label: "Pinterest", Icon: Pinterest },
  { href: site.connect.links[3].href, label: "GitHub", Icon: Github },
  { href: `mailto:${site.email}`, label: "Email", Icon: Mail },
];

/* ------------------------------------------------------------------ chrome */

function Intro({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const start = performance.now();
    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((res) => {
        const img = new Image();
        img.onload = img.onerror = () => res();
        img.src = window.innerWidth <= 760 ? "/site/img/hero-photo-640.webp" : "/site/img/hero-photo-1100.webp";
      }),
    ]);
    let done = false;
    ready.then(() => (done = true));
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      const target = done ? 100 : Math.min(92, t * 100);
      setPct((p) => Math.min(100, Math.max(p, Math.round(p + (target - p) * 0.12 + (done ? 1 : 0)))));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const cap = window.setTimeout(() => (done = true), 3500);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(cap);
    };
  }, []);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (pct < 100) return;
    setLeaving(true);
    // Hand over slightly before the curtain finishes so the headline rises with it.
    const t = window.setTimeout(() => doneRef.current(), 650);
    return () => window.clearTimeout(t);
  }, [pct >= 100]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`intro${leaving ? " intro--out" : ""}`} aria-hidden="true">
      <div className="intro__mark">
        <span className="intro__mono">{site.monogram}</span>
        <span className="intro__pct">{String(pct).padStart(3, "0")}</span>
      </div>
    </div>
  );
}

function Chrome() {
  const { honest, toggleHonest } = useSpotlight();
  const [active, setActive] = useState<string>("top");
  useEffect(() => {
    const ids = ["top", ...NAV.map((n) => n.id)];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return (
    <>
      <a className="s-skip" href="#about">
        Skip to content
      </a>
      <header className="chrome-top">
        <a href="/" className="s-mono" onClick={(e) => scrollToId(e, "top")} aria-label={`${site.name} — back to top`}>
          {site.monogram}
          <i>.</i>
        </a>
        <nav aria-label="Primary">
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={(e) => scrollToId(e, n.id)} aria-current={active === n.id ? "true" : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <aside className="s-rail s-rail--left" aria-label="Social links">
        <ul>
          {SOCIALS.map(({ href, label, Icon }) => (
            <li key={label}>
              <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" aria-label={label} title={label}>
                <Icon size={17} />
              </a>
            </li>
          ))}
        </ul>
      </aside>
      <div className="s-rail s-rail--right">
        <button type="button" className="s-honest" aria-pressed={honest} onClick={toggleHonest}>
          Honest mode <b>{honest ? "On" : "Off"}</b>
        </button>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- sections */

function Hero({ ready }: { ready: boolean }) {
  const h = site.hero;
  return (
    <Reveal
      id="top"
      className="s-hero"
      label="Introduction"
      alt={
        <div className="s-hero__inner">
          <picture className="s-hero__img s-hero__img--alt">
            <img src="/site/img/hero-alt-1100.webp" srcSet="/site/img/hero-alt-640.webp 640w, /site/img/hero-alt-1100.webp 1100w" sizes="(max-width: 760px) 100vw, 50vw" alt="" decoding="async" />
          </picture>
          <p className="s-hero__kicker">{h.kicker}</p>
          <p className="s-hero__title" data-hot>
            <Lines lines={h.altLines} animate={false} />
          </p>
          <p className="s-hero__sub">{h.altSub}</p>
        </div>
      }
    >
      <div className="s-hero__inner">
        <picture className="s-hero__img">
          <img
            src="/site/img/hero-photo-1100.webp"
            srcSet="/site/img/hero-photo-640.webp 640w, /site/img/hero-photo-1100.webp 1100w"
            sizes="(max-width: 760px) 100vw, 50vw"
            width={1106}
            height={1422}
            alt={`Portrait of ${site.name}`}
            {...{ fetchpriority: "high" }}
            decoding="async"
          />
        </picture>
        <p className="s-hero__kicker">{h.kicker}</p>
        <h1 className="s-hero__title" data-hot>
          <span className="sr-only">{site.name} — data engineer by day, creator by night. </span>
          <span aria-hidden="true">
            <Lines lines={h.lines} delay={0.1} play={ready} />
          </span>
        </h1>
        <p className="s-hero__sub">{h.sub}</p>
        <span className="s-hero__scroll" aria-hidden="true">
          Scroll
        </span>
      </div>
    </Reveal>
  );
}

function About() {
  const a = site.about;
  return (
    <Reveal
      id="about"
      className="s-section about"
      label={a.label}
      alt={
        <div className="s-wrap">
          <Label>{a.label}</Label>
          <p className="big-text" data-hot>
            <Rich text={a.alt} />
          </p>
        </div>
      }
    >
      <div className="s-wrap">
        <div className="split">
          <div>
            <Label>{a.label}</Label>
            <div data-hot>
              <ScrubText text={a.text} className="big-text" />
            </div>
          </div>
          <LottieClip name="about" className="split__art" />
        </div>
        <dl className="facts">
          {a.facts.map((f) => (
            <div key={f.k}>
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Reveal>
  );
}

function Services() {
  const s = site.services;
  const [active, setActive] = useState<string>(s.items[0].key);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "150px 0px" });
    io.observe(el);
    // Rows crossing the middle of the viewport become active (touch + scroll).
    const rows = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive((e.target as HTMLElement).dataset.key!)),
      { rootMargin: "-48% 0px -48% 0px" },
    );
    el.querySelectorAll<HTMLElement>(".svc[data-key]").forEach((r) => rows.observe(r));
    return () => {
      io.disconnect();
      rows.disconnect();
    };
  }, []);
  const list = (alt: boolean) => (
    <ol className="svc-list">
      {s.items.map((it, i) => (
        <li
          key={it.key}
          className={`svc${active === it.key ? " is-active" : ""}`}
          data-key={alt ? undefined : it.key}
          onPointerEnter={alt ? undefined : () => setActive(it.key)}
        >
          <span className="svc__n">0{i + 1}</span>
          <h3 className="svc__title" data-hot>
            {it.title}
          </h3>
          <p className="svc__text">{alt ? it.alt : it.text}</p>
          {!alt && <LottieClip name={it.key} className="svc__art" />}
        </li>
      ))}
    </ol>
  );
  return (
    <div ref={ref} className="services-shell">
      <Reveal
        className="s-section services"
        label={s.label}
        alt={
          <div className="s-wrap services__grid">
            <div>
              <Label>{s.label}</Label>
              {list(true)}
            </div>
          </div>
        }
      >
        <div className="s-wrap services__grid">
          <div>
            <Label>{s.label}</Label>
            {list(false)}
          </div>
        </div>
      </Reveal>
      <div className="services__stage">
        <LottieStage keys={s.items.map((i) => i.key)} active={active} visible={visible} />
      </div>
    </div>
  );
}

function Experience() {
  const e = site.experience;
  return (
    <Reveal
      className="s-section experience"
      label={e.label}
      alt={
        <div className="s-wrap">
          <Label>{e.label}</Label>
          <p className="big-text" data-hot>
            <Rich text={e.alt} />
          </p>
        </div>
      }
    >
      <div className="s-wrap split split--flip">
        <div>
          <Label>{e.label}</Label>
          <div data-hot>
            <ScrubText text={e.text} className="big-text" />
          </div>
        </div>
        <LottieClip name="experience" className="split__art" />
      </div>
    </Reveal>
  );
}

function History() {
  const h = site.history;
  const rows = (alt: boolean) => (
    <ol className="s-history">
      {h.rows.map((r, i) => (
        <li key={i} className="s-history__row">
          <span className="s-history__when">{r.when}</span>
          <div>
            <h3 className="s-history__role" data-hot>
              {alt ? r.altRole : r.role}
            </h3>
            <p className="s-history__org">{alt ? r.altOrg : r.org}</p>
          </div>
        </li>
      ))}
    </ol>
  );
  return (
    <Reveal
      className="s-section s-history-section"
      label={h.label}
      alt={
        <div className="s-wrap">
          <Label>{h.label}</Label>
          {rows(true)}
        </div>
      }
    >
      <div className="s-wrap">
        <Label>{h.label}</Label>
        {rows(false)}
      </div>
    </Reveal>
  );
}

function Stack() {
  const s = site.stack;
  return (
    <Reveal
      className="s-section stack"
      label={s.label}
      alt={
        <div className="s-wrap stack__grid">
          <div>
            <Label>{s.label}</Label>
            <p className="big-text big-text--sm" data-hot>
              <Rich text={s.alt} />
            </p>
          </div>
        </div>
      }
    >
      <div className="s-wrap stack__grid">
        <div>
          <Label>{s.label}</Label>
          <h2 className="s-display s-display--md" data-hot>
            <Lines lines={["The tech", "*behind the*", "content"]} />
          </h2>
          <div className="stack__groups">
            {s.groups.map((g) => (
              <div key={g.group} className="stack__group">
                <h3>{g.group}</h3>
                <ul>
                  {g.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="stack__learn-row">
            <details className="stack__learning">
              <summary>Learning &amp; credentials</summary>
              <ul>
                {s.learning.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </details>
            <LottieClip name="learning" className="stack__learn-art" />
          </div>
        </div>
        <Chip3D monogram={site.monogram} />
      </div>
    </Reveal>
  );
}

function Work() {
  const w = site.work;
  return (
    <Reveal
      id="work"
      className="s-section s-work"
      label={w.label}
      alt={
        <div className="s-wrap">
          <Label>{w.label}</Label>
          <p className="s-display s-display--lg" data-hot>
            <Lines lines={w.altTitle} animate={false} />
          </p>
          <p className="s-work__note">Every creator starts at zero posts. This is me, at zero, telling you about it.</p>
        </div>
      }
    >
      <div className="s-wrap">
        <div className="split split--work">
          <div>
            <Label>{w.label}</Label>
            <h2 className="s-display s-display--lg" data-hot>
              <Lines lines={w.title} />
            </h2>
            <p className="s-work__note">{w.note}</p>
          </div>
          <figure className="portrait portrait--tilt">
            <img src="/site/img/reel-photo-1100.webp" srcSet="/site/img/reel-photo-640.webp 640w, /site/img/reel-photo-1100.webp 1100w" sizes="(max-width: 760px) 90vw, 36vw" width={1106} height={1422} alt={`${site.name} in an empty theatre`} loading="lazy" decoding="async" />
            <figcaption>Empty theatre. First reel loading.</figcaption>
          </figure>
        </div>
        <ul className="slots">
          <li className="slot slot--calendar">
            <span className="slot__n">Calendar</span>
            <LottieClip name="calendar" className="slot__art" />
            <span className="slot__format">Posting schedule</span>
            <span className="slot__status">Being planned</span>
          </li>
          {w.slots.map((slot, i) => (
            <li key={i} className="slot" style={{ aspectRatio: slot.ratio }}>
              <span className="slot__n">Slot {String(i + 1).padStart(2, "0")}</span>
              <span className="slot__play" aria-hidden="true" />
              <span className="slot__format">{slot.format}</span>
              <span className="slot__status">In production</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

function Motto() {
  const m = site.motto;
  return (
    <Reveal
      className="s-section motto"
      label={m.label}
      alt={
        <div className="s-wrap motto__inner">
          <Label>{m.label}</Label>
          <p className="s-display s-display--xl" data-hot>
            <Lines lines={m.altLines} animate={false} />
          </p>
          <p className="motto__by">Also {m.by}</p>
        </div>
      }
    >
      <div className="s-wrap motto__inner">
        <Label>{m.label}</Label>
        <blockquote className="s-display s-display--xl" data-hot>
          <Lines lines={m.lines} />
        </blockquote>
        <p className="motto__by">{m.by}</p>
      </div>
    </Reveal>
  );
}

function Connect() {
  const c = site.connect;
  return (
    <Reveal
      id="connect"
      className="s-section s-connect"
      label={c.label}
      alt={
        <div className="s-wrap">
          <div className="s-connect__img s-connect__img--alt">
            <img src="/site/img/connect-alt-1100.webp" srcSet="/site/img/connect-alt-640.webp 640w, /site/img/connect-alt-1100.webp 1100w" sizes="(max-width: 700px) 100vw, 50vw" alt="" loading="lazy" decoding="async" />
          </div>
          <Label>{c.label}</Label>
          <ul className="s-links">
            {c.links.map((l) => (
              <li key={l.name}>
                <span className="s-links__name" data-hot>
                  {l.name}
                </span>
                <span className="s-links__note">{l.alt}</span>
              </li>
            ))}
          </ul>
          <div className="s-email">
            <span className="s-email__note">{c.emailAlt}</span>
            <span className="s-email__addr" data-hot>
              {site.email}
            </span>
          </div>
        </div>
      }
    >
      <div className="s-wrap">
        <figure className="s-connect__img portrait">
          <img src="/site/img/connect-photo-1600.webp" srcSet="/site/img/connect-photo-800.webp 800w, /site/img/connect-photo-1600.webp 1600w" sizes="(max-width: 760px) 90vw, 40vw" width={2400} height={1792} alt={`${site.name}, studio portrait`} loading="lazy" decoding="async" />
          <figcaption>Say hi — I don’t bite. Mostly.</figcaption>
        </figure>
        <Label>{c.label}</Label>
        <ul className="s-links">
          {c.links.map((l) => (
            <li key={l.name}>
              <a href={l.href} target="_blank" rel="noopener noreferrer">
                <span className="s-links__name" data-hot>
                  <ArrowUpRight className="s-links__arrow" size={22} aria-hidden="true" />
                  {l.name}
                </span>
                <span className="s-links__note">{l.note}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="s-email">
          <LottieClip name="email" className="s-email__art" />
          <div>
            <span className="s-email__note">{c.emailNote}</span>
            <a className="s-email__addr" href={`mailto:${site.email}`} data-hot>
              {site.email}
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Footer() {
  return (
    <footer className="s-footer">
      <div className="s-wrap s-footer__inner">
        <p>
          © {new Date().getFullYear()} {site.name}. Personal work and opinions — no employer affiliation implied.
        </p>
        <ul>
          <li>
            <a href="/card">Digital card</a>
          </li>
          <li>
            <a href="/privacy">Privacy</a>
          </li>
          <li>
            <a href="#top" onClick={(e) => scrollToId(e, "top")}>
              Back to top ↑
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------- page */

const INTRO_KEY = "as-intro-seen";

export default function Home() {
  const [intro, setIntro] = useState(() => {
    try {
      return !sessionStorage.getItem(INTRO_KEY) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.title = site.title;
    document.documentElement.classList.add("site");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    if (import.meta.env.DEV) (window as unknown as { __lenis?: Lenis | null }).__lenis = lenis;
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target) {
      if (lenis) lenis.scrollTo(target, { immediate: true, offset: -40 });
      else target.scrollIntoView();
    }
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
      document.documentElement.classList.remove("site");
    };
  }, []);

  useEffect(() => {
    if (intro) lenis?.stop();
    else lenis?.start();
  }, [intro]);

  return (
    <SpotlightProvider>
      {intro && (
        <Intro
          onDone={() => {
            try {
              sessionStorage.setItem(INTRO_KEY, "1");
            } catch {
              /* private mode: the intro simply plays again */
            }
            setIntro(false);
          }}
        />
      )}
      <Chrome />
      <main className="page">
        <Hero ready={!intro} />
        <About />
        <Services />
        <Experience />
        <History />
        <Stack />
        <Work />
        <Motto />
        <Connect />
      </main>
      <Footer />
    </SpotlightProvider>
  );
}
