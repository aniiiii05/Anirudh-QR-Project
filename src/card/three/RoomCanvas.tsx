import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createRoom, type Area } from "./roomScene";
import { clamp, lerp } from "./maths";
export default function RoomCanvas({
  area,
  onFailure,
}: {
  area: Area | null;
  onFailure: () => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const selected = useRef(area);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    selected.current = area;
  }, [area]);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      onFailure();
      return;
    }
    const { scene, camera, targets, dispose } = createRoom();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    let visible = true;
    let frame = 0;
    let last = 0;
    let pointerX = 0,
      pointerY = 0;
    const focus = new THREE.Vector3(0, 1.1, 0);
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        window.matchMedia("(pointer: coarse)").matches ? 1.25 : 1.75,
      ),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    function resize() {
      const w = host!.clientWidth,
        h = host!.clientHeight;
      if (!w || !h) return;
      const aspect = w / h;
      const vertical = aspect < 1.2 ? 5.8 : 4.7;
      camera.left = -vertical * aspect;
      camera.right = vertical * aspect;
      camera.top = vertical;
      camera.bottom = -vertical;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    function draw(time: number) {
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden || time - last < 33) return;
      const dt = Math.min((time - last) / 1000, 0.1);
      last = time;
      const target = selected.current
        ? targets[selected.current]
        : new THREE.Vector3(0, 1.1, 0);
      const alpha = reduced ? 1 : 1 - Math.exp(-5 * dt);
      focus.lerp(target, alpha);
      const zoom = selected.current ? 1.28 : 1;
      camera.zoom = lerp(camera.zoom, zoom, alpha);
      camera.position.set(
        focus.x + 9 + (reduced ? 0 : pointerX * 0.65),
        focus.y + 6.4 + (reduced ? 0 : pointerY * 0.3),
        focus.z + 10,
      );
      camera.lookAt(focus);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.01 },
    );
    intersection.observe(host);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = host.getBoundingClientRect();
      pointerX = clamp(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -1,
        1,
      );
      pointerY = clamp(
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
        -1,
        1,
      );
    };
    const leave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    const motion = (event: MediaQueryListEvent) => {
      reduced = event.matches;
    };
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    media.addEventListener("change", motion);
    renderer.render(scene, camera);
    setReady(true);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      media.removeEventListener("change", motion);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [onFailure]);
  return (
    <div ref={mount} className={`room-canvas ${ready ? "is-ready" : ""}`} />
  );
}
