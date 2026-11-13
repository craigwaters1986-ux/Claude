// Interactive 3D muscle mannequin (Three.js, procedural geometry).
//
// HONEST SCOPE: this is a stylised, procedurally generated muscle-GROUP model
// — 18 groups placed as sculpted volumes on a glass mannequin. It is not an
// anatomically accurate model. A production build would swap the geometry
// for a licensed, segmented anatomy asset (see docs/01-product-design.md
// §3D anatomy options); the API below (setColors / select / view) stays the same.

import * as THREE from '../../vendor/three.module.min.js';
import { OrbitControls } from '../../vendor/OrbitControls.js';

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch { return false; }
}

const SKIN = 0x141a26;

function fresnelMaterial(color = 0x5ce1ff, power = 2.4, intensity = 0.9) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, p: { value: power }, k: { value: intensity } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 c; uniform float p; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), p); gl_FragColor = vec4(c * f * k, f * k); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide,
  });
}

export function createMannequin(container, { onSelect, autoRotate = true } = {}) {
  const width = () => container.clientWidth || 360;
  const height = () => container.clientHeight || 460;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width(), height());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D muscle model. Drag to rotate, pinch or scroll to zoom, tap a muscle for details.');
  renderer.domElement.setAttribute('role', 'img');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, width() / height(), 0.05, 50);
  camera.position.set(0, 1.0, 3.15);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.98, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.minDistance = 1.3; controls.maxDistance = 5;
  controls.minPolarAngle = Math.PI * 0.18; controls.maxPolarAngle = Math.PI * 0.82;
  controls.rotateSpeed = 0.8; controls.autoRotate = autoRotate; controls.autoRotateSpeed = 0.9;
  controls.update();

  // Lights: cool key, blue rim from behind, soft fill.
  scene.add(new THREE.HemisphereLight(0x9ccaff, 0x05070b, 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(1.5, 2.5, 3); scene.add(key);
  const rim1 = new THREE.DirectionalLight(0x2f8cff, 2.2); rim1.position.set(-2.5, 1.5, -2.5); scene.add(rim1);
  const rim2 = new THREE.DirectionalLight(0x6d5cff, 1.4); rim2.position.set(2.5, 1.2, -2); scene.add(rim2);

  const root = new THREE.Group(); scene.add(root);
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.42, metalness: 0.35 });
  const rimMat = fresnelMaterial(0x5ce1ff, 2.6, 0.75);
  const muscleMeshes = []; // { mesh, id }

  const addSkin = (geo, parent = root, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(geo, skinMat); m.position.set(...pos); m.scale.set(...scale); m.rotation.set(...rot); parent.add(m);
    const r = new THREE.Mesh(geo, rimMat); r.position.copy(m.position); r.scale.copy(m.scale).multiplyScalar(1.012); r.rotation.copy(m.rotation); parent.add(r);
    return m;
  };
  const sphere = new THREE.SphereGeometry(1, 40, 28);
  const addMuscle = (id, parent, pos, scale, rot = [0, 0, 0]) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0x3aa8ff, emissive: 0x3aa8ff, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.95 });
    const m = new THREE.Mesh(sphere, mat); m.position.set(...pos); m.scale.set(...scale); m.rotation.set(...rot);
    m.userData = { muscleId: id, baseScale: m.scale.clone() };
    parent.add(m); muscleMeshes.push({ mesh: m, id });
    return m;
  };

  // ── Torso (lathe profile, flattened front-to-back) ───────────────────
  const prof = [[0.001, 0.9], [0.15, 0.91], [0.172, 0.97], [0.168, 1.03], [0.148, 1.1], [0.138, 1.16], [0.148, 1.24], [0.172, 1.32], [0.188, 1.4], [0.185, 1.45], [0.15, 1.5], [0.07, 1.525], [0.001, 1.53]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  addSkin(new THREE.LatheGeometry(prof, 48), root, [0, 0, 0], [1, 1, 0.62]);
  addSkin(new THREE.CylinderGeometry(0.048, 0.056, 0.12, 24), root, [0, 1.56, 0]);
  addSkin(sphere, root, [0, 1.69, 0.005], [0.088, 0.112, 0.1]);

  // ── Arms (grouped so muscles follow the limb) ────────────────────────
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(s * 0.215, 1.43, 0); shoulder.rotation.z = s * 0.13; root.add(shoulder);
    addSkin(sphere, shoulder, [0, 0, 0], [0.06, 0.06, 0.06]);
    addSkin(new THREE.CapsuleGeometry(0.044, 0.22, 8, 20), shoulder, [0, -0.15, 0]);
    const elbow = new THREE.Group(); elbow.position.set(0, -0.3, 0); elbow.rotation.z = -s * 0.04; elbow.rotation.x = -0.12; shoulder.add(elbow);
    addSkin(sphere, elbow, [0, 0, 0], [0.042, 0.042, 0.042]);
    addSkin(new THREE.CapsuleGeometry(0.036, 0.22, 8, 20), elbow, [0, -0.13, 0]);
    addSkin(sphere, elbow, [0, -0.29, 0.005], [0.035, 0.05, 0.022]);
    addMuscle('frontDelts', shoulder, [0.0, -0.01, 0.04], [0.046, 0.065, 0.04], [0.2, 0, 0]);
    addMuscle('sideDelts', shoulder, [s * 0.03, -0.02, 0], [0.035, 0.065, 0.048]);
    addMuscle('rearDelts', shoulder, [0, -0.01, -0.04], [0.044, 0.06, 0.036], [-0.2, 0, 0]);
    addMuscle('biceps', shoulder, [0, -0.16, 0.026], [0.034, 0.088, 0.03]);
    addMuscle('triceps', shoulder, [0, -0.14, -0.026], [0.038, 0.1, 0.031]);
    addMuscle('forearms', elbow, [0, -0.09, 0.004], [0.04, 0.095, 0.036]);
  }

  // ── Legs ─────────────────────────────────────────────────────────────
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.09, 0.93, 0); hip.rotation.z = s * 0.025; root.add(hip);
    addSkin(new THREE.CapsuleGeometry(0.075, 0.32, 8, 24), hip, [0, -0.2, 0]);
    const knee = new THREE.Group(); knee.position.set(0, -0.44, 0); hip.add(knee);
    addSkin(sphere, knee, [0, 0, 0], [0.058, 0.058, 0.058]);
    addSkin(new THREE.CapsuleGeometry(0.05, 0.32, 8, 20), knee, [0, -0.2, 0]);
    addSkin(new THREE.BoxGeometry(0.08, 0.04, 0.2), knee, [0, -0.4, 0.045]);
    addMuscle('quads', hip, [s * 0.005, -0.19, 0.034], [0.064, 0.17, 0.05]);
    addMuscle('hamstrings', hip, [0, -0.2, -0.034], [0.058, 0.16, 0.046]);
    addMuscle('adductors', hip, [-s * 0.038, -0.12, 0.008], [0.032, 0.12, 0.04]);
    addMuscle('calves', knee, [0, -0.11, -0.024], [0.045, 0.11, 0.038]);
    addMuscle('glutes', root, [s * 0.075, 0.96, -0.08], [0.08, 0.085, 0.058]);
  }

  // ── Torso muscles ────────────────────────────────────────────────────
  for (const s of [-1, 1]) {
    addMuscle('chest', root, [s * 0.082, 1.36, 0.095], [0.092, 0.066, 0.045], [0, 0, s * 0.12]);
    addMuscle('obliques', root, [s * 0.112, 1.17, 0.045], [0.036, 0.08, 0.045], [0, s * 0.5, s * 0.1]);
    addMuscle('traps', root, [s * 0.075, 1.47, -0.055], [0.085, 0.04, 0.04], [0.3, 0, s * -0.35]);
    addMuscle('lats', root, [s * 0.112, 1.28, -0.066], [0.066, 0.13, 0.04], [0, s * -0.35, s * -0.18]);
    addMuscle('upperBack', root, [s * 0.05, 1.37, -0.1], [0.05, 0.065, 0.03]);
    addMuscle('lowerBack', root, [s * 0.032, 1.12, -0.078], [0.026, 0.09, 0.026]);
    for (const yy of [1.1, 1.17, 1.24]) addMuscle('abs', root, [s * 0.031, yy, 0.083], [0.028, 0.03, 0.015]);
  }
  addMuscle('traps', root, [0, 1.4, -0.105], [0.035, 0.08, 0.025]);

  // Floor halo
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.42, 64), new THREE.MeshBasicMaterial({ color: 0x2f8cff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = 0.04; scene.add(halo);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.28, 64), new THREE.MeshBasicMaterial({ color: 0x5ce1ff, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.041; scene.add(disc);

  // ── State, picking, animation ────────────────────────────────────────
  let selected = null; let colors = {};
  let targetAzimuth = null;
  const raycaster = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  let down = null;

  const onDown = (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; controls.autoRotate = false; };
  const onUp = (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 8) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(muscleMeshes.map((m) => m.mesh), false)[0];
    const id = hit?.object.userData.muscleId || null;
    api.select(id);
    onSelect?.(id);
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);

  const ro = new ResizeObserver(() => { renderer.setSize(width(), height()); camera.aspect = width() / height(); camera.updateProjectionMatrix(); });
  ro.observe(container);

  let raf = 0; const clock = new THREE.Clock(); let visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(container);
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (targetAzimuth != null) {
      const offset = camera.position.clone().sub(controls.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      let d = targetAzimuth - sph.theta; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) < 0.005) targetAzimuth = null; else { sph.theta += d * 0.12; offset.setFromSpherical(sph); camera.position.copy(controls.target).add(offset); }
    }
    for (const { mesh, id } of muscleMeshes) {
      const isSel = id === selected;
      const pulse = isSel ? 0.9 + 0.5 * (0.5 + 0.5 * Math.sin(t * 5)) : (selected ? 0.12 : 0.38);
      mesh.material.emissiveIntensity += (pulse - mesh.material.emissiveIntensity) * 0.2;
      mesh.material.opacity += ((selected && !isSel ? 0.55 : 0.95) - mesh.material.opacity) * 0.15;
      const k = isSel ? 1.08 : 1; const b = mesh.userData.baseScale;
      mesh.scale.lerp(new THREE.Vector3(b.x * k, b.y * k, b.z * k), 0.2);
    }
    halo.material.opacity = 0.22 + 0.08 * Math.sin(t * 1.6);
    controls.update();
    renderer.render(scene, camera);
  };
  loop();

  const api = {
    setColors(map) {
      colors = map;
      for (const { mesh, id } of muscleMeshes) {
        const c = new THREE.Color(map[id] || '#27324a');
        mesh.material.color.copy(c); mesh.material.emissive.copy(c);
      }
    },
    select(id) { selected = id; },
    view(which) { controls.autoRotate = false; targetAzimuth = which === 'back' ? Math.PI : 0; },
    reset() { controls.autoRotate = false; targetAzimuth = 0; camera.position.set(0, 1.0, 3.15); controls.target.set(0, 0.98, 0); },
    zoom(f) { const off = camera.position.clone().sub(controls.target).multiplyScalar(f); const len = Math.min(controls.maxDistance, Math.max(controls.minDistance, off.length())); camera.position.copy(controls.target).add(off.setLength(len)); },
    get colors() { return colors; },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointerup', onUp);
      scene.traverse((o) => { o.geometry?.dispose?.(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose?.()); });
      renderer.dispose(); renderer.domElement.remove();
    },
  };
  return api;
}
