import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { profile, type ProjectId } from "./profile";
import type { Area } from "./three/layout";
import { placePins, STILL_PINS, STILL_SPOTS, type PinRefs } from "./three/pins";
import { hasWebGL2 } from "./three/webgl";
import "./workspace.css";

export type { Area } from "./three/layout";

type RoomCanvasModule = typeof import("./three/RoomCanvas");

/**
 * Browsers remember a failed module fetch for the life of the page, so a plain
 * re-import after a network error fails instantly. When the error names the
 * chunk URL (Chrome, Firefox), the retry asks for the same chunk with a query
 * string, which is a fresh module request.
 */
let failedChunk: string | null = null;
function chunkUrlFromError(error: unknown): string | null {
  const match = /https?:\/\/[^\s'"]+/.exec(String((error as Error | undefined)?.message ?? error));
  if (!match) return null;
  try {
    const url = new URL(match[0].replace(/[).,]+$/, ""));
    return url.origin === window.location.origin ? url.href : null;
  } catch {
    return null;
  }
}

/** The only route to three.js: requested after "Explore in 3D". */
function loadRoomCanvas(attempt: number): Promise<RoomCanvasModule> {
  const request: Promise<RoomCanvasModule> = failedChunk
    ? import(/* @vite-ignore */ `${failedChunk}${failedChunk.includes("?") ? "&" : "?"}retry=${attempt}`)
    : import("./three/RoomCanvas");
  return request.then(
    (module) => {
      failedChunk = null;
      return module;
    },
    (error: unknown) => {
      failedChunk = chunkUrlFromError(error) ?? failedChunk;
      throw error;
    },
  );
}

type Mode = "still" | "loading" | "active" | "error";
type Problem = "unsupported" | "load-failed" | "context-lost";

const AREAS: { id: ProjectId; index: string; name: string; description: string }[] = [
  {
    id: "operations",
    index: "01",
    name: "Data",
    description:
      "The monitor shows a sample chart. Spot the bar that stands out, then ask a better question of the data.",
  },
  {
    id: "practice",
    index: "02",
    name: "Product",
    description:
      "The idea board and the notebook: one intention, one small next step. Small enough to test.",
  },
  {
    id: "workflow",
    index: "03",
    name: "Automation",
    description:
      "Building blocks on a rail: a messy pile goes in, a tidy stack comes out. The repetitive bits get a better job.",
  },
];

const titles = Object.fromEntries(profile.projects.map((project) => [project.id, project.title])) as Record<
  ProjectId,
  string
>;

const MESSAGES: Record<Problem, string> = {
  unsupported:
    "3D isn’t available on this device, so here’s the still view. Every corner still works.",
  "load-failed": "The 3D view couldn’t load. The still view and every corner still work.",
  "context-lost":
    "The 3D view paused because the graphics context was lost. The still view and every corner still work.",
};

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Workspace3D({ onExplore }: { onExplore: (id: ProjectId) => void }) {
  const [mode, setMode] = useState<Mode>("still");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [restored, setRestored] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [hovered, setHovered] = useState<Area | null>(null);
  const pins: PinRefs = useRef({});

  // A fresh lazy component per attempt, so "Try 3D again" re-requests the chunk.
  const RoomCanvas = useMemo(() => lazy(() => loadRoomCanvas(attempt)), [attempt]);

  const selected = AREAS.find((item) => item.id === area);
  const mounted = mode === "loading" || mode === "active" || (mode === "error" && problem === "context-lost");

  // Pins follow the live camera while 3D is active, and the poster otherwise.
  useLayoutEffect(() => {
    if (mode !== "active") placePins(pins, STILL_PINS);
  }, [mode]);

  const fail = useCallback((reason: Problem) => {
    setProblem(reason);
    setRestored(false);
    setHovered(null);
    setMode("error");
  }, []);

  const explore = () => {
    if (!hasWebGL2()) return fail("unsupported");
    setProblem(null);
    setRestored(false);
    setAttempt((value) => value + 1);
    setMode("loading");
  };
  const toStill = () => {
    setProblem(null);
    setRestored(false);
    setHovered(null);
    setMode("still");
  };

  const callbacks = useMemo(
    () => ({
      onReady: () => setMode((value) => (value === "loading" ? "active" : value)),
      onSelect: (id: Area) => setArea(id),
      onHover: (id: Area | null) => setHovered(id),
      onFailure: () => fail("unsupported"),
      onContextLost: () => fail("context-lost"),
      onContextRestored: () => setRestored(true),
      onLoadError: () => fail("load-failed"),
    }),
    [fail],
  );

  let primary: { label: string; action: () => void; disabled?: boolean };
  const canReset = Boolean(area) || mode === "active";
  if (mode === "loading" || mode === "active") primary = { label: "Use still image", action: toStill };
  else if (problem === "load-failed" || (problem === "context-lost" && restored))
    primary = { label: "Try 3D again", action: explore };
  else if (problem === "context-lost") primary = { label: "Use still image", action: toStill };
  else if (problem === "unsupported") primary = { label: "Explore in 3D ↗", action: explore, disabled: true };
  else primary = { label: "Explore in 3D ↗", action: explore };

  const status =
    mode === "loading"
      ? "Opening the 3D workspace…"
      : mode === "active"
        ? "3D workspace ready. Pick a corner, or click an object in the room."
        : problem
          ? MESSAGES[problem]
          : "";
  const spot = area && mode !== "active" ? STILL_SPOTS[area] : null;

  return (
    <section id="workspace" className="workspace-3d" aria-labelledby="workspace-title">
      <div className="workspace-copy">
        <p className="workspace-eyebrow">A LITTLE ROOM FOR IDEAS</p>
        <h2 id="workspace-title" className="workspace-title">
          <span>Different tools.</span> <span>Same curiosity.</span>
        </h2>
        <p className="workspace-intro">
          An imaginary workspace for the things I like making. Pick a corner and take a closer look.
        </p>
        <div className="room-areas" role="group" aria-label="Workspace corners">
          {AREAS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="room-area"
              aria-pressed={area === item.id}
              data-hover={hovered === item.id || undefined}
              onClick={() => setArea(item.id)}
            >
              <span className="room-area-index" aria-hidden="true">
                {item.index}
              </span>
              {item.name}
            </button>
          ))}
        </div>
        <div className="room-detail" aria-live="polite">
          <p className="room-description">
            {selected?.description ?? "A desk for data. A board for ideas. A few building blocks for the boring bits."}
          </p>
          {selected && (
            <button type="button" className="room-open" onClick={() => onExplore(selected.id)}>
              Open {titles[selected.id]} ↗
            </button>
          )}
        </div>
        <a className="room-credit" href="/notices/3d-credits.txt" target="_blank" rel="noopener">
          3D inspiration &amp; credits ↗
        </a>
      </div>

      <div className={`room-figure is-${mode}`}>
        <div className={`room-stage is-${mode}`} data-area={area ?? undefined}>
          <picture className="room-poster">
            <source type="image/webp" srcSet="/workspace-room.webp" />
            <img
              src="/workspace-room.png"
              width={1600}
              height={1280}
              decoding="async"
              alt="An imaginary miniature workspace: a desk with a monitor showing a sample bar chart, an idea board with sticky notes, a notebook, a stool, a plant, a bookshelf and a row of building blocks."
            />
          </picture>
          {spot && (
            <span
              className={`room-spot room-spot-${area}`}
              style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }}
              aria-hidden="true"
            />
          )}
          {mounted && (
            <SceneBoundary key={attempt} onError={callbacks.onLoadError}>
              <Suspense fallback={null}>
                <RoomCanvas
                  area={area}
                  pins={pins}
                  onReady={callbacks.onReady}
                  onSelect={callbacks.onSelect}
                  onHover={callbacks.onHover}
                  onFailure={callbacks.onFailure}
                  onContextLost={callbacks.onContextLost}
                  onContextRestored={callbacks.onContextRestored}
                />
              </Suspense>
            </SceneBoundary>
          )}
          <div className="room-pins">
            {AREAS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="room-pin"
                ref={(element) => {
                  pins.current[item.id] = element;
                }}
                aria-label={`Focus the ${item.name} corner`}
                aria-pressed={area === item.id}
                data-hover={hovered === item.id || undefined}
                onClick={() => setArea(item.id)}
              >
                <span className="room-pin-dot" aria-hidden="true" />
                <span className="room-pin-label" aria-hidden="true">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        {/* Outside the stage so that, on narrow screens, it sits below the scene
            instead of covering the hotspot pins. */}
        <p className={`room-status${mode === "active" || !status ? " is-quiet" : ""}`} role="status">
          {status}
        </p>
        <div className="room-toolbar">
          <span className="room-caption">
            AN IMAGINARY WORKSPACE
            {selected ? ` / ${selected.index} ${selected.name.toUpperCase()}` : ""}
          </span>
          <div className="room-actions">
            {/* Always rendered (aria-disabled when there is nothing to reset) so
                keyboard focus is never dropped when it is activated. */}
            <button
              type="button"
              className="room-button"
              aria-disabled={canReset ? undefined : true}
              onClick={() => {
                if (!canReset) return;
                setArea(null);
                setHovered(null);
              }}
            >
              Reset view
            </button>
            <button
              type="button"
              className="room-button is-primary"
              aria-disabled={primary.disabled || undefined}
              onClick={primary.disabled ? explore : primary.action}
            >
              {primary.label}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
