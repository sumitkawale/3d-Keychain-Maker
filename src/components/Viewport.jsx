import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../state/StoreContext.jsx';
import { formatSize } from './sections/ExportSection.jsx';

const clampRadius = (r) => Math.min(600, Math.max(15, r));
const CLICK_SLOP = 4;
const FOV = 40;

/** Small X / Y / Z axis indicator that turns with the camera, drawn in a corner of the preview. */
function makeGizmo() {
  const scene = new THREE.Scene();
  const label = (text, hex) => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = `#${hex.toString(16).padStart(6, '0')}`;
    x.font = 'bold 44px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(text, 32, 34);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
    sp.scale.set(0.7, 0.7, 0.7);
    sp.renderOrder = 4;
    return sp;
  };
  // Soft round backdrop so the axes stay readable over the grid and the model.
  const bg = document.createElement('canvas');
  bg.width = 128;
  bg.height = 128;
  const bx = bg.getContext('2d');
  bx.fillStyle = 'rgba(255,255,255,0.55)';
  bx.beginPath();
  bx.arc(64, 64, 62, 0, Math.PI * 0);
  bx.fill();
  const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(bg), depthTest: false, transparent: true }));
  disc.scale.set(3.7, 3.7, 3.7);
  disc.renderOrder = 0;
  scene.add(disc);
  [
    [new THREE.Vector3(1, 0, 0), 0xe5484d, 'X'],
    [new THREE.Vector3(0, 1, 0), 0x30a46c, 'Y'],
    [new THREE.Vector3(0, 0, 1), 0x3e63dd, 'Z'],
  ].forEach(([dir, hex, text]) => {
    const mat = new THREE.MeshBasicMaterial({ color: hex, depthTest: false, transparent: true });
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 12), mat);
    shaft.quaternion.copy(quat);
    shaft.position.copy(dir).multiplyScalar(0.425);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.34, 16), mat);
    head.quaternion.copy(quat);
    head.position.copy(dir).multiplyScalar(1.02);
    shaft.renderOrder = 2;
    head.renderOrder = 2;
    scene.add(shaft, head);
    const sp = label(text, hex);
    sp.position.copy(dir).multiplyScalar(1.5);
    scene.add(sp);
    const stub = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir.clone().multiplyScalar(-0.6)]),
      new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.35, depthTest: false }),
    );
    stub.renderOrder = 1;
    scene.add(stub);
  });
  const camera = new THREE.OrthographicCamera(-1.85, 1.85, 1.85, -1.85, 0.1, 30);
  camera.up.set(0, 0, 1);
  return { scene, camera };
}

function disposeGroup(group) {
  group.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
}

/** Tints the meshes that belong to the selected part so it stands out in the preview. */
function paintSelection(group, selection) {
  group.children.forEach((m) => {
    const u = m.userData || {};
    const on = !!selection && u.kind === selection.kind && (selection.kind !== 'item' || u.id === selection.id);
    m.material.emissive.setHex(on ? 0x6a3414 : 0x000000);
  });
}

/**
 * Three.js preview: lights, grid and the current keychain.
 * Left-drag orbits, right-drag pans across the XY plane, wheel / pinch zooms, double-click recentres,
 * and a click selects the component under the cursor (its controls are highlighted in the panel).
 */
export default function Viewport() {
  const { model, selection, actions } = useStore();
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const selectRef = useRef(actions.select);
  selectRef.current = actions.select;

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 3000);
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
    const gizmo = makeGizmo();

    const view = { th: -Math.PI / 2, ph: 0.7, rad: 90, tx: 0, ty: 0, group: null, fitted: false };
    const draw = () => {
      camera.position.set(
        view.tx + view.rad * Math.sin(view.ph) * Math.cos(view.th),
        view.ty + view.rad * Math.sin(view.ph) * Math.sin(view.th),
        view.rad * Math.cos(view.ph),
      );
      camera.lookAt(view.tx, view.ty, 0);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, w, h);
      renderer.autoClear = true;
      renderer.render(scene, camera);
      // Axis indicator in the bottom-right corner, looking from the same direction as the main camera.
      const g = Math.round(Math.min(150, Math.max(96, Math.min(w, h) * 0.18)));
      renderer.setScissorTest(true);
      renderer.setViewport(w - g - 10, 10, g, g);
      renderer.setScissor(w - g - 10, 10, g, g);
      renderer.autoClear = false;
      renderer.clearDepth();
      gizmo.camera.position.set(Math.sin(view.ph) * Math.cos(view.th), Math.sin(view.ph) * Math.sin(view.th), Math.cos(view.ph)).multiplyScalar(8);
      gizmo.camera.lookAt(0, 0, 0);
      renderer.render(gizmo.scene, gizmo.camera);
      renderer.autoClear = true;
      renderer.setScissorTest(false);
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

    const raycaster = new THREE.Raycaster();
    const pick = (e) => {
      if (!view.group) return;
      const r = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(view.group.children, false).find((h) => h.object.userData && h.object.userData.kind);
      selectRef.current(hit ? { kind: hit.object.userData.kind, id: hit.object.userData.id } : null);
    };

    const pointers = new Map();
    let pinch = 0;
    const down = (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, btn: e.button, moved: false });
    };
    const move = (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > CLICK_SLOP) p.moved = true;
      if (p.btn === 2) {
        // Right-drag: slide the view across the XY plane, so the model follows the cursor.
        const scale = (2 * view.rad * Math.tan((FOV * Math.PI) / 360)) / canvas.clientHeight;
        view.tx -= -Math.sin(view.th) * dx * scale;
        view.ty -= Math.cos(view.th) * dx * scale;
        view.tx += -Math.cos(view.th) * dy * scale;
        view.ty += -Math.sin(view.th) * dy * scale;
      } else if (pointers.size === 1) {
        view.th -= dx * 0.008;
        view.ph = Math.min(3, Math.max(0.05, view.ph - dy * 0.008));
      }
      p.x = e.clientX;
      p.y = e.clientY;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) view.rad = clampRadius((view.rad * pinch) / d);
        pinch = d;
      }
      draw();
    };
    const up = (e) => {
      const p = pointers.get(e.pointerId);
      if (p && !p.moved && p.btn === 0 && pointers.size === 1 && e.type === 'pointerup') pick(e);
      pointers.delete(e.pointerId);
      pinch = 0;
    };
    const wheel = (e) => { e.preventDefault(); view.rad = clampRadius(view.rad * (1 + e.deltaY * 0.001)); draw(); };
    const recentre = () => { view.tx = 0; view.ty = 0; draw(); };
    const noMenu = (e) => e.preventDefault();
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('dblclick', recentre);
    canvas.addEventListener('contextmenu', noMenu);

    ctx.current = { scene, view, draw };
    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('dblclick', recentre);
      canvas.removeEventListener('contextmenu', noMenu);
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
    paintSelection(model.group, selection);
    draw();
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the selected part.
  useEffect(() => {
    const c = ctx.current;
    if (!c || !c.view.group) return;
    paintSelection(c.view.group, selection);
    c.draw();
  }, [selection]);

  return (
    <div className="stage">
      <canvas ref={canvasRef} />
      <div className="dims">{model ? formatSize(model.size) : ''}</div>
      <div className="hint">Drag to rotate · right-drag to pan · scroll or pinch to zoom · click a part to select it · the corner gizmo shows the X, Y and Z axes</div>
    </div>
  );
}
