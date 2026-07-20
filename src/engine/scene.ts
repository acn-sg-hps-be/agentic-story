/**
 * scene.ts — builds the interactive SVG stage for one plot.
 *
 * Domain-neutral. Layout model (agreed with the presenter):
 *  - The belt shows ONLY agent stations (varied "supercomputer" towers).
 *  - The INPUT is the human avatar at front-left (click it for the input popup).
 *  - OUTPUTS are not belt nodes; the object glides off the right end in its
 *    final governed state, and each agent describes what it produces.
 *  - Top callout cards are staggered (two rows) with leader lines to their
 *    station, so labels never overlap as station count grows.
 *
 * Built PER PLOT; rebuild on plot change.
 */

import { svgRoot, g, text, transform, path, circle } from './svg';
import {
  defs, THEME, ambientBackdrop, floorGlow, beltRibbon, machineHousing,
  orchestrator, speechBubble, calloutCard, renderObjectState, AVATARS,
} from './primitives';
import type { Scenario, Plot, Branding, ObjectStateSpec } from './types';

export type NodeKind = 'input' | 'station' | 'output';
type Pt = { x: number; y: number };

export interface SceneHandlers {
  onNode?: (kind: NodeKind, id: string) => void;
  onAgent?: (stationId: string, agentIndex: number) => void;
}

export interface ObjectController {
  isVisible(): boolean;
  setStart(state: ObjectStateSpec): void;
  toNode(stationId: string, state: ObjectStateSpec): void;
  toEnd(state: ObjectStateSpec): void;
  hide(): void;
}

export interface SceneHandle {
  svg: SVGSVGElement;
  object: ObjectController;
  setActive(stationId: string | null): void;
  showPersona(inputId: string | null): void;
}

const W = 1280, H = 720;
const leftFront: Pt = { x: 180, y: 540 };
const rightFront: Pt = { x: 1100, y: 540 };
const ctrl: Pt = { x: 640, y: 322 };
const bez = (t: number): Pt => ({
  x: (1 - t) ** 2 * leftFront.x + 2 * (1 - t) * t * ctrl.x + t * t * rightFront.x,
  y: (1 - t) ** 2 * leftFront.y + 2 * (1 - t) * t * ctrl.y + t * t * rightFront.y,
});
const peakY = bez(0.5).y;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const scaleAt = (y: number) => 0.9 + clamp01((y - peakY) / (leftFront.y - peakY)) * 0.1;

export function buildScene(
  scenario: Scenario,
  plot: Plot,
  _branding: Branding,
  handlers: SceneHandlers = {},
): SceneHandle {
  const svg = svgRoot(`0 0 ${W} ${H}`, { class: 'af-stage', role: 'img', 'aria-label': scenario.title });
  svg.appendChild(defs());
  svg.appendChild(ambientBackdrop(W, H));
  svg.appendChild(floorGlow(W / 2, 590, W * 0.92));

  const refs = new Set(plot.steps.map((s) => s.ref));
  const stations = scenario.stations.filter((s) => refs.has(s.id));
  const inputs = scenario.inputs.filter((i) => refs.has(i.id));
  const m = stations.length;

  // stations along the arch, leaving the ends for entry/exit flow
  const stationT = (k: number) => (m > 1 ? 0.2 + 0.6 * (k / (m - 1)) : 0.5);
  const pointById = new Map<string, { point: Pt; scale: number }>();
  const startPoint = bez(0.05), endPoint = bez(0.95);

  // ---- station towers (behind the belt; NOT clickable — only agents are) --
  const structures: Array<{ id: string; y: number; node: SVGGElement; machine: SVGGElement }> = [];
  stations.forEach((st, k) => {
    const p = bez(stationT(k));
    const s = scaleAt(p.y);
    pointById.set(st.id, { point: p, scale: s });
    const tower = machineHousing(st.variant ?? k);
    tower.classList.add('af-dim');
    const wrap = g({ transform: `translate(${p.x} ${p.y - s * 4}) scale(${s})` }, [tower]);
    structures.push({ id: st.id, y: p.y, node: wrap, machine: tower });
  });
  structures.sort((a, b) => a.y - b.y).forEach((l) => svg.appendChild(l.node));

  // ---- belt in front of the towers ----------------------------------------
  const beltPts = Array.from({ length: 26 }, (_, i) => bez(i / 25));
  svg.appendChild(beltRibbon(beltPts, (i) => 56 * scaleAt(beltPts[i].y)));
  [0.14, 0.32, 0.68, 0.86].forEach((t) => {
    const p = bez(t);
    const dx = 2 * (1 - t) * (ctrl.x - leftFront.x) + 2 * t * (rightFront.x - ctrl.x);
    const dy = 2 * (1 - t) * (ctrl.y - leftFront.y) + 2 * t * (rightFront.y - ctrl.y);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    svg.appendChild(g({ transform: `translate(${p.x} ${p.y}) rotate(${ang}) scale(${scaleAt(p.y)})`, class: 'af-flow-arrow' }, [
      path('M -6 -7 L 6 0 L -6 7', { fill: 'none', stroke: THEME.cyan, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    ]));
  });

  // ---- orchestrator control rays to each station (active one brightens) ---
  const orchAnchor = { x: 640, y: 500 };
  const rayLayer = g({ 'data-layer': 'rays' });
  const rayById = new Map<string, SVGElement>();
  stations.forEach((st) => {
    const pl = pointById.get(st.id)!;
    const top = { x: pl.point.x, y: pl.point.y - 88 * pl.scale };
    const ang = (Math.atan2(top.y - orchAnchor.y, top.x - orchAnchor.x) * 180) / Math.PI;
    const line = path(`M ${orchAnchor.x} ${orchAnchor.y} L ${top.x} ${top.y}`, {
      class: 'af-ray-line', fill: 'none', stroke: THEME.amber, 'stroke-width': 2.5, 'stroke-linecap': 'round',
    });
    // arrowhead at the station end, pointing along the ray (direction obvious)
    const arrow = g({ transform: `translate(${top.x} ${top.y}) rotate(${ang})` }, [
      path('M -15 -9 L 0 0 L -15 9 Z', { fill: THEME.amber }),
    ]);
    const ray = g({ class: 'af-ray' }, [line, arrow]);
    rayById.set(st.id, ray);
    rayLayer.appendChild(ray);
  });
  svg.appendChild(rayLayer);

  // ---- travelling object (front) ------------------------------------------
  const objInner = g({ class: 'af-obj-inner' });
  const objRoot = g({ class: 'af-object' }, [objInner]);
  objRoot.style.opacity = '0';
  svg.appendChild(objRoot);

  const tf = (p: Pt, scale: number) => `translate(${p.x}px, ${p.y - 34 * scale}px) scale(${0.62 * scale})`;
  const morph = (state: ObjectStateSpec) => {
    objInner.replaceChildren(renderObjectState(state));
    objRoot.classList.remove('af-pop'); void objRoot.getBoundingClientRect(); objRoot.classList.add('af-pop');
  };
  const object: ObjectController = {
    isVisible: () => objRoot.style.opacity === '1',
    setStart(state) {
      morph(state);
      objRoot.classList.add('af-no-anim');
      objRoot.style.transform = tf(startPoint, scaleAt(startPoint.y));
      void objRoot.getBoundingClientRect();
      objRoot.classList.remove('af-no-anim');
      objRoot.style.opacity = '1';
    },
    toNode(stationId, state) {
      morph(state);
      const pl = pointById.get(stationId);
      if (pl) objRoot.style.transform = tf(pl.point, pl.scale);
      objRoot.style.opacity = '1';
    },
    toEnd(state) { morph(state); objRoot.style.transform = tf(endPoint, scaleAt(endPoint.y)); objRoot.style.opacity = '1'; },
    hide() { objRoot.style.opacity = '0'; },
  };

  // ---- persona avatars = the INPUT (clickable) ----------------------------
  const bubbleByInput = new Map<string, SVGGElement>();
  inputs.forEach((inp, i) => {
    const persona = inp.persona;
    const ax = 150 + i * 118, ay = 560;
    const avatarFn = AVATARS[persona?.avatar ?? 'person'] ?? AVATARS.person;
    svg.appendChild(g({
      transform: `translate(${ax} ${ay}) scale(1.08)`,
      class: 'af-clickable', 'data-node-id': inp.id, 'data-kind': 'input',
      role: 'button', tabindex: 0, 'aria-label': `${inp.label} — details`,
    }, [avatarFn()]));
    if (persona) {
      // bubble sits above the avatar; its tail points down at the avatar (ax)
      const bw = 240, bleft = ax - 120;
      const bubble = g({ class: 'af-persona-bubble', transform: transform({ x: bleft, y: 292 }) }, [
        speechBubble(persona.role, persona.quote, bw, ax - bleft),
      ]);
      bubble.style.opacity = '0';
      bubbleByInput.set(inp.id, bubble);
      svg.appendChild(bubble);
    }
  });

  // ---- orchestrator (front-centre, illustrative) — label BELOW it ---------
  svg.appendChild(g({ transform: `translate(640 520) scale(0.38)` }, [orchestrator()]));
  svg.appendChild(text('AGENTIC ORCHESTRATOR', {
    x: 640, y: 545, fill: THEME.cyan, 'font-size': 12, 'font-weight': 800, 'letter-spacing': 2, 'text-anchor': 'middle', opacity: 0.85,
  }));

  // ---- top callout cards (staggered) + leaders ----------------------------
  const leaderLayer = g({ 'data-layer': 'leaders' });
  const cardLayer = g({ 'data-layer': 'cards' });
  svg.appendChild(leaderLayer);
  svg.appendChild(cardLayer);

  const currentCards = new Map<string, SVGGElement>();
  const x0 = 200, x1 = 1080;
  stations.forEach((st, k) => {
    const cx = m > 1 ? x0 + (x1 - x0) * (k / (m - 1)) : (x0 + x1) / 2;
    // clear of the brand bar; only stagger a second row when crowded (>4)
    const cardTop = m > 4 && k % 2 === 1 ? 240 : 104;
    const agents = st.agents.map((a) => ({ name: a.name, icon: a.icon }));
    const cc = calloutCard(st.label, undefined, agents, THEME.cyan);
    // card carries data-node-id so agent buttons can resolve their station,
    // but the card/station itself is NOT clickable (only the agent buttons).
    const wrap = g({
      transform: transform({ x: cx - cc.width / 2, y: cardTop }),
      class: 'af-card-wrap', 'data-node-id': st.id, 'data-kind': 'station',
    }, [cc.node]);
    currentCards.set(st.id, wrap);
    cardLayer.appendChild(wrap);

    const stp = pointById.get(st.id)!;
    const objTopY = stp.point.y - 104 * stp.scale;
    const y0 = cardTop + cc.height;
    const my = (y0 + objTopY) / 2;
    leaderLayer.appendChild(path(`M ${cx} ${y0} C ${cx} ${my}, ${stp.point.x} ${my}, ${stp.point.x} ${objTopY}`, {
      fill: 'none', stroke: THEME.cyan, 'stroke-opacity': 0.28, 'stroke-width': 1.5, 'stroke-dasharray': '1 5', 'stroke-linecap': 'round',
    }));
    leaderLayer.appendChild(circle(stp.point.x, objTopY, 3, { fill: THEME.cyan, 'fill-opacity': 0.8 }));
  });

  // ---- interaction (event delegation) -------------------------------------
  const fire = (target: Element) => {
    const agentEl = target.closest('[data-agent]');
    const nodeEl = target.closest('[data-node-id]');
    if (agentEl && nodeEl && nodeEl.getAttribute('data-kind') === 'station') {
      handlers.onAgent?.(nodeEl.getAttribute('data-node-id')!, Number(agentEl.getAttribute('data-agent')));
    } else if (nodeEl && nodeEl.getAttribute('data-kind') === 'input') {
      handlers.onNode?.('input', nodeEl.getAttribute('data-node-id')!);
    }
  };
  svg.addEventListener('click', (e) => fire(e.target as Element));
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const t = e.target as Element;
      if (t.closest('[data-agent]') || t.closest('[data-node-id]')) { e.preventDefault(); fire(t); }
    }
  });

  return {
    svg,
    object,
    setActive(stationId) {
      structures.forEach(({ id, machine }) => {
        const on = id === stationId;
        machine.classList.toggle('af-active', on);
        machine.classList.toggle('af-dim', !on);
      });
      currentCards.forEach((el, id) => el.classList.toggle('af-current', id === stationId));
      rayById.forEach((el, id) => el.classList.toggle('af-ray-active', id === stationId));
    },
    showPersona(inputId) {
      bubbleByInput.forEach((el, id) => { el.style.opacity = id === inputId ? '1' : '0'; });
    },
  };
}
