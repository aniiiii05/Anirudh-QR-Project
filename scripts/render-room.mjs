// Reproducible static fallback: node scripts/render-room.mjs && python3 scripts/render-room.py
// Python helper requires numpy and Pillow. Not run during deployment.
import { createServer } from "vite";
import * as THREE from "three";
import { mkdirSync, writeFileSync } from "node:fs";
const vite = await createServer({
  server: { middlewareMode: true, host: "127.0.0.1" },
  appType: "custom",
});
const { createRoom } = await vite.ssrLoadModule("/src/card/three/roomScene.ts");
const { scene, camera, dispose } = createRoom();
scene.updateMatrixWorld(true);
camera.updateMatrixWorld(true);
const faces = [];
const light = new THREE.Vector3(2, 8, 5).normalize();
scene.traverse((object) => {
  if (!object.isMesh) return;
  const positions = object.geometry.attributes.position;
  const index = object.geometry.index;
  const count = index ? index.count : positions.count;
  for (let i = 0; i < count; i += 3) {
    const points = [0, 1, 2].map((j) =>
      new THREE.Vector3()
        .fromBufferAttribute(positions, index ? index.getX(i + j) : i + j)
        .applyMatrix4(object.matrixWorld),
    );
    const normal = new THREE.Vector3()
      .subVectors(points[1], points[0])
      .cross(new THREE.Vector3().subVectors(points[2], points[0]))
      .normalize();
    const center = points[0]
      .clone()
      .add(points[1])
      .add(points[2])
      .multiplyScalar(1 / 3);
    if (normal.dot(camera.position.clone().sub(center)) <= 0) continue;
    const shade = 0.58 + 0.42 * Math.max(0, normal.dot(light));
    const color = object.material.color.clone().convertLinearToSRGB();
    faces.push({
      p: points.map((p) => {
        p.project(camera);
        return [(p.x + 1) * 600, (1 - p.y) * 450, p.z];
      }),
      c: [color.r, color.g, color.b].map((c) => Math.round(c * 255 * shade)),
    });
  }
});
mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/room-faces.json", JSON.stringify(faces));
dispose();
await vite.close();
