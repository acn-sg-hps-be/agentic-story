/**
 * gen-placeholders.mjs — generate labelled SVG placeholder media for scenarios
 * whose media paths end in .svg. Reads each scenario.json, collects every media
 * slot, and writes a tasteful colour-card SVG so no popup is blank out of the
 * box. Replace any file with a real screenshot/video of the same name.
 *
 *   node scripts/gen-placeholders.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';

const ROOT = 'public/scenarios';
const SCENARIOS = ['email', 'whatsapp'];

const collectMedia = (s) => {
  const out = [];
  (s.inputs ?? []).forEach((n) => n.media && out.push(n.media));
  (s.outputs ?? []).forEach((n) => n.media && out.push(n.media));
  (s.stations ?? []).forEach((st) => {
    st.media && out.push(st.media);
    (st.agents ?? []).forEach((a) => a.media && out.push(a.media));
  });
  return out;
};

const card = (label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#241146"/><stop offset="1" stop-color="#0b0618"/>
  </linearGradient></defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <rect x="10" y="10" width="620" height="340" rx="16" fill="none" stroke="#22e0ff" stroke-opacity="0.5" stroke-width="2"/>
  <g transform="translate(320 150)" fill="none" stroke="#22e0ff" stroke-width="4" stroke-linejoin="round">
    <rect x="-48" y="-34" width="96" height="72" rx="8"/><circle cx="-20" cy="-6" r="9" fill="#22e0ff" stroke="none"/>
    <path d="M-40 34 L-6 2 L14 20 L30 6 L44 34 Z" fill="#22e0ff" stroke="none" opacity="0.55"/>
  </g>
  <text x="320" y="250" fill="#e9e0ff" font-family="system-ui,sans-serif" font-size="24" font-weight="700" text-anchor="middle">${label}</text>
  <text x="320" y="284" fill="#a99bd4" font-family="system-ui,sans-serif" font-size="14" text-anchor="middle">placeholder — drop a real screenshot / video of the same name</text>
</svg>`;

let count = 0;
for (const id of SCENARIOS) {
  const dir = join(ROOT, id);
  const scenario = JSON.parse(readFileSync(join(dir, 'scenario.json'), 'utf8'));
  for (const rel of collectMedia(scenario)) {
    if (!rel.endsWith('.svg')) continue;
    const file = join(dir, rel);
    mkdirSync(dirname(file), { recursive: true });
    const label = basename(rel, '.svg').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    writeFileSync(file, card(label));
    count++;
  }
}
console.log(`Wrote ${count} placeholder media files.`);
