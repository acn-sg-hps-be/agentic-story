/**
 * primitives.ts — THE art system.
 *
 * Every visual in the app is drawn here as a pure function returning an SVG
 * group. There are NO external art files of any kind: no 3D models, icon packs,
 * sprite sheets, fonts-as-icons, or raster images. To add a new object type in
 * future, add ONE function here — never an asset file.
 *
 * A rendered travelling object = one `base` + zero-or-more `badges`, layered on
 * fixed anchor slots so states like ["tags","rename","link","stamp-green"] all
 * show at once without collision (see renderObjectState + BADGE_ANCHORS).
 *
 * Categories:
 *   - Object bases      base:*     envelope, chat, card, photo
 *   - Object badges     badge:*    tags, rename, link, stamp-green
 *   - Agent icons       icon:*     eye, tag, ticket, rename, link, check, shield
 *   - Avatars           avatar:*   worker, inspector, office, person
 *   - Scene furniture   (drawn by the engine, not config-referenced)
 *
 * Coordinate convention: every primitive is drawn centred on its own origin
 * (0,0) unless noted; the caller translates it into place.
 */

import { g, path, rect, circle, ellipse, line, text, el, transform } from './svg';

/* -------------------------------------------------------------------------- */
/* Theme — the single palette. Restyle the whole app by editing this object.  */
/* -------------------------------------------------------------------------- */

export const THEME = {
  bgTop: '#0b0618',
  bgBottom: '#1e0f3d',
  violet: '#a100ff',
  cyan: '#22e0ff',
  green: '#00e6a8',
  amber: '#ffb027',
  pink: '#ff4fd8',
  machineTop: '#4a2c8f',
  machineBottom: '#25133f',
  machineBevel: '#6b46c9',
  paper: '#f4eeff',
  paperShade: '#d9ccf2',
  ink: '#2a1b47',
  text: '#e9e0ff',
  textDim: '#a99bd4',
} as const;

const NS = 'http://www.w3.org/2000/svg';

/* -------------------------------------------------------------------------- */
/* Reusable <defs>: gradients + filters. Appended once to each SVG root.       */
/* Primitives reference these by url(#id).                                     */
/* -------------------------------------------------------------------------- */

export function defs(): SVGDefsElement {
  const d = document.createElementNS(NS, 'defs') as SVGDefsElement;
  d.innerHTML = `
    <linearGradient id="af-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${THEME.bgTop}"/>
      <stop offset="1" stop-color="${THEME.bgBottom}"/>
    </linearGradient>
    <radialGradient id="af-glow-violet" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${THEME.violet}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${THEME.violet}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="af-glow-pink" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${THEME.pink}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${THEME.pink}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="af-glow-cyan" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${THEME.cyan}" stop-opacity="0.7"/>
      <stop offset="1" stop-color="${THEME.cyan}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="af-glow-amber" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${THEME.amber}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${THEME.amber}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="af-machine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${THEME.machineBevel}"/>
      <stop offset="0.12" stop-color="${THEME.machineTop}"/>
      <stop offset="1" stop-color="${THEME.machineBottom}"/>
    </linearGradient>
    <linearGradient id="af-belt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b1852"/>
      <stop offset="1" stop-color="#160a2c"/>
    </linearGradient>
    <linearGradient id="af-field" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${THEME.cyan}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${THEME.cyan}" stop-opacity="0.04"/>
    </linearGradient>
    <linearGradient id="af-paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${THEME.paper}"/>
      <stop offset="1" stop-color="${THEME.paperShade}"/>
    </linearGradient>
    <linearGradient id="af-chip" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2170"/>
      <stop offset="1" stop-color="#241146"/>
    </linearGradient>
    <linearGradient id="af-plate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3d2378"/>
      <stop offset="1" stop-color="#1c0f39"/>
    </linearGradient>
    <filter id="af-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.45"/>
    </filter>
    <filter id="af-soft" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
    <filter id="af-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  return d;
}

/* -------------------------------------------------------------------------- */
/* Object bases (base:*)                                                       */
/* Canonical object box: OBJ_W x OBJ_H, centred at origin.                     */
/* -------------------------------------------------------------------------- */

export const OBJ_W = 120;
export const OBJ_H = 92;

function bevelHighlight(w: number, h: number, rx: number): SVGElement {
  // a soft top highlight giving the 2.5D "lit from above" read
  return path(
    `M ${-w / 2 + rx} ${-h / 2} h ${w - rx * 2} a ${rx} ${rx} 0 0 1 ${rx} ${rx}`,
    { fill: 'none', stroke: '#ffffff', 'stroke-opacity': '0.35', 'stroke-width': 2, 'stroke-linecap': 'round' },
  );
}

function envelope(): SVGGElement {
  const w = 112, h = 76;
  return g({ filter: 'url(#af-shadow)' }, [
    rect({ x: -w / 2, y: -h / 2, width: w, height: h, rx: 9, fill: 'url(#af-paper)', stroke: THEME.paperShade, 'stroke-width': 1.5 }),
    // flap
    path(`M ${-w / 2} ${-h / 2 + 2} L 0 14 L ${w / 2} ${-h / 2 + 2}`, {
      fill: 'none', stroke: THEME.violet, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
    }),
    path(`M ${-w / 2} ${-h / 2} L 0 12 L ${w / 2} ${-h / 2} Z`, { fill: '#ffffff', 'fill-opacity': 0.35 }),
    bevelHighlight(w, h, 9),
  ]);
}

function chat(): SVGGElement {
  const w = 112, h = 72;
  return g({ filter: 'url(#af-shadow)' }, [
    rect({ x: -w / 2, y: -h / 2 - 4, width: w, height: h, rx: 20, fill: THEME.cyan, stroke: '#12b4d6', 'stroke-width': 1.5 }),
    // tail
    path(`M ${-w / 2 + 18} ${h / 2 - 8} l -14 20 l 26 -8 Z`, { fill: THEME.cyan, stroke: '#12b4d6', 'stroke-width': 1.5 }),
    // three dots
    ...[-22, 0, 22].map((dx) => circle(dx, -8, 5.5, { fill: '#0b3f4a' })),
    bevelHighlight(w, h - 4, 20),
  ]);
}

function card(): SVGGElement {
  const w = 96, h = 84, fold = 20;
  return g({ filter: 'url(#af-shadow)' }, [
    path(
      `M ${-w / 2} ${-h / 2} H ${w / 2 - fold} L ${w / 2} ${-h / 2 + fold} V ${h / 2} H ${-w / 2} Z`,
      { fill: 'url(#af-paper)', stroke: THEME.paperShade, 'stroke-width': 1.5 },
    ),
    // folded corner
    path(`M ${w / 2 - fold} ${-h / 2} V ${-h / 2 + fold} H ${w / 2} Z`, { fill: THEME.paperShade }),
    // text lines
    ...[-18, -2, 14].map((y, i) =>
      rect({ x: -w / 2 + 12, y, width: (i === 2 ? 40 : 58), height: 6, rx: 3, fill: THEME.ink, 'fill-opacity': 0.35 }),
    ),
    rect({ x: -w / 2 + 12, y: -h / 2 + 10, width: 30, height: 8, rx: 4, fill: THEME.violet, 'fill-opacity': 0.8 }),
    bevelHighlight(w, h, 6),
  ]);
}

function photo(): SVGGElement {
  const w = 108, h = 82, pad = 7;
  const iw = w - pad * 2, ih = h - pad * 2 - 6;
  return g({ filter: 'url(#af-shadow)' }, [
    rect({ x: -w / 2, y: -h / 2, width: w, height: h, rx: 6, fill: '#ffffff' }),
    // inner "scene"
    el('clipPath', { id: 'af-photo-clip' }, [rect({ x: -iw / 2, y: -h / 2 + pad, width: iw, height: ih, rx: 3 })]),
    g({ 'clip-path': 'url(#af-photo-clip)' }, [
      rect({ x: -iw / 2, y: -h / 2 + pad, width: iw, height: ih, fill: '#9fd8ff' }),
      circle(iw / 2 - 20, -h / 2 + pad + 16, 9, { fill: THEME.amber }),
      path(`M ${-iw / 2} ${ih / 2 - 8} L ${-8} ${-4} L 10 ${ih / 2 - 22} L ${iw / 2} ${ih / 2 - 4} V ${ih / 2 + 10} H ${-iw / 2} Z`, { fill: '#3aa06b' }),
    ]),
    rect({ x: -w / 2, y: -h / 2, width: w, height: h, rx: 6, fill: 'none', stroke: THEME.paperShade, 'stroke-width': 1.5 }),
    bevelHighlight(w, h, 6),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Object badges (badge:*) — small layers placed at fixed corner anchors so     */
/* several can stack on one base without overlapping.                          */
/* -------------------------------------------------------------------------- */

// Anchor slots relative to the OBJ_W x OBJ_H box (centre origin).
const A = { L: -OBJ_W / 2 + 8, R: OBJ_W / 2 - 8, T: -OBJ_H / 2 + 8, B: OBJ_H / 2 - 8 };
export const BADGE_ANCHORS: Record<string, { x: number; y: number }> = {
  tags: { x: A.L, y: A.T }, // top-left
  rename: { x: A.R, y: A.T }, // top-right
  link: { x: A.L, y: A.B }, // bottom-left
  'stamp-green': { x: A.R, y: A.B }, // bottom-right
};

function badgeTags(): SVGGElement {
  const tag = (dx: number, dy: number, color: string) =>
    g({ transform: transform({ x: dx, y: dy }) }, [
      path('M -2 -9 L 16 -9 L 24 0 L 16 9 L -2 9 Z', { fill: color, stroke: '#00000022', 'stroke-width': 1 }),
      circle(4, 0, 2.5, { fill: '#ffffff' }),
    ]);
  return g({ filter: 'url(#af-shadow)' }, [tag(-2, -5, THEME.amber), tag(4, 6, THEME.cyan)]);
}

function badgeRename(): SVGGElement {
  return g({ filter: 'url(#af-shadow)' }, [
    rect({ x: -20, y: -12, width: 40, height: 24, rx: 12, fill: THEME.violet }),
    text('A', { x: -10, y: 5, fill: '#fff', 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle' }),
    path('M -3 0 h 8 m 0 0 l -3 -3 m 3 3 l -3 3', { stroke: '#fff', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    text('B', { x: 11, y: 5, fill: '#fff', 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle' }),
  ]);
}

function badgeLink(): SVGGElement {
  const ringPair = (dx: number) =>
    el('rect', { x: dx - 11, y: -7, width: 22, height: 14, rx: 7, fill: 'none', stroke: '#fff', 'stroke-width': 4 });
  return g({ filter: 'url(#af-shadow)' }, [
    circle(0, 0, 15, { fill: THEME.cyan }),
    g({ transform: 'rotate(-30)' }, [ringPair(-6), ringPair(6)]),
  ]);
}

function badgeStampGreen(): SVGGElement {
  return g({ filter: 'url(#af-shadow)', transform: 'rotate(-12)' }, [
    circle(0, 0, 17, { fill: 'none', stroke: THEME.green, 'stroke-width': 3 }),
    circle(0, 0, 13, { fill: THEME.green, 'fill-opacity': 0.16 }),
    path('M -7 0 L -2 6 L 8 -6', { fill: 'none', stroke: THEME.green, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Agent icons (icon:*) — monoline glyphs, drawn ~24px, centred.               */
/* -------------------------------------------------------------------------- */

function iconFrame(children: SVGElement[], stroke = THEME.cyan): SVGGElement {
  return g({ fill: 'none', stroke, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, children);
}

const iconEye = () => iconFrame([path('M -11 0 C -6 -7 6 -7 11 0 C 6 7 -6 7 -11 0 Z'), circle(0, 0, 3.2, { fill: THEME.cyan, stroke: 'none' })]);
const iconTag = () => iconFrame([path('M -10 -8 H 2 L 11 1 L 1 11 L -10 0 Z'), circle(-5, -3, 1.6, { fill: THEME.cyan, stroke: 'none' })]);
const iconTicket = () => iconFrame([path('M -11 -7 H 11 V -2 A 2 2 0 0 0 11 2 V 7 H -11 V 2 A 2 2 0 0 0 -11 -2 Z'), line(-2, -7, -2, 7, { 'stroke-dasharray': '2 3' })]);
const iconRename = () => iconFrame([path('M -10 8 L -10 4 L 2 -8 L 6 -4 L -6 8 Z'), line(0, -6, 4, -2)]);
const iconLink = () => iconFrame([path('M -3 -3 a 5 5 0 0 1 7 0 l 2 2 a 5 5 0 0 1 0 7'), path('M 3 3 a 5 5 0 0 1 -7 0 l -2 -2 a 5 5 0 0 1 0 -7')]);
const iconCheck = () => iconFrame([circle(0, 0, 10), path('M -5 0 L -1 4 L 6 -5')]);
const iconShield = () => iconFrame([path('M 0 -11 L 10 -7 V 2 C 10 8 5 11 0 12 C -5 11 -10 8 -10 2 V -7 Z'), path('M -4 0 L -1 3 L 5 -4')]);

/* -------------------------------------------------------------------------- */
/* Avatars (avatar:*) — stylised 2.5D characters, ~120 tall, feet near y=0.    */
/* The person is the human source of an input; role + quote come from config.  */
/* -------------------------------------------------------------------------- */

function avatarBody(shirt: string): SVGElement[] {
  return [
    // torso / shoulders
    path('M -30 6 C -30 -18 30 -18 30 6 L 30 30 L -30 30 Z', { fill: shirt, stroke: '#00000022', 'stroke-width': 1.5 }),
    // neck
    rect({ x: -7, y: -30, width: 14, height: 16, rx: 5, fill: '#e8b48a' }),
    // head
    circle(0, -42, 18, { fill: '#f0c19a', stroke: '#00000018', 'stroke-width': 1.5 }),
  ];
}

function avatar(kind: 'worker' | 'inspector' | 'office' | 'person'): SVGGElement {
  const shirt = { worker: THEME.amber, inspector: '#ffe14d', office: '#6da8ff', person: '#b79cff' }[kind];
  const parts: SVGElement[] = [
    ellipse(0, 34, 34, 8, { fill: '#000', 'fill-opacity': 0.28, filter: 'url(#af-soft)' }), // ground shadow
    ...avatarBody(shirt),
  ];
  // simple face
  parts.push(
    circle(-6, -44, 1.8, { fill: THEME.ink }),
    circle(6, -44, 1.8, { fill: THEME.ink }),
    path('M -5 -36 Q 0 -33 5 -36', { fill: 'none', stroke: THEME.ink, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
  );
  if (kind === 'worker') {
    parts.push(
      path('M -20 -50 C -20 -66 20 -66 20 -50 Z', { fill: THEME.amber, stroke: '#00000022', 'stroke-width': 1.5 }),
      rect({ x: -23, y: -52, width: 46, height: 5, rx: 2.5, fill: '#e0951f' }),
      rect({ x: -3, y: -64, width: 6, height: 8, rx: 2, fill: '#e0951f' }),
    );
  } else if (kind === 'inspector') {
    parts.push(
      // white construction safety helmet (dome + brim + ridge)
      rect({ x: -24, y: -51, width: 48, height: 6, rx: 3, fill: '#e4e8ef', stroke: '#00000022', 'stroke-width': 1 }), // brim
      path('M -20 -49 C -20 -68 20 -68 20 -49 Z', { fill: '#f4f6fa', stroke: '#00000022', 'stroke-width': 1.5 }), // dome
      path('M 0 -67 C -9 -66 -15 -60 -17 -50', { fill: 'none', stroke: '#cdd3dd', 'stroke-width': 2, 'stroke-linecap': 'round' }), // ridge shade
      rect({ x: -3, y: -66, width: 6, height: 9, rx: 2, fill: '#cdd3dd' }), // crown knob
      rect({ x: 20, y: -6, width: 20, height: 26, rx: 3, fill: THEME.paper, stroke: THEME.paperShade, 'stroke-width': 1.5 }), // clipboard
      rect({ x: 26, y: -10, width: 8, height: 6, rx: 2, fill: '#9aa' }),
      ...[0, 6, 12].map((y) => line(24, y, 36, y, { stroke: THEME.textDim, 'stroke-width': 1.5 })),
    );
  } else if (kind === 'office') {
    parts.push(
      // short hair
      path('M -17 -50 C -17 -61 17 -61 17 -50 L 17 -45 C 9 -51 -9 -51 -17 -45 Z', { fill: '#3b2a17' }),
      // black headset with a light rim so the shape reads on the dark stage
      path('M -18 -45 a 18 18 0 0 1 36 0', { fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.55, 'stroke-width': 5.5 }),
      path('M -18 -45 a 18 18 0 0 1 36 0', { fill: 'none', stroke: '#0b0b0f', 'stroke-width': 3.5 }),
      circle(-18, -42, 5, { fill: '#0b0b0f', stroke: '#ffffff', 'stroke-opacity': 0.6, 'stroke-width': 1.3 }),
      circle(18, -42, 5, { fill: '#0b0b0f', stroke: '#ffffff', 'stroke-opacity': 0.6, 'stroke-width': 1.3 }),
      path('M -18 -42 q -11 9 -3 16', { fill: 'none', stroke: '#0b0b0f', 'stroke-width': 3 }), // mic boom
      circle(-9, -26, 3.2, { fill: '#0b0b0f', stroke: '#ffffff', 'stroke-opacity': 0.55, 'stroke-width': 1 }),
      // collar + tie (office look, high-contrast)
      path('M -11 -14 L 0 -5 L 11 -14', { fill: 'none', stroke: '#ffffff', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
      path('M 0 -5 L -4 12 L 0 20 L 4 12 Z', { fill: THEME.amber, stroke: '#00000022', 'stroke-width': 1 }),
    );
  } else {
    parts.push(path('M -16 -50 C -16 -60 16 -60 16 -50 L 16 -44 C 8 -50 -8 -50 -16 -44 Z', { fill: '#5a3fae' })); // hair
  }
  return g({ filter: 'url(#af-shadow)' }, parts);
}

/* -------------------------------------------------------------------------- */
/* Object-state composition                                                    */
/* rendered object = one base + badges layered on fixed anchors.               */
/* -------------------------------------------------------------------------- */

export interface ObjectStateSpec {
  base: string;
  badges?: string[];
}

/** Compose a travelling-object visual from a state spec. Unknown names throw. */
export function renderObjectState(spec: ObjectStateSpec): SVGGElement {
  const baseFn = BASES[spec.base];
  if (!baseFn) throw new Error(`Unknown object base "${spec.base}"`);
  const layers: SVGElement[] = [baseFn()];
  for (const name of spec.badges ?? []) {
    const badgeFn = BADGES[name];
    if (!badgeFn) throw new Error(`Unknown object badge "${name}"`);
    const anchor = BADGE_ANCHORS[name] ?? { x: 0, y: 0 };
    layers.push(g({ transform: transform({ x: anchor.x, y: anchor.y }), 'data-badge': name }, [badgeFn()]));
  }
  return g({ 'data-base': spec.base }, layers);
}

/**
 * Resolve a node "icon"/"shape" token used by inputs & outputs. It may name an
 * object base (envelope/chat/card/photo) OR an agent icon (ticket/tag/…).
 * Returns a small centred glyph suitable for a node badge.
 */
export function renderShapeToken(token: string, sizeHint = 40): SVGGElement {
  if (BASES[token]) {
    const scale = sizeHint / OBJ_W;
    return g({ transform: transform({ scale }) }, [BASES[token]()]);
  }
  if (ICONS[token]) return ICONS[token]();
  // graceful fallback: a neutral dot rather than blank
  return g({}, [circle(0, 0, 8, { fill: THEME.textDim })]);
}

/* -------------------------------------------------------------------------- */
/* Registries — used by the validator to confirm a config references nothing   */
/* that would render blank, and by the gallery to enumerate everything.        */
/* -------------------------------------------------------------------------- */

export const BASES: Record<string, () => SVGGElement> = { envelope, chat, card, photo };
export const BADGES: Record<string, () => SVGGElement> = {
  tags: badgeTags,
  rename: badgeRename,
  link: badgeLink,
  'stamp-green': badgeStampGreen,
};
export const ICONS: Record<string, () => SVGGElement> = {
  eye: iconEye,
  tag: iconTag,
  ticket: iconTicket,
  rename: iconRename,
  link: iconLink,
  check: iconCheck,
  shield: iconShield,
};
export const AVATARS: Record<string, () => SVGGElement> = {
  worker: () => avatar('worker'),
  inspector: () => avatar('inspector'),
  office: () => avatar('office'),
  person: () => avatar('person'),
};

/* -------------------------------------------------------------------------- */
/* Scene furniture (hardcoded backdrop — never config-referenced)              */
/*                                                                            */
/* Isometric 2.5D: every solid is built from isoBox() — a lit top face + a     */
/* shaded right face receding by a shared depth vector, so the whole stage     */
/* reads as 3D under one upper-left light. Travelling objects and characters   */
/* stay front-facing (billboarded) against this environment.                   */
/* -------------------------------------------------------------------------- */

// Depth unit -> screen offset (up and to the right). One constant for the
// whole stage keeps every box on the same "camera" and light.
const DZX = 0.62;
const DZY = -0.42;
const dpt = (d: number) => ({ x: d * DZX, y: d * DZY });

/**
 * A dimetric "2.5D" box from a front-face rect (top-left fx,fy; size fw x fh)
 * plus a lit top face and a shaded right face receding by depth `d`. Returns
 * the three face paths (draw order: top, right, front) — the building block
 * for every furniture solid.
 */
function isoBox(
  fx: number, fy: number, fw: number, fh: number, d: number,
  o: { top?: string; front?: string; right?: string; stroke?: string } = {},
): SVGElement[] {
  const { x: dx, y: dy } = dpt(d);
  const stroke = o.stroke ?? '#140a2a';
  const common = { stroke, 'stroke-width': 1.5, 'stroke-linejoin': 'round' as const };
  return [
    path(`M ${fx} ${fy} L ${fx + dx} ${fy + dy} L ${fx + fw + dx} ${fy + dy} L ${fx + fw} ${fy} Z`, { fill: o.top ?? '#5f3cb0', ...common }),
    path(`M ${fx + fw} ${fy} L ${fx + fw + dx} ${fy + dy} L ${fx + fw + dx} ${fy + fh + dy} L ${fx + fw} ${fy + fh} Z`, { fill: o.right ?? '#1b0f34', ...common }),
    path(`M ${fx} ${fy} h ${fw} v ${fh} h ${-fw} Z`, { fill: o.front ?? 'url(#af-machine)', ...common }),
  ];
}

/** Full-bleed ambient background: gradient wash, radial glows, floor grid. */
export function ambientBackdrop(w: number, h: number): SVGGElement {
  const gridY = h * 0.6; // horizon of the ground plane
  const grid: SVGElement[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = (w / 12) * i;
    const bx = w / 2 + (x - w / 2) * 1.9; // spread toward viewer for perspective
    grid.push(line(x, gridY, bx, h, { stroke: '#6a4fce', 'stroke-opacity': 0.1, 'stroke-width': 1 }));
  }
  for (let j = 1; j <= 5; j++) {
    const y = gridY + ((h - gridY) / 5) * j;
    grid.push(line(0, y, w, y, { stroke: '#6a4fce', 'stroke-opacity': 0.07, 'stroke-width': 1 }));
  }
  return g({ 'data-furniture': 'backdrop' }, [
    rect({ x: 0, y: 0, width: w, height: h, fill: 'url(#af-bg)' }),
    ellipse(w * 0.24, h * 0.2, w * 0.34, h * 0.34, { fill: 'url(#af-glow-violet)' }),
    ellipse(w * 0.82, h * 0.14, w * 0.28, h * 0.3, { fill: 'url(#af-glow-pink)' }),
    g({ 'data-furniture': 'floor-grid' }, grid),
    ellipse(w * 0.5, h * 0.92, w * 0.55, h * 0.28, { fill: 'url(#af-glow-cyan)', opacity: 0.45 }),
  ]);
}

/** Soft cyan floor glow beneath the line (gradient, no blur filter). */
export function floorGlow(cx: number, cy: number, w: number): SVGGElement {
  return g({ 'data-furniture': 'floor-glow' }, [
    ellipse(cx, cy, w / 2, 40, { fill: 'url(#af-glow-cyan)' }),
  ]);
}

/**
 * Isometric conveyor belt drawn from its near-front-top-left corner (0,0),
 * extending right to x=length. The top running surface recedes up-right by
 * `depth`; chevrons scroll across it (.af-belt-scroll, one 48px period loop,
 * paused under reduced-motion). Travelling objects ride the near edge (y≈0).
 */
export function conveyorBelt(length: number, depth = 52): SVGGElement {
  const { x: dx, y: dy } = dpt(depth);
  const frontH = 22;
  const period = 48;
  const clipId = 'af-belt-clip';
  const topPath = `M 0 0 L ${dx} ${dy} L ${length + dx} ${dy} L ${length} 0 Z`;
  const segs: SVGElement[] = [];
  for (let sx = -period; sx < length + period; sx += period) {
    segs.push(path(`M ${sx} 0 L ${sx + 11} 0 L ${sx + 11 + dx} ${dy} L ${sx + dx} ${dy} Z`, { fill: THEME.cyan, 'fill-opacity': 0.16 }));
  }
  return g({ 'data-furniture': 'belt' }, [
    path(topPath, { fill: 'url(#af-belt)', stroke: '#0c0620', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    el('clipPath', { id: clipId }, [path(topPath)]),
    g({ 'clip-path': `url(#${clipId})` }, [g({ class: 'af-belt-scroll' }, segs)]),
    path(`M 0 0 L ${length} 0 L ${length} ${frontH} L 0 ${frontH} Z`, { fill: '#160a2c', stroke: '#0c0620', 'stroke-width': 2 }),
    // glowing near edge (layered rects, no full-width blur filter)
    rect({ x: 0, y: -3, width: length, height: 8, rx: 4, fill: THEME.cyan, opacity: 0.3 }),
    rect({ x: 0, y: -1, width: length, height: 3, fill: THEME.cyan }),
  ]);
}

/**
 * Belt "ribbon" following a polyline centre-line (which is the near/front edge).
 * The back edge is offset up-right by widthAt(i) per point and a front lip adds
 * thickness, so a V/U-shaped line reads with real receding depth. A dashed
 * centre-line animates (stroke-dashoffset) to show flow. Points are in stage
 * coordinates; the caller tapers widthAt() with perspective.
 */
export function beltRibbon(
  center: Array<{ x: number; y: number }>,
  widthAt: (i: number) => number,
): SVGGElement {
  const back = center.map((p, i) => {
    const d = dpt(widthAt(i));
    return { x: p.x + d.x, y: p.y + d.y };
  });
  const top = [...center, ...back.slice().reverse()];
  const topPath = 'M ' + top.map((p) => `${p.x} ${p.y}`).join(' L ') + ' Z';
  const lipBot = center.map((p, i) => ({ x: p.x, y: p.y + widthAt(i) * 0.34 }));
  const lipPath =
    'M ' + center.map((p) => `${p.x} ${p.y}`).join(' L ') + ' ' +
    lipBot.slice().reverse().map((p) => `L ${p.x} ${p.y}`).join(' ') + ' Z';
  const centreLine = 'M ' + center.map((p) => `${p.x} ${p.y}`).join(' L ');
  return g({ 'data-furniture': 'belt' }, [
    path(topPath, { fill: 'url(#af-belt)', stroke: '#0c0620', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    path(lipPath, { fill: '#120826', stroke: '#0c0620', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    path(centreLine, { fill: 'none', stroke: THEME.cyan, 'stroke-opacity': 0.15, 'stroke-width': 2 }),
    path(centreLine, { class: 'af-belt-flow', fill: 'none', stroke: THEME.cyan, 'stroke-width': 5, 'stroke-linecap': 'round' }),
  ]);
}

/**
 * Station = a futuristic "supercomputer" tower: a slim iso cabinet with a
 * glowing central compute-core column and rows of blinking indicator lights.
 * Front-bottom-centre at (0,0). Add class "af-active" to ramp under-glow +
 * indicator. Slim enough that the travelling object reads clearly in front.
 */
export function machineHousing(variant = 0): SVGGElement {
  const v = ((variant % 4) + 4) % 4;
  const w = 80, h = 104, d = 40, fx = -w / 2, fy = -h;
  const parts: SVGElement[] = [
    ellipse(dpt(d).x / 2, 8, 78, 22, { class: 'af-spotlight', fill: 'url(#af-glow-amber)', opacity: 0 }),
    g({ filter: 'url(#af-shadow)' }, isoBox(fx, fy, w, h, d)),
    rect({ x: fx + 6, y: fy + 5, width: w - 12, height: 7, rx: 3.5, fill: '#ffffff', 'fill-opacity': 0.12 }),
  ];

  if (v === 0) {
    // single compute core + side light banks
    const c = 12;
    parts.push(
      rect({ x: -c / 2 - 2, y: fy + 16, width: c + 4, height: h - 30, rx: 8, fill: 'url(#af-field)' }),
      rect({ x: -c / 2 + 2, y: fy + 18, width: c - 4, height: h - 34, rx: 3, fill: THEME.cyan, 'fill-opacity': 0.7 }),
      ...[0, 1, 2, 3, 4].flatMap((i) => [
        circle(fx + 13, fy + 22 + i * 16, 2.4, { fill: i % 2 ? THEME.cyan : THEME.green }),
        circle(fx + w - 13, fy + 22 + i * 16, 2.4, { fill: i % 2 ? THEME.green : THEME.cyan }),
      ]),
    );
  } else if (v === 1) {
    // twin cores
    parts.push(
      ...[-15, 15].map((cx) => g({}, [
        rect({ x: cx - 6, y: fy + 16, width: 12, height: h - 34, rx: 6, fill: 'url(#af-field)' }),
        rect({ x: cx - 2, y: fy + 18, width: 4, height: h - 38, rx: 2, fill: THEME.cyan, 'fill-opacity': 0.7 }),
      ])),
      rect({ x: fx + 12, y: fy + h - 16, width: w - 24, height: 6, rx: 3, fill: THEME.green, 'fill-opacity': 0.4 }),
    );
  } else if (v === 2) {
    // stacked racks with glowing seams
    parts.push(
      ...[0, 1, 2, 3].map((i) => g({}, [
        rect({ x: fx + 10, y: fy + 16 + i * 20, width: w - 20, height: 14, rx: 4, fill: '#0a0518', 'fill-opacity': 0.7, stroke: THEME.cyan, 'stroke-opacity': 0.25, 'stroke-width': 1 }),
        circle(fx + 18, fy + 23 + i * 20, 2.6, { fill: i % 2 ? THEME.green : THEME.cyan }),
        rect({ x: fx + 26, y: fy + 21 + i * 20, width: w - 42, height: 4, rx: 2, fill: THEME.cyan, 'fill-opacity': 0.3 }),
      ])),
    );
  } else {
    // monolith with a diamond core + antenna
    parts.push(
      path(`M 0 ${fy + 22} L 16 ${fy + h / 2} L 0 ${fy + h - 14} L -16 ${fy + h / 2} Z`, { fill: 'url(#af-field)', stroke: THEME.cyan, 'stroke-opacity': 0.5, 'stroke-width': 1.5 }),
      circle(0, fy + h / 2 - 4, 5, { fill: THEME.cyan, 'fill-opacity': 0.85 }),
      line(0, fy, 0, fy - 14, { stroke: '#5a37a8', 'stroke-width': 3 }),
      circle(0, fy - 16, 3.5, { fill: THEME.amber }),
    );
  }

  parts.push(circle(0, fy + 9, 3.5, { class: 'af-indicator', fill: THEME.cyan }));
  return g({ 'data-furniture': 'machine', class: 'af-machine' }, parts);
}

/** Floating agent chip: rounded pill with an icon dot + name (billboarded). */
export function agentChip(name: string, iconName: string, width = 132): SVGGElement {
  const iconFn = ICONS[iconName] ?? (() => circle(0, 0, 6, { fill: THEME.cyan }));
  return g({ 'data-furniture': 'agent-chip', class: 'af-chip', filter: 'url(#af-shadow)' }, [
    rect({ x: 0, y: 0, width, height: 34, rx: 17, fill: 'url(#af-chip)', stroke: THEME.violet, 'stroke-opacity': 0.6, 'stroke-width': 1.5 }),
    circle(19, 17, 13, { fill: '#0c0620', stroke: THEME.cyan, 'stroke-opacity': 0.4, 'stroke-width': 1 }),
    g({ transform: transform({ x: 19, y: 17, scale: 0.72 }) }, [iconFn()]),
    text(name, { x: 38, y: 22, fill: THEME.text, 'font-size': 13, 'font-weight': 600 }),
  ]);
}

/** Input = a small "source console" emitting the item. Front-bottom-centre (0,0). */
export function inputHopper(): SVGGElement {
  const w = 66, h = 68, fx = -w / 2, fy = -h;
  return g({ 'data-furniture': 'hopper', class: 'af-node' }, [
    ellipse(0, 2, 40, 11, { fill: 'url(#af-glow-cyan)' }),
    g({ filter: 'url(#af-shadow)' }, isoBox(fx, fy, w, h, 30)),
    rect({ x: fx + 9, y: fy + 12, width: w - 18, height: 26, rx: 6, fill: '#0a0518', 'fill-opacity': 0.8, stroke: THEME.cyan, 'stroke-opacity': 0.4, 'stroke-width': 1.5 }),
    path(`M ${fx + 16} ${fy + 25} h 22 m 0 0 l -6 -5 m 6 5 l -6 5`, { fill: 'none', stroke: THEME.cyan, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    circle(0, -8, 3, { fill: THEME.green }),
  ]);
}

/** Output = a small "collector vault" with a compliant check. Front-bottom-centre (0,0). */
export function outputCrate(): SVGGElement {
  const w = 66, h = 68, fx = -w / 2, fy = -h;
  return g({ 'data-furniture': 'crate', class: 'af-node' }, [
    ellipse(0, 2, 40, 11, { fill: 'url(#af-glow-cyan)' }),
    g({ filter: 'url(#af-shadow)' }, isoBox(fx, fy, w, h, 30)),
    rect({ x: fx + 9, y: fy + 12, width: w - 18, height: 26, rx: 6, fill: '#0a0518', 'fill-opacity': 0.8, stroke: THEME.green, 'stroke-opacity': 0.55, 'stroke-width': 1.5 }),
    path(`M ${fx + 18} ${fy + 26} l 6 7 l 12 -14`, { fill: 'none', stroke: THEME.green, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    circle(0, -8, 3, { fill: THEME.green }),
  ]);
}

/**
 * Central orchestrator — a fixed, illustrative robot "conductor" on a raised
 * dais with a glow ring and floating abstract dashboards. Pure scene furniture:
 * it is never config-referenced and does nothing functional; it sells the
 * "agentic orchestration" story. Base-centre at (0,0); the line runs behind it.
 */
export function orchestrator(): SVGGElement {
  const dw = 210, dh = 26, dd = 128;
  const cx = dpt(dd).x / 2;
  const topY = -dh + dpt(dd).y / 2;
  return g({ 'data-furniture': 'orchestrator' }, [
    ellipse(cx, topY - 70, 130, 130, { fill: 'url(#af-glow-cyan)' }),
    g({ filter: 'url(#af-shadow)' }, isoBox(-dw / 2, -dh, dw, dh, dd, { top: '#3a2170', right: '#160a2c', front: 'url(#af-plate)' })),
    ellipse(cx, topY, dw * 0.4, 24, { fill: 'none', stroke: THEME.cyan, 'stroke-opacity': 0.6, 'stroke-width': 3 }),
    g({ transform: transform({ x: cx - 152, y: topY - 96 }) }, [miniPanel('bars')]),
    g({ transform: transform({ x: cx + 82, y: topY - 120 }) }, [miniPanel('gauge')]),
    g({ transform: transform({ x: cx - 40, y: topY - 176 }) }, [miniPanel('check')]),
    g({ transform: transform({ x: cx, y: topY + 4 }) }, [robotFigure()]),
  ]);
}

/** Friendly front-facing robot; origin at its feet, drawn upward. */
function robotFigure(): SVGGElement {
  return g({ filter: 'url(#af-shadow)', class: 'af-robot' }, [
    ellipse(0, 2, 42, 10, { fill: '#000', 'fill-opacity': 0.3, filter: 'url(#af-soft)' }),
    path('M -26 0 Q -30 -30 -18 -34 L 18 -34 Q 30 -30 26 0 Z', { fill: '#6b46c9', stroke: '#140a2a', 'stroke-width': 1.5 }),
    path('M -34 -84 q -18 6 -16 36', { fill: 'none', stroke: '#5a37a8', 'stroke-width': 11, 'stroke-linecap': 'round' }),
    path('M 34 -84 q 18 6 16 36', { fill: 'none', stroke: '#5a37a8', 'stroke-width': 11, 'stroke-linecap': 'round' }),
    rect({ x: -34, y: -96, width: 68, height: 64, rx: 20, fill: 'url(#af-machine)', stroke: '#140a2a', 'stroke-width': 1.5 }),
    circle(0, -64, 15, { fill: '#0a0518' }),
    circle(0, -64, 11, { class: 'af-core', fill: THEME.cyan, filter: 'url(#af-glow)' }),
    rect({ x: -6, y: -108, width: 12, height: 14, fill: '#4a2c8f' }),
    rect({ x: -28, y: -150, width: 56, height: 46, rx: 16, fill: 'url(#af-machine)', stroke: '#140a2a', 'stroke-width': 1.5 }),
    rect({ x: -22, y: -142, width: 44, height: 26, rx: 12, fill: '#0a0518' }),
    circle(-9, -129, 4.5, { fill: THEME.cyan, filter: 'url(#af-glow)' }),
    circle(9, -129, 4.5, { fill: THEME.cyan, filter: 'url(#af-glow)' }),
    line(0, -150, 0, -164, { stroke: '#5a37a8', 'stroke-width': 3 }),
    circle(0, -168, 4, { fill: THEME.amber, filter: 'url(#af-glow)' }),
  ]);
}

/** Small floating dashboard panel around the orchestrator. Domain-neutral. */
function miniPanel(kind: 'bars' | 'gauge' | 'check', w = 80, h = 56): SVGGElement {
  const body: SVGElement[] = [
    rect({ x: 0, y: 0, width: w, height: h, rx: 8, fill: '#160a2ccc', stroke: THEME.cyan, 'stroke-opacity': 0.5, 'stroke-width': 1.5 }),
    rect({ x: 8, y: 8, width: 30, height: 5, rx: 2.5, fill: THEME.cyan, 'fill-opacity': 0.5 }),
  ];
  if (kind === 'bars') {
    [16, 30, 22, 36].forEach((bh, i) => body.push(rect({ x: 10 + i * 16, y: h - 10 - bh, width: 9, height: bh, rx: 2, fill: THEME.cyan, 'fill-opacity': 0.8 })));
  } else if (kind === 'gauge') {
    body.push(path(`M 18 ${h - 12} A 22 22 0 0 1 62 ${h - 12}`, { fill: 'none', stroke: THEME.violet, 'stroke-width': 5, 'stroke-linecap': 'round' }));
    body.push(path(`M 18 ${h - 12} A 22 22 0 0 1 46 ${h - 30}`, { fill: 'none', stroke: THEME.green, 'stroke-width': 5, 'stroke-linecap': 'round' }));
  } else {
    [0, 1, 2].forEach((i) => {
      body.push(path(`M 11 ${20 + i * 11} l 3 3 l 5 -6`, { fill: 'none', stroke: THEME.green, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      body.push(rect({ x: 26, y: 18 + i * 11, width: 44, height: 4, rx: 2, fill: THEME.text, 'fill-opacity': 0.3 }));
    });
  }
  return g({ 'data-furniture': 'panel', class: 'af-panel', filter: 'url(#af-shadow)' }, body);
}

/**
 * Callout card for the top text band: a station/input/output label plus its
 * agent chips. Anchored top-left at (0,0); returns the node and its measured
 * size so the scene can draw a leader line from the card down to its object.
 * Text lives here (top band); the object below stays purely visual.
 */
export function calloutCard(
  title: string,
  sub: string | undefined,
  agents: Array<{ name: string; icon: string }> = [],
  accent: string = THEME.cyan,
): { node: SVGGElement; width: number; height: number } {
  const W = 190, pad = 12, btnGap = 9, lineH = 15, textX = 50;
  const headBottom = sub ? 46 : 32;      // clear separation below the title
  const startY = headBottom + 4;
  // wrap each "<name> Agent" label to the button's text column; taller buttons
  // when a label needs two lines so nothing overflows.
  const maxChars = Math.max(8, Math.floor((W - textX - pad) / 6.6));
  const wrapped = agents.map((a) => wrapText(`${a.name} Agent`, maxChars));
  const btnHeights = wrapped.map((lines) => Math.max(34, 12 + lines.length * lineH));
  const height = startY + btnHeights.reduce((s, h) => s + h + btnGap, 0) - btnGap + pad;

  const body: SVGElement[] = [
    rect({ x: 0, y: 0, width: W, height, rx: 12, fill: '#160a2cf2', stroke: accent, 'stroke-opacity': 0.55, 'stroke-width': 1.5 }),
    rect({ x: 0, y: 0, width: 4, height, rx: 2, fill: accent }),
    text(title, { x: pad, y: 22, fill: THEME.text, 'font-size': 14, 'font-weight': 800, 'letter-spacing': 1 }),
  ];
  if (sub) body.push(text(sub, { x: pad, y: 38, fill: THEME.textDim, 'font-size': 12 }));

  let by = startY;
  agents.forEach((a, i) => {
    const lines = wrapped[i];
    const bh = btnHeights[i];
    const cy = by + bh / 2;
    const iconFn = ICONS[a.icon] ?? (() => circle(0, 0, 6, { fill: accent }));
    const firstBaseline = cy - ((lines.length - 1) * lineH) / 2 + 4.5;
    const lineEls = lines.map((ln, li) =>
      text(ln, { x: textX, y: firstBaseline + li * lineH, fill: THEME.text, 'font-size': 12.5, 'font-weight': 600 }),
    );
    body.push(g({ class: 'af-agent', 'data-agent': i, role: 'button', tabindex: 0, 'aria-label': `${a.name} Agent` }, [
      rect({ class: 'af-agent-btn', x: 8, y: by, width: W - 16, height: bh, rx: 9, fill: '#ffffff12', stroke: accent, 'stroke-opacity': 0.4, 'stroke-width': 1 }),
      circle(27, cy, 14, { fill: '#0c0620', stroke: accent, 'stroke-opacity': 0.65, 'stroke-width': 1.3 }),
      g({ transform: transform({ x: 27, y: cy, scale: 0.66 }) }, [iconFn()]),
      ...lineEls,
    ]));
    by += bh + btnGap;
  });
  return { node: g({ 'data-furniture': 'callout', class: 'af-callout', filter: 'url(#af-shadow)' }, body), width: W, height };
}

/**
 * Brand plate — fixed product branding (tool chrome). Text is data, passed in;
 * the engine core never hardcodes an org name. Drawn top-left by the scene.
 */
export function brandPlate(title: string, mark: string): SVGGElement {
  const w = 214, h = 62;
  return g({ 'data-furniture': 'brand', filter: 'url(#af-shadow)' }, [
    rect({ x: 0, y: 0, width: w, height: h, rx: 12, fill: 'url(#af-plate)', stroke: THEME.violet, 'stroke-opacity': 0.7, 'stroke-width': 1.5 }),
    rect({ x: 0, y: 0, width: 6, height: h, rx: 3, fill: THEME.cyan }),
    // little factory glyph
    g({ transform: transform({ x: 30, y: 31 }) }, [
      path('M -12 8 V -6 L -2 0 V -6 L 8 0 V 8 Z', { fill: THEME.cyan }),
      rect({ x: -12, y: 8, width: 24, height: 3, fill: THEME.cyan }),
    ]),
    text(title, { x: 52, y: 30, fill: THEME.text, 'font-size': 18, 'font-weight': 800, 'letter-spacing': '0.5' }),
    text(mark, { x: 52, y: 47, fill: THEME.cyan, 'font-size': 11, 'font-weight': 700, 'letter-spacing': '2' }),
  ]);
}

/**
 * Speech bubble for the actor-intro beat. Width grows with text length (caller
 * may pass an explicit width). Tail points down-left toward the avatar.
 */
export function speechBubble(role: string, quote: string, w = 300, tailX = w / 2): SVGGElement {
  const lines = wrapText(quote, Math.max(14, Math.floor((w - 28) / 7)));
  const h = 30 + lines.length * 19 + 12;
  const fill = '#160a2cee';
  const tx = Math.max(22, Math.min(w - 22, tailX));
  const stroke = { stroke: THEME.cyan, 'stroke-opacity': 0.6, 'stroke-width': 1.5 };
  const body: SVGElement[] = [
    // downward tail (drawn first so the body hides its seam) — points at the avatar
    path(`M ${tx - 12} ${h - 4} L ${tx} ${h + 22} L ${tx + 12} ${h - 4} Z`, { fill, ...stroke, 'stroke-linejoin': 'round' }),
    rect({ x: 0, y: 0, width: w, height: h, rx: 14, fill, ...stroke }),
    text(role.toUpperCase(), { x: 16, y: 24, fill: THEME.cyan, 'font-size': 12, 'font-weight': 800, 'letter-spacing': '1.5' }),
  ];
  lines.forEach((ln, i) => body.push(text(ln, { x: 16, y: 48 + i * 19, fill: THEME.text, 'font-size': 15 })));
  return g({ 'data-furniture': 'speech', class: 'af-speech', filter: 'url(#af-shadow)' }, body);
}

/** Naive word-wrap by character budget (offline, no text-measuring needed). */
function wrapText(s: string, maxChars: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    if ((cur + ' ' + word).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = word;
    } else {
      cur = (cur + ' ' + word).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
