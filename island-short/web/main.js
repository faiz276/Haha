import * as THREE from 'three';
import { TAU, rnd, rr, drawShell, drawFish, drawSack, drawChar, drawTag, drawBoard, chalk, drawCrab, drawBoat, shellHeap, drawHeap, drawStar, drawCloud } from './art.js';

const SC = parseFloat(new URLSearchParams(location.search).get('s') || '1');
const W = 1080, H = 1920, FPS = 30;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const eio = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const eo = (u) => 1 - Math.pow(1 - clamp(u), 3);
const pop = (u) => { u = clamp(u); const c1 = 1.70158, c3 = c1 + 1; return u <= 0 ? 0 : 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const mix = (a, b, u) => a.map((v, i) => lerp(v, b[i], clamp(u)));

// ---------- renderer / scene ----------
const out = document.getElementById('out'); out.width = W * SC; out.height = H * SC;
const og = out.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W * SC; c.height = H * SC; return c; };
const pre = mk(), pg = pre.getContext('2d'), frozen = mk(), fg = frozen.getContext('2d');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W * SC, H * SC, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfeaff, 90, 330);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.3, 1200);

scene.add(new THREE.HemisphereLight(0xffffff, 0xe6d3a3, 1.95));
const sun = new THREE.DirectionalLight(0xfff3dd, 1.7);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 80 });
scene.add(sun, sun.target);

const L = (c) => new THREE.MeshLambertMaterial({ color: c });
const add = (geo, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
const box = (w, h, d, c, x, y, z, p) => add(new THREE.BoxGeometry(w, h, d), L(c), x, y, z, p);
const canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

// sky, sea, island
{
  const sky = canvasTex(8, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2a78d6'); gr.addColorStop(0.3, '#4f9fe8'); gr.addColorStop(0.5, '#cfeaff'); gr.addColorStop(1, '#cfeaff'); g.fillStyle = gr; g.fillRect(0, 0, 8, 512); });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 24, 24), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false })));
}
const seaTex = canvasTex(512, 512, (g) => {
  g.fillStyle = '#2b98e4'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + rnd(i) * 0.45})`; g.beginPath(); g.ellipse(rnd(i + 50) * 512, rnd(i + 99) * 512, 14 + rnd(i + 7) * 30, 3 + rnd(i + 3) * 5, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(20,110,200,0.35)'; g.beginPath(); g.ellipse(rnd(i + 150) * 512, rnd(i + 199) * 512, 20 + rnd(i + 17) * 30, 4 + rnd(i + 13) * 4, 0, 0, TAU); g.fill(); }
});
seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.repeat.set(70, 70);
{
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshBasicMaterial({ map: seaTex })); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.42; scene.add(sea);
  const ring = (r, y, c, o) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.04, 72), new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o })); m.position.y = y; scene.add(m); };
  ring(37, -0.4, 0x7fd3f5, 0.75); ring(32.4, -0.38, 0xf4fbff, 1);
  const sandTex = canvasTex(256, 256, (g) => { g.fillStyle = '#f1dba3'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 500; i++) { g.fillStyle = rnd(i) > 0.5 ? 'rgba(255,255,255,.22)' : 'rgba(190,150,80,.16)'; g.fillRect(rnd(i + 1) * 256, rnd(i + 2) * 256, 3, 2); } });
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping; sandTex.repeat.set(14, 14);
  const isl = add(new THREE.CylinderGeometry(30, 31.5, 1, 72), new THREE.MeshLambertMaterial({ map: sandTex }), 0, -0.5, 0); isl.castShadow = false;
}

function hut(x, z, s = 1) {
  add(new THREE.CylinderGeometry(1.5 * s, 1.5 * s, 2 * s, 20), L('#f3e6c8'), x, s, z);
  add(new THREE.ConeGeometry(2.15 * s, 1.7 * s, 20), L('#cf9d3c'), x, 2 * s + 0.85 * s, z);
  box(0.8 * s, 1.3 * s, 0.1, '#6b4423', x, 0.65 * s, z + 1.48 * s);
}
function palm(x, z, h = 5, lean = 0.5, seed = 0) {
  const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = rnd(seed + x) * TAU; scene.add(grp);
  let px = 0, py = 0; const n = 6;
  for (let i = 0; i < n; i++) {
    const a = lean * (i / n) * 0.5, seg = h / n;
    const m = add(new THREE.CylinderGeometry(0.2 - i * 0.012, 0.23 - i * 0.012, seg * 1.08, 8), L(i % 2 ? '#9a6a3c' : '#a87644'), px + Math.sin(a) * seg / 2, py + Math.cos(a) * seg / 2, 0, grp);
    m.rotation.z = -a; px += Math.sin(a) * seg; py += Math.cos(a) * seg;
  }
  for (let i = 0; i < 8; i++) {
    const pv = new THREE.Group(); pv.position.set(px, py, 0); pv.rotation.y = (i / 8) * TAU; pv.rotation.z = -0.35 - rnd(i + seed) * 0.3; grp.add(pv);
    const lf = add(new THREE.SphereGeometry(1, 10, 6), L(i % 2 ? '#2f9e44' : '#3bb357'), 1.5, 0, 0, pv); lf.scale.set(1.6, 0.07, 0.42);
  }
  add(new THREE.SphereGeometry(0.2, 8, 8), L('#5b3a1e'), px + 0.2, py - 0.2, 0.1, grp);
}
function rock(x, z, s = 1, c = '#8f9299', sy = 0.7) { const m = add(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshLambertMaterial({ color: c, flatShading: true }), x, s * sy * 0.55, z); m.scale.y = sy; m.rotation.y = rnd(x + z) * 3; return m; }

hut(-7, -6, 1.1); hut(-1, -10, 1.25); hut(6, -7, 1); hut(11.5, -11, 1.15); hut(15, 17, 0.95); hut(-22, 6, 1);
[[-10, -3, 5.2], [-4, -5, 6], [3, -4.5, 5.4], [9, -2.5, 6.2], [13.5, -6, 5], [-13, -8, 5.6], [0.5, -15, 6.5], [-18, -14, 5.2],
 [11, 23, 5], [17.5, 22, 5.6], [-20.5, -5, 5.6], [-11.5, -6, 5], [21, 4, 5.2], [-25, -3, 5], [22, -14, 5.4]]
  .forEach(([x, z, h], i) => palm(x, z, h, 0.5 + rnd(i) * 0.7, i * 3));
rock(-7.9, 16, 0.95); rock(-12, 2, 0.6); rock(8, 12, 0.5); rock(20, 12, 0.8); rock(-3, -20, 0.9);

// market stall
const MX = -16;
{
  box(3.3, 0.16, 1.3, '#b17a42', MX, 1.0, 0);
  box(3.3, 0.86, 0.08, '#e0a55e', MX, 0.52, 0.62);
  for (const sx of [-1.55, 1.55]) { box(0.14, 3.1, 0.14, '#8b5a2b', MX + sx, 1.55, -0.6); box(0.14, 1, 0.14, '#8b5a2b', MX + sx, 0.5, 0.55); }
  const aw = canvasTex(256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff' : '#e63946'; g.fillRect(i * 32, 0, 32, 64); } });
  const m = add(new THREE.BoxGeometry(3.8, 0.12, 2.1), new THREE.MeshLambertMaterial({ map: aw }), MX, 3.15, 0.1); m.rotation.x = 0.28;
}
// dock
{
  box(2.1, 0.2, 11, '#b17a42', 14, 0.15, 30.5);
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.13, 0.13, 1.6, 8), L('#7a4a1e'), 14 + sx * 1.0, -0.1, 26.5 + i * 2.3);
}
// cave
{
  const c = rock(18.5, -7.5, 4.6, '#777a84', 0.85); c.position.y = 1.6;
  rock(15.2, -6, 1.6, '#8a8d96', 0.8); rock(21.8, -5.6, 1.9, '#80838c', 0.8);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 16), new THREE.MeshBasicMaterial({ color: 0x0c0a12 })); hole.scale.set(1, 1.3, 0.9); hole.position.set(18.3, 0.9, -3.75); scene.add(hole);
}
// cave interior (far-away set)
const IX = 120;
const interior = new THREE.Group(); scene.add(interior);
{
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), new THREE.MeshBasicMaterial({ color: 0x1c1628, fog: false })); wall.position.set(IX, 12, -6); interior.add(wall);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ color: 0x2b2238, fog: false })); fl.rotation.x = -Math.PI / 2; fl.position.set(IX, 0.01, 6); interior.add(fl);
}

// ---------- sprites ----------
const sprites = [];
class Sprite {
  constructor(cw, ch, w, h, opt = {}) {
    this.c = document.createElement('canvas'); this.c.width = cw; this.c.height = ch; this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
    this.m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.02, depthWrite: false, side: THREE.DoubleSide, fog: opt.fog ?? true, blending: opt.add ? THREE.AdditiveBlending : THREE.NormalBlending }));
    if (opt.shadow !== false) { this.m.castShadow = true; this.m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: 0.5 }); }
    this.fixed = !!opt.fixed; this.roll = 0; this.m.visible = false; scene.add(this.m); if (!this.fixed) sprites.push(this);
    if (opt.draw) this.draw(opt.draw);
  }
  put(x, y, z, s = 1, roll = 0) { this.m.visible = true; this.m.position.set(x, y, z); this.m.scale.set(s, s, s); this.roll = roll; return this; }
  draw(fn) { this.g.clearRect(0, 0, this.c.width, this.c.height); fn(this.g); this.tex.needsUpdate = true; return this; }
}
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * TAU + 0.3, s = new Sprite(512, 256, 150, 75, { shadow: false, fixed: true, fog: false, draw: (g) => drawCloud(g, i * 11) });
  s.m.position.set(Math.cos(a) * 420, 60 + rnd(i) * 90, Math.sin(a) * 420); s.m.lookAt(0, 40, 0); s.m.visible = true;
}

const SPECS = [
  { skin: '#f2c9a0', shirt: '#c0392b', hat: 'feathers' },                                   // 0 chief
  { skin: '#e8b98a', shirt: '#3d7ea6', apron: '#fdf6e3', hat: 'straw' },                    // 1 vendor
  { skin: '#fbe3c8', shirt: '#2a9d8f', hat: 'hairbun', hair: '#1d1a22' },                   // 2
  { skin: '#c98e62', shirt: '#ffffff', stripe: '#e63946', hat: 'bandana', hatc: '#3a6fd8' },// 3
  { skin: '#f6d2b0', shirt: '#8e5fc7', hat: 'flower', hair: '#6b3e1f' },                    // 4
  { skin: '#a8714a', shirt: '#f08a24', hat: 'straw' },                                      // 5 fisher
  { skin: '#fbe3c8', shirt: '#5aa845', hat: 'hair', hair: '#2b2118' },                      // 6
  { skin: '#e8b98a', shirt: '#ff7eb6', hat: 'bandana', hatc: '#2f9e44' },                   // 7
  { skin: '#c98e62', shirt: '#f4d03f', hat: 'cap', hatc: '#3d5a80' },                       // 8
  { skin: '#f6d2b0', shirt: '#b8a1e3', hat: 'bun', hair: '#c9c9d2', glasses: true },        // 9 Mara
];
const chars = SPECS.map((sp) => ({ sp, s: new Sprite(400, 600, 2, 3) }));
const pool = (n, mkf) => Array.from({ length: n }, (_, i) => mkf(i));
const fishS = pool(12, () => new Sprite(248, 136, 0.62, 0.34, { draw: (g) => drawFish(g, 140, 68, 1.25) }));
const shellS = pool(34, (i) => new Sprite(96, 96, 0.34, 0.34, { shadow: false, draw: (g) => drawShell(g, 48, 50, 38, 0, ['#ffd8bf', '#ffe6cf', '#ffc9ae'][i % 3]) }));
const sackS = pool(10, () => new Sprite(200, 200, 0.95, 0.95, { draw: (g) => drawSack(g, 100, 112, 1) }));
const tag = new Sprite(300, 240, 1.2, 0.96, { shadow: false });
const board = new Sprite(640, 480, 2.5, 1.875);
const crab = new Sprite(360, 300, 1.25, 1.04);
const boats = [new Sprite(720, 720, 6, 6, { draw: (g) => drawBoat(g, false) }), new Sprite(720, 720, 7, 7, { draw: (g) => drawBoat(g, true) })];
const pilePts = shellHeap(100, 560, 360, 26, 3), pile = new Sprite(560, 360, 2.8, 1.8);
const mtnPts = shellHeap(520, 800, 700, 24, 11), mtn = new Sprite(800, 700, 9, 7.875, { shadow: false, fog: false });
const mtnCache = document.createElement('canvas'); mtnCache.width = 800; mtnCache.height = 700; drawHeap(mtnCache.getContext('2d'), mtnPts, 520, 24);
const glow = new Sprite(256, 256, 14, 14, { shadow: false, fog: false, add: true, draw: (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,200,110,.95)'); gr.addColorStop(0.5, 'rgba(255,150,70,.35)'); gr.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); } });
const puff = new Sprite(300, 300, 1.8, 1.8, { shadow: false });

// ---------- per-frame director state ----------
let cur = null, card = null, gradeSpec = null, capTop = false;
const camP = new THREE.Vector3(), camL = new THREE.Vector3();
const cam = (px, py, pz, lx, ly, lz) => { camP.set(px, py, pz); camL.set(lx, ly, lz); };
const setCard = (text, t0, col) => { const k = pop((cur.t - t0) / 0.28); if (k > 0) card = { text, k, col }; };
const grade = (name, amt = 1) => { gradeSpec = { name, amt }; };

function A(i, x, z, st = {}) {
  const ch = chars[i], T = cur.T;
  const blink = ((T + rnd(i) * 4) % (2.4 + rnd(i + 9) * 1.6)) < 0.11;
  const s = { expr: 'neutral', aL: 0.25, aR: 0.25, y: 0, scale: 1, blink, ...st };
  if (s.scale <= 0.01) return;
  s.squash = (s.squash || 0) + Math.sin(T * 2.4 + i) * 0.012;
  ch.s.draw((g) => drawChar(g, ch.sp, s));
  ch.s.put(x, -0.17 * s.scale + s.y, z, s.scale);
}
const ROW = { 3: [-1.55, 8], 2: [0, 8], 9: [1.55, 8], 1: [-2.3, 6.3], 4: [-0.78, 6.3], 5: [0.78, 6.3], 6: [2.3, 6.3], 7: [-1.55, 4.6], 0: [0, 4.6], 8: [1.55, 4.6] };
const ORDER = [3, 2, 9, 1, 4, 5, 6, 7, 0, 8];
// back rows get a small lift so every face reads in a portrait frame
const lift = (z) => (z < 5 ? 0.85 : z < 7 ? 0.42 : 0);
const row = (fn) => ORDER.forEach((i, k) => { const st = fn(i, k); if (st) A(i, ROW[i][0] + (st.dx || 0), ROW[i][1], { ...st, y: (st.y || 0) + lift(ROW[i][1]) * (st.scale ?? 1) }); });
const BC = [0, 4.6, 23, 0, 1.3, 6.3];
function tableFish(n = 10, hide = -1, bump = () => 1) {
  for (let j = 0; j < n; j++) if (j > hide) fishS[j].put(MX - 1.2 + (j % 5) * 0.6, 1.08 + (j < 5 ? 0 : 0.14), j < 5 ? 0.25 : -0.2, bump(j));
}
function arc(spr, a, b, u, h, s = 1, spin = 0) { u = clamp(u); spr.put(lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * h, lerp(a[2], b[2], u), s, spin * u); }
function shellRain(n, cx, cz, t) {
  for (let i = 0; i < n; i++) { const y = 8.5 - ((t * 4.5 + rnd(i) * 9) % 9); shellS[i].put(cx + (rnd(i + 20) - 0.5) * 7, y, cz + (rnd(i + 40) - 0.5) * 4, 1, t * 4 + i); }
}
function crabScene(c, content, clawUp = true) {
  cam(...mix([-6.9, 1.8, 26.6, -6.9, 1.2, 16], [-6.9, 1.75, 25.4, -6.9, 1.2, 16], c.u));
  crab.draw((g) => drawCrab(g, c.T, clawUp, (c.T % 2.7) < 0.1)).put(-7.9, 0.82 + Math.sin(c.T * 3) * 0.015, 16.15);
  board.draw((g) => drawBoard(g, content)).put(-6.2, 0, 16, pop(c.t / 0.3));
}

// ---------- shots (one per narrated sentence) ----------
const S = {};
S.hook = (c) => {
  const steps = [[0, 10], [0.34, 20], [0.56, 50], [0.76, 100]], st = [...steps].reverse().find((s) => c.u >= s[0]), n = st[1];
  cam(...mix([0.25, 1.8, 13.4, 0.3, 1.6, 6], [0.25, 1.8, 11.9, 0.3, 1.62, 6], c.u));
  A(2, -0.3, 6, { expr: n >= 50 ? 'shock' : n >= 20 ? 'neutral' : 'smile', hold: { type: 'fish', s: 1 }, look: [0.9, -0.6], squash: n >= 100 ? Math.sin(c.T * 38) * 0.012 : 0 });
  tag.draw((g) => drawTag(g, n, n >= 100)).put(0.95, 2.0, 6.05, 0.95 * pop((c.u - st[0]) * c.d / 0.22), n >= 100 ? Math.sin(c.T * 42) * 0.06 : 0);
};
S.island = (c) => {
  cam(...mix([0.25, 1.8, 11.9, 0.3, 1.62, 6], [0, 30, 74, 0, 4, 2], eio(c.u * 1.15)));
  A(2, -0.3, 6, { expr: 'shock', hold: { type: 'fish', s: 1 } });
  boats[0].put(-20, -0.55 + Math.sin(c.T * 2) * 0.08, 40, 1);
};
S.people = (c) => {
  cam(...mix(BC, [0, 4.4, 21.8, 0, 1.3, 6.3], c.u));
  let n = 0;
  row((i, k) => { const t0 = 0.12 + k * 0.1, s = pop((c.t - t0) / 0.26); if (s > 0) n++; const w = clamp((c.t - t0) / 0.7); return { scale: s, expr: 'smile', aR: 0.25 + Math.sin(w * Math.PI) * 2.4 + Math.sin(c.T * 14) * 0.2 * (w < 1) }; });
  setCard(`${n} PEOPLE`, 0.15);
};
S.fish = (c) => {
  cam(...mix([14, 2.5, 46.5, 14, 1.75, 34], [14, 2.5, 45.2, 14, 1.75, 34], c.u));
  let n = 0;
  for (let k = 0; k < 10; k++) {
    const t0 = 0.12 + k * 0.12, u = (c.t - t0) / 0.5; if (u <= 0) continue; if (u >= 1) n++;
    const side = k % 2 ? 1 : -1;
    arc(fishS[k], [14 + side * (2.6 + rnd(k) * 0.8), -0.6, 35.5 + rnd(k + 5) * 2], [14 + ((k % 5) - 2) * 0.3, 0.27 + Math.floor(k / 5) * 0.2, 34.6], u, 3, 1, side * -5);
  }
  A(5, 14, 33.7, { y: 0.25, expr: 'happy', aL: 2.5 + Math.sin(c.T * 10) * 0.25, aR: 2.5 - Math.sin(c.T * 10) * 0.25 });
  setCard(`${n} FISH`, 0.2);
};
S.shells = (c) => {
  cam(...mix([5.5, 2.0, 25.2, 5.5, 1.25, 12], [5.5, 1.95, 24, 5.5, 1.25, 12], c.u));
  const n = Math.round(100 * eo(c.t / 1.9));
  pile.draw((g) => drawHeap(g, pilePts, n, 26)).put(5.5, 0, 12);
  A(4, 3.7, 12.2, { expr: 'smile', look: [0.9, 0.4], aR: 1.3 }); A(6, 7.3, 12.2, { expr: 'happy', look: [-0.9, 0.4], aL: 1.3 });
  setCard(`${n} SHELLS`, 0.15);
};
const MCAM = [MX + 0.5, 2.6, 15.6, MX + 0.5, 1.75, 0];
S.price = (c) => {
  cam(...mix(MCAM, [MX + 0.5, 2.5, 14.5, MX + 0.5, 1.75, 0], c.u));
  const u2 = (c.u - 0.62) / 0.25;
  tableFish(10, u2 > 0 ? 4 : -1); if (u2 > 0 && u2 < 1) arc(fishS[4], [MX + 1.2, 1.08, 0.25], [MX + 2.3, 1.1, 0.6], u2, 0.9, 1, 3);
  A(1, MX - 0.5, -0.9, { expr: c.u > 0.55 ? 'happy' : 'smile', aR: c.u > 0.4 && c.u < 0.7 ? 1.5 : 0.25 });
  A(2, MX + 2.4, 0.55, { expr: u2 >= 1 ? 'happy' : 'smile', look: [-0.8, 0], hold: u2 >= 1 ? { type: 'fish', s: 0.9 } : null, aL: c.u < 0.55 ? 1.5 : 0.3 });
  const u1 = (c.u - 0.3) / 0.25; if (u1 > 0 && u1 < 1) for (let i = 0; i < 4; i++) arc(shellS[i], [MX + 1.75, 1.35, 0.55], [MX - 0.1, 1.5, -0.6], u1 - i * 0.07, 1.1, 1, 6);
  tag.draw((g) => drawTag(g, 10, false)).put(MX + 0.2, 1.72, 0.35, 0.75 * pop((c.t - 0.15) / 0.25));
};
S.simple = (c) => crabScene(c, (g) => { chalk(g, '1', 108, 208, 124); drawFish(g, 226, 208, 0.66); chalk(g, '=', 322, 204, 100); chalk(g, '10', 428, 208, 110, '#ffe08a'); drawShell(g, 540, 202, 32); });
S.cave = (c) => {
  cam(...mix([15.6, 2.3, 12.2, 16.4, 1.9, -3], [15.9, 2.2, 10.6, 16.6, 1.8, -3], c.u));
  const x = lerp(12.2, 15.6, eo(c.u * 1.25)), mv = c.u < 0.78;
  A(0, x, -1.4, { expr: c.u > 0.7 ? 'shock' : 'neutral', look: [0.9, 0], run: mv ? c.T * 9 : null, y: mv ? Math.abs(Math.sin(c.T * 9)) * 0.06 : 0, aR: c.u > 0.7 ? 1.4 : 0.3 });
  glow.put(18.3, -1.2, -3.2, 0.42 + Math.sin(c.T * 6) * 0.04 + c.u * 0.12);
  grade('morning', 0.8);
};
const mountain = (c, s = 1) => {
  interior.visible = true;
  mtn.draw((g) => { g.drawImage(mtnCache, 0, 0); for (let i = 0; i < 26; i++) { const p = mtnPts[(i * 19) % 520]; drawStar(g, p.x, p.y, 26, Math.max(0, Math.sin(c.T * 5 + i * 1.7))); } }).put(IX, 0, -1.5, s);
  glow.put(IX, -3, -3, 1.5);
};
S.full = (c) => {
  cam(...mix([IX, 1.9, 17, IX, 3.3, 0], [IX, 1.9, 15.6, IX, 3.4, 0], c.u));
  mountain(c, 0.94 + 0.06 * pop(c.t / 0.35));
  A(0, IX - 1.5, 3.4, { expr: 'awe', look: [0.6, -0.9], aL: 1.9, aR: 1.9 });
};
S.thousands = (c) => {
  cam(...mix([IX, 1.7, 13, IX, 1.9, 0], [IX, 2.6, 14.5, IX, 5.0, 0], eio(c.u)));
  mountain(c); A(0, IX - 1.3, 3.4, { expr: 'awe', look: [0.6, -0.9], aL: 2.6, aR: 2.6, y: Math.abs(Math.sin(c.T * 9)) * 0.12 });
  const n = Math.floor(lerp(100, 9999, eo(c.t / 0.9)));
  setCard(n >= 9999 ? '9,999+' : n.toLocaleString('en-US'), 0.05);
};
S.sacks = (c) => {
  cam(...mix([-0.7, 4.6, 28, -0.7, 1.3, 6.3], [-0.7, 4.5, 26.8, -0.7, 1.3, 6.3], c.u));
  A(0, -3.8, 8.6, { expr: 'happy', aR: 2.3 + Math.sin(c.T * 12) * 0.3, look: [0.8, 0] });
  let k2 = 0;
  row((i) => {
    if (i === 0) return null;
    const tk = 0.4 + (k2++) * 0.13, dt = c.t - tk, [x, z] = ROW[i];
    if (dt < 0) { if (dt > -0.35) sackS[i].put(x, lerp(9, 1.0, ((dt + 0.35) / 0.35) ** 2), z + 0.05, 1); return { expr: 'neutral', look: [0, -0.8] }; }
    return { expr: 'happy', hold: { type: 'sack', s: 1 }, squash: Math.exp(-dt * 7) * Math.cos(dt * 22) * 0.16 };
  });
};
S.rich = (c) => {
  cam(...mix([0, 3.4, 19, 0, 1.5, 7], [0, 3.4, 18, 0, 1.5, 7], c.u));
  row((i) => ({ expr: 'happy', hold: { type: 'sack', s: 1 }, y: Math.abs(Math.sin(c.T * 8 + i)) * 0.16 }));
  shellRain(30, 0, 7.4, c.t + 2);
};
S.dance = (c) => {
  cam(...mix([6, 3.2, 18, 0.2, 1.4, 6.4], [4.8, 3.2, 17.6, 0.2, 1.4, 6.4], c.u));
  row((i) => { const p = c.T * 9 + i * 1.3; return { expr: 'happy', tilt: Math.sin(p) * 0.17, y: Math.abs(Math.sin(p)) * 0.18, aL: 1.7 + Math.sin(p) * 0.9, aR: 1.7 - Math.sin(p) * 0.9 }; });
  shellRain(16, 0, 7.4, c.t + 5);
};
S.cheer = (c) => {
  cam(...mix([-1.5, 0.9, 15.4, 0, 2.2, 7.2], [-1.3, 0.9, 14.8, 0, 2.25, 7.2], c.u));
  row((i) => { const j = Math.max(0, Math.sin(c.t * 9 - rnd(i) * 1.2)); return { expr: 'happy', aL: 2.8, aR: 2.8, y: j * 0.55, squash: -j * 0.05 }; });
  shellRain(20, 0, 7.4, c.t + 7);
};
S.run = (c) => {
  const dx = -(0.5 + c.t * 7.5); cam(dx + 1.8, 3.0, 20, dx + 0.6, 1.3, 6.4);
  row((i) => ({ dx, expr: 'happy', hold: { type: 'sack', s: 1 }, run: c.T * 17 + i * 2, tilt: -0.13, y: Math.abs(Math.sin(c.T * 17 + i * 2)) * 0.09 }));
};
S.problem = (c) => { crabScene(c, (g) => { chalk(g, 'BUT...', 320, 150, 92, '#f6f6ee'); if (c.u > 0.3) chalk(g, 'PROBLEM!', 320, 270, 92, '#ff8a70'); }); grade('cool', 0.5); };
S.sea = (c) => {
  cam(...mix([14, 3.0, 49, 14, 1.3, 36], [14, 3.2, 51, 14, 1.3, 36], c.u));
  boats[0].put(17.2, -0.36 + Math.sin(c.T * 2) * 0.05, 37.5, 0.62, Math.sin(c.T * 1.6) * 0.02);
  A(5, 14, 34, { y: 0.25, expr: 'neutral', aL: 1.25, aR: 1.25, look: [0, 0.3] });
  for (let k = 0; k < 10; k++) fishS[k].put(14 + ((k % 5) - 2) * 0.3, 0.27 + Math.floor(k / 5) * 0.2, 34.9);
};
S.still = (c) => {
  cam(...mix([MX, 2.7, 10.2, MX, 1.4, 0], [MX, 2.4, 8.6, MX, 1.4, 0], c.u));
  let n = 0;
  tableFish(10, -1, (j) => { const dt = c.t - 0.2 - j * 0.09; if (dt > 0) n++; return 1 + (dt > 0 ? Math.exp(-dt * 9) * 0.45 : 0); });
  A(1, MX - 0.5, -0.9, { expr: 'flat', aL: 1.3, aR: 1.3 });
  setCard(`STILL ${Math.max(1, n)} FISH`, 0.2);
};
S.paymore = (c) => {
  cam(...mix([MX, 2.8, 21, MX, 1.8, 0], [MX, 2.7, 19.8, MX, 1.8, 0], c.u));
  tableFish(); A(1, MX - 0.3, -0.9, { expr: 'neutral', look: [Math.sin(c.T * 5), 0] });
  [[3, -2.4, 0.6], [7, -3.1, 1.8], [4, 2.4, 0.6], [6, 3.1, 1.8]].forEach(([i, dx, z], k) => A(i, MX + dx, z, { expr: 'happy', hold: { type: 'sack', s: 1.05 }, y: Math.abs(Math.sin(c.T * 10 + k * 1.6)) * 0.3, look: [dx < 0 ? 0.8 : -0.8, 0] }));
};
S.theydo = (c) => {
  cam(...mix([MX - 0.5, 1.9, 5.6, MX - 0.5, 1.72, -0.9], [MX - 0.5, 1.9, 5.0, MX - 0.5, 1.72, -0.9], c.u));
  tableFish(); A(1, MX - 0.5, -0.9, { expr: 'smug', aL: 2.75 + Math.sin(c.T * 16) * 0.12, aR: 2.75 - Math.sin(c.T * 16) * 0.12 });
};
const priceShot = (n, z0) => (c) => {
  cam(...mix([MX + 0.25, 1.85, z0, MX + 0.25, 1.75, 0.3], [MX + 0.25, 1.85, z0 - 0.5, MX + 0.25, 1.75, 0.3], c.u));
  tableFish(); A(1, MX - 0.9, -0.9, { expr: n >= 100 ? 'happy' : 'smug' });
  const hot = n >= 100;
  tag.draw((g) => drawTag(g, n, hot)).put(MX + 0.3 + (hot ? Math.sin(c.T * 50) * 0.02 : 0), 1.3, 0.7, (n >= 100 ? 1.5 : n >= 50 ? 1.4 : 1.25) * pop(c.t / 0.2), hot ? Math.sin(c.T * 40) * 0.05 : 0);
};
S.twenty = priceShot(20, 7.6); S.fifty = priceShot(50, 7.0); S.hundred = priceShot(100, 6.5);
S.sunset = (c) => {
  cam(...mix(BC, [0, 4.4, 21.6, 0, 1.3, 6.3], c.u)); grade('sunset');
  row((i) => ({ expr: c.u > 0.55 ? 'smile' : 'happy', hold: { type: 'sack', s: 1.4 }, y: Math.abs(Math.sin(c.T * 5 + i)) * 0.05 }));
  setCard('10× THE MONEY', c.d * 0.5);
};
S.dinner = (c) => {
  cam(...mix([0, 3.4, 18.6, 0, 1.45, 7], [0, 3.4, 17.6, 0, 1.45, 7], c.u)); grade('sunset');
  row(() => ({ expr: 'flat', hold: { type: 'plate', s: 1 } }));
  setCard('SAME DINNER', c.d * 0.45);
};
S.two = (c) => {
  cam(...mix([0, 1.9, 18.8, 0, 1.55, 9], [0, 1.9, 17.6, 0, 1.55, 9], c.u)); grade('spot');
  A(0, -1.25, 9, { scale: pop((c.t - 0.15) / 0.28), expr: 'smug', hold: { type: 'sack', s: 1.3 } });
  A(9, 1.25, 9, { scale: pop((c.t - 0.7) / 0.28), expr: 'sad', hold: { type: 'jar', s: 1 } });
};
S.chief = (c) => {
  cam(...mix(MCAM, [MX + 0.5, 2.5, 14.5, MX + 0.5, 1.75, 0], c.u)); grade('sepia');
  let got = 0;
  for (let k = 0; k < 10; k++) {
    const src = [MX - 1.2 + (k % 5) * 0.6, 1.08 + (k < 5 ? 0 : 0.14), k < 5 ? 0.25 : -0.2], u = k < 8 ? (c.t - 0.5 - k * 0.2) / 0.42 : -1;
    if (u <= 0) fishS[k].put(...src); else { if (u >= 1) got++; arc(fishS[k], src, [MX + 2.45 + ((k % 4) - 1.5) * 0.3, 0.02 + Math.floor(k / 4) * 0.24, 1.3], u, 1.5, 1, 4); }
  }
  A(1, MX - 0.5, -0.9, { expr: 'happy' });
  A(0, MX + 2.5, 0.5, { expr: 'smug', hold: { type: 'sack', s: 1.2 }, look: [-0.8, 0] });
  tag.draw((g) => drawTag(g, 10, false)).put(MX + 0.2, 1.72, 0.35, 0.75);
  setCard('OLD PRICES', c.d * 0.55);
};
S.boat = (c) => {
  cam(...mix([14.5, 2.6, 50.5, 14.5, 2.5, 38.5], [14.5, 2.6, 49.3, 14.5, 2.5, 38.5], c.u));
  const bob = Math.sin(c.T * 2.2) * 0.08, x = 13.6 + c.u * 1.2;
  A(0, x - 1.55, 38.4, { y: 0.55 + bob, expr: 'smug', aR: 2.3 + Math.sin(c.T * 9) * 0.3 });
  boats[1].put(x, -0.75 + bob, 38.5, 1, Math.sin(c.T * 1.8) * 0.015);
};
S.mara = (c) => {
  cam(...mix([4, 1.8, 16.2, 4, 1.85, 10], [4, 1.8, 15.0, 4, 1.85, 10], c.u));
  A(9, 4, 10, { expr: 'smile', hold: { type: 'jar', s: 1.2 }, tilt: Math.sin(c.T * 2.5) * 0.03 });
  setCard('30 YEARS', c.d * 0.68);
};
S.jar = (c) => {
  cam(...mix([4, 1.8, 15.0, 4, 1.85, 10], [4, 1.8, 14.2, 4, 1.85, 10], c.u)); grade('cool', 0.45);
  const pu = (c.t - 0.75) / 0.45, after = pu > 0.35;
  A(9, 4, 10, { expr: after ? 'sad' : 'neutral', tear: pu > 1.6, hold: after ? { type: 'fish', s: 0.6 } : { type: 'jar', s: 1.2 }, look: [0, after ? 0.9 : 0.5] });
  if (pu > 0 && pu < 1) puff.draw((g) => { g.globalAlpha = 1 - pu; g.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { const a = i * 0.7, r = 40 + pu * 85; g.beginPath(); g.arc(150 + Math.cos(a) * r, 150 + Math.sin(a) * r, 46 - pu * 16, 0, TAU); g.fill(); } g.globalAlpha = 1; }).put(4, 0.15, 10.2, 1 + pu * 0.4);
  setCard('= 1 FISH', 1.15);
};
S.nobody = (c) => {
  cam(...mix([0, 4.4, 21.5, 0, 1.3, 6.3], [0, 4.7, 24, 0, 1.3, 6.3], c.u)); grade('cool', 0.75);
  row((i) => ({ expr: i === 0 ? 'smug' : 'sad', hold: { type: 'sack', s: 1.4 }, look: [0, 0.6] }));
};
S.made = (c) => {
  cam(...mix([15.9, 2.4, 11.6, 16.6, 1.5, -3], [15.9, 2.3, 10.4, 16.6, 1.5, -3], c.u)); grade('cool', 0.35);
  for (let i = 0; i < 34; i++) { const p = (c.T * 0.42 + rnd(i)) % 1; shellS[i].put(18.3 + (rnd(i + 60) - 0.5) * 5 * p - 1.2 * p, 0.12 + Math.abs(Math.sin(p * 16 + i)) * 0.5 * (1 - p), -3.2 + p * 11, 1.15, p * 9 + i); }
  glow.put(18.3, -1.2, -3.2, 0.5);
  A(0, 14.7, -0.6, { expr: 'smug', aL: 1.35, aR: 1.35, y: Math.sin(c.T * 3) * 0.02 });
};
S.inflation = (c) => crabScene(c, (g) => {
  const n = Math.floor(clamp((c.t - 0.25) / 0.55) * 9); chalk(g, 'INFLATION'.slice(0, n), 320, 190, 86, '#ffe08a');
  const ul = clamp((c.t - 0.85) / 0.25); if (ul > 0) { g.strokeStyle = '#f6f6ee'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(90, 262); g.lineTo(90 + 460 * ul, 262); g.stroke(); }
});
const TIN = { island: 'cont', full: 'fade', thousands: 'fade', fifty: 'cont', hundred: 'cont', dinner: 'fade', jar: 'cont', simple: 'whip' };

// ---------- timeline, captions ----------
const timing = await (await fetch('/build/timings.json')).json();
const sents = timing.sentences;
const shots = sents.map((s, i) => ({ id: s.id, fn: S[s.id], start: i ? s.start - 0.12 : 0, tin: i ? (TIN[s.id] || 'whip') : 'cont', dir: i % 2 ? 1 : -1 }));
shots.forEach((s, i) => { s.end = shots[i + 1] ? shots[i + 1].start : timing.duration; });
const FRAMES = Math.ceil(timing.duration * FPS);
const caps = [];
for (const s of sents) {
  let g = []; const flush = () => { if (g.length) { caps.push({ text: g.map((w) => w.w).join(' '), s: g[0].s, e: g[g.length - 1].e }); g = []; } };
  for (const w of s.words) { const len = g.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length; if (g.length >= 2 || (g.length && len > 12)) flush(); g.push(w); if (/[,.?!]$/.test(w.w)) flush(); }
  flush();
}
caps.forEach((c, i) => { const n = caps[i + 1]; c.e = n && n.s - c.e < 0.4 ? n.s : c.e + 0.25; });

await Promise.all([document.fonts.load('900 80px Nunito'), document.fonts.load('900 80px Archivo')]);

const GR = { sunset: ['multiply', 'rgb(255,172,118)', 0.62], cool: ['multiply', 'rgb(150,175,228)', 0.6], morning: ['soft-light', 'rgb(255,214,150)', 0.6], sepia: ['multiply', 'rgb(244,214,160)', 0.6], spot: ['multiply', 'rgb(120,130,170)', 0] };
const WF = 5, FD = 8, Y = new THREE.Vector3(0, 1, 0);
let lastK = -1;

function frame(f) {
  const T = f / FPS;
  let k = shots.findIndex((s) => T >= s.start && T < s.end); if (k < 0) k = shots.length - 1;
  const sh = shots[k], t = T - sh.start, d = sh.end - sh.start;
  if (k !== lastK) { fg.drawImage(pre, 0, 0); lastK = k; }
  sprites.forEach((s) => { s.m.visible = false; }); interior.visible = false; card = null; gradeSpec = null; capTop = false;
  cur = { T, t, d, u: clamp(t / d) };
  sh.fn(cur);

  const fi = Math.round(t * FPS), nfr = Math.round(d * FPS), nxt = shots[k + 1];
  let yaw = 0, blur = 0;
  if (sh.tin === 'whip' && fi < WF) { const e = Math.pow(1 - fi / WF, 2); yaw = -e * 0.75 * sh.dir; blur = e; }
  if (nxt && nxt.tin === 'whip' && fi >= nfr - WF) { const e = Math.pow((fi - (nfr - WF) + 1) / WF, 2); yaw = e * 0.75 * nxt.dir; blur = e; }
  camera.position.copy(camP); camera.position.x += Math.sin(T * 0.9) * 0.02; camera.position.y += Math.sin(T * 1.3 + 1) * 0.015;
  camera.lookAt(camL); if (yaw) camera.rotateOnWorldAxis(Y, yaw);
  sun.target.position.copy(camL); sun.position.copy(camL).add(new THREE.Vector3(9, 19, 11));
  seaTex.offset.set(T * 0.012, T * 0.006);
  for (const s of sprites) if (s.m.visible) s.m.rotation.set(0, Math.atan2(camera.position.x - s.m.position.x, camera.position.z - s.m.position.z), s.roll);
  renderer.render(scene, camera);

  const g = pg; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const gl = renderer.domElement, cw = W * SC, chh = H * SC;
  if (blur > 0.02) {
    const N = 14;
    for (let i = 0; i < N; i++) { g.globalAlpha = 1 / (i + 1); const dx = (i / (N - 1) - 0.5) * blur * cw * 0.55; g.drawImage(gl, -cw * 0.3 + dx, 0, cw * 1.6, chh); }
    g.globalAlpha = 1;
  } else g.drawImage(gl, 0, 0);
  g.setTransform(SC, 0, 0, SC, 0, 0);
  if (gradeSpec) { const [op, col, a] = GR[gradeSpec.name]; g.globalCompositeOperation = op; g.globalAlpha = a * gradeSpec.amt; g.fillStyle = col; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
  const spot = gradeSpec?.name === 'spot';
  const vg = g.createRadialGradient(W / 2, H * 0.5, spot ? 300 : 700, W / 2, H * 0.5, spot ? 1000 : 1250);
  vg.addColorStop(0, 'rgba(8,10,40,0)'); vg.addColorStop(1, `rgba(8,10,40,${spot ? 0.82 : 0.3})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  if (card && blur < 0.15) {
    g.save(); g.translate(540, 430); g.scale(card.k, card.k); g.font = '900 92px Archivo'; const w = g.measureText(card.text).width + 110, h = 172;
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -w / 2 + 6, -h / 2 + 12, w, h, 42); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 42); g.fillStyle = '#fffdf5'; g.fill(); g.lineWidth = 12; g.strokeStyle = '#161616'; g.stroke();
    g.fillStyle = card.col || '#161616'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(card.text, 0, 8); g.restore();
  }
  if (sh.tin === 'fade' && fi < FD) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - (fi + 1) / (FD + 1); g.drawImage(frozen, 0, 0); g.globalAlpha = 1; }

  og.setTransform(1, 0, 0, 1, 0, 0); og.drawImage(pre, 0, 0); og.setTransform(SC, 0, 0, SC, 0, 0);
  const cp = caps.find((c) => T >= c.s && T < c.e);
  if (cp) {
    const s = 0.84 + 0.16 * pop((T - cp.s) / 0.12);
    og.save(); og.translate(540, capTop ? 330 : 1300); og.scale(s, s); og.font = '900 88px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
    og.strokeStyle = '#000'; og.lineWidth = 20; og.strokeText(cp.text, 0, 7); og.strokeText(cp.text, 0, 0); og.fillStyle = '#fff'; og.fillText(cp.text, 0, 0); og.restore();
  }
}

window.renderFrame = (f) => { frame(f); return out.toDataURL('image/jpeg', 0.94); };
window.INFO = { frames: FRAMES, fps: FPS, shots: shots.map((s) => ({ id: s.id, start: s.start, end: s.end, tin: s.tin })) };
window.READY = true;
