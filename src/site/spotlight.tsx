import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * The cursor spotlight. Each <Reveal> section stacks a base layer and an "alt"
 * layer in the same grid cell; the alt layer is clipped to a circle that
 * follows the pointer. One rAF loop eases the circle and writes --x/--y/--r on
 * the sections that are on screen, so nothing re-renders while it moves.
 *
 * "Honest mode" opens the circle over the whole page (the touch and keyboard
 * route to the same content).
 */
type SpotlightApi = { honest: boolean; toggleHonest: () => void };
const SpotlightContext = createContext<SpotlightApi>({ honest: false, toggleHonest: () => {} });
export const useSpotlight = () => useContext(SpotlightContext);

const DOT = 9;
const HONEST_R = 4000;

export function SpotlightProvider({ children }: { children: ReactNode }) {
  const [honest, setHonest] = useState(false);
  const honestRef = useRef(false);
  const dotRef = useRef<HTMLDivElement>(null);

  const toggleHonest = useCallback(() => {
    setHonest((h) => {
      honestRef.current = !h;
      document.documentElement.toggleAttribute("data-honest", !h);
      return !h;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const target = { x: -500, y: -500, r: 0 };
    const pos = { x: -500, y: -500, r: 0 };
    let inReveal = false;
    let hot = false;
    let touchTimer = 0;
    let raf = 0;
    const hotRadius = () => Math.min(190, Math.max(110, window.innerWidth * 0.12));

    const visible = new Set<HTMLElement>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
    });
    const observeAll = () => document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => io.observe(el));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    const classify = (el: Element | null) => {
      inReveal = Boolean(el?.closest("[data-reveal]"));
      hot = Boolean(el?.closest("[data-hot]"));
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (e.pointerType === "mouse") {
        classify(e.target as Element);
        root.setAttribute("data-cursor", "on");
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      // Touch: tap a headline to peek at the honest version for a moment.
      target.x = pos.x = e.clientX;
      target.y = pos.y = e.clientY;
      classify(e.target as Element);
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => (hot = false), 1400);
    };
    const onLeave = () => {
      inReveal = false;
      hot = false;
      root.removeAttribute("data-cursor");
    };
    // Scrolling moves content under a still pointer: re-check what is under it.
    const onScroll = () => {
      if (target.x < 0) return;
      classify(document.elementFromPoint(target.x, target.y));
    };

    const tick = () => {
      const honestNow = honestRef.current;
      target.r = honestNow ? HONEST_R : hot ? hotRadius() : inReveal ? DOT : 0;
      const ease = honestNow ? 0.06 : 0.2;
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      pos.r += (target.r - pos.r) * ease;
      if (Math.abs(target.r - pos.r) < 0.1) pos.r = target.r;

      for (const el of visible) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--x", `${pos.x - rect.left}px`);
        el.style.setProperty("--y", `${pos.y - rect.top}px`);
        el.style.setProperty("--r", `${pos.r}px`);
      }
      const dot = dotRef.current;
      if (dot) {
        dot.style.transform = `translate3d(${pos.x - DOT}px, ${pos.y - DOT}px, 0)`;
        dot.style.opacity = inReveal || honestNow ? "0" : "1";
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(touchTimer);
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <SpotlightContext.Provider value={{ honest, toggleHonest }}>
      {children}
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </SpotlightContext.Provider>
  );
}

/** A section with a cursor-revealed alter ego. The alt layer is decorative. */
export function Reveal({
  id,
  className = "",
  alt,
  children,
  label,
}: {
  id?: string;
  className?: string;
  alt: ReactNode;
  children: ReactNode;
  label?: string;
}) {
  return (
    <section id={id} className={`rv ${className}`} data-reveal aria-label={label}>
      <div className="rv__layer rv__base">{children}</div>
      <div className="rv__layer rv__alt" aria-hidden="true">
        {alt}
      </div>
    </section>
  );
}
