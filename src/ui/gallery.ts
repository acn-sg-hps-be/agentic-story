/**
 * gallery.ts — an overlay showing every code-drawn primitive with the name to
 * use in the scenario JSON. Lets the presenter see what avatars, station towers,
 * object bases, badges and agent icons are available to configure.
 */

import { svgRoot, g, transform } from '../engine/svg';
import { defs, BASES, BADGES, ICONS, AVATARS, machineHousing, renderObjectState } from '../engine/primitives';

export function openGallery(host: HTMLElement): void {
  const overlay = document.createElement('div');
  overlay.className = 'af-gallery-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const panel = document.createElement('div');
  panel.className = 'af-gallery-panel';
  overlay.appendChild(panel);

  const close = document.createElement('button');
  close.className = 'af-modal-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close');
  close.onclick = () => overlay.remove();
  panel.appendChild(close);

  const h = document.createElement('h2');
  h.textContent = 'Object gallery';
  panel.appendChild(h);
  const note = document.createElement('p');
  note.className = 'af-gallery-note';
  note.textContent = 'All code-drawn SVG (no asset files). Use these names in the scenario JSON.';
  panel.appendChild(note);

  const cell = (label: string, node: SVGGElement, vb: string): HTMLElement => {
    const d = document.createElement('div');
    d.className = 'af-gallery-cell';
    const svg = svgRoot(vb);
    svg.appendChild(defs());
    svg.appendChild(node);
    d.appendChild(svg);
    const l = document.createElement('div');
    l.className = 'af-gallery-label';
    l.textContent = label;
    d.appendChild(l);
    return d;
  };
  const section = (title: string, cells: HTMLElement[]) => {
    const s = document.createElement('h3');
    s.className = 'af-gallery-h3';
    s.textContent = title;
    panel.appendChild(s);
    const grid = document.createElement('div');
    grid.className = 'af-gallery-grid';
    cells.forEach((c) => grid.appendChild(c));
    panel.appendChild(grid);
  };

  section('Avatars — persona.avatar', Object.keys(AVATARS).map((n) =>
    cell(n, g({ transform: transform({ y: 40 }) }, [AVATARS[n]()]), '-64 -150 128 200')));
  section('Station towers — station.variant', [0, 1, 2, 3].map((v) =>
    cell(String(v), g({ transform: transform({ y: 58 }) }, [machineHousing(v)]), '-64 -120 128 190')));
  section('Object bases — objectStates.base', Object.keys(BASES).map((n) =>
    cell(n, renderObjectState({ base: n }), '-82 -72 164 148')));
  section('Badges — objectStates.badges', Object.keys(BADGES).map((n) =>
    cell(n, g({ transform: transform({ scale: 1.6 }) }, [BADGES[n]()]), '-40 -40 80 80')));
  section('Agent icons — agent.icon', Object.keys(ICONS).map((n) =>
    cell(n, g({ transform: transform({ scale: 2.6 }) }, [ICONS[n]()]), '-40 -40 80 80')));

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);

  host.appendChild(overlay);
}
