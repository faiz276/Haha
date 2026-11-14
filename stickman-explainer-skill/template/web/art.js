// Canvas-drawn cutout art: characters, props, signs.
export const TAU = Math.PI * 2;
const K = '#161616';
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

export function drawShell(g, x, y, r, rot = 0, col = '#ffd8bf') {
  g.save(); g.translate(x, y); g.rotate(rot); g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, r * 0.8); g.lineTo(-r * 0.35, r * 0.55);
  g.bezierCurveTo(-r * 1.25, r * 0.2, -r * 1.05, -r * 0.95, 0, -r * 0.95);
  g.bezierCurveTo(r * 1.05, -r * 0.95, r * 1.25, r * 0.2, r * 0.35, r * 0.55); g.closePath();
  g.fillStyle = col; g.fill(); g.lineWidth = Math.max(1.5, r * 0.16); g.strokeStyle = K; g.stroke();
  g.strokeStyle = '#e08f6e'; g.lineWidth = Math.max(1, r * 0.09);
  for (const a of [-0.75, -0.38, 0, 0.38, 0.75]) { g.beginPath(); g.moveTo(0, r * 0.5); g.lineTo(Math.sin(a) * r * 0.82, -Math.cos(a) * r * 0.72); g.stroke(); }
  g.restore();
}

export function drawFish(g, x, y, s, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineWidth = 7; g.strokeStyle = K; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-48, 0); g.lineTo(-88, -30); g.lineTo(-76, 0); g.lineTo(-88, 30); g.closePath(); g.fillStyle = '#3f8fc0'; g.fill(); g.stroke();
  const body = () => { g.beginPath(); g.ellipse(0, 0, 62, 32, 0, 0, TAU); };
  body(); g.fillStyle = '#62b6e6'; g.fill();
  g.save(); body(); g.clip(); g.fillStyle = '#d9f1ff'; g.beginPath(); g.ellipse(4, 28, 62, 20, 0, 0, TAU); g.fill(); g.restore();
  body(); g.stroke();
  g.beginPath(); g.moveTo(-6, -6); g.quadraticCurveTo(-26, 8, -6, 14); g.lineWidth = 5; g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(34, -8, 10, 0, TAU); g.fill(); g.lineWidth = 4; g.stroke();
  g.fillStyle = K; g.beginPath(); g.arc(36, -8, 4.5, 0, TAU); g.fill();
  g.restore();
}

export function drawSack(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 8; g.strokeStyle = K; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-22, -58); g.lineTo(-34, -88); g.lineTo(-10, -78); g.lineTo(2, -92); g.lineTo(14, -78); g.lineTo(36, -86); g.lineTo(22, -58); g.closePath();
  g.fillStyle = '#b98d55'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-22, -58); g.bezierCurveTo(-90, -30, -88, 62, -40, 66); g.lineTo(40, 66); g.bezierCurveTo(88, 62, 90, -30, 22, -58); g.closePath();
  g.fillStyle = '#d6ad72'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-24, -56); g.quadraticCurveTo(0, -46, 24, -56); g.strokeStyle = '#7a4a1e'; g.lineWidth = 9; g.stroke();
  drawShell(g, 0, 12, 26);
  g.restore();
}

export function drawJar(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  rr(g, -46, -56, 92, 118, 22); g.fillStyle = 'rgba(214,238,250,0.92)'; g.fill();
  g.save(); rr(g, -46, -56, 92, 118, 22); g.clip();
  for (let i = 0; i < 9; i++) drawShell(g, -28 + (i % 3) * 28 + (rnd(i) - 0.5) * 8, 44 - Math.floor(i / 3) * 24, 15, rnd(i + 3) - 0.5);
  g.restore();
  rr(g, -46, -56, 92, 118, 22); g.lineWidth = 8; g.strokeStyle = K; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-31, -36); g.lineTo(-31, -4); g.stroke();
  rr(g, -40, -80, 80, 26, 8); g.fillStyle = '#a8733c'; g.fill(); g.strokeStyle = K; g.lineWidth = 8; g.stroke();
  g.restore();
}

export function drawPlate(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.ellipse(0, 14, 78, 20, 0, 0, TAU); g.fillStyle = '#fafafa'; g.fill(); g.lineWidth = 8; g.strokeStyle = K; g.stroke();
  g.beginPath(); g.ellipse(0, 12, 52, 11, 0, 0, TAU); g.strokeStyle = '#d5d5d5'; g.lineWidth = 4; g.stroke();
  drawFish(g, 4, -8, 0.5);
  g.restore();
}

const HOLD = { sack: [74, 412], fish: [62, 428], jar: [50, 412], plate: [72, 440] };

// 400x600 canvas, feet at y=566
export function drawChar(g, sp, st) {
  g.save();
  const sq = st.squash || 0;
  g.translate(200, 566); g.rotate(st.tilt || 0); g.scale(1 + sq, 1 - sq); g.translate(-200, -566);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const sgn of [-1, 1]) {
    const hx = 200 + sgn * 22, hy = 492; let fx = hx, fy = 562;
    if (st.run != null) { const ph = st.run + (sgn > 0 ? Math.PI : 0); fx = hx + Math.sin(ph) * 36; fy = 562 - Math.max(0, Math.cos(ph)) * 22; }
    g.strokeStyle = K; g.lineWidth = 9; g.beginPath(); g.moveTo(hx, hy); g.lineTo(fx, fy); g.stroke();
    g.fillStyle = K; g.beginPath(); g.ellipse(fx + sgn * 5, fy + 2, 15, 7, 0, 0, TAU); g.fill();
  }
  const body = () => { g.beginPath(); g.ellipse(200, 400, 66, 108, 0, 0, TAU); };
  body(); g.fillStyle = sp.shirt; g.fill();
  if (sp.stripe) { g.save(); body(); g.clip(); g.fillStyle = sp.stripe; for (let y = 300; y < 520; y += 34) g.fillRect(120, y, 160, 16); g.restore(); }
  if (sp.apron) { g.save(); body(); g.clip(); g.fillStyle = sp.apron; g.fillRect(152, 372, 96, 150); g.restore(); }
  body(); g.lineWidth = 9; g.strokeStyle = K; g.stroke();

  const sh = [[146, 350], [254, 350]]; let hands;
  if (st.hold) { const [hw, hy] = HOLD[st.hold.type]; const w = hw * (st.hold.s || 1); hands = [[200 - w, hy], [200 + w, hy]]; }
  else { const L = 104; hands = [[146 - Math.sin(st.aL) * L, 350 + Math.cos(st.aL) * L], [254 + Math.sin(st.aR) * L, 350 + Math.cos(st.aR) * L]]; }
  g.strokeStyle = K; g.lineWidth = 9;
  sh.forEach((s, i) => { g.beginPath(); g.moveTo(s[0], s[1]); g.quadraticCurveTo((s[0] + hands[i][0]) / 2 + (i ? 12 : -12), (s[1] + hands[i][1]) / 2 + 10, hands[i][0], hands[i][1]); g.stroke(); });
  if (st.hold) {
    const h = st.hold, s = h.s || 1;
    if (h.type === 'sack') drawSack(g, 200, 400, s); else if (h.type === 'fish') drawFish(g, 200, 424, 0.95 * s);
    else if (h.type === 'jar') drawJar(g, 200, 410, s); else drawPlate(g, 200, 430, s);
  }
  hands.forEach((h) => { g.beginPath(); g.arc(h[0], h[1], 14, 0, TAU); g.fillStyle = sp.skin; g.fill(); g.lineWidth = 6; g.strokeStyle = K; g.stroke(); });

  const hx = 200, hy = 208;
  const head = () => { g.beginPath(); g.arc(hx, hy, 96, 0, TAU); };
  if (sp.hat === 'feathers') {
    const cols = ['#e63946', '#f4a261', '#2a9d8f', '#f4a261', '#e63946'];
    for (let i = 0; i < 5; i++) {
      g.save(); g.translate(hx, hy - 58); g.rotate((i - 2) * 0.36);
      g.beginPath(); g.ellipse(0, -84, 20, 54, 0, 0, TAU); g.fillStyle = cols[i]; g.fill(); g.lineWidth = 7; g.strokeStyle = K; g.stroke();
      g.beginPath(); g.moveTo(0, -128); g.lineTo(0, -44); g.lineWidth = 4; g.stroke(); g.restore();
    }
  }
  if (sp.hat === 'bun' || sp.hat === 'hairbun') { g.beginPath(); g.arc(hx, hy - 106, 40, 0, TAU); g.fillStyle = sp.hair; g.fill(); g.lineWidth = 9; g.strokeStyle = K; g.stroke(); }
  head(); g.fillStyle = sp.skin; g.fill();
  g.save(); head(); g.clip(); g.strokeStyle = K; g.lineWidth = 7;
  if (['hair', 'hairbun', 'bun', 'flower'].includes(sp.hat)) { g.fillStyle = sp.hair; g.beginPath(); g.ellipse(hx, hy - 80, 114, 74, 0, 0, TAU); g.fill(); g.stroke(); }
  if (sp.hat === 'bandana') {
    g.fillStyle = sp.hatc; g.fillRect(90, 100, 220, 82); g.fillStyle = '#fff';
    for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(112 + (i % 7) * 30 + (i > 6 ? 15 : 0), 128 + (i > 6 ? 28 : 0), 6, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(90, 182); g.lineTo(310, 182); g.stroke();
  }
  if (sp.hat === 'feathers') {
    g.fillStyle = '#7a4a1e'; g.fillRect(90, 128, 220, 34); g.strokeRect(90, 128, 220, 34); g.fillStyle = '#ffd166';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(118 + i * 33, 145, 7, 0, TAU); g.fill(); }
  }
  if (sp.hat === 'cap') { g.fillStyle = sp.hatc; g.fillRect(90, 100, 220, 72); g.beginPath(); g.moveTo(90, 172); g.lineTo(310, 172); g.stroke(); }
  g.restore();
  head(); g.lineWidth = 9; g.strokeStyle = K; g.stroke();
  if (sp.hat === 'straw') {
    g.lineWidth = 8;
    g.beginPath(); g.ellipse(hx, hy - 60, 142, 25, 0, 0, TAU); g.fillStyle = '#e8b93f'; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(hx, hy - 64, 84, 66, 0, Math.PI, TAU); g.closePath(); g.fillStyle = '#f3cf63'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(hx - 82, hy - 76); g.quadraticCurveTo(hx, hy - 62, hx + 82, hy - 76); g.strokeStyle = '#c0392b'; g.lineWidth = 12; g.stroke(); g.strokeStyle = K;
  }
  if (sp.hat === 'cap') { g.beginPath(); g.ellipse(hx + 74, hy - 40, 62, 14, 0.08, 0, TAU); g.fillStyle = sp.hatc; g.fill(); g.lineWidth = 8; g.stroke(); }
  if (sp.hat === 'bandana') { g.beginPath(); g.moveTo(292, 150); g.lineTo(340, 122); g.lineTo(336, 168); g.closePath(); g.fillStyle = sp.hatc; g.fill(); g.lineWidth = 7; g.stroke(); }
  if (sp.hat === 'flower') {
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(124 + Math.cos(i * TAU / 5) * 17, 138 + Math.sin(i * TAU / 5) * 17, 13, 0, TAU); g.fillStyle = '#ff7eb6'; g.fill(); g.lineWidth = 5; g.stroke(); }
    g.beginPath(); g.arc(124, 138, 10, 0, TAU); g.fillStyle = '#ffd166'; g.fill(); g.stroke();
  }

  const lx = (st.look?.[0] || 0) * 10, ly = (st.look?.[1] || 0) * 8, fx = hx + lx, fy = hy + 14 + ly, e = st.expr;
  g.strokeStyle = K; g.fillStyle = K;
  const eyes = (fn) => { fn(fx - 36, 1); fn(fx + 36, -1); };
  if (['happy', 'smug', 'awe', 'smile'].includes(e)) { g.fillStyle = 'rgba(255,110,110,.32)'; eyes((x, s) => { g.beginPath(); g.ellipse(x - s * 22, fy + 30, 17, 10, 0, 0, TAU); g.fill(); }); g.fillStyle = K; }
  if (st.blink && e !== 'happy') { g.lineWidth = 7; eyes((x) => { g.beginPath(); g.moveTo(x - 12, fy); g.lineTo(x + 12, fy); g.stroke(); }); }
  else if (e === 'happy') { g.lineWidth = 8; eyes((x) => { g.beginPath(); g.arc(x, fy + 8, 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }); }
  else if (e === 'shock' || e === 'awe') {
    eyes((x) => {
      g.beginPath(); g.arc(x, fy - 4, 25, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 7; g.stroke();
      g.fillStyle = K; g.beginPath(); g.arc(x + lx * 0.6, fy - 4 + ly * 0.6, e === 'awe' ? 13 : 9, 0, TAU); g.fill();
      if (e === 'awe') { g.fillStyle = '#fff'; g.beginPath(); g.arc(x + lx * 0.6 - 4, fy - 9 + ly * 0.6, 4.5, 0, TAU); g.fill(); g.fillStyle = K; }
    });
  } else if (e === 'flat' || e === 'smug') {
    g.lineWidth = 7; eyes((x) => { g.beginPath(); g.moveTo(x - 17, fy - 4); g.lineTo(x + 17, fy - 4); g.stroke(); g.beginPath(); g.arc(x + (e === 'smug' ? 5 : 0), fy - 3, 8, 0, Math.PI); g.fill(); });
  } else eyes((x) => { g.beginPath(); g.arc(x, fy, 8.5, 0, TAU); g.fill(); });
  g.lineWidth = 7;
  if (e === 'sad') eyes((x, s) => { g.beginPath(); g.moveTo(x - 16 * s, fy - 22); g.lineTo(x + 16 * s, fy - 34); g.stroke(); });
  if (e === 'angry') eyes((x, s) => { g.beginPath(); g.moveTo(x - 16 * s, fy - 34); g.lineTo(x + 16 * s, fy - 20); g.stroke(); });
  if (sp.glasses) { g.lineWidth = 5; eyes((x) => { g.beginPath(); g.arc(x, fy - 2, 27, 0, TAU); g.stroke(); }); g.beginPath(); g.moveTo(fx - 9, fy - 2); g.lineTo(fx + 9, fy - 2); g.stroke(); }
  const my = fy + 46; g.lineWidth = 7;
  if (e === 'happy' || e === 'awe') {
    const r = e === 'awe' ? 17 : 24;
    g.beginPath(); g.moveTo(fx - r, my - 8); g.lineTo(fx + r, my - 8); g.arc(fx, my - 8, r, 0, Math.PI); g.closePath(); g.fillStyle = '#7a1f2b'; g.fill(); g.stroke();
    g.fillStyle = '#ff8fa3'; g.beginPath(); g.ellipse(fx, my + r - 14, r * 0.5, r * 0.28, 0, 0, TAU); g.fill();
  } else if (e === 'smile') { g.beginPath(); g.arc(fx, my - 12, 18, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
  else if (e === 'shock') { g.beginPath(); g.ellipse(fx, my + 2, 12, 16, 0, 0, TAU); g.fillStyle = '#5a1620'; g.fill(); g.stroke(); }
  else if (e === 'sad' || e === 'angry') { g.beginPath(); g.arc(fx, my + 16, 16, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  else if (e === 'smug') { g.beginPath(); g.moveTo(fx - 14, my); g.quadraticCurveTo(fx + 4, my + 9, fx + 19, my - 9); g.stroke(); }
  else { g.beginPath(); g.moveTo(fx - 10, my); g.lineTo(fx + 10, my); g.stroke(); }
  if (st.tear) { g.beginPath(); g.moveTo(fx - 36, fy + 16); g.quadraticCurveTo(fx - 50, fy + 44, fx - 36, fy + 48); g.quadraticCurveTo(fx - 22, fy + 44, fx - 36, fy + 16); g.fillStyle = '#6ec6ff'; g.fill(); g.lineWidth = 4; g.stroke(); }
  g.restore();
}

// 300x240
export function drawTag(g, n, red) {
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = K;
  g.lineWidth = 6; g.beginPath(); g.moveTo(150, 236); g.quadraticCurveTo(118, 206, 150, 178); g.stroke();
  rr(g, 14, 14, 272, 164, 28); g.fillStyle = red ? '#ff4b4b' : '#fff7e0'; g.fill(); g.lineWidth = 11; g.stroke();
  const txt = String(n); g.font = '900 104px Archivo'; g.textBaseline = 'middle'; g.textAlign = 'left';
  const tw = g.measureText(txt).width, tot = tw + 14 + 70, x0 = 150 - tot / 2;
  g.fillStyle = red ? '#fff' : K; g.fillText(txt, x0, 102); drawShell(g, x0 + tw + 14 + 35, 96, 34);
}

// 640x480
export function drawBoard(g, content) {
  g.lineJoin = 'round'; g.strokeStyle = K; g.lineWidth = 10; g.fillStyle = '#8b5a2b';
  for (const x of [150, 470]) { g.fillRect(x, 380, 22, 94); g.strokeRect(x, 380, 22, 94); }
  rr(g, 20, 20, 600, 372, 26); g.fillStyle = '#a8733c'; g.fill(); g.stroke();
  rr(g, 46, 46, 548, 320, 12); g.fillStyle = '#1f4a3a'; g.fill(); g.lineWidth = 6; g.stroke();
  g.save(); content(g); g.restore();
}
export function chalk(g, txt, x, y, size, col = '#f6f6ee', align = 'center') {
  g.font = `900 ${size}px Archivo`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(txt, x, y);
}

// 360x300
export function drawCrab(g, T, clawUp, blink) {
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = K;
  g.lineWidth = 9;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(180 + s * 70, 222 + i * 4); g.quadraticCurveTo(180 + s * (122 + i * 8), 214 + i * 14, 180 + s * (120 + i * 14), 264 + i * 8); g.stroke(); }
  const claw = (s, up) => {
    const bx = 180 + s * 88, by = 196, ex = 180 + s * 132, ey = up ? 96 + Math.sin(T * 9) * 9 : 152;
    g.lineWidth = 10; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey + 26); g.stroke();
    g.beginPath(); g.ellipse(ex, ey, 34, 29, 0, 0, TAU); g.fillStyle = '#ee5236'; g.fill(); g.lineWidth = 8; g.stroke();
    g.beginPath(); g.moveTo(ex - s * 2, ey + 2); g.lineTo(ex + s * 8, ey - 28); g.lineTo(ex + s * 24, ey - 20); g.closePath(); g.fillStyle = K; g.fill();
  };
  claw(-1, false); claw(1, clawUp);
  g.lineWidth = 8;
  for (const x of [150, 210]) { g.beginPath(); g.moveTo(x, 160); g.lineTo(x + (x < 180 ? -4 : 4), 112); g.stroke(); }
  g.beginPath(); g.ellipse(180, 204, 98, 64, 0, 0, TAU); g.fillStyle = '#ee5236'; g.fill(); g.lineWidth = 9; g.stroke();
  g.beginPath(); g.arc(180, 190, 74, Math.PI * 1.2, Math.PI * 1.45); g.strokeStyle = '#ff9a85'; g.lineWidth = 8; g.stroke(); g.strokeStyle = K;
  for (const x of [146, 214]) {
    g.beginPath(); g.arc(x, 100, 23, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 7; g.stroke();
    g.beginPath(); g.arc(x, 100, 23, Math.PI, TAU); g.closePath(); g.fillStyle = '#c93a26'; g.fill(); g.stroke();
    if (blink) { g.beginPath(); g.arc(x, 100, 23, 0, Math.PI); g.closePath(); g.fill(); g.stroke(); }
    else { g.fillStyle = K; g.beginPath(); g.arc(x + 4, 108, 7.5, 0, TAU); g.fill(); }
  }
  g.lineWidth = 7; g.beginPath(); g.moveTo(162, 226); g.quadraticCurveTo(184, 238, 204, 218); g.stroke();
}

// 720x720
export function drawBoat(g, fancy) {
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = K; g.lineWidth = 10;
  g.fillStyle = '#7a4a1e'; g.fillRect(372, 70, 16, 480); g.strokeRect(372, 70, 16, 480);
  const sail = () => { g.beginPath(); g.moveTo(398, 100); g.quadraticCurveTo(600, 300, 650, 500); g.lineTo(398, 500); g.closePath(); };
  sail(); g.fillStyle = fancy ? '#ffffff' : '#f1e6c8'; g.fill();
  if (fancy) { g.save(); sail(); g.clip(); g.fillStyle = '#f5b82e'; for (let y = 130; y < 520; y += 90) g.fillRect(380, y, 300, 36); g.restore(); }
  sail(); g.stroke();
  if (fancy) {
    drawShell(g, 478, 410, 44);
    g.beginPath(); g.moveTo(372, 74); g.lineTo(290, 100); g.lineTo(372, 128); g.closePath(); g.fillStyle = '#e63946'; g.fill(); g.stroke();
  }
  const hull = () => { g.beginPath(); g.moveTo(70, 540); g.lineTo(660, 540); g.quadraticCurveTo(640, 640, 580, 660); g.lineTo(170, 660); g.quadraticCurveTo(100, 640, 70, 540); g.closePath(); };
  hull(); g.fillStyle = fancy ? '#fbfbfb' : '#b9814a'; g.fill();
  g.save(); hull(); g.clip(); g.fillStyle = fancy ? '#e63946' : '#8f5f33'; g.fillRect(60, 566, 620, 26); if (fancy) { g.fillStyle = '#1d3557'; g.fillRect(60, 620, 620, 50); } g.restore();
  hull(); g.stroke();
}

export function shellHeap(n, w, h, r, seed) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const v = rnd(i * 7 + seed) ** 1.7, u = rnd(i * 3 + seed + 1);
    const hw = (w / 2 - r) * (1 - v) ** 0.8 + r * 0.5;
    pts.push({ x: w / 2 + (u - 0.5) * 2 * hw, y: h - r - 4 - v * (h - 2.4 * r), rot: (rnd(i + seed + 5) - 0.5) * 1.6, c: rnd(i + seed + 9) });
  }
  pts.sort((a, b) => b.y - a.y);            // reveal order: bottom first
  return pts;
}
const COLS = ['#ffd8bf', '#ffe6cf', '#ffc9ae', '#fff1dd'];
export function drawHeap(g, pts, n, r) {
  const vis = pts.slice(0, n).sort((a, b) => a.y - b.y);
  for (const p of vis) drawShell(g, p.x, p.y, r, p.rot, COLS[Math.floor(p.c * 4)]);
}

export function drawStar(g, x, y, r, a) {
  g.save(); g.translate(x, y); g.globalAlpha = a; g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(0, 0, r, 0); g.quadraticCurveTo(0, 0, 0, r); g.quadraticCurveTo(0, 0, -r, 0); g.quadraticCurveTo(0, 0, 0, -r); g.fill();
  g.restore();
}

export function drawCloud(g, seed) {
  g.fillStyle = '#ffffff';
  for (let i = 0; i < 7; i++) { const x = 80 + i * 58 + rnd(seed + i) * 20, r = 44 + rnd(seed + i * 3) * 46; g.beginPath(); g.arc(x, 190 - r * 0.55, r, 0, TAU); g.fill(); }
  g.fillRect(60, 150, 400, 44); g.clearRect(0, 194, 512, 62);
}
