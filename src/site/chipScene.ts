import * as THREE from "three";

/**
 * A procedural "AI chip" in the brand palette: a die on a substrate with pins,
 * engraved monogram and light pulses running along circuit traces. Built from
 * primitives instead of the 25 MB source OBJ so it ships at a few kilobytes.
 */
export type ChipScene = { dispose: () => void; setPointer: (x: number, y: number) => void; setRunning: (on: boolean) => void };

const C = {
  night: 0x190019,
  indigo: 0x2b124c,
  plum: 0x522b5b,
  mauve: 0x854f6c,
  blush: 0xdfb6b2,
  cream: 0xfbe4d8,
};

function labelTexture(text: string) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#2B124C");
  grad.addColorStop(1, "#190019");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(223,182,178,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, size - 56, size - 56);
  ctx.fillStyle = "#FBE4D8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `150px "SA Triumph", sans-serif`;
  ctx.fillText(text, size / 2, size / 2 - 20);
  ctx.font = `500 30px "Balimo", sans-serif`;
  ctx.fillStyle = "#DFB6B2";
  ctx.fillText("DATA · CONTENT · AI", size / 2, size / 2 + 95);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createChipScene(canvas: HTMLCanvasElement, monogram: string): ChipScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 6.2, 7.4);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(C.cream, C.night, 0.9));
  const key = new THREE.DirectionalLight(C.blush, 2.4);
  key.position.set(4, 7, 3);
  scene.add(key);
  const rim = new THREE.PointLight(C.mauve, 30, 20);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const chip = new THREE.Group();
  scene.add(chip);
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  // Substrate board.
  const boardMat = track(new THREE.MeshStandardMaterial({ color: C.indigo, roughness: 0.55, metalness: 0.35 }));
  const board = new THREE.Mesh(track(new THREE.BoxGeometry(4.2, 0.18, 4.2)), boardMat);
  chip.add(board);

  // Die with engraved label on top.
  const label = track(labelTexture(monogram));
  const sideMat = track(new THREE.MeshStandardMaterial({ color: C.plum, roughness: 0.3, metalness: 0.7 }));
  const topMat = track(new THREE.MeshStandardMaterial({ map: label, roughness: 0.35, metalness: 0.4 }));
  const die = new THREE.Mesh(track(new THREE.BoxGeometry(2.3, 0.32, 2.3)), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
  die.position.y = 0.25;
  chip.add(die);

  // Heat-spreader rim.
  const rimMat = track(new THREE.MeshStandardMaterial({ color: C.blush, roughness: 0.25, metalness: 0.9 }));
  const frame = new THREE.Mesh(track(new THREE.TorusGeometry(1.75, 0.035, 8, 4)), rimMat);
  frame.rotation.set(Math.PI / 2, 0, Math.PI / 4);
  frame.scale.set(1.0, 1.0, 1);
  frame.position.y = 0.11;
  chip.add(frame);

  // Pins along all four edges (one instanced mesh).
  const pinsPerSide = 14;
  const pinGeo = track(new THREE.BoxGeometry(0.09, 0.06, 0.38));
  const pins = new THREE.InstancedMesh(pinGeo, rimMat, pinsPerSide * 4);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  let n = 0;
  for (let side = 0; side < 4; side++) {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (side * Math.PI) / 2);
    for (let i = 0; i < pinsPerSide; i++) {
      const t = (i / (pinsPerSide - 1) - 0.5) * 3.4;
      const p = new THREE.Vector3(t, 0, 2.27).applyQuaternion(q);
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      pins.setMatrixAt(n++, m);
    }
  }
  chip.add(pins);

  // Circuit traces with travelling light pulses.
  const traceMat = track(new THREE.LineBasicMaterial({ color: C.mauve, transparent: true, opacity: 0.55 }));
  const pulseMat = track(new THREE.MeshBasicMaterial({ color: C.cream }));
  const pulseGeo = track(new THREE.SphereGeometry(0.045, 10, 10));
  const pulses: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; speed: number; offset: number }[] = [];
  const traceCount = 18;
  for (let i = 0; i < traceCount; i++) {
    const side = i % 4;
    const along = ((i * 0.37) % 1) * 2.6 - 1.3;
    const pts = [new THREE.Vector3(along, 0.1, 1.2), new THREE.Vector3(along, 0.1, 1.55), new THREE.Vector3(along + (i % 2 ? 0.35 : -0.35), 0.1, 1.85), new THREE.Vector3(along + (i % 2 ? 0.35 : -0.35), 0.1, 2.08)];
    const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (side * Math.PI) / 2);
    pts.forEach((p) => p.applyQuaternion(rot));
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1);
    const lineGeo = track(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)));
    chip.add(new THREE.Line(lineGeo, traceMat));
    const mesh = new THREE.Mesh(pulseGeo, pulseMat);
    chip.add(mesh);
    pulses.push({ mesh, curve, speed: 0.25 + (i % 5) * 0.07, offset: i * 0.173 });
  }

  // Soft floor glow.
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const g = glowCanvas.getContext("2d")!;
  const rad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rad.addColorStop(0, "rgba(133,79,108,0.55)");
  rad.addColorStop(1, "rgba(25,0,25,0)");
  g.fillStyle = rad;
  g.fillRect(0, 0, 128, 128);
  const glowTex = track(new THREE.CanvasTexture(glowCanvas));
  const glow = new THREE.Mesh(track(new THREE.PlaneGeometry(9, 9)), track(new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false })));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.6;
  scene.add(glow);

  chip.rotation.set(0.15, Math.PI / 4, 0);

  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  let running = false;
  let raf = 0;

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const frameFn = () => {
    const t = clock.getElapsedTime();
    eased.x += (pointer.x - eased.x) * 0.06;
    eased.y += (pointer.y - eased.y) * 0.06;
    chip.rotation.y = Math.PI / 4 + t * 0.12 + eased.x * 0.6;
    chip.rotation.x = 0.15 + eased.y * 0.35;
    chip.position.y = Math.sin(t * 1.2) * 0.08;
    for (const p of pulses) p.mesh.position.copy(p.curve.getPointAt((t * p.speed + p.offset) % 1));
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frameFn);
  };

  // Redraw once fonts are ready so the engraved label uses SA Triumph.
  document.fonts?.ready.then(() => {
    const fresh = labelTexture(monogram);
    topMat.map = fresh;
    topMat.needsUpdate = true;
    label.dispose();
    disposables.push(fresh);
    if (!running) renderer.render(scene, camera);
  });

  renderer.render(scene, camera);

  return {
    setPointer(x, y) {
      pointer.x = x;
      pointer.y = y;
    },
    setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) {
        clock.start();
        raf = requestAnimationFrame(frameFn);
      } else cancelAnimationFrame(raf);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposables.forEach((d) => d.dispose());
      pins.dispose();
      renderer.dispose();
    },
  };
}
