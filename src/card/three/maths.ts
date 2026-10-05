/**
 * Small numeric helpers for the 3D workspace. Pure: no three.js import, so the
 * page bundle can use them without loading WebGL code.
 *
 * clamp, lerp and smoothstep are adapted (TypeScript types added, otherwise
 * unchanged) from Bruno Simon, folio-2025, sources/Game/utilities/maths.js at
 * commit 41046b57eeed8d156d9c3fd7fa259900baef7816.
 * Copyright (c) 2025 Bruno Simon. MIT licence — full notice in
 * public/notices/bruno-simon-folio-MIT.txt.
 *
 * damp is original to this project.
 */

/** Adapted from folio-2025 `clamp`. */
export function clamp(input: number, min: number, max: number) {
  return Math.max(min, Math.min(input, max));
}

/** Adapted from folio-2025 `lerp`. */
export function lerp(start: number, end: number, ratio: number) {
  return (1 - ratio) * start + ratio * end;
}

/** Adapted from folio-2025 `smoothstep` (Hermite ease between min and max). */
export function smoothstep(value: number, min: number, max: number) {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Frame-rate independent exponential smoothing (original). `lambda` is the
 * response speed in 1/s; the result approaches `target` the same way at
 * 30 fps and 60 fps.
 */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}
