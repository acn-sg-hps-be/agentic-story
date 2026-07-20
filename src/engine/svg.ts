/**
 * svg.ts — tiny, dependency-free helpers for building SVG DOM.
 *
 * The entire art system (primitives.ts) and the scene builder are composed
 * from these. No framework, no runtime deps: just document.createElementNS.
 */

export const SVG_NS = 'http://www.w3.org/2000/svg';

export type Attrs = Record<string, string | number | boolean | undefined>;

/** Create an SVG element with attributes and children. */
export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  setAttrs(node, attrs);
  for (const child of children) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function setAttrs(node: Element, attrs: Attrs): void {
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    node.setAttribute(k, v === true ? '' : String(v));
  }
}

/** A <g> group, optionally translated/rotated/scaled and class-tagged. */
export function g(attrs: Attrs = {}, children: (Node | string)[] = []): SVGGElement {
  return el('g', attrs, children);
}

/** Convenience translate/rotate/scale transform string builder. */
export function transform(opts: {
  x?: number;
  y?: number;
  rotate?: number;
  scale?: number;
}): string {
  const parts: string[] = [];
  if (opts.x !== undefined || opts.y !== undefined) {
    parts.push(`translate(${opts.x ?? 0} ${opts.y ?? 0})`);
  }
  if (opts.rotate !== undefined) parts.push(`rotate(${opts.rotate})`);
  if (opts.scale !== undefined) parts.push(`scale(${opts.scale})`);
  return parts.join(' ');
}

export const path = (d: string, attrs: Attrs = {}) => el('path', { d, ...attrs });
export const rect = (attrs: Attrs) => el('rect', attrs);
export const circle = (cx: number, cy: number, r: number, attrs: Attrs = {}) =>
  el('circle', { cx, cy, r, ...attrs });
export const line = (x1: number, y1: number, x2: number, y2: number, attrs: Attrs = {}) =>
  el('line', { x1, y1, x2, y2, ...attrs });
export const ellipse = (cx: number, cy: number, rx: number, ry: number, attrs: Attrs = {}) =>
  el('ellipse', { cx, cy, rx, ry, ...attrs });

/** SVG <text>. Text content is set as a child node (safe, no innerHTML). */
export function text(content: string, attrs: Attrs = {}): SVGTextElement {
  return el('text', attrs, [content]);
}

/** Build a root <svg> element sized to a viewBox. */
export function svgRoot(viewBox: string, attrs: Attrs = {}): SVGSVGElement {
  return el('svg', { xmlns: SVG_NS, viewBox, ...attrs });
}
