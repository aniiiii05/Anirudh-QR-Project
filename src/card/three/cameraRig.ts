/**
 * Camera maths for the workspace, kept pure (no three.js import) so it can be
 * unit-tested and used by the still image without loading WebGL code.
 *
 * The live scene uses a THREE.OrthographicCamera positioned with
 * `cameraPosition(view)` and `lookAt(view.target)`, and a frustum of
 * ±halfHeight·aspect by ±halfHeight. `projectToStage` reproduces exactly that
 * projection, which is how still-image hotspots line up with the poster.
 */
import { clamp, lerp } from "./maths";
import {
  AREA_LAYOUT,
  FRAME_POINTS,
  OVERVIEW,
  PARALLAX,
  TARGET_LIMITS,
  type Area,
  type CameraView,
  type Vec3,
} from "./layout";

export const CAMERA_DISTANCE = 24;

type Basis = { toCamera: Vec3; right: Vec3; up: Vec3 };

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a: Vec3, b: Vec3, scale = 1): Vec3 => [
  a[0] + b[0] * scale,
  a[1] + b[1] * scale,
  a[2] + b[2] * scale,
];

/** Camera axes for a view direction (world up is +y, as with Object3D.lookAt). */
export function cameraBasis(azimuth: number, elevation: number): Basis {
  const cosE = Math.cos(elevation);
  const toCamera: Vec3 = [Math.sin(azimuth) * cosE, Math.sin(elevation), Math.cos(azimuth) * cosE];
  // right = normalize(up × toCamera) = (toCamera.z, 0, -toCamera.x) / |…|
  const length = Math.hypot(toCamera[2], toCamera[0]) || 1;
  const right: Vec3 = [toCamera[2] / length, 0, -toCamera[0] / length];
  // up = toCamera × right
  const up: Vec3 = [
    toCamera[1] * right[2] - toCamera[2] * right[1],
    toCamera[2] * right[0] - toCamera[0] * right[2],
    toCamera[0] * right[1] - toCamera[1] * right[0],
  ];
  return { toCamera, right, up };
}

export type Frame = {
  /** Look target that centres the whole platform in the overview. */
  center: Vec3;
  /** Orthographic half height at zoom 1 for this aspect ratio. */
  halfHeight: number;
  aspect: number;
};

/**
 * Fit the overview to the platform for any aspect ratio: wide stages are
 * height-limited, narrow/portrait stages are width-limited, so the whole room
 * is always visible with the same margin.
 */
export function fitFrame(aspect: number, points: Vec3[] = FRAME_POINTS): Frame {
  const safeAspect = clamp(Number.isFinite(aspect) && aspect > 0 ? aspect : 1, 0.3, 4);
  const { right, up } = cameraBasis(OVERVIEW.azimuth, OVERVIEW.elevation);
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const point of points) {
    const x = dot(point, right);
    const y = dot(point, up);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const center = add(add([0, 0, 0], right, cx), up, cy);
  const halfHeight =
    Math.max((maxY - minY) / 2, (maxX - minX) / 2 / safeAspect) * (1 + OVERVIEW.margin);
  return { center, halfHeight, aspect: safeAspect };
}

export function clampTarget(target: Vec3): Vec3 {
  return [
    clamp(target[0], TARGET_LIMITS.min[0], TARGET_LIMITS.max[0]),
    clamp(target[1], TARGET_LIMITS.min[1], TARGET_LIMITS.max[1]),
    clamp(target[2], TARGET_LIMITS.min[2], TARGET_LIMITS.max[2]),
  ];
}

/** The overview, or the bounded focus pose of an area. */
export function viewFor(area: Area | null, frame: Frame): CameraView {
  if (!area)
    return {
      target: frame.center,
      azimuth: OVERVIEW.azimuth,
      elevation: OVERVIEW.elevation,
      zoom: 1,
    };
  const view = AREA_LAYOUT[area].view;
  return { ...view, target: clampTarget(view.target), zoom: clamp(view.zoom, 1, 3) };
}

/** Eased blend between two poses; zoom is blended in log space so it feels even. */
export function interpolateView(from: CameraView, to: CameraView, t: number): CameraView {
  const k = clamp(t, 0, 1);
  return {
    target: [
      lerp(from.target[0], to.target[0], k),
      lerp(from.target[1], to.target[1], k),
      lerp(from.target[2], to.target[2], k),
    ],
    azimuth: lerp(from.azimuth, to.azimuth, k),
    elevation: lerp(from.elevation, to.elevation, k),
    zoom: Math.exp(lerp(Math.log(from.zoom), Math.log(to.zoom), k)),
  };
}

/** Apply a pointer offset in [-1, 1]² as a small, bounded orbit. */
export function withParallax(view: CameraView, x: number, y: number): CameraView {
  return {
    ...view,
    azimuth: view.azimuth + clamp(x, -1, 1) * PARALLAX.azimuth,
    elevation: view.elevation - clamp(y, -1, 1) * PARALLAX.elevation,
  };
}

export function cameraPosition(view: CameraView, distance = CAMERA_DISTANCE): Vec3 {
  const { toCamera } = cameraBasis(view.azimuth, view.elevation);
  return add(view.target, toCamera, distance);
}

/**
 * Project a world point to stage coordinates (0..1, origin top-left) for an
 * orthographic camera in `view` with the overview `frame`.
 */
export function projectToStage(point: Vec3, view: CameraView, frame: Frame) {
  const { right, up } = cameraBasis(view.azimuth, view.elevation);
  const relative: Vec3 = [
    point[0] - view.target[0],
    point[1] - view.target[1],
    point[2] - view.target[2],
  ];
  const ndcX = (dot(relative, right) * view.zoom) / (frame.halfHeight * frame.aspect);
  const ndcY = (dot(relative, up) * view.zoom) / frame.halfHeight;
  return { x: 0.5 + ndcX / 2, y: 0.5 - ndcY / 2 };
}

/** True when two poses are visually identical (used to stop the render loop). */
export function viewsMatch(a: CameraView, b: CameraView, epsilon = 1e-4) {
  return (
    Math.abs(a.azimuth - b.azimuth) < epsilon &&
    Math.abs(a.elevation - b.elevation) < epsilon &&
    Math.abs(a.zoom - b.zoom) < epsilon &&
    Math.abs(a.target[0] - b.target[0]) < epsilon &&
    Math.abs(a.target[1] - b.target[1]) < epsilon &&
    Math.abs(a.target[2] - b.target[2]) < epsilon
  );
}

/** Transition length: longer moves take a little longer, never more than ~1.1 s. */
export function transitionDuration(from: CameraView, to: CameraView, reducedMotion: boolean) {
  if (reducedMotion) return 0;
  const distance = Math.hypot(
    to.target[0] - from.target[0],
    to.target[1] - from.target[1],
    to.target[2] - from.target[2],
  );
  const zoomChange = Math.abs(Math.log(to.zoom / from.zoom));
  return clamp(520 + distance * 90 + zoomChange * 180, 520, 1100);
}
