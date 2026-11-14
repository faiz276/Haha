// Reusable engine: renderer, cutout sprites, characters, camera, transitions, cards, grading, captions.
// A story file (story.js) builds the set, declares the cast, writes one shot function per sentence
// and calls start(). Nothing in this file is topic-specific.
import * as THREE from 'three';
import { rnd, rr, drawChar, drawCloud } from './art.js';

export { THREE };
const SC = parseFloat(new URLSearchParams(location.search).get('s') || '1');
export const W = 1080, H = 1920, FPS = 30;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const eio = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const eo = (u) => 1 - Math.pow(1 - clamp(u), 3);
// overshoot ease for anything that "pops" in (cards, tags, characters)
export const pop = (u) => { u = clamp(u); const c1 = 1.70158, c3 = c1 + 1; return u <= 0 ? 0 : 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
export const mix = (a, b, u) => a.map((v, i) => lerp(v, b[i], clamp(u)));

// ---------- renderer / scene ----------
const out = document.getElementById('out'); out.width = W * SC; out.height = H * SC;
const og = out.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W * SC; c.height = H * SC; return c; };
const pre = mk(), pg = pre.getContext('2d'), frozen = mk(), fg = frozen.getContext('2d');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W * SC, H * SC, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfeaff, 90, 330);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.3, 1200);

scene.add(new THREE.HemisphereLight(0xffffff, 0xe6d3a3, 1.95));
const sun = new THREE.DirectionalLight(0xfff3dd, 1.7);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 80 });
scene.add(sun, sun.target);

export const L = (c) => new THREE.MeshLambertMaterial({ color: c });
export const add = (geo, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
export const box = (w, h, d, c, x, y, z, p) => add(new THREE.BoxGeometry(w, h, d), L(c), x, y, z, p);
export const canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

{
  const sky = canvasTex(8, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2a78d6'); gr.addColorStop(0.3, '#4f9fe8'); gr.addColorStop(0.5, '#cfeaff'); gr.addColorStop(1, '#cfeaff'); g.fillStyle = gr; g.fillRect(0, 0, 8, 512); });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 24, 24), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false })));
}

// ---------- sprites: canvas-drawn cutouts that always face the camera ----------
const sprites = [];
export class Sprite {
  // cw/ch: canvas pixels, w/h: world units. The sprite's origin is its bottom centre.
  constructor(cw, ch, w, h, opt = {}) {
    this.c = document.createElement('canvas'); this.c.width = cw; this.c.height = ch; this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
    this.m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.02, depthWrite: false, side: THREE.DoubleSide, fog: opt.fog ?? true, blending: opt.add ? THREE.AdditiveBlending : THREE.NormalBlending }));
    if (opt.shadow !== false) { this.m.castShadow = true; this.m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: 0.5 }); }
    this.fixed = !!opt.fixed; this.roll = 0; this.m.visible = false; scene.add(this.m); if (!this.fixed) sprites.push(this);
    if (opt.draw) this.draw(opt.draw);
  }
  // Every sprite is hidden at the start of each frame; calling put() shows it for this frame.
  put(x, y, z, s = 1, roll = 0) { this.m.visible = true; this.m.position.set(x, y, z); this.m.scale.set(s, s, s); this.roll = roll; return this; }
  draw(fn) { this.g.clearRect(0, 0, this.c.width, this.c.height); fn(this.g); this.tex.needsUpdate = true; return this; }
}
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * Math.PI * 2 + 0.3, s = new Sprite(512, 256, 150, 75, { shadow: false, fixed: true, fog: false, draw: (g) => drawCloud(g, i * 11) });
  s.m.position.set(Math.cos(a) * 420, 60 + rnd(i) * 90, Math.sin(a) * 420); s.m.lookAt(0, 40, 0); s.m.visible = true;
}

// ---------- per-frame director state (reset before every shot function call) ----------
let cur = null, card = null, gradeSpec = null, capTop = false;
const camP = new THREE.Vector3(), camL = new THREE.Vector3();
// camera position (px,py,pz) and look-at point (lx,ly,lz)
export const cam = (px, py, pz, lx, ly, lz) => { camP.set(px, py, pz); camL.set(lx, ly, lz); };
// big counter/label card in the upper third; t0 = seconds into the shot when it pops in
export const setCard = (text, t0 = 0, col) => { const k = pop((cur.t - t0) / 0.28); if (k > 0) card = { text, k, col }; };
// colour mood for this shot: 'sunset' | 'cool' | 'morning' | 'sepia' | 'spot'
export const grade = (name, amt = 1) => { gradeSpec = { name, amt }; };
// move captions to the top for a shot whose action sits low in the frame
export const captionsTop = () => { capTop = true; };

let chars = [];
export function makeCast(specs) { chars = specs.map((sp) => ({ sp, s: new Sprite(400, 600, 2, 3) })); return chars; }
// Place cast member i at (x, z) for this frame. A character is 2 wide and 3 tall in world units.
export function A(i, x, z, st = {}) {
  const ch = chars[i], T = cur.T;
  if (!ch) throw new Error(`A(${i}): no such cast member (cast has ${chars.length})`);
  const blink = ((T + rnd(i) * 4) % (2.4 + rnd(i + 9) * 1.6)) < 0.11;
  const s = { expr: 'neutral', aL: 0.25, aR: 0.25, y: 0, scale: 1, blink, ...st };
  if (s.scale <= 0.01) return;
  s.squash = (s.squash || 0) + Math.sin(T * 2.4 + i) * 0.012;   // idle breathing: nothing is ever fully still
  ch.s.draw((g) => drawChar(g, ch.sp, s));
  ch.s.put(x, -0.17 * s.scale + s.y, z, s.scale);
}

const GR = { sunset: ['multiply', 'rgb(255,172,118)', 0.62], cool: ['multiply', 'rgb(150,175,228)', 0.6], morning: ['soft-light', 'rgb(255,214,150)', 0.6], sepia: ['multiply', 'rgb(244,214,160)', 0.6], spot: ['multiply', 'rgb(120,130,170)', 0] };
const WF = 5, FD = 8, Y = new THREE.Vector3(0, 1, 0);   // whip-pan half length and cross-fade length, in frames

// shots: { sentenceId: (c) => {...} } with c = { T: video time, t: seconds into shot, d: shot length, u: t/d }
// transitions: { sentenceId: 'whip' | 'fade' | 'cont' } for how that shot is ENTERED (default 'whip')
// reset(): called before each frame to hide non-sprite objects; perFrame(T): continuous animation (water, etc.)
export async function start({ shots: S, transitions: TIN = {}, reset = () => {}, perFrame = () => {} }) {
  const timing = await (await fetch('/build/timings.json')).json();
  const sents = timing.sentences;
  const missing = sents.filter((s) => typeof S[s.id] !== 'function').map((s) => s.id);
  if (missing.length) throw new Error(`No shot function for sentence id(s): ${missing.join(', ')}`);
  const shots = sents.map((s, i) => ({ id: s.id, fn: S[s.id], start: i ? s.start - 0.12 : 0, tin: i ? (TIN[s.id] || 'whip') : 'cont', dir: i % 2 ? 1 : -1 }));
  shots.forEach((s, i) => { s.end = shots[i + 1] ? shots[i + 1].start : timing.duration; });
  const FRAMES = Math.ceil(timing.duration * FPS);

  // captions: 1-2 words (max ~12 characters), broken at punctuation, timed to the spoken words
  const caps = [];
  for (const s of sents) {
    let g = []; const flush = () => { if (g.length) { caps.push({ text: g.map((w) => w.w).join(' '), s: g[0].s, e: g[g.length - 1].e }); g = []; } };
    for (const w of s.words) { const len = g.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length; if (g.length >= 2 || (g.length && len > 12)) flush(); g.push(w); if (/[,.?!]$/.test(w.w)) flush(); }
    flush();
  }
  caps.forEach((c, i) => { const n = caps[i + 1]; c.e = n && n.s - c.e < 0.4 ? n.s : c.e + 0.25; });

  await Promise.all([document.fonts.load('900 80px Nunito'), document.fonts.load('900 80px Archivo')]);
  let lastK = -1;

  function frame(f) {
    const T = f / FPS;
    let k = shots.findIndex((s) => T >= s.start && T < s.end); if (k < 0) k = shots.length - 1;
    const sh = shots[k], t = T - sh.start, d = sh.end - sh.start;
    if (k !== lastK) { fg.drawImage(pre, 0, 0); lastK = k; }      // last frame of previous shot, for cross-fades
    sprites.forEach((s) => { s.m.visible = false; }); card = null; gradeSpec = null; capTop = false; reset();
    cur = { T, t, d, u: clamp(t / d) };
    sh.fn(cur);

    const fi = Math.round(t * FPS), nfr = Math.round(d * FPS), nxt = shots[k + 1];
    let yaw = 0, blur = 0;
    if (sh.tin === 'whip' && fi < WF) { const e = Math.pow(1 - fi / WF, 2); yaw = -e * 0.75 * sh.dir; blur = e; }
    if (nxt && nxt.tin === 'whip' && fi >= nfr - WF) { const e = Math.pow((fi - (nfr - WF) + 1) / WF, 2); yaw = e * 0.75 * nxt.dir; blur = e; }
    camera.position.copy(camP); camera.position.x += Math.sin(T * 0.9) * 0.02; camera.position.y += Math.sin(T * 1.3 + 1) * 0.015;
    camera.lookAt(camL); if (yaw) camera.rotateOnWorldAxis(Y, yaw);
    sun.target.position.copy(camL); sun.position.copy(camL).add(new THREE.Vector3(9, 19, 11));
    perFrame(T);
    for (const s of sprites) if (s.m.visible) s.m.rotation.set(0, Math.atan2(camera.position.x - s.m.position.x, camera.position.z - s.m.position.z), s.roll);
    renderer.render(scene, camera);

    const g = pg; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const gl = renderer.domElement, cw = W * SC, chh = H * SC;
    if (blur > 0.02) {
      const N = 14;   // horizontal motion blur for the whip-pan
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

    // captions go on last so they stay sharp through blur and fades
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
}
