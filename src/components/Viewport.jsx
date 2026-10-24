import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../state/StoreContext.jsx';
import { formatSize } from './sections/ExportSection.jsx';

const clampRadius = (r) => Math.min(600, Math.max(15, r));

function disposeGroup(group) {
  group.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
}

/** Three.js preview: lights, grid, orbit (drag) / zoom (wheel, pinch) controls, and the current keychain model. */
export default function Viewport() {
  const { model } = useStore();
  const canvasRef = useRef(null);
  const ctx = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 3000);
    camera.up.set(0, 0, 1);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const l1 = new THREE.DirectionalLight(0xffffff, 0.8);
    l1.position.set(40, -60, 100);
    scene.add(l1);
    const l2 = new THREE.DirectionalLight(0xffffff, 0.35);
    l2.position.set(-60, 40, 30);
    scene.add(l2);
    const grid = new THREE.GridHelper(300, 30, 0x888888, 0x888888);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    scene.add(grid);

    const view = { th: -Math.PI / 2, ph: 0.7, rad: 90, group: null, fitted: false };
    const draw = () => {
      camera.position.set(
        view.rad * Math.sin(view.ph) * Math.cos(view.th),
        view.rad * Math.sin(view.ph) * Math.sin(view.th),
        view.rad * Math.cos(view.ph),
      );
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    const pointers = new Map();
    let pinch = 0;
    const down = (e) => { canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]); };
    const move = (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      if (pointers.size === 1) {
        view.th -= (e.clientX - p[0]) * 0.008;
        view.ph = Math.min(3, Math.max(0.05, view.ph - (e.clientY - p[1]) * 0.008));
      }
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) view.rad = clampRadius((view.rad * pinch) / d);
        pinch = d;
      }
      draw();
    };
    const up = (e) => { pointers.delete(e.pointerId); pinch = 0; };
    const wheel = (e) => { e.preventDefault(); view.rad = clampRadius(view.rad * (1 + e.deltaY * 0.001)); draw(); };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });

    ctx.current = { scene, view, draw };
    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
      if (view.group) disposeGroup(view.group);
      renderer.dispose();
      ctx.current = null;
    };
  }, []);

  // Swap in each newly built model.
  useEffect(() => {
    const c = ctx.current;
    if (!c || !model) return;
    const { scene, view, draw } = c;
    if (view.group) { scene.remove(view.group); disposeGroup(view.group); }
    view.group = model.group;
    scene.add(model.group);
    if (!view.fitted) { view.rad = clampRadius(model.fit); view.fitted = true; }
    draw();
  }, [model]);

  return (
    <div className="stage">
      <canvas ref={canvasRef} />
      <div className="dims">{model ? formatSize(model.size) : ''}</div>
      <div className="hint">Drag to rotate · scroll or pinch to zoom</div>
    </div>
  );
}
