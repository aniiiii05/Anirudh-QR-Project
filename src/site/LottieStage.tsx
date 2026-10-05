import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

type LottiePlayer = typeof import("lottie-web").default;
let playerPromise: Promise<LottiePlayer> | null = null;
/** The light SVG build: no expressions, no eval — fits the site's CSP. */
const loadPlayer = () =>
  (playerPromise ??= import("lottie-web/build/player/lottie_light").then(
    (m) => (m as unknown as { default: LottiePlayer }).default,
  ));

/**
 * Palette-recoloured Lottie illustrations (see scripts/build-site-assets.mjs).
 * Each animation is fetched only the first time it becomes active, and only the
 * active one plays.
 */
export function LottieStage({ keys, active, visible }: { keys: readonly string[]; active: string; visible: boolean }) {
  const holders = useRef<Record<string, HTMLDivElement | null>>({});
  const anims = useRef<Record<string, AnimationItem>>({});

  useEffect(() => {
    if (!visible) {
      Object.values(anims.current).forEach((a) => a.pause());
      return;
    }
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    loadPlayer()
      .then((lottie) => {
        if (cancelled) return;
        const holder = holders.current[active];
        if (holder && !anims.current[active]) {
          anims.current[active] = lottie.loadAnimation({
            container: holder,
            renderer: "svg",
            loop: true,
            autoplay: false,
            path: `/site/lottie/${active}.json`,
            rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: true },
          });
        }
        for (const [key, anim] of Object.entries(anims.current)) {
          if (key !== active) anim.pause();
          else if (reduce) anim.goToAndStop(40, true);
          else anim.play();
        }
      })
      .catch(() => {
        /* Decorative only: the section reads fine without the illustration. */
      });
    return () => {
      cancelled = true;
    };
  }, [active, visible]);

  useEffect(() => () => Object.values(anims.current).forEach((a) => a.destroy()), []);

  return (
    <div className="lottie-stage" aria-hidden="true">
      {keys.map((key) => (
        <div
          key={key}
          ref={(el) => (holders.current[key] = el)}
          className={`lottie-stage__item${key === active ? " is-active" : ""}`}
        />
      ))}
    </div>
  );
}

/**
 * A single section illustration: fetched when it nears the viewport, plays
 * only while visible, and speeds up while hovered.
 */
export function LottieClip({ name, className = "" }: { name: string; className?: string }) {
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let anim: AnimationItem | null = null;
    let visible = false;
    let disposed = false;
    const sync = () => {
      if (!anim) return;
      if (reduce) anim.goToAndStop(40, true);
      else if (visible) anim.play();
      else anim.pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !anim)
          loadPlayer()
            .then((lottie) => {
              if (disposed || anim) return;
              anim = lottie.loadAnimation({
                container: el,
                renderer: "svg",
                loop: true,
                autoplay: false,
                path: `/site/lottie/${name}.json`,
                rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: true },
              });
              anim.addEventListener("DOMLoaded", sync);
            })
            .catch(() => {
              /* decorative */
            });
        sync();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    const fast = () => anim?.setSpeed(1.8);
    const normal = () => anim?.setSpeed(1);
    el.addEventListener("pointerenter", fast);
    el.addEventListener("pointerleave", normal);
    return () => {
      disposed = true;
      io.disconnect();
      el.removeEventListener("pointerenter", fast);
      el.removeEventListener("pointerleave", normal);
      anim?.destroy();
    };
  }, [name]);
  return <div ref={holder} className={`lottie-clip ${className}`} aria-hidden="true" />;
}
