/**
 * WebGL2 capability probe, run before the 3D chunk is requested.
 * three.js r163+ renders with WebGL2 only, so WebGL1 alone is not enough.
 */
export function hasWebGL2(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  if (!("WebGL2RenderingContext" in window)) return false;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) return false;
    // Release the probe context straight away.
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
