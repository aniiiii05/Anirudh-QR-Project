/** Adapted from Bruno Simon, folio-2025, sources/Game/utilities/maths.js.
 * Copyright (c) 2025 Bruno Simon. MIT; see public/notices/bruno-simon-folio-MIT.txt.
 */
export function clamp(input: number, min: number, max: number) {
  return Math.max(min, Math.min(input, max));
}
export function lerp(start: number, end: number, ratio: number) {
  return (1 - ratio) * start + ratio * end;
}
