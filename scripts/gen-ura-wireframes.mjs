/**
 * gen-ura-wireframes.mjs — the eight agent screen mockups for the `ura`
 * project's popup media slots.
 *
 * These are POPUP MEDIA (an explicitly allowed external file per CLAUDE.md
 * golden rule 2), not engine art. Nothing in src/ is touched. Run:
 *
 *     node scripts/gen-ura-wireframes.mjs
 *
 * NOTE: `gen-placeholders.mjs` overwrites every .svg media path it finds, so if
 * you ever run it for `ura` you will flatten these — just re-run this script.
 *
 * Look: a light government case-management web app — navy app bar, breadcrumb,
 * white cards on a grey page, data tables with status pills, a details drawer.
 * Agent-produced content is marked with an AGENT chip so it is never confused
 * with system-of-record data.
 *
 * Sized 940x528 to match `.af-modal` (940px) without tripping `max-height:52vh`.
 * Layout is FLOW-BASED with build-time assertions — hand-placed offsets drift.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OUT = 'public/projects/ura/scenarios/development-application/media';
const W = 940, H = 528;

/* government-app palette (light) */
const L = {
  page: '#eef1f6', card: '#ffffff', bd: '#ccd4e0', bd2: '#e4e9f0', zebra: '#f7f9fc',
  ink: '#14202f', ink2: '#3b4759', mute: '#69737f', faint: '#98a1ad',
  navy: '#0f3866', navy2: '#1c4f8a', link: '#175cc4', chipbg: '#e9eff8',
  ok: '#186b4c', okbg: '#e3f1ea', warn: '#8a5600', warnbg: '#fbeed6',
  bad: '#a3221f', badbg: '#fae8e7', ai: '#5a2b96', aibg: '#efe7fb',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const t = (x, y, s, o = {}) => {
  const a = {
    'font-size': o.size ?? 13, fill: o.fill ?? L.ink, 'font-weight': o.weight ?? 400,
    ...(o.anchor ? { 'text-anchor': o.anchor } : {}),
    ...(o.spacing ? { 'letter-spacing': o.spacing } : {}),
    ...(o.mono ? { 'font-family': 'ui-monospace, Consolas, monospace' } : {}),
    ...(o.deco ? { 'text-decoration': o.deco } : {}),
  };
  return `<text x="${x}" y="${y}" ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}>${esc(s)}</text>`;
};
const r = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 3}" fill="${o.fill ?? 'none'}"` +
  `${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1}"` : ''}` +
  `${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, col = L.bd2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="1"/>`;
/** small uppercase field label */
const lbl = (x, y, s, col) => t(x, y, s, { size: 10, fill: col ?? L.mute, weight: 700, spacing: 1.1 });
/** redaction block — stands in for real case data */
const blk = (x, y, w, h = 11, col) => r(x, y, w, h, { rx: 2, fill: col ?? '#c9d2df' });

/** greedy wrap (approximate glyph width) */
function wrap(s, maxW, size) {
  const per = size * 0.523, out = [];
  let cur = '';
  for (const word of String(s).split(' ')) {
    const test = cur ? cur + ' ' + word : word;
    if (test.length * per > maxW && cur) { out.push(cur); cur = word; } else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}
const para = (x, y, w, s, o = {}) =>
  wrap(s, w, o.size ?? 12.5).map((ln, i) =>
    t(x, y + i * (o.lh ?? 17), ln, { size: o.size ?? 12.5, fill: o.fill ?? L.ink2 })).join('');
const paraH = (s, w, o = {}) => wrap(s, w, o.size ?? 12.5).length * (o.lh ?? 17);

/** status pill, right-aligned to rx */
const pill = (rx, y, s, fg, bg) => {
  const w = String(s).length * 6.4 + 26;
  return r(rx - w, y - 11.5, w, 18, { rx: 9, fill: bg, stroke: fg + '55' }) +
    `<circle cx="${rx - w + 11}" cy="${y - 2.5}" r="3" fill="${fg}"/>` +
    t(rx - w + 19, y, s, { size: 10.5, fill: fg, weight: 700, spacing: 0.5 });
};
/** the AGENT provenance chip */
const agentChip = (x, y) =>
  r(x, y - 11, 58, 17, { rx: 3, fill: L.aibg, stroke: L.ai + '4d' }) +
  t(x + 7, y + 1.5, '◆ AGENT', { size: 9.5, fill: L.ai, weight: 800, spacing: 0.6 });
/** button */
const btn = (x, y, s, kind) => {
  const w = String(s).length * 6.6 + 26;
  const fill = kind === 'pri' ? L.navy : L.card;
  const stroke = kind === 'pri' ? L.navy : L.bd;
  const fg = kind === 'pri' ? '#ffffff' : (kind === 'ghost' ? L.mute : L.navy);
  return { svg: r(x, y, w, 28, { rx: 3, fill, stroke }) + t(x + w / 2, y + 18.5, s, { size: 12, fill: fg, weight: kind === 'pri' ? 700 : 400, anchor: 'middle' }), w };
};
const btnRow = (x, y, items) => {
  let out = '', xx = x;
  for (const [s, kind] of items) { const b = btn(xx, y, s, kind); out += b.svg; xx += b.w + 8; }
  if (xx - 8 > W - 16) throw new Error(`btnRow overflows to ${xx}`);
  return out;
};
/** white card */
const card = (x, y, w, h, title, o = {}) =>
  r(x, y, w, h, { rx: 4, fill: L.card, stroke: L.bd }) +
  (title ? line(x, y + 33, x + w, y + 33, L.bd2) + t(x + 13, y + 22, title, { size: 12.5, weight: 700, fill: L.ink }) +
    (o.right ? t(x + w - 13, y + 22, o.right, { size: 11, fill: L.mute, anchor: 'end' }) : '') : '');
/** table header */
const thead = (x, y, w, cols) =>
  r(x, y, w, 26, { rx: 0, fill: L.zebra }) + line(x, y + 26, x + w, y + 26, L.bd) +
  cols.map(([cx, s]) => lbl(x + cx, y + 17, s)).join('');

/** data row with optional second line + status pill; returns { svg, h } */
const trow = (x, y, w, main, sub, status, col, bg, i) => {
  const h = sub ? 42 : 30;
  const cols = { ok: [L.ok, L.okbg], warn: [L.warn, L.warnbg], bad: [L.bad, L.badbg], ai: [L.ai, L.aibg], n: [L.mute, L.chipbg] };
  const [fg, pbg] = cols[col] ?? cols.n;
  const svg = (i % 2 ? r(x, y, w, h, { rx: 0, fill: L.zebra }) : '') +
    t(x + 13, y + (sub ? 18 : 20), main, { size: 13, fill: L.ink }) +
    (sub ? t(x + 13, y + 34, sub, { size: 11.5, fill: L.link }) : '') +
    (status ? pill(x + w - 13, y + (sub ? 22 : 19), status, fg, pbg) : '') +
    line(x, y + h, x + w, y + h, L.bd2);
  return { svg, h };
};
const table = (x, y, w, cols, rows) => {
  let out = thead(x, y, w, cols), yy = y + 26;
  rows.forEach((rw, i) => { const o = trow(x, yy, w, ...rw, i); out += o.svg; yy += o.h; });
  return { svg: out, h: yy - y };
};

/* ---- chat drawer (flow-based, input pinned to the bottom) ---------------- */
const msg = (x, y, w, who, txt, cite) => {
  const isYou = who === 'you';
  const iw = w - 40;
  const lines = wrap(txt, iw - 24, 12.5);
  const h = 14 + lines.length * 17 + (cite ? 17 : 0) + 10;
  const bx = isYou ? x + 40 : x;
  const svg =
    `<circle cx="${isYou ? x + 26 : x + 14}" cy="${y + 14}" r="12" fill="${isYou ? L.chipbg : L.aibg}" stroke="${isYou ? L.bd : L.ai + '55'}"/>` +
    t(isYou ? x + 26 : x + 14, y + 18, isYou ? 'PO' : '◆', { size: isYou ? 9.5 : 11, fill: isYou ? L.navy : L.ai, weight: 800, anchor: 'middle' }) +
    r(bx + (isYou ? -40 + 34 : 34), y, iw - 10, h - 8, { rx: 4, fill: isYou ? L.chipbg : L.card, stroke: isYou ? L.bd : L.bd }) +
    lines.map((ln, i) => t(bx + (isYou ? 6 : 46), y + 20 + i * 17, ln, { size: 12.5, fill: L.ink2 })).join('') +
    (cite ? t(bx + (isYou ? 6 : 46), y + 22 + lines.length * 17, cite, { size: 10.5, fill: L.link }) : '');
  return { svg, h };
};
const drawer = (x, y, w, h, title, msgs, hint) => {
  const PAD = 13, INPUT = 30;
  let out = card(x, y, w, h, title, { right: 'ask' }), yy = y + 45;
  for (const m of msgs) { const o = msg(x + PAD, yy, w - PAD * 2, m.who, m.txt, m.cite); out += o.svg; yy += o.h; }
  const iy = y + h - PAD - INPUT;
  if (yy - 10 > iy - 8) throw new Error(`drawer "${title}" overflows by ${Math.ceil(yy - 10 - (iy - 8))}px`);
  return out + r(x + PAD, iy, w - PAD * 2, INPUT, { rx: 3, fill: L.card, stroke: L.bd }) +
    t(x + PAD + 10, iy + 19.5, hint, { size: 11.5, fill: L.faint }) +
    r(x + w - PAD - 34, iy + 4, 30, 22, { rx: 3, fill: L.navy }) +
    t(x + w - PAD - 19, iy + 19, '↵', { size: 12, fill: '#fff', anchor: 'middle' });
};

/* ---- app chrome --------------------------------------------------------- */
function app(screen, crumb, meta, bodyFn) {
  const AB = 40, BC = 30, top = AB + BC;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">
<rect width="${W}" height="${H}" fill="${L.page}"/>
<rect x="0" y="0" width="${W}" height="${AB}" fill="${L.navy}"/>
${r(16, 11, 18, 18, { rx: 3, fill: '#ffffff', sw: 0 })}
${t(20, 25, 'U', { size: 13, fill: L.navy, weight: 800 })}
${t(42, 25, 'URBAN REDEVELOPMENT AUTHORITY', { size: 12, fill: '#ffffff', weight: 800, spacing: 1.1 })}
${line(304, 10, 304, 30, "#ffffff44")}
${t(318, 25, "Development Control System", { size: 12.5, fill: '#c8d8ec' })}
${r(W - 150, 10, 74, 20, { rx: 3, fill: '#ffffff1f', stroke: '#ffffff3d' })}
${t(W - 113, 24, 'DAX · CX/CP', { size: 10, fill: '#dce7f4', anchor: 'middle', weight: 700 })}
<circle cx="${W - 34}" cy="20" r="13" fill="#ffffff22" stroke="#ffffff44"/>
${t(W - 34, 24, 'PO', { size: 10.5, fill: '#ffffff', weight: 800, anchor: 'middle' })}
<rect x="0" y="${AB}" width="${W}" height="${BC}" fill="${L.card}"/>
${line(0, top, W, top, L.bd)}
${t(16, AB + 20, 'Cases', { size: 12, fill: L.link })}
${t(52, AB + 20, '›', { size: 12, fill: L.faint })}
${t(64, AB + 20, crumb, { size: 12, fill: L.link })}
${t(64 + crumb.length * 6.6 + 10, AB + 20, '›', { size: 12, fill: L.faint })}
${t(64 + crumb.length * 6.6 + 22, AB + 20, screen, { size: 12, fill: L.ink, weight: 700 })}
${t(W - 16, AB + 20, meta, { size: 11, fill: L.mute, anchor: 'end' })}
${bodyFn(top)}
</svg>`;
}

/* ================================================================== A1 === */
const a1 = () => app('Intake verification', 'DA/████/25', 'ran automatically on registration · 2 min ago', (top) => {
  const y = top + 16, LX = 16, LW = 588, RX = 616, RW = 308;
  const kpi = (i, k, v, col) => {
    const x = LX + i * 198;
    return r(x, y, 188, 62, { rx: 4, fill: L.card, stroke: L.bd }) +
      lbl(x + 13, y + 21, k) + t(x + 13, y + 45, v, { size: 18, weight: 800, fill: col ?? L.ink });
  };
  const tb = table(LX, y + 106, LW, [[13, 'CHECK'], [LW - 90, 'RESULT']], [
    ['Development type', 'registration pack p.2', 'MATCHED', 'ok'],
    ['Chargeable area', 'area schedule p.4', 'MATCHED', 'ok'],
    ['Provision applied', 'fee guideline §█.█', 'DERIVED', 'ai'],
    ['Amount charged', 'invoice ████', 'READ', 'n'],
    ['Amount settled', 'receipt ████', 'SHORTFALL', 'warn'],
  ]);
  return kpi(0, 'REGISTRATION', 'Consistent', L.ok) + kpi(1, 'FEE DUE', '$ ██,███') + kpi(2, 'FEE PAID', '$ ██,███', L.warn) +
    t(LX, y + 92, 'Checks', { size: 14, weight: 700 }) + agentChip(LX + 62, y + 92) +
    tb.svg +
    btnRow(LX, y + 112 + tb.h + 14, [['Accept and release to evaluation', 'pri'], ['Draft query to QP', 'sec'], ['Override with reason', 'ghost']]) +
    card(RX, y, RW, 176, 'How it got there') +
    t(RX + 13, y + 56, 'Fee derivation', { size: 12.5, weight: 700 }) +
    para(RX + 13, y + 76, RW - 26, 'Type read as ████, area ██,███ m², rate from §█.█ of the guideline.') +
    r(RX + 13, y + 126, RW - 26, 34, { rx: 3, fill: L.warnbg, stroke: L.warn + '44' }) +
    t(RX + 24, y + 147, 'Difference arises at ████', { size: 12, fill: L.warn, weight: 700 }) +
    card(RX, y + 188, RW, 174, 'Sources the agent opened', { right: '3' }) +
    ['Registration pack · 14 pp', 'Fee guideline · §█.█ cited', 'Invoice and receipt'].map((s, i) =>
      t(RX + 13, y + 226 + i * 42, s, { size: 12.5, fill: L.link, deco: 'underline' }) +
      blk(RX + 13, y + 234 + i * 42, [190, 150, 168][i], 7, L.bd2)).join('');
});

/* ================================================================== A2 === */
const a2 = () => app('Pre-validation', 'DA/████/25', 'requirement set derived from Circular ██/20██', (top) => {
  const y = top + 16, LX = 16, LW = 570, RX = 598, RW = 326;
  const tb = table(LX, y + 30, LW, [[13, 'REQUIRED DOCUMENT'], [LW - 96, 'STATUS']], [
    ['Architectural plan set', 'A-2██ rev C', 'PRESENT', 'ok'],
    ['Federated model', '████.ifc · ██ disciplines', 'PRESENT', 'ok'],
    ['Site and survey plan', '████.pdf', 'PRESENT', 'ok'],
    ['██████ statement', 'no lodged file matches this class', 'MISSING', 'bad'],
    ['Heritage impact note', 'site is in a conservation area', 'CONDITIONAL', 'warn'],
  ]);
  return t(LX, y + 12, 'Required for this submission type', { size: 14, weight: 700 }) + agentChip(LX + 218, y + 12) +
    t(LX + 284, y + 12, 'derived, not a fixed list', { size: 11.5, fill: L.mute }) +
    tb.svg +
    btnRow(LX, y + 36 + tb.h + 14, [['Return to QP with drafted note', 'pri'], ['Waive conditional item', 'sec']]) +
    // geo panel
    card(RX, y, RW, 300, 'Geo-reference', { right: 'GIS · cadastral base' }) +
    r(RX + 13, y + 46, RW - 26, 146, { rx: 3, fill: '#fbfcfe', stroke: L.bd2 }) +
    Array.from({ length: 9 }, (_, i) => line(RX + 13 + i * 37, y + 46, RX + 13 + i * 37, y + 192, '#e9edf3')).join('') +
    Array.from({ length: 5 }, (_, i) => line(RX + 13, y + 46 + i * 36, RX + RW - 13, y + 46 + i * 36, '#e9edf3')).join('') +
    r(RX + 56, y + 74, 146, 88, { rx: 0, stroke: L.mute, sw: 1.4, dash: '5 4' }) +
    t(RX + 56, y + 68, 'REGISTERED LOT', { size: 9.5, fill: L.mute, weight: 700, spacing: 0.8 }) +
    `<g transform="rotate(4 ${RX + 150} ${y + 130})"><rect x="${RX + 76}" y="${y + 90}" width="146" height="88" fill="${L.ai}1a" stroke="${L.ai}" stroke-width="1.6"/></g>` +
    t(RX + 90, y + 186, 'MODEL FOOTPRINT', { size: 9.5, fill: L.ai, weight: 700, spacing: 0.8 }) +
    line(RX + 13, y + 204, RX + RW - 13, y + 204, L.bd2) +
    t(RX + 13, y + 226, 'Diagnosis', { size: 12.5, weight: 700 }) +
    pill(RX + RW - 13, y + 226, 'OFFSET + ROTATION', L.warn, L.warnbg) +
    para(RX + 13, y + 248, RW - 26, 'Offset █.█ m and rotation █.█° — consistent with a declared datum of ████, not the survey basis on the site plan.') +
    card(RX, y + 312, RW, 86, 'Drafted instruction to the QP') +
    para(RX + 13, y + 356, RW - 26, 'Re-declare datum and re-export. Same offset, four possible causes — this is the one that fits.', { fill: L.ok });
});

/* ================================================================== A3 === */
const a3 = () => app('Delta review', 'DA/████/25', 'rev B → rev C · resubmission 2 of 2', (top) => {
  const y = top + 16, LX = 16, LW = 570, RX = 598, RW = 326;
  const tabs = ['By prior issue', 'By artifact', 'Unrequested changes'];
  let tx = LX;
  const tabSvg = tabs.map((s, i) => {
    const w = s.length * 6.6 + 26;
    const el = r(tx, y, w, 28, { rx: 3, fill: i === 0 ? L.card : 'none', stroke: i === 0 ? L.bd : 'none' }) +
      (i === 0 ? r(tx, y, w, 2.5, { rx: 0, fill: L.navy }) : '') +
      t(tx + w / 2, y + 18.5, s, { size: 12, fill: i === 0 ? L.ink : L.mute, weight: i === 0 ? 700 : 400, anchor: 'middle' });
    tx += w + 4; return el;
  }).join('');
  const tb = table(LX, y + 36, LW, [[13, 'PRIOR ISSUE'], [LW - 108, 'THIS VERSION']], [
    ['Issue ██ · setback', 'model: wall moved · A-2██ · response ¶2', 'ADDRESSED', 'ok'],
    ['Issue ██ · attic use', 'narrative claims revision · no model change', 'CONTRADICTION', 'warn'],
    ['Issue ██ · bin point', 'no change in any artifact', 'PERSISTING', 'bad'],
    ['Issue ██ · landscape', 'response letter silent', 'NOT ANSWERED', 'bad'],
    ['██████', 'new in rev C · not raised by URA', 'NEW', 'ai'],
  ]);
  return tabSvg + tb.svg +
    t(LX, y + 42 + tb.h + 22, 'Selected — issue ██', { size: 13, weight: 700 }) +
    r(LX, y + 42 + tb.h + 32, LW / 2 - 6, 74, { rx: 4, fill: L.card, stroke: L.bd }) +
    lbl(LX + 12, y + 42 + tb.h + 52, 'REV B') +
    [0, 1].map((i) => blk(LX + 12, y + 42 + tb.h + 60 + i * 15, [240, 196][i], 8, L.bd2)).join('') +
    r(LX + LW / 2 + 6, y + 42 + tb.h + 32, LW / 2 - 6, 74, { rx: 4, fill: L.card, stroke: L.ai + '66' }) +
    lbl(LX + LW / 2 + 18, y + 42 + tb.h + 52, 'REV C · CHANGED', L.ai) +
    [0, 1].map((i) => blk(LX + LW / 2 + 18, y + 42 + tb.h + 60 + i * 15, [240, 168][i], 8, i === 0 ? L.ai + '4d' : L.bd2)).join('') +
    drawer(RX, y, RW, 398, 'Ask the agent', [
      { who: 'you', txt: 'Did they move the bin point, or re-label it?' },
      { who: 'ag', txt: 'No change in the model or drawing. The letter describes the ██████ instead.', cite: 'model delta · A-2██ · response ¶4' },
      { who: 'you', txt: 'What changed that we never asked about?' },
      { who: 'ag', txt: 'One item — ██████ on level ██.', cite: 'element ██████ · rev C only' },
    ], 'Ask about a version, issue or document');
});

/* ================================================================== A4 === */
const a4 = () => app('Routing proposal', 'DA/████/25', 'advisory · nothing sent until you send it', (top) => {
  const y = top + 16, LX = 16, LW = 570, RX = 598, RW = 326;
  const t1 = table(LX, y + 26, LW, [[13, 'INTERNAL'], [LW - 84, 'ACTION']], [
    ['██████ team · conservation elevation', 'guideline §█.█', 'REFER', 'ai'],
    ['██████ team · height and massing', 'guideline §█.█ · precedent DA/████', 'REFER', 'ai'],
  ]);
  const t2 = table(LX, y + 26 + t1.h + 26, LW, [[13, 'EXTERNAL AGENCY'], [LW - 96, 'ACTION']], [
    ['LTA · vehicular access onto ██████', 'designation + proposal type', 'REFER', 'ai'],
    ['PUB · drainage reserve adjacency', 'borderline — ██ m from reserve', 'YOUR CALL', 'warn'],
  ]);
  const y3 = y + 26 + t1.h + 26 + t2.h + 26;
  const t3 = table(LX, y3, LW, [[13, 'CONSIDERED AND NOT REFERRED'], [LW - 74, '']], [
    ['██████ team', 'designation present, condition not engaged', 'NO', 'n'],
  ]);
  return t(LX, y + 10, 'Suggested referrals', { size: 14, weight: 700 }) + agentChip(LX + 138, y + 10) +
    t1.svg + t2.svg + t3.svg +
    btnRow(LX, y3 + t3.h + 14, [['Send 3 selected referrals', 'pri'], ['Add a reviewer', 'sec']]) +
    card(RX, y, RW, 398, 'Basis for each suggestion') +
    t(RX + 13, y + 56, 'Guideline §█.█', { size: 12.5, weight: 700 }) +
    para(RX + 13, y + 76, RW - 26, 'Extract shown in full, so routing is checked against the rule rather than trusted.') +
    blk(RX + 13, y + 112, 240, 7, L.bd2) +
    line(RX + 13, y + 134, RX + RW - 13, y + 134, L.bd2) +
    t(RX + 13, y + 158, 'Comparable cases', { size: 12.5, weight: 700 }) +
    t(RX + 13, y + 178, 'DA/████ · same designation', { size: 12.5, fill: L.link, deco: 'underline' }) +
    line(RX + 13, y + 198, RX + RW - 13, y + 198, L.bd2) +
    t(RX + 13, y + 222, 'Coverage', { size: 12.5, weight: 700 }) +
    [['██ designations read', L.ink2], ['██ engaged', L.ok], ['██ ruled out', L.mute]].map(([s, c], i) =>
      t(RX + 13, y + 248 + i * 24, s, { size: 12.5, fill: c })).join('') +
    r(RX + 13, y + 330, RW - 26, 54, { rx: 3, fill: L.okbg, stroke: L.ok + '44' }) +
    para(RX + 24, y + 352, RW - 48, 'Nothing leaves URA until a person sends it.', { fill: L.ok, size: 12 });
});

/* ================================================================== A5 === */
const a5 = () => app('Site precedent', 'DA/████/25', '██ sources indexed · ██ candidates read', (top) => {
  const y = top + 16, LX = 16, LW = 570, RX = 598, RW = 326;
  const tabs = ['This site', 'Comparable proposals', 'Enforcement', 'Appeals'];
  let tx = LX;
  const tabSvg = tabs.map((s, i) => {
    const w = s.length * 6.5 + 24;
    const el = r(tx, y, w, 28, { rx: 3, fill: i === 0 ? L.card : 'none', stroke: i === 0 ? L.bd : 'none' }) +
      (i === 0 ? r(tx, y, w, 2.5, { rx: 0, fill: L.navy }) : '') +
      t(tx + w / 2, y + 18.5, s, { size: 11.5, fill: i === 0 ? L.ink : L.mute, weight: i === 0 ? 700 : 400, anchor: 'middle' });
    tx += w + 4; return el;
  }).join('');
  const rec = (yy, ref, sub, status, col, body, src) => {
    const [fg, bg] = { ok: [L.ok, L.okbg], bad: [L.bad, L.badbg], warn: [L.warn, L.warnbg], n: [L.mute, L.chipbg] }[col];
    return r(LX, yy, LW, 76, { rx: 4, fill: L.card, stroke: L.bd }) +
      t(LX + 13, yy + 24, ref, { size: 13, weight: 700, mono: true }) +
      t(LX + 13 + ref.length * 8 + 10, yy + 24, sub, { size: 11.5, fill: L.mute }) +
      pill(LX + LW - 13, yy + 22, status, fg, bg) +
      para(LX + 13, yy + 45, LW - 26, body, { size: 12 }) +
      t(LX + 13, yy + 66, src, { size: 10.5, fill: L.link });
  };
  return tabSvg +
    rec(y + 38, 'DA/████/18', 'same site', 'APPROVED WITH CONDITIONS', 'ok', 'Change of use to ██████. Grounds cited §█.█. Condition on ██████ imposed.', 'DMS · evaluation report pp.3–5') +
    rec(y + 124, 'DA/████/21', 'adjoining lot', 'REFUSED', 'bad', 'Similar massing. Refused on ██████. Not appealed.', 'DMS · decision letter p.1') +
    rec(y + 210, 'ENF/████/19', 'same site', 'NOTICE SERVED', 'warn', 'Unauthorised ██████, resolved ████.', 'DAX enforcement record') +
    rec(y + 296, 'Note ████', 'internal', 'CONTEXT', 'n', 'Departmental view recorded in correspondence, never in a case record.', 'mail thread · ██ messages') +
    btnRow(LX, y + 386, [['Attach 2 to the case', 'pri'], ['Why ranked first?', 'ghost']]) +
    drawer(RX, y, RW, 398, 'Narrow it down', [
      { who: 'you', txt: 'Conserved shophouses, refusals only.' },
      { who: 'ag', txt: 'Three refusals since ████. Two turned on ██████, one on ██████.', cite: 'DMS decision letters · DAX' },
      { who: 'you', txt: 'What condition did we impose when we approved?' },
      { who: 'ag', txt: 'In ██ of ██ approvals a condition on ██████ appears, worded consistently.', cite: '██ evaluation reports cited' },
    ], 'Ask about a site, use, ground or period');
});

/* ================================================================== A6 === */
const a6 = () => app('Issue consolidation', 'DA/████/25', '██ raw comments · 4 sources · ██ issues drafted', (top) => {
  const y = top + 16, LX = 16, LW = 570, RX = 598, RW = 326, cw = (LW - 16) / 3;
  const colCards = (x, yy, w, maxH, items, accent) => {
    let out = '', cy = yy;
    for (const [src, body, col] of items) {
      const lines = wrap(body, w - 18, 11.5);
      const h = 16 + lines.length * 14 + 12;
      const bd = col ? { ok: L.ok, warn: L.warn, bad: L.bad }[col] : (accent ?? L.bd);
      out += r(x, cy, w, h, { rx: 3, fill: L.card, stroke: bd + (col ? '77' : '') }) +
        (col ? r(x, cy, 2.5, h, { rx: 0, fill: bd }) : '') +
        t(x + 9, cy + 14, src, { size: 9, fill: col ? bd : L.mute, weight: 800, spacing: 0.7 }) +
        lines.map((ln, i) => t(x + 9, cy + 30 + i * 14, ln, { size: 11.5, fill: L.ink })).join('');
      cy += h + 6;
    }
    if (cy - 6 > yy + maxH) throw new Error(`colCards overflows by ${Math.ceil(cy - 6 - (yy + maxH))}px`);
    return out;
  };
  const MH = 284;
  return [['RAW IN — ██', 0], ['CLUSTERED — ██', 1], ['FOR ATTENTION', 2]].map(([s, i]) =>
    lbl(LX + i * (cw + 8), y + 10, s)).join('') +
    colCards(LX, y + 22, cw, MH, [
      ['DC ASSISTANT', 'rule █.█.█ ██████'], ['URA · ██████ TEAM', '██████ too close at rear'],
      ['URA · ██████ TEAM', 'rear boundary treatment'], ['LTA', 'encroachment onto ██████'],
      ['PUB', 'clearance from ██████'], ['MAIL', 'follow-up from ██████'],
    ]) +
    colCards(LX + cw + 8, y + 22, cw, MH, [
      ['CLUSTER 01 · 4 SOURCES', 'Rear boundary and setback'], ['CLUSTER 02 · 2 SOURCES', 'Vehicular access'],
      ['CLUSTER 03 · 3 SOURCES', '██████'], ['UNGROUPED · 2', 'left as raised'],
    ], L.ai) +
    colCards(LX + (cw + 8) * 2, y + 22, cw, MH, [
      ['CONFLICT', 'LTA asks for ██████; ██████ team requires ██████. Cannot both be met.', 'warn'],
      ['DUPLICATE', 'Two teams, same concern, different wording'],
      ['SUPERSEDED', 'Comment predates rev C'],
    ]) +
    t(LX, y + 312, 'Draft formal issue — cluster 01', { size: 13, weight: 700 }) + agentChip(LX + 196, y + 312) +
    r(LX, y + 324, LW, 56, { rx: 4, fill: L.card, stroke: L.bd }) +
    [0, 1].map((i) => blk(LX + 13, y + 340 + i * 14, [520, 430][i], 8, L.bd2)).join('') +
    t(LX + 13, y + 372, 'assembled from 4 comments · each retained verbatim beneath', { size: 10.5, fill: L.link }) +
    btnRow(LX, y + 390, [['Accept draft into CX/CP', 'pri'], ['Edit wording', 'sec'], ['Show 4 originals', 'ghost']]) +
    drawer(RX, y, RW, 398, 'Ask the agent', [
      { who: 'you', txt: 'Why are LTA and the ██████ team in conflict?' },
      { who: 'ag', txt: 'LTA requires ██████ at the access point; the team requires ██████ retained. Same elevation.', cite: 'CX/CP comment ██ · DAX issue ██' },
      { who: 'you', txt: 'Anything raised twice by one team?' },
      { who: 'ag', txt: 'Two, both on ██████.', cite: 'DAX issues ██ and ██' },
    ], 'Ask about a cluster, source or conflict');
});

/* ================================================================== A7 === */
const a7 = () => app('AO briefing pack', 'DA/████/25', 'assembled from ██ records · ██ citations', (top) => {
  const y = top + 16, LX = 16, LW = 570, RX = 598, RW = 326;
  const kpi = (i, k, v) => {
    const x = LX + i * 192;
    return r(x, y, 182, 58, { rx: 4, fill: L.card, stroke: L.bd }) +
      lbl(x + 12, y + 20, k) + t(x + 12, y + 43, v, { size: 15, weight: 800 });
  };
  const tb = table(LX, y + 96, LW, [[13, 'SECTION'], [LW - 62, 'PP']], [
    ['1 · Case at a glance', '', '1 p', 'n'],
    ['2 · Site, designations and history', 'draws on A5', '1 p', 'n'],
    ['3 · Findings and formal issues', '██ summarised · full list linked', '2 pp', 'n'],
    ['4 · Consultations and responses', 'LTA, PUB, internal', '1 p', 'n'],
    ['5 · Overrides and PO reasoning', 'links to A8', '1 p', 'n'],
    ['6 · Recommendation as written', '', '1 p', 'n'],
  ]);
  return kpi(0, 'ISSUES', '██ open · ██ closed') + kpi(1, 'CONSULTATIONS', '██ sent · ██ replied') + kpi(2, 'OVERRIDES', '██ · ██ material') +
    t(LX, y + 84, 'Contents', { size: 14, weight: 700 }) + agentChip(LX + 74, y + 84) +
    tb.svg +
    btnRow(LX, y + 102 + tb.h + 12, [['Open full pack', 'pri'], ['Export as report', 'sec'], ['Show me what was left out', 'sec']]) +
    drawer(RX, y, RW, 398, 'Interrogate the pack', [
      { who: 'you', txt: 'Show me everything LTA raised, in their words.' },
      { who: 'ag', txt: '██ comments, two still open.', cite: 'CX/CP · comments ██–██' },
      { who: 'you', txt: 'What is not in the summary?' },
      { who: 'ag', txt: '██ minor findings and ██ routine overrides, listed here.', cite: 'full lists linked' },
    ], 'Ask about any section, issue or consultation');
});

/* ================================================================== A8 === */
const a8 = () => app('Evidence & override assurance', 'DA/████/25', 'completeness only · no view on merits', (top) => {
  const y = top + 16, LX = 16, LW = 570, RX = 598, RW = 326;
  const bar = (i, name, pct, col) => {
    const yy = y + 44 + i * 24;
    return t(LX + 13, yy, name, { size: 12, fill: L.ink2 }) +
      r(LX + 158, yy - 9, 300, 10, { rx: 5, fill: L.bd2 }) +
      r(LX + 158, yy - 9, 300 * pct, 10, { rx: 5, fill: col }) +
      t(LX + LW - 13, yy, '██/██', { size: 11, fill: L.mute, anchor: 'end' });
  };
  const tb = table(LX, y + 164, LW, [[13, 'OVERRIDE'], [LW - 92, 'TRACEABILITY']], [
    ['Override ██ · rule █.█', 'cites §█.█ · resolves to the provision', 'TRACEABLE', 'ok'],
    ['Override ██ · rule █.█', 'cites "████ guidance" · not located', 'UNRESOLVED', 'warn'],
    ['Override ██ · rule █.█', 'no source given', 'UNCITED', 'bad'],
  ]);
  const sy = y + 164 + tb.h;
  return card(LX, y, LW, 126, 'Citation coverage', { right: 'completeness only' }) +
    bar(0, 'Findings', 0.89, L.ok) + bar(1, 'Overrides', 0.72, L.warn) +
    bar(2, 'Recommendation', 0.83, L.ok) + bar(3, 'Consultation replies', 1, L.ok) +
    t(LX, y + 152, 'Overrides', { size: 14, weight: 700 }) +
    tb.svg +
    t(LX, sy + 22, 'Selected — override ██', { size: 13, weight: 700 }) +
    r(LX, sy + 32, LW / 2 - 6, 62, { rx: 4, fill: L.card, stroke: L.bd }) +
    lbl(LX + 12, sy + 52, 'MACHINE FOUND') +
    t(LX + 12, sy + 72, 'rule █.█ failed on element ██████', { size: 11.5, fill: L.ink2 }) +
    r(LX + LW / 2 + 6, sy + 32, LW / 2 - 6, 62, { rx: 4, fill: L.card, stroke: L.warn + '66' }) +
    lbl(LX + LW / 2 + 18, sy + 52, 'OFFICER OVERRODE', L.warn) +
    t(LX + LW / 2 + 18, sy + 72, 'cites "████ guidance" — not found', { size: 11.5, fill: L.warn }) +
    drawer(RX, y, RW, 398, 'Ask the agent', [
      { who: 'you', txt: 'Why is override ██ unresolved?' },
      { who: 'ag', txt: 'No document matches the guidance note it cites. The override may still be right — the source is what is missing.', cite: 'searched ██ documents' },
      { who: 'you', txt: 'Have we overridden this rule before?' },
      { who: 'ag', txt: '██ times in ██ months, ██ citing the same provision.', cite: 'DMS · prior override log' },
    ], 'Ask about an override, citation or rule');
});

const FILES = {
  'a1-registration-fee.svg': a1, 'a2-completeness-georef.svg': a2,
  'a3-delta-review.svg': a3, 'a4-referral-control.svg': a4,
  'a5-precedent-retrieval.svg': a5, 'a6-issue-consolidation.svg': a6,
  'a7-ao-briefing.svg': a7, 'a8-evidence-assurance.svg': a8,
};
for (const [name, fn] of Object.entries(FILES)) {
  const file = join(OUT, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, fn());
}
console.log(`Wrote ${Object.keys(FILES).length} agent screens to ${OUT}`);
