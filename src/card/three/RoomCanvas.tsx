/**
 * Live WebGL view of the workspace. Loaded only through a dynamic import after
 * "Explore in 3D"; this is the only module (with roomScene) that imports three.
 *
 * Rendering is on demand: a frame is drawn only while the camera is moving,
 * the parallax is easing or the size changed, and the loop stops once the
 * view settles. It never runs while the canvas is off-screen or the document
 * is hidden.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  fitFrame,
  interpolateView,
  transitionDuration,
  viewFor,
  viewsMatch,
  withParallax,
  type Frame,
} from "./cameraRig";
import { AREA_LAYOUT, AREA_ORDER, type Area, type CameraView, type Vec3 } from "./layout";
import { clamp, damp, smoothstep } from "./maths";
import { placePins, type PinRefs, type StagePoint } from "./pins";
import { applyView, configureRenderer, createCamera, createRoom, type Quality } from "./roomScene";

type Props = {
  area: Area | null;
  /** Hotspot buttons rendered by the page; positioned here every frame. */
  pins: PinRefs;
  onReady: () => void;
  onSelect: (area: Area) => void;
  onHover: (area: Area | null) => void;
  onFailure: () => void;
  onContextLost: () => void;
  onContextRestored: () => void;
};

/** Dev-only hook for end-to-end tests (stripped from production builds). */
type TestHook = {
  pickPoint: (area: Area) => { x: number; y: number };
  state: () => {
    area: Area | null;
    settled: boolean;
    renders: number;
    quality: Quality;
    pixelRatio: number;
    drawCalls: number;
    triangles: number;
  };
};

declare global {
  interface Window {
    __workspaceTest?: TestHook;
  }
}

function detectQuality(): { quality: Quality; pixelRatio: number; frameInterval: number } {
  // Touch-first small screens count as coarse even where the media query is not reported.
  const coarse =
    window.matchMedia("(pointer: coarse)").matches ||
    (navigator.maxTouchPoints > 0 && Math.min(window.innerWidth, window.innerHeight) < 600);
  const cores = navigator.hardwareConcurrency || 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const low = coarse || cores <= 4 || (memory !== undefined && memory <= 4);
  return {
    quality: low ? "low" : "high",
    pixelRatio: Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5),
    frameInterval: low ? 1000 / 30 : 1000 / 60,
  };
}

export default function RoomCanvas(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const focus = useRef<(area: Area | null) => void>();

  useEffect(() => {
    focus.current?.(props.area);
  }, [props.area]);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    const call = latest.current;
    const { quality, pixelRatio, frameInterval } = detectQuality();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      call.onFailure();
      return;
    }
    let room: ReturnType<typeof createRoom>;
    try {
      room = createRoom({ quality });
    } catch {
      renderer.dispose();
      renderer.forceContextLoss();
      call.onFailure();
      return;
    }
    const { scene, pickables } = room;
    const camera = createCamera();
    const canvas = renderer.domElement;
    renderer.setPixelRatio(pixelRatio);
    configureRenderer(renderer);
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("tabindex", "-1");
    canvas.style.touchAction = "pan-y";
    mount.appendChild(canvas);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    let reduced = motionQuery.matches;
    let frame: Frame = fitFrame(mount.clientWidth / Math.max(1, mount.clientHeight));
    let selected: Area | null = null;
    let current: CameraView = viewFor(null, frame);
    let transition: { from: CameraView; to: CameraView; start: number; duration: number } | null = null;
    const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let onScreen = true;
    let lost = false;
    let disposed = false;
    let ready = false;
    let raf = 0;
    let last = -Infinity;
    let renders = 0;
    let hovered: Area | null = null;
    const anchor = new THREE.Vector3();

    const canRender = () => ready && onScreen && !document.hidden && !lost && !disposed;

    function updatePins() {
      const positions: Partial<Record<Area, StagePoint>> = {};
      for (const area of AREA_ORDER) {
        // While a corner is focused only its own pin stays; the overview shows all three.
        if (selected && area !== selected) continue;
        anchor.set(...AREA_LAYOUT[area].anchor).project(camera);
        positions[area] = { x: (anchor.x + 1) / 2, y: (1 - anchor.y) / 2 };
      }
      placePins(latest.current.pins, positions);
    }

    function draw() {
      applyView(camera, withParallax(current, parallax.x, parallax.y), frame);
      renderer.render(scene, camera);
      renders++;
      updatePins();
    }

    function tick(now: number) {
      raf = 0;
      if (!canRender()) return;
      if (now - last < frameInterval - 2) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      let moving = false;
      if (transition) {
        const t = transition.duration > 0 ? (now - transition.start) / transition.duration : 1;
        current = interpolateView(transition.from, transition.to, smoothstep(t, 0, 1));
        if (t >= 1) {
          current = transition.to;
          transition = null;
        } else moving = true;
      }
      if (reduced) {
        parallax.x = parallax.targetX = 0;
        parallax.y = parallax.targetY = 0;
      } else {
        parallax.x = damp(parallax.x, parallax.targetX, 6, dt);
        parallax.y = damp(parallax.y, parallax.targetY, 6, dt);
        if (Math.abs(parallax.x - parallax.targetX) < 1e-3 && Math.abs(parallax.y - parallax.targetY) < 1e-3) {
          parallax.x = parallax.targetX;
          parallax.y = parallax.targetY;
        } else moving = true;
      }
      draw();
      if (moving) raf = requestAnimationFrame(tick);
    }

    function invalidate() {
      if (!raf && canRender()) raf = requestAnimationFrame(tick);
    }

    function goTo(area: Area | null) {
      selected = area;
      const to = viewFor(area, frame);
      if (viewsMatch(current, to) && !transition) return invalidate();
      const now = performance.now();
      const duration = transitionDuration(current, to, reduced);
      transition = { from: current, to, start: now, duration };
      invalidate();
    }
    focus.current = (area) => {
      if (area === selected) return;
      if (!area) {
        parallax.targetX = parallax.targetY = 0;
      }
      if (ready) goTo(area);
      else selected = area;
    };
    selected = latest.current.area;

    function resize() {
      const width = mount!.clientWidth;
      const height = mount!.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      frame = fitFrame(width / height);
      if (!selected && !transition) current = viewFor(null, frame);
      if (ready) {
        last = -Infinity;
        invalidate();
      }
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const intersection = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) invalidate();
      },
      { threshold: 0 },
    );
    intersection.observe(mount);

    // ------------------------------------------------------------- pointer
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (clientX: number, clientY: number): Area | null => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      return (hit?.object.userData.area as Area | undefined) ?? null;
    };
    let hoverFrame = 0;
    let pointer: { x: number; y: number } | null = null;
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !ready) return;
      const rect = canvas.getBoundingClientRect();
      if (hoverQuery.matches && !reduced) {
        parallax.targetX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
        parallax.targetY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
        invalidate();
      }
      pointer = { x: event.clientX, y: event.clientY };
      if (!hoverFrame)
        hoverFrame = requestAnimationFrame(() => {
          hoverFrame = 0;
          if (!pointer || lost) return;
          const area = pick(pointer.x, pointer.y);
          if (area !== hovered) {
            hovered = area;
            canvas.style.cursor = area ? "pointer" : "";
            latest.current.onHover(area);
          }
        });
    };
    const onPointerLeave = () => {
      parallax.targetX = parallax.targetY = 0;
      pointer = null;
      if (hovered) {
        hovered = null;
        canvas.style.cursor = "";
        latest.current.onHover(null);
      }
      invalidate();
    };
    // `click` only fires for a tap or click, never for a scroll gesture.
    const onClick = (event: MouseEvent) => {
      if (!ready || lost) return;
      const area = pick(event.clientX, event.clientY);
      if (area) latest.current.onSelect(area);
    };
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("click", onClick);

    // ------------------------------------------------------------- environment
    const onMotion = (event: MediaQueryListEvent) => {
      reduced = event.matches;
      if (reduced && transition) {
        current = transition.to;
        transition = null;
      }
      invalidate();
    };
    const onVisibility = () => {
      if (!document.hidden) {
        last = -Infinity;
        invalidate();
      }
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      latest.current.onContextLost();
    };
    const onRestored = () => {
      latest.current.onContextRestored();
    };
    motionQuery.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    if (import.meta.env.DEV) {
      window.__workspaceTest = {
        pickPoint(area) {
          const rect = canvas.getBoundingClientRect();
          const point = new THREE.Vector3(...(AREA_LAYOUT[area].pick as Vec3)).project(camera);
          return {
            x: rect.left + ((point.x + 1) / 2) * rect.width,
            y: rect.top + ((1 - point.y) / 2) * rect.height,
          };
        },
        state: () => ({
          area: selected,
          settled: !transition && !raf,
          renders,
          quality,
          pixelRatio: renderer.getPixelRatio(),
          drawCalls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
        }),
      };
    }

    // ------------------------------------------------------------- first frame
    const start = async () => {
      applyView(camera, current, frame);
      try {
        await renderer.compileAsync(scene, camera);
      } catch {
        // Older drivers without parallel compile: the first render compiles.
      }
      if (disposed || lost) return;
      ready = true;
      draw();
      latest.current.onReady();
      const initial = selected;
      selected = null;
      if (initial) goTo(initial);
    };
    void start();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (hoverFrame) cancelAnimationFrame(hoverFrame);
      focus.current = undefined;
      resizeObserver.disconnect();
      intersection.disconnect();
      motionQuery.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (import.meta.env.DEV) delete window.__workspaceTest;
      room.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      try {
        if (!lost) renderer.forceContextLoss();
      } catch {
        // Context already gone.
      }
      canvas.remove();
    };
  }, []);

  return <div ref={host} className="room-canvas" />;
}
