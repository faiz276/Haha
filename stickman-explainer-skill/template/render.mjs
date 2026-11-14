// Renders the short frame by frame in headless Chrome and pipes JPEG frames to ffmpeg.
// node render.mjs [--scale 1] [--from 0] [--to N] [--out build/video.mp4] [--stills 1.2,5.5] [--sheet]
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : (process.argv[i + 1] ?? true); };
const scale = parseFloat(arg('scale', '1'));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };

const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const chrome = [process.env.CHROME, '/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => p && fs.existsSync(p));
if (!chrome) { console.error('Chrome not found: set CHROME=/path/to/chrome'); process.exit(1); }
const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 0,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => { console.error('PAGE ERROR', e.message); process.exit(1); });
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://localhost:${server.address().port}/web/index.html?s=${scale}`);
await page.waitForFunction('window.READY === true', { timeout: 60000 });
const info = await page.evaluate(() => window.INFO);
fs.mkdirSync(path.join(ROOT, 'build/stills'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'build/events.json'), JSON.stringify(info, null, 1));
const grab = async (f) => Buffer.from((await page.evaluate((n) => window.renderFrame(n), f)).split(',')[1], 'base64');

if (arg('stills') || arg('sheet')) {
  // --sheet: one frame from the middle (60%) of every shot
  const times = arg('sheet') ? info.shots.map((s) => [s.id, s.start + (s.end - s.start) * 0.6]) : String(arg('stills')).split(',').map((t) => [t, parseFloat(t)]);
  let i = 0;
  for (const [name, t] of times) fs.writeFileSync(path.join(ROOT, `build/stills/${String(i++).padStart(2, '0')}_${name}.jpg`), await grab(Math.round(t * info.fps)));
  console.log('stills', times.length);
} else {
  const from = parseInt(arg('from', '0'), 10), to = Math.min(info.frames, parseInt(arg('to', String(info.frames)), 10));
  const outFile = path.join(ROOT, arg('out', 'build/video.mp4'));
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  if (from > 0) await grab(from - 1);        // primes the cross-fade snapshot
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    if (!ff.stdin.write(await grab(f))) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - from) % 150 === 149) console.log(`frame ${f + 1}/${to}  ${((Date.now() - t0) / (f - from + 1)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log('wrote', outFile, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close(); server.close();
