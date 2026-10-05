/**
 * Hotspot pin placement shared by the still image and the live canvas.
 * Pure DOM + maths (no three.js), so the page bundle can use it.
 */
import type { MutableRefObject } from "react";
import { fitFrame, projectToStage, viewFor } from "./cameraRig";
import { AREA_LAYOUT, AREA_ORDER, STAGE_ASPECT, type Area } from "./layout";

export type PinRefs = MutableRefObject<Partial<Record<Area, HTMLElement | null>>>;
export type StagePoint = { x: number; y: number };

/** Pins must sit inside this part of the stage; anything outside is hidden. */
export const PIN_BOUNDS = { minX: 0.05, maxX: 0.95, minY: 0.08, maxY: 0.94 } as const;

export function pinVisible(point: StagePoint | undefined) {
  return (
    !!point &&
    point.x >= PIN_BOUNDS.minX &&
    point.x <= PIN_BOUNDS.maxX &&
    point.y >= PIN_BOUNDS.minY &&
    point.y <= PIN_BOUNDS.maxY
  );
}

/** Position pins as percentages of the stage; hide the ones out of frame. */
export function placePins(pins: PinRefs, positions: Partial<Record<Area, StagePoint>>) {
  for (const area of AREA_ORDER) {
    const element = pins.current[area];
    if (!element) continue;
    const point = positions[area];
    element.hidden = !pinVisible(point);
    if (point) {
      element.style.left = `${(point.x * 100).toFixed(3)}%`;
      element.style.top = `${(point.y * 100).toFixed(3)}%`;
    }
  }
}

const stillFrame = fitFrame(STAGE_ASPECT);
const overview = viewFor(null, stillFrame);

/** Where each pin and highlight sits on the poster (same camera as the poster render). */
export const STILL_PINS: Record<Area, StagePoint> = {
  operations: projectToStage(AREA_LAYOUT.operations.anchor, overview, stillFrame),
  practice: projectToStage(AREA_LAYOUT.practice.anchor, overview, stillFrame),
  workflow: projectToStage(AREA_LAYOUT.workflow.anchor, overview, stillFrame),
};

export const STILL_SPOTS: Record<Area, StagePoint> = {
  operations: projectToStage(AREA_LAYOUT.operations.spot, overview, stillFrame),
  practice: projectToStage(AREA_LAYOUT.practice.spot, overview, stillFrame),
  workflow: projectToStage(AREA_LAYOUT.workflow.spot, overview, stillFrame),
};
