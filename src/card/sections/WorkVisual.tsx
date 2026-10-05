import type { ProjectId } from "../profile";

/** Original, decorative thumbnails for each work item (inline SVG, no imagery). */
export default function WorkVisual({ id }: { id: ProjectId }) {
  if (id === "operations")
    return (
      <svg className="thumb thumb--ops" viewBox="0 0 160 112" aria-hidden="true">
        <rect className="thumb__bg" x="0" y="0" width="160" height="112" rx="14" />
        {Array.from({ length: 10 }, (_, i) => {
          const x = 16 + (i % 5) * 27;
          const y = i < 5 ? 18 : 50;
          const good = ![2, 6, 3].includes(i);
          return (
            <rect
              key={i}
              className={good ? "thumb__cell is-good" : "thumb__cell"}
              x={x}
              y={y}
              width="20"
              height="24"
              rx="5"
            />
          );
        })}
        <rect className="thumb__meter" x="16" y="88" width="128" height="8" rx="4" />
        <rect className="thumb__meter-fill" x="16" y="88" width="90" height="8" rx="4" />
      </svg>
    );
  if (id === "practice")
    return (
      <svg className="thumb thumb--practice" viewBox="0 0 160 112" aria-hidden="true">
        <rect className="thumb__bg" x="0" y="0" width="160" height="112" rx="14" />
        <g transform="rotate(-5 80 56)">
          <rect className="thumb__note" x="34" y="18" width="92" height="76" rx="8" />
          <rect className="thumb__line" x="46" y="32" width="56" height="6" rx="3" />
          <rect className="thumb__line thumb__line--soft" x="46" y="44" width="40" height="6" rx="3" />
          <rect className="thumb__check" x="46" y="62" width="18" height="18" rx="5" />
          <path className="thumb__tick" d="M50 71 l4 4 l7 -9" />
          <rect className="thumb__line" x="72" y="68" width="40" height="6" rx="3" />
        </g>
      </svg>
    );
  return (
    <svg className="thumb thumb--flow" viewBox="0 0 160 112" aria-hidden="true">
      <rect className="thumb__bg" x="0" y="0" width="160" height="112" rx="14" />
      <g className="thumb__messy">
        <rect x="14" y="24" width="42" height="5" rx="2.5" transform="rotate(-6 35 26)" />
        <rect x="20" y="40" width="30" height="5" rx="2.5" transform="rotate(4 35 42)" />
        <rect x="12" y="56" width="44" height="5" rx="2.5" />
        <rect x="18" y="72" width="26" height="5" rx="2.5" transform="rotate(-3 31 74)" />
        <rect x="14" y="86" width="38" height="5" rx="2.5" transform="rotate(5 33 88)" />
      </g>
      <path className="thumb__arrow" d="M66 56 h18 m-6 -6 l6 6 l-6 6" />
      {[30, 50, 70].map((y) => (
        <g key={y}>
          <rect className="thumb__box" x="96" y={y - 6} width="12" height="12" rx="3" />
          <rect className="thumb__line thumb__line--light" x="114" y={y - 3} width="32" height="6" rx="3" />
        </g>
      ))}
    </svg>
  );
}
