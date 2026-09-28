import * as THREE from "three";
export type Area = "operations" | "practice" | "workflow";
/** Original geometry. No models, textures or branding from either reference repository. */
export function createRoom() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e5e8dc");
  const room = new THREE.Group();
  scene.add(room);
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const surfaces = new Map<string, THREE.MeshLambertMaterial>();
  const mat = (color: string) => {
    if (!surfaces.has(color)) {
      const material = new THREE.MeshLambertMaterial({ color });
      surfaces.set(color, material);
      materials.push(material);
    }
    return surfaces.get(color)!;
  };
  const box = (
    size: [number, number, number],
    pos: [number, number, number],
    color: string,
    parent: THREE.Group = room,
  ) => {
    const geometry = new THREE.BoxGeometry(...size);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat(color));
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (
    top: number,
    bottom: number,
    height: number,
    pos: [number, number, number],
    color: string,
  ) => {
    const geometry = new THREE.CylinderGeometry(top, bottom, height, 24);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat(color));
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    room.add(mesh);
    return mesh;
  };
  // Open architectural corner on a floating platform.
  box([7.4, 0.24, 5.8], [0, -0.12, 0], "#b4baa5");
  box([7.4, 3.7, 0.15], [0, 1.85, -2.83], "#f4f1ea");
  box([0.15, 3.7, 5.8], [-3.63, 1.85, 0], "#d5dacb");
  box([7.1, 0.1, 0.12], [0.05, 0.09, -2.7], "#bdc6b2");
  box([0.12, 0.1, 5.5], [-3.49, 0.09, 0], "#bdc6b2");
  // Window recess and mullions.
  box([0.12, 1.85, 2.3], [-3.52, 2.26, -0.68], "#687a6a");
  box([0.14, 1.59, 2.04], [-3.43, 2.26, -0.68], "#e6f2e5");
  box([0.18, 0.06, 2.1], [-3.31, 2.26, -0.68], "#7b917c");
  box([0.18, 1.65, 0.06], [-3.31, 2.26, -0.68], "#7b917c");
  box([0.52, 0.12, 2.45], [-3.34, 1.37, -0.68], "#9cae93");
  // Desk and four legs.
  box([4.25, 0.18, 1.65], [0.35, 1.48, -1.38], "#b58e67");
  for (const x of [-1.48, 2.18])
    for (const z of [-2.02, -0.77])
      box([0.13, 1.4, 0.13], [x, 0.7, z], "#333c34");
  box([3.8, 0.12, 0.13], [0.35, 0.33, -2.02], "#333c34");
  // Monitor with a fictional bar chart.
  const monitor = box([1.85, 1.05, 0.12], [0.05, 2.24, -1.88], "#26342c");
  box([1.65, 0.84, 0.04], [0.05, 2.24, -1.795], "#ecf3df");
  box([0.12, 0.35, 0.12], [0.05, 1.71, -1.88], "#26342c");
  box([0.68, 0.06, 0.42], [0.05, 1.6, -1.88], "#26342c");
  [0.25, 0.43, 0.31, 0.62, 0.52].forEach((h, i) =>
    box(
      [0.17, h, 0.045],
      [-0.55 + i * 0.29, 1.89 + h / 2, -1.762],
      i === 3 ? "#315dff" : "#647c45",
    ),
  );
  box([1.35, 0.06, 0.44], [0.02, 1.61, -0.99], "#d2d9ca");
  for (let i = 0; i < 9; i++)
    box([0.1, 0.016, 0.25], [-0.53 + i * 0.13, 1.65, -0.99], "#96a48f");
  box([0.21, 0.05, 0.31], [0.95, 1.6, -1.03], "#333c34");
  // Product cards pinned to a cork board.
  const board = box([1.65, 1.15, 0.09], [2.28, 2.5, -2.7], "#a68c70");
  for (const [x, y, c] of [
    [1.91, 2.7, "#d7ff5a"],
    [2.5, 2.7, "#f4f1ea"],
    [2.06, 2.19, "#f4f1ea"],
    [2.63, 2.19, "#d7ff5a"],
  ] as [number, number, string][]) {
    box([0.43, 0.35, 0.035], [x, y, -2.63], c);
    box([0.24, 0.025, 0.01], [x, y + 0.045, -2.605], "#657256");
  }
  // Notebook and an abstract workflow object, both original.
  box([0.55, 0.1, 0.69], [1.65, 1.65, -1.47], "#315dff");
  box([0.48, 0.025, 0.62], [1.65, 1.712, -1.47], "#f4f1ea");
  const workflow = new THREE.Group();
  workflow.position.set(2.65, 0.45, 1.35);
  room.add(workflow);
  for (let i = 0; i < 3; i++)
    box(
      [0.48, 0.48, 0.48],
      [i * 0.25 - 0.25, i * 0.49, 0],
      i === 1 ? "#315dff" : "#d7ff5a",
      workflow,
    );
  // Stool, rug and plant.
  box([3.8, 0.025, 2.15], [0.2, 0.022, 0.5], "#c4cdba");
  cylinder(0.55, 0.55, 0.13, [0.2, 0.88, 0.16], "#405642");
  for (const x of [-0.16, 0.56])
    for (const z of [-0.2, 0.52])
      box([0.08, 0.85, 0.08], [x, 0.425, z], "#26342c");
  cylinder(0.35, 0.26, 0.6, [-2.54, 0.3, 1.48], "#b78057");
  cylinder(0.31, 0.31, 0.025, [-2.54, 0.61, 1.48], "#4a4834");
  for (let i = 0; i < 7; i++) {
    const g = new THREE.SphereGeometry(1, 12, 8);
    geometries.push(g);
    const leaf = new THREE.Mesh(g, mat(i % 2 ? "#5d7b48" : "#769652"));
    leaf.scale.set(0.18, 0.64, 0.12);
    leaf.position.set(
      -2.54 + Math.sin(i * 2) * 0.21,
      1 + (i % 3) * 0.12,
      1.48 + Math.cos(i * 2) * 0.21,
    );
    leaf.rotation.z = Math.sin(i * 2) * 0.55;
    leaf.rotation.x = Math.cos(i * 2) * 0.45;
    room.add(leaf);
  }
  cylinder(0.14, 0.11, 0.24, [1.21, 1.71, -1.9], "#d7ff5a");
  const ambient = new THREE.AmbientLight("#ffffff", 0.8);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight("#fff5dd", 1.2);
  sun.position.set(2, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  const camera = new THREE.OrthographicCamera(-6, 6, 4.5, -4.5, 0.1, 60);
  camera.position.set(9, 7.5, 10);
  camera.lookAt(0, 1.1, 0);
  const targets: Record<Area, THREE.Vector3> = {
    operations: monitor.position.clone(),
    practice: board.position.clone(),
    workflow: workflow.position.clone(),
  };
  return {
    scene,
    room,
    camera,
    targets,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      sun.shadow.dispose();
    },
  };
}
