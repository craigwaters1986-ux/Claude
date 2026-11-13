// Builds prototype/models/bodyparts3d-muscles.glb from the BodyParts3D "is-a"
// dataset: selects the meshes for Forma's muscle groups (via the same
// anatomy.js mapping the app uses), converts mm/Z-up to m/Y-up, simplifies
// with meshoptimizer, computes smooth normals and writes one node per element
// named "<muscleId>__<FJ id>".
//
// BodyParts3D has no meshes for rectus abdominis or latissimus dorsi; those two
// groups are added as clearly named APPROXIMATE volumes ("abs__approx",
// "lats__approx_L/R") positioned from neighbouring anatomy.
//
//   node tools/anatomy/build-bodyparts3d.mjs <dataset-dir> [out.glb] [ratio]
//   <dataset-dir> contains isa_element_parts.txt and isa_BP3D_4.0_obj_99/*.obj
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { MeshoptSimplifier } from 'meshoptimizer';
import { Document, NodeIO } from '@gltf-transform/core';
import { muscleForMeshName } from '../../prototype/js/core/anatomy.js';

const [dataset, out = 'prototype/models/bodyparts3d-muscles.glb', ratioArg = '0.08', usdaOut = 'ios/Forma/Resources/bodyparts3d-muscles.usda'] = process.argv.slice(2);
if (!dataset) { console.error('usage: build-bodyparts3d.mjs <dataset-dir> [out.glb] [ratio]'); process.exit(2); }
const RATIO = Number(ratioArg);
await MeshoptSimplifier.ready;

// 1. Select element files → muscle group (side-specific names preferred).
const rows = readFileSync(join(dataset, 'isa_element_parts.txt'), 'utf8').trim().split('\n').slice(1).map((l) => l.split('\t'));
const pick = new Map();
for (const [, name, fj] of rows) {
  const m = muscleForMeshName(name); if (!m) continue;
  const sided = /\b(left|right)\b/i.test(name);
  if (!pick.has(fj) || (sided && !pick.get(fj).sided)) pick.set(fj, { muscle: m, name, sided });
}

// 2. Parse OBJ (v / f with v//n) → positions (m, Y-up) + indices.
function parseObj(text) {
  const pos = []; const idx = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('v ')) { const [, x, y, z] = line.trim().split(/\s+/).map(Number); pos.push(x / 1000, z / 1000, -y / 1000); }
    else if (line.startsWith('f ')) {
      const vs = line.trim().split(/\s+/).slice(1).map((t) => parseInt(t, 10) - 1);
      for (let i = 1; i + 1 < vs.length; i++) idx.push(vs[0], vs[i], vs[i + 1]);
    }
  }
  return { pos: new Float32Array(pos), idx: new Uint32Array(idx) };
}

/** Weld duplicate vertices (BodyParts3D repeats shared vertices), so faces connect and can be simplified. */
function weld({ pos, idx }) {
  const key = new Map(); const out = []; const remap = new Uint32Array(pos.length / 3);
  for (let v = 0; v < pos.length / 3; v++) {
    const k = `${Math.round(pos[3 * v] * 1e5)},${Math.round(pos[3 * v + 1] * 1e5)},${Math.round(pos[3 * v + 2] * 1e5)}`;
    let i = key.get(k); if (i === undefined) { i = out.length / 3; key.set(k, i); out.push(pos[3 * v], pos[3 * v + 1], pos[3 * v + 2]); }
    remap[v] = i;
  }
  return { pos: new Float32Array(out), idx: idx.map((v) => remap[v]) };
}

function simplify({ pos, idx }) {
  const target = Math.max(120, Math.floor((idx.length * RATIO) / 3) * 3);
  const [out] = MeshoptSimplifier.simplify(idx, pos, 3, target, 0.02, []);
  // Compact: keep only referenced vertices.
  const remap = new Map(); const p = []; const i2 = new Uint32Array(out.length);
  out.forEach((v, k) => { if (!remap.has(v)) { remap.set(v, remap.size); p.push(pos[3 * v], pos[3 * v + 1], pos[3 * v + 2]); } i2[k] = remap.get(v); });
  return { pos: new Float32Array(p), idx: i2 };
}

function normals({ pos, idx }) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i] * 3, idx[i + 1] * 3, idx[i + 2] * 3];
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}

function bbox(meshes) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const m of meshes) for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], m.pos[i + k]); hi[k] = Math.max(hi[k], m.pos[i + k]); }
  return { lo, hi, c: lo.map((v, k) => (v + hi[k]) / 2), s: lo.map((v, k) => hi[k] - v) };
}

function ellipsoid(center, radii, seg = 24, ring = 16) {
  const p = []; const ix = [];
  for (let r = 0; r <= ring; r++) { const th = (r / ring) * Math.PI; for (let s = 0; s <= seg; s++) { const ph = (s / seg) * 2 * Math.PI;
    p.push(center[0] + radii[0] * Math.sin(th) * Math.cos(ph), center[1] + radii[1] * Math.cos(th), center[2] + radii[2] * Math.sin(th) * Math.sin(ph)); } }
  for (let r = 0; r < ring; r++) for (let s = 0; s < seg; s++) { const a = r * (seg + 1) + s, b = a + seg + 1; ix.push(a, b, a + 1, b, b + 1, a + 1); }
  return { pos: new Float32Array(p), idx: new Uint32Array(ix) };
}

// 3. Load + simplify.
const meshes = []; let inTris = 0;
for (const [fj, info] of pick) {
  let text; try { text = readFileSync(join(dataset, 'isa_BP3D_4.0_obj_99', `${fj}.obj`), 'utf8'); } catch { continue; }
  const raw = parseObj(text); inTris += raw.idx.length / 3;
  meshes.push({ name: `${info.muscle}__${fj}`, muscle: info.muscle, label: info.name, ...simplify(weld(raw)) });
}

// 4. Normalise: feet on y=0, centred on x/z.
const all = bbox(meshes);
for (const m of meshes) for (let i = 0; i < m.pos.length; i += 3) { m.pos[i] -= all.c[0]; m.pos[i + 1] -= all.lo[1]; m.pos[i + 2] -= all.c[2]; }
const groupBox = (id) => bbox(meshes.filter((m) => m.muscle === id));

// 5. Approximate volumes for groups the dataset lacks (positioned from neighbours).
const obl = groupBox('obliques'), rh = groupBox('upperBack'), pec = groupBox('chest');
const front = Math.max(obl.hi[2], pec.lo[2] + pec.s[2] * 0.6);
meshes.push({ name: 'abs__approx', muscle: 'abs', label: 'rectus abdominis (approximate — not in BodyParts3D)',
  ...ellipsoid([0, obl.lo[1] + obl.s[1] * 0.45, front - 0.012], [0.055, obl.s[1] * 0.42, 0.022]) });
for (const side of [-1, 1]) {
  meshes.push({ name: `lats__approx_${side < 0 ? 'R' : 'L'}`, muscle: 'lats', label: 'latissimus dorsi (approximate — not in BodyParts3D)',
    ...ellipsoid([side * (rh.s[0] / 2 + 0.035), (rh.lo[1] + obl.lo[1]) / 2 + 0.03, rh.lo[2] + 0.03], [0.07, (rh.lo[1] - obl.lo[1]) / 2 + 0.06, 0.03]) });
}

// 6. Write GLB.
const doc = new Document(); const buffer = doc.createBuffer(); const scene = doc.createScene('BodyParts3D muscles');
let outTris = 0;
for (const m of meshes) {
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(m.pos).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normals(m)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(m.pos.length / 3 < 65536 ? Uint16Array.from(m.idx) : m.idx).setBuffer(buffer));
  scene.addChild(doc.createNode(m.name).setMesh(doc.createMesh(m.name).addPrimitive(prim)).setExtras({ label: m.label, muscle: m.muscle }));
  outTris += m.idx.length / 3;
}
doc.getRoot().getAsset().copyright = 'BodyParts3D, (c) The Database Center for Life Science (DBCLS). See prototype/models/ATTRIBUTION.md';
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await new NodeIO().writeBinary(doc));
// 7. USD (ASCII) for the native app — SceneKit/ModelIO load it; prim names carry the mapping.
const f = (a) => Array.from(a, (v) => +v.toFixed(4)).join(', ');
let usda = '#usda 1.0\n(\n    defaultPrim = "Muscles"\n    metersPerUnit = 1\n    upAxis = "Y"\n    doc = "BodyParts3D (c) DBCLS — see ATTRIBUTION.md. Abs and lats are approximate."\n)\n\ndef Xform "Muscles"\n{\n';
for (const m of meshes) {
  const pts = []; for (let i = 0; i < m.pos.length; i += 3) pts.push(`(${f(m.pos.subarray(i, i + 3))})`);
  const nrm = normals(m); const ns = []; for (let i = 0; i < nrm.length; i += 3) ns.push(`(${f(nrm.subarray(i, i + 3))})`);
  usda += `    def Mesh "${m.name}"\n    {\n        int[] faceVertexCounts = [${new Array(m.idx.length / 3).fill(3).join(', ')}]\n        int[] faceVertexIndices = [${Array.from(m.idx).join(', ')}]\n        point3f[] points = [${pts.join(', ')}]\n        normal3f[] normals = [${ns.join(', ')}] (\n            interpolation = "vertex"\n        )\n        uniform token subdivisionScheme = "none"\n    }\n`;
}
usda += '}\n';
mkdirSync(dirname(usdaOut), { recursive: true });
writeFileSync(usdaOut, usda);
console.log(`wrote ${usdaOut} (${(usda.length / 1e6).toFixed(1)} MB)`);

const groups = [...new Set(meshes.map((m) => m.muscle))].sort();
console.log(`${meshes.length} meshes, ${inTris} → ${outTris} triangles, ${groups.length} groups (${groups.join(', ')})`);
console.log(`height ${(all.s[1]).toFixed(2)} m → wrote ${out}`);
