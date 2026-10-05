/**
 * Shared layout of the imaginary workspace. Pure data (no three.js import):
 * the scene builder, the live camera, the still-image hotspots and the poster
 * renderer all read these numbers, so the poster and the live scene agree.
 *
 * Units are roughly metres. y is up, the floor top is y = 0, the back wall
 * faces +z and the left wall faces +x. The camera looks in from the open
 * front-right corner.
 */
import type { ProjectId } from "../profile";

export type Area = ProjectId;
export type Vec3 = readonly [number, number, number];

/** A bounded camera pose: where it looks, from which direction, how close. */
export type CameraView = {
  target: Vec3;
  /** Radians around the y axis, measured from +z towards +x. */
  azimuth: number;
  /** Radians above the horizon. */
  elevation: number;
  /** Orthographic zoom relative to the fitted overview frame. */
  zoom: number;
};

export const deg = (value: number) => (value * Math.PI) / 180;

/** Platform footprint and wall height; the overview frame is fitted to it. */
export const ROOM = {
  minX: -3.8,
  maxX: 3.8,
  minZ: -3.0,
  maxZ: 3.0,
  floorTop: 0,
  baseBottom: -0.46,
  wallHeight: 3.55,
  wallThickness: 0.18,
} as const;

/** Points the overview must always contain (platform base to wall tops). */
export const FRAME_POINTS: Vec3[] = [
  [ROOM.minX, ROOM.baseBottom, ROOM.minZ],
  [ROOM.maxX, ROOM.baseBottom, ROOM.minZ],
  [ROOM.minX, ROOM.baseBottom, ROOM.maxZ],
  [ROOM.maxX, ROOM.baseBottom, ROOM.maxZ],
  [ROOM.minX, ROOM.wallHeight, ROOM.minZ],
  [ROOM.maxX, ROOM.wallHeight, ROOM.minZ],
  [ROOM.minX, ROOM.wallHeight, ROOM.maxZ],
  [ROOM.maxX, ROOM.floorTop, ROOM.maxZ],
];

/** Stage aspect ratio (CSS and poster use the same 5:4 frame). */
export const STAGE_ASPECT = 5 / 4;
export const POSTER_SIZE = { width: 1600, height: 1280 } as const;

export const OVERVIEW = {
  azimuth: deg(45),
  elevation: deg(29),
  /** Breathing room around the platform, as a fraction of the frame. */
  margin: 0.07,
} as const;

/** Parallax limits (desktop mouse only). Small on purpose. */
export const PARALLAX = { azimuth: deg(3.2), elevation: deg(1.8) } as const;

/** Focus targets must stay inside this box. */
export const TARGET_LIMITS = {
  min: [-3.4, 0.2, -2.7] as Vec3,
  max: [3.4, 3.2, 2.7] as Vec3,
};

export type AreaLayout = {
  /** Where the hotspot pin sits (just above the object). */
  anchor: Vec3;
  /** A point on the object itself, used to aim clicks in tests. */
  pick: Vec3;
  /** Centre of the still-image highlight. */
  spot: Vec3;
  /** The focused camera pose. */
  view: CameraView;
};

export const AREA_LAYOUT: Record<Area, AreaLayout> = {
  operations: {
    anchor: [-0.3, 3.13, -2.46],
    pick: [-0.1, 2.45, -2.4],
    spot: [-0.3, 2.3, -2.2],
    view: { target: [-0.25, 2.05, -2.2], azimuth: deg(22), elevation: deg(13), zoom: 2.75 },
  },
  practice: {
    anchor: [2.35, 3.48, -2.74],
    pick: [2.0, 2.62, -2.74],
    spot: [1.9, 2.3, -2.3],
    view: { target: [1.85, 2.2, -2.25], azimuth: deg(32), elevation: deg(18), zoom: 2.25 },
  },
  workflow: {
    anchor: [2.22, 0.98, 1.8],
    pick: [2.3, 0.5, 2.07],
    spot: [2.2, 0.55, 1.8],
    view: { target: [2.15, 0.62, 1.7], azimuth: deg(50), elevation: deg(27), zoom: 2.3 },
  },
};

export const AREA_ORDER: Area[] = ["operations", "practice", "workflow"];
