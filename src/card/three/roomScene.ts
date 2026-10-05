/**
 * The imaginary workspace: original procedural geometry and materials.
 * No models, textures, code or audio from either reference repository.
 *
 * Objects are authored as a normal hierarchy, then static meshes are baked
 * into one merged mesh per (area, material, shadow flags) bucket to keep draw
 * calls low. Merged meshes that belong to an area carry `userData.area`, which
 * is what pointer picking reads.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraPosition, type Frame } from "./cameraRig";
import { FRAME_POINTS, ROOM, type Area, type CameraView, type Vec3 } from "./layout";

export type { Area } from "./layout";

export type Quality = "high" | "low";

const PALETTE = {
  wall: "#fbe4d8",
  skirting: "#dfb6b2",
  floor: "#c99a9a",
  seam: "#b28585",
  base: "#2b124c",
  rug: "#854f6c",
  rugRing: "#dfb6b2",
  oak: "#c9a676",
  ink: "#190019",
  paper: "#fdf0e9",
  lime: "#dfb6b2",
  cobalt: "#854f6c",
  sage: "#7f9473",
  leaf: "#5c7c4c",
  leafLight: "#87a565",
  pot: "#f3d6ca",
  soil: "#4a3f34",
  felt: "#e8c5bd",
  keyboard: "#f3d6ca",
  key: "#dfb6b2",
  coffee: "#4d3a2b",
  bar: "#d4a9a5",
} as const;

type Tone = keyof typeof PALETTE;

type BuildOptions = { quality?: Quality };

export type Room = {
  scene: THREE.Scene;
  pickables: THREE.Mesh[];
  /** Number of draw calls in the main pass, for diagnostics. */
  meshCount: number;
  dispose: () => void;
};

export function createRoom({ quality = "high" }: BuildOptions = {}): Room {
  const scene = new THREE.Scene();
  const disposables = new Set<{ dispose: () => void }>();
  const track = <T extends { dispose: () => void }>(item: T) => {
    disposables.add(item);
    return item;
  };

  // ---------------------------------------------------------------- materials
  const lit = new Map<string, THREE.MeshStandardMaterial>();
  const surface = (tone: Tone, roughness = 0.82, metalness = 0) => {
    const key = `${tone}|${roughness}|${metalness}`;
    let material = lit.get(key);
    if (!material) {
      material = track(
        new THREE.MeshStandardMaterial({ color: PALETTE[tone], roughness, metalness }),
      );
      material.name = key;
      lit.set(key, material);
    }
    return material;
  };
  // Screens and glass are self-lit and keep their exact colours.
  const flat = (color: string) => {
    const key = `flat|${color}`;
    let material = lit.get(key) as unknown as THREE.MeshBasicMaterial | undefined;
    if (!material) {
      material = track(new THREE.MeshBasicMaterial({ color, toneMapped: false }));
      material.name = key;
      lit.set(key, material as unknown as THREE.MeshStandardMaterial);
    }
    return material;
  };

  // ---------------------------------------------------------------- helpers
  const root = new THREE.Group();
  scene.add(root);
  const areaGroups: Record<Area, THREE.Group> = {
    operations: new THREE.Group(),
    practice: new THREE.Group(),
    workflow: new THREE.Group(),
  };
  for (const [area, group] of Object.entries(areaGroups)) {
    group.userData.area = area;
    root.add(group);
  }

  type MeshOptions = { cast?: boolean; receive?: boolean };
  const mesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: Vec3,
    parent: THREE.Object3D = root,
    { cast = true, receive = true }: MeshOptions = {},
  ) => {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(...position);
    item.castShadow = cast;
    item.receiveShadow = receive;
    parent.add(item);
    return item;
  };
  /** Plain box from min/max corners (architecture: crisp edges). */
  const slab = (
    min: Vec3,
    max: Vec3,
    material: THREE.Material,
    parent: THREE.Object3D = root,
    options?: MeshOptions,
  ) =>
    mesh(
      new THREE.BoxGeometry(max[0] - min[0], max[1] - min[1], max[2] - min[2]),
      material,
      [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
      parent,
      options,
    );
  /** Soft-edged box centred at `position`. */
  const block = (
    size: Vec3,
    position: Vec3,
    material: THREE.Material,
    parent: THREE.Object3D = root,
    radius = 0.03,
    options?: MeshOptions,
  ) => {
    const r = Math.min(radius, Math.min(...size) / 2 - 0.0005);
    const geometry =
      r > 0.002
        ? new RoundedBoxGeometry(size[0], size[1], size[2], Math.max(...size) < 0.2 ? 1 : 3, r)
        : new THREE.BoxGeometry(...size);
    return mesh(geometry, material, position, parent, options);
  };
  const cylinder = (
    radiusTop: number,
    radiusBottom: number,
    height: number,
    position: Vec3,
    material: THREE.Material,
    parent: THREE.Object3D = root,
    segments = 32,
    options?: MeshOptions,
  ) =>
    mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
      material,
      position,
      parent,
      options,
    );
  /** Thin rod between two points (lamp arms, stool legs). */
  const rod = (
    from: Vec3,
    to: Vec3,
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D = root,
  ) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const length = a.distanceTo(b);
    const item = cylinder(radius, radius, length, [0, 0, 0], material, parent, 12);
    item.position.copy(a).add(b).multiplyScalar(0.5);
    item.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    return item;
  };
  const group = (position: Vec3, parent: THREE.Object3D = root, rotationY = 0) => {
    const item = new THREE.Group();
    item.position.set(...position);
    item.rotation.y = rotationY;
    parent.add(item);
    return item;
  };

  // ---------------------------------------------------------------- room shell
  const T = ROOM.wallThickness;
  const H = ROOM.wallHeight;
  const backFace = ROOM.minZ + T; // interior face of the back wall
  const leftFace = ROOM.minX + T; // interior face of the left wall
  const wall = surface("wall", 0.92);
  const architecture = { cast: false, receive: true };

  // Platform: a light floor slab over a slightly inset ink plinth.
  slab([ROOM.minX, -0.11, ROOM.minZ], [ROOM.maxX, 0, ROOM.maxZ], surface("floor", 0.86), root, architecture);
  slab(
    [ROOM.minX + 0.06, ROOM.baseBottom, ROOM.minZ + 0.06],
    [ROOM.maxX - 0.06, -0.11, ROOM.maxZ - 0.06],
    surface("base", 0.7),
    root,
    architecture,
  );
  // Floorboard seams: hairline strips just above the floor (never coplanar).
  const seam = surface("seam", 0.9);
  for (let x = leftFace + 0.62; x < ROOM.maxX - 0.2; x += 0.62)
    slab([x - 0.006, 0, backFace], [x + 0.006, 0.0025, ROOM.maxZ - 0.002], seam, root, architecture);
  // Back wall (full width) and left wall (built around a window opening).
  slab([ROOM.minX, 0, ROOM.minZ], [ROOM.maxX, H, backFace], wall, root, architecture);
  const win = { z0: -1.55, z1: 0.05, y0: 1.45, y1: 2.95 };
  slab([ROOM.minX, 0, backFace], [leftFace, win.y0, ROOM.maxZ], wall, root, architecture);
  slab([ROOM.minX, win.y1, backFace], [leftFace, H, ROOM.maxZ], wall, root, architecture);
  slab([ROOM.minX, win.y0, backFace], [leftFace, win.y1, win.z0], wall, root, architecture);
  slab([ROOM.minX, win.y0, win.z1], [leftFace, win.y1, ROOM.maxZ], wall, root, architecture);
  // Skirting boards.
  const skirting = surface("skirting", 0.8);
  slab([leftFace, 0, backFace], [ROOM.maxX - 0.01, 0.1, backFace + 0.03], skirting, root, architecture);
  slab([leftFace, 0, backFace + 0.03], [leftFace + 0.03, 0.1, ROOM.maxZ - 0.01], skirting, root, architecture);

  // Window: slim ink frame, cross mullion, pale glass and a deep sill.
  const ink = surface("ink", 0.55, 0.1);
  const frameX: [number, number] = [-3.7, -3.64];
  const bar = 0.05;
  slab([frameX[0], win.y0, win.z0], [frameX[1], win.y0 + bar, win.z1], ink);
  slab([frameX[0], win.y1 - bar, win.z0], [frameX[1], win.y1, win.z1], ink);
  slab([frameX[0], win.y0 + bar, win.z0], [frameX[1], win.y1 - bar, win.z0 + bar], ink);
  slab([frameX[0], win.y0 + bar, win.z1 - bar], [frameX[1], win.y1 - bar, win.z1], ink);
  const midZ = (win.z0 + win.z1) / 2;
  const midY = 2.25;
  slab([frameX[0], win.y0 + bar, midZ - 0.02], [frameX[1], win.y1 - bar, midZ + 0.02], ink);
  slab([frameX[0], midY - 0.02, win.z0 + bar], [frameX[1], midY + 0.02, win.z1 - bar], ink);
  slab([-3.745, win.y0, win.z0], [frameX[0], win.y1, win.z1], flat("#dfeaea"), root, { cast: false, receive: false });
  // Two soft reflections on the glass, just in front of it.
  for (const [z, w] of [
    [-1.2, 0.07],
    [-1.05, 0.035],
  ] as const) {
    const streak = block([0.004, 0.7, w], [frameX[0] + 0.003, 2.62, z], flat("#f4f8f6"), root, 0, {
      cast: false,
      receive: false,
    });
    streak.rotation.x = 0.55;
  }
  block([0.2, 0.04, 1.78], [-3.53, 1.44, midZ], surface("paper", 0.7), root, 0.012);

  // ---------------------------------------------------------------- rug
  const rug = cylinder(1, 1, 0.02, [0, 0.01, 0], surface("rug", 0.97), root, 64, { cast: false, receive: true });
  rug.scale.set(1.75, 1, 1.15);
  rug.position.set(-0.15, 0.01, -0.55);
  const ring = mesh(new THREE.RingGeometry(0.86, 0.9, 64), surface("rugRing", 0.9), [-0.15, 0.0205, -0.55], root, {
    cast: false,
    receive: true,
  });
  ring.rotation.x = -Math.PI / 2;
  ring.scale.set(1.75, 1.15, 1);

  // ---------------------------------------------------------------- desk
  const oak = surface("oak", 0.68);
  block([3.5, 0.09, 1.3], [0.15, 1.455, -2.1], oak, root, 0.03);
  for (const x of [-1.48, 1.78])
    for (const z of [-2.65, -1.55]) block([0.07, 1.41, 0.07], [x, 0.705, z], ink, root, 0.015);
  block([3.19, 0.06, 0.04], [0.15, 1.33, -2.65], ink, root, 0.012);
  for (const x of [-1.48, 1.78]) block([0.04, 0.05, 1.03], [x, 0.24, -2.1], ink, root, 0.012);

  // ---------------------------------------------------------------- Data: monitor + chart
  const data = areaGroups.operations;
  block([1.9, 1.12, 0.07], [-0.3, 2.53, -2.5], ink, data, 0.03);
  block([0.12, 0.5, 0.06], [-0.3, 1.78, -2.56], ink, data, 0.02);
  block([0.62, 0.035, 0.34], [-0.3, 1.5175, -2.5], ink, data, 0.015);
  const screenZ = -2.465 + 0.003;
  const screen = mesh(new THREE.PlaneGeometry(1.78, 1.0), flat("#f6f3ec"), [-0.3, 2.53, screenZ], data, {
    cast: false,
    receive: false,
  });
  screen.name = "screen";
  const chartZ = screenZ + 0.004;
  const chartOptions = { cast: false, receive: false };
  // Header: a lime tag and two placeholder lines.
  block([0.2, 0.06, 0.004], [-1.0, 2.9, chartZ], flat("#dfb6b2"), data, 0, chartOptions);
  block([0.42, 0.024, 0.004], [-0.62, 2.91, chartZ], flat("#bdb7aa"), data, 0, chartOptions);
  block([0.26, 0.024, 0.004], [-0.62 - 0.08, 2.86, chartZ], flat("#d9d4c9"), data, 0, chartOptions);
  // Bars on a baseline; the sixth bar is the highlighted one.
  const heights = [0.24, 0.36, 0.3, 0.44, 0.38, 0.58, 0.47];
  heights.forEach((h, i) => {
    const x = -1.0 + i * 0.205;
    const color = i === 5 ? "#854f6c" : "#d4a9a5";
    block([0.12, h, 0.004], [x, 2.16 + h / 2, chartZ], flat(color), data, 0, chartOptions);
  });
  block([1.45, 0.012, 0.004], [-0.385, 2.155, chartZ], flat("#262624"), data, 0, chartOptions);
  // A small lime marker above the highlighted bar.
  cylinder(0.028, 0.028, 0.004, [-1.0 + 5 * 0.205, 2.16 + 0.58 + 0.07, chartZ], flat("#dfb6b2"), data, 20, chartOptions).rotation.x =
    Math.PI / 2;
  // Keyboard, keys, mouse pad and mouse.
  block([1.0, 0.035, 0.32], [-0.35, 1.5175, -1.78], surface("keyboard", 0.6), data, 0.012);
  const keyMaterial = surface("key", 0.7);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 12; col++)
      block([0.062, 0.014, 0.058], [-0.78 + col * 0.078, 1.541, -1.89 + row * 0.072], keyMaterial, data, 0.006, {
        cast: false,
        receive: true,
      });
  block([0.42, 0.014, 0.058], [-0.35, 1.541, -1.674], keyMaterial, data, 0.006, { cast: false, receive: true });
  block([0.44, 0.006, 0.36], [0.42, 1.503, -1.77], surface("sage", 0.95), data, 0.003, { cast: false, receive: true });
  block([0.12, 0.045, 0.19], [0.42, 1.5285, -1.75], surface("keyboard", 0.5), data, 0.022);

  // ---------------------------------------------------------------- desk objects (static)
  // Mug with coffee and handle.
  const lime = surface("lime", 0.62);
  const mug: Vec3 = [0.8, 1.6, -2.28];
  cylinder(0.095, 0.09, 0.2, mug, lime, root, 28);
  cylinder(0.078, 0.078, 0.003, [mug[0], 1.7015, mug[2]], surface("coffee", 0.4), root, 24, { cast: false, receive: false });
  mesh(new THREE.TorusGeometry(0.055, 0.014, 10, 20), lime, [mug[0] + 0.115, 1.6, mug[2]]);
  // Desk lamp on the left end, leaning towards the keyboard.
  const lampBase: Vec3 = [-1.36, 1.5, -2.45];
  cylinder(0.14, 0.15, 0.035, [lampBase[0], 1.5175, lampBase[2]], ink, root, 28);
  const elbow: Vec3 = [-1.46, 2.2, -2.62];
  const headAt: Vec3 = [-1.4, 2.28, -2.0];
  rod([lampBase[0], 1.53, lampBase[2]], elbow, 0.018, ink);
  rod(elbow, headAt, 0.016, ink);
  mesh(new THREE.SphereGeometry(0.032, 14, 10), ink, elbow);
  const head = group(headAt);
  head.rotation.x = 0.25;
  cylinder(0.05, 0.13, 0.17, [0, -0.07, 0], surface("paper", 0.55), head, 28);
  cylinder(0.11, 0.11, 0.004, [0, -0.157, 0], flat("#fff3cf"), head, 24, { cast: false, receive: false });

  // ---------------------------------------------------------------- Product: notebook + idea board
  const product = areaGroups.practice;
  const cobalt = surface("cobalt", 0.58);
  const paper = surface("paper", 0.85);
  const notebook = group([1.12, 1.5, -1.9], product, -0.2);
  block([0.5, 0.01, 0.68], [0, 0.005, 0], cobalt, notebook, 0.004);
  block([0.47, 0.024, 0.65], [0.006, 0.022, 0], paper, notebook, 0.004);
  block([0.5, 0.01, 0.68], [0, 0.039, 0], cobalt, notebook, 0.004);
  block([0.022, 0.004, 0.684], [0.17, 0.0455, 0], lime, notebook, 0, { cast: false, receive: true });
  const pencil = group([0.02, 0.058, 0.0], notebook, 0.7);
  cylinder(0.012, 0.012, 0.36, [0, 0, 0], lime, pencil, 10).rotation.z = Math.PI / 2;
  cylinder(0.0, 0.012, 0.05, [0.205, 0, 0], surface("oak", 0.7), pencil, 10).rotation.z = -Math.PI / 2;

  // Idea board with lime and paper notes, pins and scribbles.
  const boardFront = backFace + 0.05;
  block([1.7, 1.15, 0.05], [2.35, 2.75, backFace + 0.025], surface("felt", 0.95), product, 0.02, {
    cast: true,
    receive: true,
  });
  block([1.74, 0.03, 0.07], [2.35, 2.16, backFace + 0.035], oak, product, 0.01);
  const notes: [number, number, number, Tone][] = [
    [1.8, 3.02, 0.06, "lime"],
    [2.2, 3.0, -0.05, "paper"],
    [2.62, 3.04, 0.04, "lime"],
    [2.98, 2.97, -0.07, "paper"],
    [1.86, 2.5, -0.04, "paper"],
    [2.3, 2.54, 0.08, "lime"],
    [2.82, 2.48, -0.03, "paper"],
  ];
  const scribble = surface("ink", 0.8);
  const pin = surface("cobalt", 0.4);
  for (const [x, y, rotation, tone] of notes) {
    const note = group([x, y, boardFront + 0.006], product);
    note.rotation.z = rotation;
    block([0.3, 0.3, 0.01], [0, 0, 0], surface(tone, 0.9), note, 0.008);
    block([0.18, 0.016, 0.002], [-0.02, 0.03, 0.0062], scribble, note, 0, { cast: false, receive: false });
    block([0.12, 0.016, 0.002], [-0.05, -0.03, 0.0062], scribble, note, 0, { cast: false, receive: false });
    mesh(new THREE.SphereGeometry(0.022, 12, 8), pin, [0, 0.11, 0.012], note);
  }
  // A thread linking two ideas.
  rod([2.2, 2.92, boardFront + 0.02], [2.3, 2.62, boardFront + 0.02], 0.006, scribble, product);

  // ---------------------------------------------------------------- framed print (static)
  const print = group([-2.45, 2.45, backFace + 0.02]);
  block([0.74, 0.94, 0.04], [0, 0, 0], ink, print, 0.012);
  block([0.62, 0.82, 0.004], [0, 0, 0.0215], paper, print, 0, { cast: false, receive: true });
  cylinder(0.15, 0.15, 0.004, [0.0, 0.12, 0.0255], lime, print, 32, { cast: false, receive: true }).rotation.x =
    Math.PI / 2;
  block([0.36, 0.06, 0.004], [0, -0.2, 0.0255], cobalt, print, 0, { cast: false, receive: true });
  block([0.24, 0.03, 0.004], [-0.06, -0.28, 0.0255], surface("bar", 0.9), print, 0, { cast: false, receive: true });

  // ---------------------------------------------------------------- stool
  const stool = group([-0.25, 0, -0.55]);
  cylinder(0.36, 0.34, 0.08, [0, 0.98, 0], surface("sage", 0.8), stool, 40);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    rod([Math.cos(a) * 0.22, 0.94, Math.sin(a) * 0.22], [Math.cos(a) * 0.33, 0.0, Math.sin(a) * 0.33], 0.024, oak, stool);
  }
  const footRing = mesh(new THREE.TorusGeometry(0.28, 0.012, 8, 40), ink, [0, 0.34, 0], stool);
  footRing.rotation.x = Math.PI / 2;

  // ---------------------------------------------------------------- floor pouf
  const pouf = group([-1.35, 0, 1.55]);
  cylinder(0.36, 0.38, 0.3, [0, 0.15, 0], surface("sage", 0.95), pouf, 40);
  const cushion = mesh(new THREE.SphereGeometry(1, 32, 16), surface("sage", 0.95), [0, 0.3, 0], pouf);
  cushion.scale.set(0.355, 0.06, 0.355);
  const tuft = mesh(new THREE.SphereGeometry(0.03, 12, 8), ink, [0, 0.355, 0], pouf);
  tuft.scale.y = 0.5;

  // ---------------------------------------------------------------- shelf + books (left wall)
  const shelfX = leftFace + 0.2;
  block([0.4, 0.05, 1.5], [shelfX, 2.05, 1.55], oak, root, 0.012);
  for (const z of [0.95, 2.15]) block([0.3, 0.03, 0.03], [shelfX - 0.03, 1.995, z], ink, root, 0.008);
  const books: [number, number, Tone][] = [
    [0.09, 0.42, "cobalt"],
    [0.07, 0.36, "paper"],
    [0.11, 0.46, "ink"],
    [0.08, 0.38, "sage"],
    [0.06, 0.33, "lime"],
    [0.1, 0.44, "oak"],
  ];
  let cursor = 0.9;
  for (const [thickness, height, tone] of books) {
    block([0.28, height, thickness], [shelfX - 0.02, 2.075 + height / 2, cursor + thickness / 2], surface(tone, 0.8), root, 0.012);
    cursor += thickness + 0.008;
  }
  const leaning = block([0.27, 0.4, 0.08], [shelfX - 0.02, 2.075 + 0.19, cursor + 0.13], surface("paper", 0.8), root, 0.012);
  leaning.rotation.x = 0.36;
  // Two books lying flat with a lime cube on top.
  block([0.3, 0.06, 0.36], [shelfX - 0.02, 2.105, 2.05], surface("cobalt", 0.8), root, 0.012);
  block([0.28, 0.05, 0.32], [shelfX - 0.02, 2.16, 2.05], surface("bar", 0.8), root, 0.012);
  block([0.12, 0.12, 0.12], [shelfX - 0.02, 2.245, 2.06], lime, root, 0.02);

  // ---------------------------------------------------------------- plant
  const plant = group([-2.95, 0, 2.2]);
  cylinder(0.3, 0.22, 0.55, [0, 0.275, 0], surface("pot", 0.75), plant, 36);
  const rim = mesh(new THREE.TorusGeometry(0.29, 0.025, 10, 36), surface("pot", 0.75), [0, 0.55, 0], plant);
  rim.rotation.x = Math.PI / 2;
  cylinder(0.27, 0.27, 0.01, [0, 0.535, 0], surface("soil", 0.95), plant, 28, { cast: false, receive: true });
  const leafGeometry = () => new THREE.SphereGeometry(1, 16, 10);
  const leafCount = 11;
  for (let i = 0; i < leafCount; i++) {
    const turn = (i / leafCount) * Math.PI * 2 + (i % 2) * 0.3;
    const tilt = 0.25 + (i % 3) * 0.17;
    const length = 0.42 + ((i * 7) % 5) * 0.045;
    const stem = group([0, 0.54, 0], plant, turn);
    const pivot = new THREE.Group();
    pivot.rotation.x = tilt;
    stem.add(pivot);
    const leaf = mesh(leafGeometry(), surface(i % 2 ? "leaf" : "leafLight", 0.75), [0, length, 0], pivot);
    leaf.scale.set(0.11, length, 0.035);
  }

  // ---------------------------------------------------------------- Automation: blocks on a rail
  // A low display plinth with a rail: a messy pile goes in, a tidy stack comes out.
  const flow = areaGroups.workflow;
  const railZ = 1.8;
  const top = 0.2; // plinth top
  block([2.85, top, 0.95], [2.2, top / 2, railZ], surface("pot", 0.8), flow, 0.04);
  block([2.55, 0.025, 0.18], [2.2, top + 0.0125, railZ], ink, flow, 0.01, { cast: false, receive: true });
  // Input: a messy little pile.
  const inputA = block([0.36, 0.36, 0.36], [1.24, top + 0.025 + 0.18, railZ - 0.02], paper, flow, 0.045);
  inputA.rotation.y = 0.42;
  const inputB = block([0.26, 0.26, 0.26], [1.3, top + 0.385 + 0.13, railZ + 0.04], lime, flow, 0.04);
  inputB.rotation.y = -0.38;
  inputB.rotation.z = 0.1;
  const inputC = block([0.2, 0.2, 0.2], [1.02, top + 0.1, railZ + 0.3], surface("bar", 0.8), flow, 0.035);
  inputC.rotation.y = 0.9;
  // Chevrons pointing along the rail.
  const chevron = (x: number) => {
    const holder = group([x, top + 0.045, railZ], flow);
    for (const sign of [1, -1]) {
      const arm = block([0.19, 0.04, 0.045], [0, 0, sign * 0.058], lime, holder, 0.015, { cast: false, receive: true });
      arm.rotation.y = sign * 0.8;
    }
  };
  chevron(1.74);
  chevron(2.7);
  // Process: one cobalt block with a lime dial.
  const process = 0.52;
  block([process, process, process], [2.22, top + 0.025 + process / 2, railZ], cobalt, flow, 0.06);
  cylinder(0.09, 0.09, 0.04, [2.22, top + 0.025 + process + 0.02, railZ], lime, flow, 28);
  // Output: a tidy stack.
  const size = 0.4;
  [lime, paper, lime].forEach((material, i) =>
    block([size, size, size], [3.16, top + 0.025 + size / 2 + i * (size + 0.004), railZ], material, flow, 0.045),
  );

  // ---------------------------------------------------------------- soft ground shadow under the platform
  const groundTexture = track(createGroundShadowTexture());
  const ground = new THREE.Mesh(
    track(new THREE.PlaneGeometry(10.2, 8.4)),
    track(
      new THREE.MeshBasicMaterial({
        map: groundTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        color: "#1b1b18",
      }),
    ),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0.25, ROOM.baseBottom - 0.18, 0.25);
  ground.renderOrder = -1;
  scene.add(ground);

  // ---------------------------------------------------------------- lights
  const hemisphere = new THREE.HemisphereLight("#ffffff", "#d9c9ad", 1.7);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight("#fff6ea", 2.4);
  key.position.set(3.4, 10, 7.2);
  key.target.position.set(0, 1, 0);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(quality === "high" ? 1024 : 512);
  // Softer, lighter shadows keep occluded areas warm cream-tan rather than grey;
  // a radius of 1 on the 512 map avoids a wide stippled penumbra on phones.
  key.shadow.radius = quality === "high" ? 4 : 1;
  key.shadow.intensity = 0.68;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.022;
  scene.add(key, key.target);
  fitShadowCamera(key);
  // Cool fill from the open right side lifts the faces turned away from the key light.
  const fill = new THREE.DirectionalLight("#eef2ff", 0.6);
  fill.position.set(8, 4, -1);
  scene.add(fill);

  // ---------------------------------------------------------------- bake static meshes
  scene.updateMatrixWorld(true);
  const pickables = bake(root, track);

  return {
    scene,
    pickables,
    meshCount: root.children.length + 1,
    dispose() {
      key.shadow.dispose();
      scene.traverse((object) => {
        const item = object as THREE.Mesh;
        if (item.isMesh) item.geometry.dispose();
      });
      disposables.forEach((item) => item.dispose());
      disposables.clear();
      scene.clear();
    },
  };
}

/** Merge every static mesh under `root` into one mesh per bucket. */
function bake(root: THREE.Group, track: <T extends { dispose: () => void }>(item: T) => T) {
  type Bucket = {
    material: THREE.Material;
    area?: Area;
    cast: boolean;
    receive: boolean;
    geometries: THREE.BufferGeometry[];
  };
  const buckets = new Map<string, Bucket>();
  const sources: THREE.Mesh[] = [];
  root.traverse((object) => {
    const item = object as THREE.Mesh;
    if (!item.isMesh) return;
    let area: Area | undefined;
    for (let node: THREE.Object3D | null = item; node; node = node.parent)
      if (node.userData.area) {
        area = node.userData.area as Area;
        break;
      }
    const material = item.material as THREE.Material;
    const id = `${area ?? "room"}|${material.uuid}|${item.castShadow}|${item.receiveShadow}`;
    let bucket = buckets.get(id);
    if (!bucket) {
      bucket = { material, area, cast: item.castShadow, receive: item.receiveShadow, geometries: [] };
      buckets.set(id, bucket);
    }
    const geometry = (item.geometry.index ? item.geometry.toNonIndexed() : item.geometry.clone()).applyMatrix4(
      item.matrixWorld,
    );
    for (const name of Object.keys(geometry.attributes))
      if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
    bucket.geometries.push(geometry);
    sources.push(item);
  });
  for (const item of sources) {
    item.geometry.dispose();
    item.removeFromParent();
  }
  root.clear();
  const pickables: THREE.Mesh[] = [];
  for (const bucket of buckets.values()) {
    const merged = mergeGeometries(bucket.geometries, false);
    bucket.geometries.forEach((geometry) => geometry.dispose());
    if (!merged) continue;
    track(merged);
    merged.computeBoundingSphere();
    const item = new THREE.Mesh(merged, bucket.material);
    item.castShadow = bucket.cast;
    item.receiveShadow = bucket.receive;
    item.matrixAutoUpdate = false;
    if (bucket.area) {
      item.userData.area = bucket.area;
      pickables.push(item);
    }
    root.add(item);
  }
  root.updateMatrixWorld(true);
  return pickables;
}

/** Fit the key light's shadow camera tightly around the platform. */
function fitShadowCamera(light: THREE.DirectionalLight) {
  light.updateMatrixWorld(true);
  light.target.updateMatrixWorld(true);
  const shadowCamera = light.shadow.camera;
  shadowCamera.position.copy(light.position);
  shadowCamera.lookAt(light.target.position);
  shadowCamera.updateMatrixWorld(true);
  const inverse = shadowCamera.matrixWorldInverse.copy(shadowCamera.matrixWorld).invert();
  const box = new THREE.Box3();
  for (const point of FRAME_POINTS) box.expandByPoint(new THREE.Vector3(...point).applyMatrix4(inverse));
  const pad = 0.3;
  shadowCamera.left = box.min.x - pad;
  shadowCamera.right = box.max.x + pad;
  shadowCamera.bottom = box.min.y - pad;
  shadowCamera.top = box.max.y + pad;
  shadowCamera.near = Math.max(0.1, -box.max.z - 1);
  shadowCamera.far = -box.min.z + 1;
  shadowCamera.updateProjectionMatrix();
}

/** A soft rounded-rectangle shadow drawn once on a small canvas. */
function createGroundShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 212;
  const context = canvas.getContext("2d");
  if (context) {
    context.shadowColor = "rgba(0,0,0,0.55)";
    context.shadowBlur = 26;
    context.shadowOffsetX = 1000;
    context.fillStyle = "#000";
    if (typeof context.roundRect === "function") {
      context.beginPath();
      context.roundRect(48 - 1000, 44, 160, 124, 18);
      context.fill();
    } else context.fillRect(48 - 1000, 44, 160, 124);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/** Point an orthographic camera at a view (same maths as cameraRig.projectToStage). */
export function applyView(camera: THREE.OrthographicCamera, view: CameraView, frame: Frame) {
  camera.left = -frame.halfHeight * frame.aspect;
  camera.right = frame.halfHeight * frame.aspect;
  camera.top = frame.halfHeight;
  camera.bottom = -frame.halfHeight;
  camera.zoom = view.zoom;
  camera.position.set(...cameraPosition(view));
  camera.up.set(0, 1, 0);
  camera.lookAt(...view.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

/** Renderer settings shared by the live canvas and the poster script. */
export function configureRenderer(renderer: THREE.WebGLRenderer) {
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Lights and furniture never move: draw the shadow map once.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
}

export function createCamera() {
  return new THREE.OrthographicCamera(-1, 1, 1, -1, 0.5, 60);
}
