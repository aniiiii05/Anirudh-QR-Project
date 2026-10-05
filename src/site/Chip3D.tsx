import { useEffect, useRef, useState } from "react";
import type { ChipScene } from "./chipScene";

/**
 * Lazy wrapper for the three.js chip: the 3D code is fetched only when the
 * section approaches the viewport, rendering pauses off-screen, and a static
 * gradient stands in when WebGL is unavailable or motion is reduced.
 */
export function Chip3D({ monogram }: { monogram: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scene: ChipScene | null = null;
    let disposed = false;
    let inView = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !scene) {
          import("./chipScene")
            .then(({ createChipScene }) => {
              if (disposed) return;
              scene = createChipScene(cv, monogram);
              scene.setRunning(inView && !reduce);
            })
            .catch(() => setFailed(true));
        }
        scene?.setRunning(inView && !reduce);
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      scene?.setPointer(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene?.dispose();
    };
  }, [monogram]);

  return (
    <div ref={wrap} className={`chip3d${failed ? " chip3d--static" : ""}`} aria-hidden="true">
      {!failed && <canvas ref={canvas} />}
    </div>
  );
}
