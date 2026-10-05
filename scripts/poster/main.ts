/**
 * Poster renderer (dev-only, driven by scripts/render-poster.mjs).
 * Renders the SAME scene module, renderer settings and overview camera as the
 * live canvas, at a fixed size, then encodes WebP/PNG in the browser.
 *
 * Query: ?area=operations|practice|workflow renders a focused view (QA only).
 */
import * as THREE from "three";
import { fitFrame, viewFor } from "../../src/card/three/cameraRig";
import { POSTER_SIZE, type Area } from "../../src/card/three/layout";
import { applyView, configureRenderer, createCamera, createRoom } from "../../src/card/three/roomScene";

type PosterApi = {
  ready: boolean;
  error?: string;
  encode: (type: "image/webp" | "image/png", quality: number, width: number) => string;
};

declare global {
  interface Window {
    __poster?: PosterApi;
  }
}

const params = new URLSearchParams(location.search);
const area = (params.get("area") as Area | null) || null;
const width = POSTER_SIZE.width;
const height = POSTER_SIZE.height;
const supersample = 2;

async function render() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width * supersample, height * supersample, false);
  configureRenderer(renderer);
  const { scene } = createRoom({ quality: "high" });
  const camera = createCamera();
  const frame = fitFrame(width / height);
  applyView(camera, viewFor(area, frame), frame);
  await renderer.compileAsync(scene, camera);
  renderer.render(scene, camera);
  document.body.appendChild(renderer.domElement);

  window.__poster = {
    ready: true,
    encode(type, quality, outWidth) {
      const outHeight = Math.round((outWidth * height) / width);
      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const context = canvas.getContext("2d")!;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(renderer.domElement, 0, 0, outWidth, outHeight);
      return canvas.toDataURL(type, quality);
    },
  };
}

render().catch((error: unknown) => {
  window.__poster = { ready: false, error: String(error), encode: () => "" };
});
