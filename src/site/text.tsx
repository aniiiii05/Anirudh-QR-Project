import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Fragment, useRef } from "react";
import { tokens } from "./content";

/** Inline text with *highlight* support, no animation (used by alt layers). */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {tokens(text).map((t, i) => (
        <Fragment key={i}>
          {i > 0 && !t.glue && " "}
          <span className={t.hl ? "s-hl" : undefined}>{t.word}</span>
        </Fragment>
      ))}
    </>
  );
}

function Word({ word, hl, progress, range }: { word: string; hl: boolean; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className={hl ? "s-hl" : undefined}>
      {word}
    </motion.span>
  );
}

/** Words brighten one by one as the paragraph scrolls through the viewport. */
export function ScrubText({ text, as: Tag = "p", className }: { text: string; as?: "p" | "h2"; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.92", "end 0.6"] });
  const list = tokens(text);
  if (reduce)
    return (
      <Tag className={className}>
        <Rich text={text} />
      </Tag>
    );
  return (
    <Tag ref={ref} className={className}>
      {list.map((t, i) => (
        <Fragment key={i}>
          {i > 0 && !t.glue && " "}
          <Word word={t.word} hl={t.hl} progress={scrollYProgress} range={[i / list.length, (i + 1) / list.length]} />
        </Fragment>
      ))}
    </Tag>
  );
}

/** Display lines that slide up out of a mask when they enter the viewport. */
export function Lines({
  lines,
  className,
  animate = true,
  delay = 0,
  play,
}: {
  lines: readonly string[];
  className?: string;
  animate?: boolean;
  delay?: number;
  /** When set, the lines animate on this flag instead of on scroll-into-view. */
  play?: boolean;
}) {
  const reduce = useReducedMotion();
  const moving = animate && !reduce;
  // The observer watches the (unclipped) wrapper: the lines themselves start
  // fully hidden inside overflow:hidden masks and would never "intersect".
  return (
    <motion.span
      className={className}
      style={{ display: "block" }}
      initial={moving ? "hidden" : false}
      animate={moving && play !== undefined ? (play ? "show" : "hidden") : undefined}
      whileInView={moving && play === undefined ? "show" : undefined}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    >
      {lines.map((line, i) => {
        const hl = line.startsWith("*") && line.endsWith("*");
        const clean = hl ? line.slice(1, -1) : line;
        return (
          <span key={i} className="s-line">
            {moving ? (
              <motion.span
                className={`s-line__in${hl ? " s-hl" : ""}`}
                variants={{
                  hidden: { y: "105%" },
                  show: { y: "0%", transition: { duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.09 } },
                }}
              >
                {clean}
              </motion.span>
            ) : (
              <span className={`s-line__in${hl ? " s-hl" : ""}`}>{clean}</span>
            )}
          </span>
        );
      })}
    </motion.span>
  );
}

/** Small letter-spaced section label, e.g. "ABOUT ME". */
export function Label({ children }: { children: string }) {
  return <p className="s-label">{children}</p>;
}
