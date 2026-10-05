import { useRef, useState, type KeyboardEvent } from "react";
import type { ProjectId } from "../profile";
import { visibleProjects } from "../profile";

type Capability = {
  label: "DATA" | "AUTOMATION" | "PRODUCT";
  line: string;
  project: ProjectId;
};

const capabilities: Capability[] = [
  { label: "DATA", line: "Find the signal. Make it useful.", project: "operations" },
  {
    label: "AUTOMATION",
    line: "Give the repetitive work a better job.",
    project: "workflow",
  },
  { label: "PRODUCT", line: "Make the idea real enough to test.", project: "practice" },
];

/** Small animated glyphs. Motion is CSS-only and only runs on the selected tile. */
function Glyph({ label }: { label: Capability["label"] }) {
  if (label === "DATA")
    return (
      <svg className="glyph glyph--data" viewBox="0 0 64 48" aria-hidden="true">
        <line x1="2" y1="46" x2="62" y2="46" />
        {[10, 22, 34, 46].map((x, i) => (
          <rect
            key={x}
            className={`glyph__bar glyph__bar--${i}`}
            x={x - 4}
            y={8}
            width="8"
            height="38"
            rx="2"
          />
        ))}
      </svg>
    );
  if (label === "AUTOMATION")
    return (
      <svg className="glyph glyph--auto" viewBox="0 0 64 48" aria-hidden="true">
        <rect className="glyph__track" x="2" y="30" width="60" height="10" rx="5" />
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            className={`glyph__crate glyph__crate--${i}`}
            x={6 + i * 20}
            y={16}
            width="12"
            height="12"
            rx="2.5"
          />
        ))}
      </svg>
    );
  return (
    <svg className="glyph glyph--product" viewBox="0 0 64 48" aria-hidden="true">
      <rect className="glyph__sketch" x="10" y="6" width="36" height="36" rx="6" />
      <rect className="glyph__real" x="18" y="10" width="36" height="36" rx="6" />
      <path className="glyph__tick" d="M28 28 l6 6 l11 -12" />
    </svg>
  );
}

export default function CapabilityStrip() {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = capabilities[selected];
  const related = visibleProjects.find((p) => p.id === current.project);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = capabilities.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus();
  }

  return (
    <section className="caps" aria-labelledby="caps-title">
      <div className="wrap">
        <h2 id="caps-title" className="sr-only">
          What I like working on
        </h2>
        <div className="caps__grid" role="group" aria-label="Interests">
          {capabilities.map((cap, i) => (
            <button
              key={cap.label}
              ref={(el) => (buttons.current[i] = el)}
              type="button"
              className="caps__tile"
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="caps__num mono" aria-hidden="true">
                0{i + 1}
              </span>
              <Glyph label={cap.label} />
              <span className="caps__label">{cap.label}</span>
            </button>
          ))}
        </div>
        <div className="caps__readout">
          <p className="caps__line" aria-live="polite" aria-atomic="true">
            <span className="sr-only">{current.label}: </span>
            {current.line}
          </p>
          {related && (
            <a className="caps__link" href={`#${related.id}`}>
              <span className="mono caps__link-kicker">Try the demo</span>
              <span className="caps__link-title">
                {related.title} <span aria-hidden="true">↓</span>
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
