// Mixes narration + music + spot effects and muxes them onto the rendered picture.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const A = (f) => path.join(ROOT, 'assets/audio', f);
const { shots } = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/events.json')));
const dur = shots[shots.length - 1].end;
const at = (id, u = 0) => { const s = shots.find((x) => x.id === id); return s.start + (s.end - s.start) * u; };

const fx = [];   // [file, time, volume]
shots.forEach((s, i) => { if (s.tin === 'whip') fx.push([`swish-${[7, 9, 8][i % 3]}.wav`, s.start - 0.12, 0.55]); });
for (const u of [0, 0.34, 0.56, 0.76]) fx.push(['handleCoins2.ogg', at('hook', u), 0.5]);
for (const id of ['twenty', 'fifty', 'hundred', 'price', 'shells']) fx.push(['handleCoins.ogg', at(id) + 0.12, 0.55]);
for (let k = 0; k < 9; k += 2) fx.push(['handleCoins2.ogg', at('sacks') + 0.4 + k * 0.13, 0.4]);
fx.push(['handleCoins.ogg', at('rich'), 0.5], ['handleCoins.ogg', at('full') + 0.1, 0.6], ['handleCoins.ogg', at('made') + 0.2, 0.45]);
fx.push(['splash_06.ogg', at('fish') + 0.15, 0.45], ['splash_09.ogg', at('fish') + 0.6, 0.4], ['splash_10.ogg', at('fish') + 1.0, 0.4], ['splash_02.ogg', at('boat') + 0.1, 0.35]);
fx.push(['bubble_02.ogg', at('jar') + 0.75, 0.7]);

const args = ['-v', 'error', '-y', '-i', path.join(ROOT, 'build/video.mp4'), '-i', path.join(ROOT, 'build/narration.wav'), '-i', A('bgm-easy-lemon.mp3')];
fx.forEach(([f]) => args.push('-i', A(f)));
const parts = [
  '[1:a]aresample=48000,loudnorm=I=-15:TP=-2:LRA=7,aformat=channel_layouts=stereo[vo]',
  `[2:a]aresample=48000,atrim=0:${dur.toFixed(2)},volume=0.11,afade=t=in:d=0.6,afade=t=out:st=${(dur - 1.6).toFixed(2)}:d=1.6[bg]`,
];
fx.forEach(([, t, v], i) => parts.push(`[${i + 3}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${v},adelay=${Math.max(0, Math.round(t * 1000))}:all=1[f${i}]`));
parts.push(`[vo][bg]${fx.map((_, i) => `[f${i}]`).join('')}amix=inputs=${fx.length + 2}:normalize=0:duration=longest,alimiter=limit=0.8,atrim=0:${dur.toFixed(2)}[a]`);
const out = path.join(ROOT, 'out/island-inflation-short.mp4');
fs.mkdirSync(path.dirname(out), { recursive: true });
args.push('-filter_complex', parts.join(';'), '-map', '0:v:0', '-map', '[a]', '-dn', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log('wrote', out);
