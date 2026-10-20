import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { CAMERA_DEFAULTS, ORBIT_DEFAULTS, VIEWER_CLAMP } from '../lib/defaults/viewer.js';

export function useThreeViewer() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const grpRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const orbitRef = useRef({ ...ORBIT_DEFAULTS });
  const [viewerReady, setViewerReady] = useState(false);

  const clamp = (r) => Math.min(VIEWER_CLAMP.max, Math.max(VIEWER_CLAMP.min, r));

  const draw = useCallback(() => {
    const { th, ph, rad } = orbitRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (!camera || !renderer || !scene) return;
    camera.position.set(rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph));
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }, []);

  const setRad = useCallback(
    (r) => {
      orbitRef.current.rad = clamp(r);
      draw();
    },
    [draw],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CAMERA_DEFAULTS.fov,
      1,
      CAMERA_DEFAULTS.near,
      CAMERA_DEFAULTS.far,
    );
    camera.up.set(0, 0, 1);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const l1 = new THREE.DirectionalLight(0xffffff, 0.8);
    l1.position.set(40, -60, 100);
    scene.add(l1);
    const l2 = new THREE.DirectionalLight(0xffffff, 0.35);
    l2.position.set(-60, 40, 30);
    scene.add(l2);
    const grid0 = new THREE.GridHelper(300, 30, 0x888888, 0x888888);
    grid0.rotation.x = Math.PI / 2;
    grid0.position.z = -0.05;
    grid0.material.transparent = true;
    grid0.material.opacity = 0.25;
    scene.add(grid0);
    const grp = new THREE.Group();
    scene.add(grp);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    grpRef.current = grp;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv.parentElement);
    resize();

    const pts = new Map();
    let pd = 0;
    const onDown = (e) => {
      cv.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
    };
    const onMove = (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const o = orbitRef.current;
      if (pts.size === 1) {
        o.th -= (e.clientX - p[0]) * 0.008;
        o.ph = Math.min(3, Math.max(0.05, o.ph - (e.clientY - p[1]) * 0.008));
      }
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pd) o.rad = clamp(o.rad * (pd / d));
        pd = d;
      }
      draw();
    };
    const onUp = (e) => {
      pts.delete(e.pointerId);
      pd = 0;
    };
    const onWheel = (e) => {
      e.preventDefault();
      orbitRef.current.rad = clamp(orbitRef.current.rad * (1 + e.deltaY * 0.001));
      draw();
    };

    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });

    setViewerReady(true);

    return () => {
      setViewerReady(false);
      ro.disconnect();
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('wheel', onWheel);
      grpRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      renderer.dispose();
    };
  }, [draw]);

  const getBuildContext = useCallback(
    () => ({
      get firstFit() {
        return orbitRef.current.firstFit;
      },
      set firstFit(v) {
        orbitRef.current.firstFit = v;
      },
      draw,
      setRad: (r) => setRad(r),
      clamp,
    }),
    [draw, setRad],
  );

  return { canvasRef, grpRef, getBuildContext, draw, viewerReady };
}
