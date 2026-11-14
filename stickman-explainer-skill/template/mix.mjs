// Mixes narration + music + spot effects (audio.json) and muxes them onto the rendered picture.
// node mix.mjs [--out out/video.mp4]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const A = (f) => { const p = path.join(ROOT, 'assets/audio', f); if (!fs.existsSync(p)) throw new Error(`missing audio file assets/audio/${f}`); return p; };
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio.json')));
const { shots } = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/events.json')));
const dur = shots[shots.length - 1].end;

const fx = [];   // [file, time, volume]
if (cfg.whipSwish) shots.forEach((s, i) => { if (s.tin === 'whip') fx.push([`swish-${[7, 9, 8][i % 3]}.wav`, s.start - 0.12, cfg.whipSwish.volume ?? 0.55]); });
for (const c of cfg.cues || []) {
  const s = shots.find((x) => x.id === c.shot);
  if (!s) throw new Error(`audio.json cue refers to unknown shot "${c.shot}"`);
  fx.push([c.file, s.start + (s.end - s.start) * (c.u || 0) + (c.offset || 0), c.vol ?? 0.5]);
}

const args = ['-v', 'error', '-y', '-i', path.join(ROOT, 'build/video.mp4'), '-i', path.join(ROOT, 'build/narration.wav')];
const parts = ['[1:a]aresample=48000,loudnorm=I=-15:TP=-2:LRA=7,aformat=channel_layouts=stereo[vo]'];
const mixIn = ['[vo]'];
let n = 2;
if (cfg.music) {
  args.push('-stream_loop', '-1', '-i', A(cfg.music.file));
  parts.push(`[${n}:a]aresample=48000,atrim=0:${dur.toFixed(2)},volume=${cfg.music.volume ?? 0.11},afade=t=in:d=0.6,afade=t=out:st=${(dur - 1.6).toFixed(2)}:d=1.6[bg]`);
  mixIn.push('[bg]'); n++;
}
fx.forEach(([f, t, v], i) => {
  args.push('-i', A(f));
  parts.push(`[${n + i}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${v},adelay=${Math.max(0, Math.round(t * 1000))}:all=1[f${i}]`);
  mixIn.push(`[f${i}]`);
});
// limiter + 2 dB of headroom keeps the true peak under -1 dBFS at about -15 LUFS
parts.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0:duration=longest,alimiter=limit=0.8,volume=-2dB,atrim=0:${dur.toFixed(2)}[a]`);
const out = path.join(ROOT, arg('out', 'out/video.mp4'));
fs.mkdirSync(path.dirname(out), { recursive: true });
args.push('-filter_complex', parts.join(';'), '-map', '0:v:0', '-map', '[a]', '-dn', '-write_tmcd', '0', '-map_chapters', '-1', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log('wrote', out, `(${dur.toFixed(1)}s, ${fx.length} effects)`);
