import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import type { Area } from "./three/roomScene";
const RoomCanvas = lazy(() => import("./three/RoomCanvas"));
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
const areas: { id: Area; name: string; description: string }[] = [
  {
    id: "operations",
    name: "Data",
    description:
      "The monitor: a fictional delivery dashboard. Find the signal, then ask a better question.",
  },
  {
    id: "practice",
    name: "Product",
    description:
      "The idea board: one intention, one next step. Make something small enough to test.",
  },
  {
    id: "workflow",
    name: "Automation",
    description:
      "The building blocks: turn a messy list into a clearer workflow. Give the repetitive bits a better job.",
  },
];
export default function Workspace3D({
  onExplore,
}: {
  onExplore: (area: Area) => void;
}) {
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [area, setArea] = useState<Area | null>(null);
  const fail = useCallback(() => {
    setFailed(true);
    setActive(false);
  }, []);
  const selected = areas.find((item) => item.id === area);
  return (
    <section className="workspace-3d" aria-labelledby="workspace-title">
      <div className="workspace-copy">
        <span className="eyebrow">A LITTLE ROOM FOR IDEAS</span>
        <h2 id="workspace-title">
          Different tools.
          <br />
          Same curiosity.
        </h2>
        <p>
          An imaginary workspace for the things I like making. Pick a corner and
          take a closer look.
        </p>
        <div className="room-areas" role="group" aria-label="Workspace areas">
          {areas.map((item) => (
            <button
              key={item.id}
              aria-pressed={area === item.id}
              onClick={() => setArea(item.id)}
            >
              {item.name} ↗
            </button>
          ))}
        </div>
        <p className="room-description" aria-live="polite">
          {selected?.description ||
            "A desk for data. A board for ideas. A few building blocks for the boring bits."}
        </p>
        {selected && (
          <button className="text-link" onClick={() => onExplore(selected.id)}>
            Try this demo ↗
          </button>
        )}
        <a
          className="room-credit"
          href="/notices/3d-credits.txt"
          target="_blank"
          rel="noreferrer"
        >
          3D inspiration & credits ↗
        </a>
      </div>
      <div className="room-stage">
        <img
          src="/workspace-room.png"
          width="1200"
          height="900"
          alt="An original miniature workspace with a chart on a monitor, an idea board, lime building blocks, a stool and a plant."
        />
        {active && !failed && (
          <SceneBoundary
            fallback={
              <p className="room-error">
                3D is unavailable. The workspace links still work.
              </p>
            }
          >
            <Suspense
              fallback={
                <span className="room-loading" role="status">
                  Opening the workspace…
                </span>
              }
            >
              <RoomCanvas area={area} onFailure={fail} />
            </Suspense>
          </SceneBoundary>
        )}
        <div className="room-toolbar">
          <span>AN IMAGINARY WORKSPACE / 01</span>
          <button
            onClick={() => {
              setFailed(false);
              setActive(!active);
            }}
          >
            {active ? "Use still image" : "Explore in 3D ↗"}
          </button>
          {area && <button onClick={() => setArea(null)}>Reset view</button>}
        </div>
        {failed && (
          <p className="room-error" role="status">
            3D isn’t available on this device. You can still explore every demo.
          </p>
        )}
      </div>
    </section>
  );
}
