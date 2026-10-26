import * as THREE from 'three';

/** Renders a small preview image (JPEG data URL) of a built keychain group, looking down at a slight angle. */
export function renderThumbnail(group, w = 480, h = 300) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0xf3f1ec, 1);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(40, -60, 100);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-60, 40, 30);
  scene.add(fill);
  scene.add(group);

  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const fov = 35;
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 3000);
  camera.up.set(0, 0, 1);
  const t = Math.tan((fov * Math.PI) / 360);
  const dist = Math.max(size.x / 2 / (t * (w / h)), size.y / 2 / t) * 1.25 + size.z;
  const dir = new THREE.Vector3(0, -0.28, 1).normalize();
  camera.position.copy(center).addScaledVector(dir, dist);
  camera.lookAt(center);
  renderer.render(scene, camera);

  const url = canvas.toDataURL('image/jpeg', 0.88);
  scene.remove(group);
  renderer.dispose();
  renderer.forceContextLoss();
  return url;
}
