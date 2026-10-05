import { describe, expect, it } from "vitest";
import {
  cameraBasis,
  cameraPosition,
  clampTarget,
  fitFrame,
  interpolateView,
  projectToStage,
  transitionDuration,
  viewFor,
  viewsMatch,
  withParallax,
} from "./cameraRig";
import { AREA_LAYOUT, AREA_ORDER, FRAME_POINTS, OVERVIEW, PARALLAX, STAGE_ASPECT, TARGET_LIMITS } from "./layout";
import { clamp, damp, lerp, smoothstep } from "./maths";
import { pinVisible, STILL_PINS, STILL_SPOTS } from "./pins";

describe("maths helpers", () => {
  it("clamp, lerp and smoothstep behave like folio-2025's originals", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
    expect(lerp(2, 4, 0.5)).toBe(3);
    expect(lerp(2, 4, 0)).toBe(2);
    expect(smoothstep(-1, 0, 1)).toBe(0);
    expect(smoothstep(0.5, 0, 1)).toBe(0.5);
    expect(smoothstep(2, 0, 1)).toBe(1);
    expect(smoothstep(0.25, 0, 1)).toBeCloseTo(0.15625);
  });

  it("damp is frame-rate independent", () => {
    let at30 = 0;
    for (let i = 0; i < 30; i++) at30 = damp(at30, 1, 6, 1 / 30);
    let at60 = 0;
    for (let i = 0; i < 60; i++) at60 = damp(at60, 1, 6, 1 / 60);
    expect(at30).toBeCloseTo(at60, 10);
    expect(at60).toBeCloseTo(1 - Math.exp(-6), 10);
  });
});

describe("camera rig", () => {
  it("builds an orthonormal camera basis", () => {
    const { toCamera, right, up } = cameraBasis(OVERVIEW.azimuth, OVERVIEW.elevation);
    const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    expect(dot(toCamera, toCamera)).toBeCloseTo(1);
    expect(dot(right, right)).toBeCloseTo(1);
    expect(dot(up, up)).toBeCloseTo(1);
    expect(dot(toCamera, right)).toBeCloseTo(0);
    expect(dot(toCamera, up)).toBeCloseTo(0);
    expect(dot(right, up)).toBeCloseTo(0);
    expect(right[1]).toBe(0); // no roll
    expect(up[1]).toBeGreaterThan(0);
  });

  it.each([0.5, 0.75, 1, STAGE_ASPECT, 16 / 9, 2.4])(
    "fits the whole platform inside the overview at aspect %d",
    (aspect) => {
      const frame = fitFrame(aspect);
      const view = viewFor(null, frame);
      for (const point of FRAME_POINTS) {
        const { x, y } = projectToStage(point, view, frame);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1);
      }
    },
  );

  it("keeps the overview compact: the platform fills most of the limiting axis", () => {
    for (const aspect of [0.6, STAGE_ASPECT, 2]) {
      const frame = fitFrame(aspect);
      const view = viewFor(null, frame);
      const xs = FRAME_POINTS.map((p) => projectToStage(p, view, frame).x);
      const ys = FRAME_POINTS.map((p) => projectToStage(p, view, frame).y);
      const spanX = Math.max(...xs) - Math.min(...xs);
      const spanY = Math.max(...ys) - Math.min(...ys);
      expect(Math.max(spanX, spanY)).toBeGreaterThan(0.85);
      // Centred.
      expect((Math.max(...xs) + Math.min(...xs)) / 2).toBeCloseTo(0.5, 5);
      expect((Math.max(...ys) + Math.min(...ys)) / 2).toBeCloseTo(0.5, 5);
    }
  });

  it("projects the look target to the centre of the stage", () => {
    const frame = fitFrame(STAGE_ASPECT);
    for (const area of AREA_ORDER) {
      const view = viewFor(area, frame);
      const centre = projectToStage(view.target, view, frame);
      expect(centre.x).toBeCloseTo(0.5);
      expect(centre.y).toBeCloseTo(0.5);
    }
  });

  it("keeps every focus pose bounded", () => {
    const frame = fitFrame(STAGE_ASPECT);
    for (const area of AREA_ORDER) {
      const view = viewFor(area, frame);
      view.target.forEach((value, axis) => {
        expect(value).toBeGreaterThanOrEqual(TARGET_LIMITS.min[axis]);
        expect(value).toBeLessThanOrEqual(TARGET_LIMITS.max[axis]);
      });
      expect(view.zoom).toBeGreaterThanOrEqual(1);
      expect(view.zoom).toBeLessThanOrEqual(3);
      expect(view.elevation).toBeGreaterThan(0);
      expect(view.elevation).toBeLessThan(Math.PI / 2);
    }
    expect(clampTarget([99, -99, 0])).toEqual([TARGET_LIMITS.max[0], TARGET_LIMITS.min[1], 0]);
  });

  it("keeps each focused object and its pin in frame", () => {
    const frame = fitFrame(STAGE_ASPECT);
    for (const area of AREA_ORDER) {
      const view = viewFor(area, frame);
      for (const point of [AREA_LAYOUT[area].pick, AREA_LAYOUT[area].anchor]) {
        const { x, y } = projectToStage(point, view, frame);
        expect(x).toBeGreaterThan(0.08);
        expect(x).toBeLessThan(0.92);
        expect(y).toBeGreaterThan(0.08);
        expect(y).toBeLessThan(0.92);
      }
    }
  });

  it("interpolates poses and hits both ends exactly", () => {
    const frame = fitFrame(STAGE_ASPECT);
    const from = viewFor(null, frame);
    const to = viewFor("operations", frame);
    expect(viewsMatch(interpolateView(from, to, 0), from)).toBe(true);
    expect(viewsMatch(interpolateView(from, to, 1), to)).toBe(true);
    const middle = interpolateView(from, to, 0.5);
    expect(middle.zoom).toBeCloseTo(Math.sqrt(from.zoom * to.zoom));
    expect(viewsMatch(interpolateView(from, to, 7), to)).toBe(true);
  });

  it("limits parallax to a few degrees", () => {
    const frame = fitFrame(STAGE_ASPECT);
    const view = viewFor(null, frame);
    const pushed = withParallax(view, 10, -10);
    expect(pushed.azimuth - view.azimuth).toBeCloseTo(PARALLAX.azimuth);
    expect(pushed.elevation - view.elevation).toBeCloseTo(PARALLAX.elevation);
    expect(viewsMatch(withParallax(view, 0, 0), view)).toBe(true);
  });

  it("places the camera on the view ray at a fixed distance", () => {
    const frame = fitFrame(STAGE_ASPECT);
    const view = viewFor("practice", frame);
    const position = cameraPosition(view, 10);
    const distance = Math.hypot(
      position[0] - view.target[0],
      position[1] - view.target[1],
      position[2] - view.target[2],
    );
    expect(distance).toBeCloseTo(10);
    expect(position[1]).toBeGreaterThan(view.target[1]);
  });

  it("makes camera changes immediate under reduced motion", () => {
    const frame = fitFrame(STAGE_ASPECT);
    const from = viewFor(null, frame);
    const to = viewFor("workflow", frame);
    expect(transitionDuration(from, to, true)).toBe(0);
    const duration = transitionDuration(from, to, false);
    expect(duration).toBeGreaterThanOrEqual(520);
    expect(duration).toBeLessThanOrEqual(1100);
  });
});

describe("still-image hotspots", () => {
  it("puts every pin and highlight inside the poster", () => {
    for (const area of AREA_ORDER) {
      expect(pinVisible(STILL_PINS[area])).toBe(true);
      expect(STILL_SPOTS[area].x).toBeGreaterThan(0);
      expect(STILL_SPOTS[area].x).toBeLessThan(1);
      expect(STILL_SPOTS[area].y).toBeGreaterThan(0);
      expect(STILL_SPOTS[area].y).toBeLessThan(1);
    }
    expect(pinVisible(undefined)).toBe(false);
    expect(pinVisible({ x: 0.01, y: 0.5 })).toBe(false);
  });
});
