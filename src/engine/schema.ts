/**
 * schema.ts — runtime validation of a scenario JSON.
 *
 * Produces friendly, human-readable messages (in the app's voice, not a stack
 * trace) so a malformed config is diagnosable by a non-programmer author.
 * Also confirms every referenced primitive exists, so nothing renders blank.
 */

import { BASES, BADGES, ICONS, AVATARS } from './primitives';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v);

/** Validate arbitrary parsed JSON as a Scenario. Never throws. */
export function validateScenario(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);
  const warn = (m: string) => warnings.push(m);

  if (!isObj(data)) {
    return { ok: false, errors: ['The scenario file is not a JSON object.'], warnings };
  }

  for (const key of ['id', 'title'] as const) {
    if (!isStr(data[key])) err(`Missing or invalid "${key}" (expected a string).`);
  }

  // objectStates ----------------------------------------------------------
  const stateNames = new Set<string>();
  if (!isObj(data.objectStates)) {
    err('Missing "objectStates" (expected an object of named visual states).');
  } else {
    for (const [name, spec] of Object.entries(data.objectStates)) {
      stateNames.add(name);
      if (!isObj(spec) || !isStr(spec.base)) {
        err(`objectStates."${name}" must have a string "base".`);
        continue;
      }
      if (!BASES[spec.base]) err(`objectStates."${name}" uses unknown base "${spec.base}". Known bases: ${Object.keys(BASES).join(', ')}.`);
      if (spec.badges !== undefined) {
        if (!Array.isArray(spec.badges)) err(`objectStates."${name}".badges must be an array.`);
        else for (const b of spec.badges) {
          if (!isStr(b) || !BADGES[b]) err(`objectStates."${name}" uses unknown badge "${String(b)}". Known badges: ${Object.keys(BADGES).join(', ')}.`);
        }
      }
    }
  }

  const ids = new Set<string>();
  const checkId = (id: unknown, where: string): string | null => {
    if (!isStr(id)) { err(`${where}: missing string "id".`); return null; }
    if (ids.has(id)) err(`Duplicate id "${id}" (${where}). Ids must be unique across all nodes.`);
    ids.add(id);
    return id;
  };
  const checkState = (name: unknown, where: string) => {
    if (!isStr(name)) { err(`${where}: expected an object-state name (string).`); return; }
    if (!stateNames.has(name)) err(`${where}: references object state "${name}" which is not defined in objectStates.`);
  };
  const checkShape = (token: unknown, where: string) => {
    if (!isStr(token)) { err(`${where}: "icon" must be a string.`); return; }
    if (!BASES[token] && !ICONS[token]) warn(`${where}: icon "${token}" is neither a known base nor icon; a neutral placeholder will show.`);
  };

  // inputs ----------------------------------------------------------------
  if (!Array.isArray(data.inputs) || data.inputs.length === 0) {
    err('"inputs" must be a non-empty array.');
  } else {
    data.inputs.forEach((inp, i) => {
      const w = `inputs[${i}]`;
      if (!isObj(inp)) { err(`${w} must be an object.`); return; }
      checkId(inp.id, w);
      if (!isStr(inp.label)) err(`${w}: missing "label".`);
      checkShape(inp.icon, w);
      checkState(inp.startsAs, `${w}.startsAs`);
      if (inp.persona !== undefined) {
        if (!isObj(inp.persona) || !isStr(inp.persona.role) || !isStr(inp.persona.quote)) {
          err(`${w}.persona must have string "role" and "quote".`);
        } else if (inp.persona.avatar !== undefined && !AVATARS[inp.persona.avatar as string]) {
          warn(`${w}.persona.avatar "${String(inp.persona.avatar)}" is unknown; "person" will be used. Known: ${Object.keys(AVATARS).join(', ')}.`);
        }
      }
    });
  }

  // stations --------------------------------------------------------------
  if (!Array.isArray(data.stations) || data.stations.length === 0) {
    err('"stations" must be a non-empty array.');
  } else {
    data.stations.forEach((st, i) => {
      const w = `stations[${i}]`;
      if (!isObj(st)) { err(`${w} must be an object.`); return; }
      checkId(st.id, w);
      if (!isStr(st.label)) err(`${w}: missing "label".`);
      checkState(st.transformTo, `${w}.transformTo`);
      if (!Array.isArray(st.agents) || st.agents.length === 0) {
        err(`${w}.agents must be a non-empty array.`);
      } else {
        st.agents.forEach((a, j) => {
          const aw = `${w}.agents[${j}]`;
          if (!isObj(a) || !isStr(a.name)) { err(`${aw}: missing string "name".`); return; }
          if (!isStr(a.icon) || !ICONS[a.icon]) err(`${aw}: unknown icon "${String(a.icon)}". Known icons: ${Object.keys(ICONS).join(', ')}.`);
        });
      }
    });
  }

  // outputs ---------------------------------------------------------------
  if (!Array.isArray(data.outputs) || data.outputs.length === 0) {
    err('"outputs" must be a non-empty array.');
  } else {
    data.outputs.forEach((out, i) => {
      const w = `outputs[${i}]`;
      if (!isObj(out)) { err(`${w} must be an object.`); return; }
      checkId(out.id, w);
      if (!isStr(out.label)) err(`${w}: missing "label".`);
      checkShape(out.icon, w);
      checkState(out.fromState, `${w}.fromState`);
    });
  }

  // plots -----------------------------------------------------------------
  const STEP_TYPES = new Set(['actor-intro', 'input-appear', 'move-to', 'process', 'output-emit']);
  if (!Array.isArray(data.plots) || data.plots.length === 0) {
    err('"plots" must be a non-empty array.');
  } else {
    data.plots.forEach((pl, i) => {
      const w = `plots[${i}]`;
      if (!isObj(pl)) { err(`${w} must be an object.`); return; }
      if (!isStr(pl.id)) err(`${w}: missing "id".`);
      if (!isStr(pl.name)) err(`${w}: missing "name".`);
      if (!Array.isArray(pl.steps) || pl.steps.length === 0) {
        err(`${w}.steps must be a non-empty array.`);
        return;
      }
      pl.steps.forEach((s, j) => {
        const sw = `${w}.steps[${j}]`;
        if (!isObj(s)) { err(`${sw} must be an object.`); return; }
        if (!isStr(s.type) || !STEP_TYPES.has(s.type)) err(`${sw}: type "${String(s.type)}" is invalid. Allowed: ${[...STEP_TYPES].join(', ')}.`);
        if (!isStr(s.ref) || !ids.has(s.ref)) err(`${sw}: ref "${String(s.ref)}" does not match any node id.`);
        if (!isStr(s.caption)) warn(`${sw}: missing "caption".`);
        if (!isNum(s.dwell)) warn(`${sw}: missing numeric "dwell"; a default will be used.`);
        if (s.transformTo !== undefined) checkState(s.transformTo, `${sw}.transformTo`);
      });
    });
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validate arbitrary parsed JSON as a project manifest (`project.json`).
 * Never throws. Same friendly voice as `validateScenario`.
 */
export function validateProject(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);

  if (!isObj(data)) {
    return { ok: false, errors: ['The project file is not a JSON object.'], warnings };
  }

  for (const key of ['id', 'title'] as const) {
    if (!isStr(data[key])) err(`Missing or invalid "${key}" (expected a string).`);
  }

  if (!Array.isArray(data.scenarios) || data.scenarios.length === 0) {
    err('"scenarios" must be a non-empty array of { id, title, path }.');
  } else {
    const seen = new Set<string>();
    data.scenarios.forEach((ref, i) => {
      const w = `scenarios[${i}]`;
      if (!isObj(ref)) { err(`${w} must be an object.`); return; }
      if (!isStr(ref.id)) err(`${w}: missing string "id".`);
      else if (seen.has(ref.id)) err(`${w}: duplicate id "${ref.id}". Scenario ids must be unique within a project.`);
      else seen.add(ref.id);
      if (!isStr(ref.title)) err(`${w}: missing string "title".`);
      if (!isStr(ref.path)) err(`${w}: missing string "path" (relative to the project folder).`);
    });
  }

  if (data.branding !== undefined) {
    if (!isObj(data.branding)) {
      err('"branding" must be an object with an optional "productName" and "logos".');
    } else {
      const b = data.branding;
      if (b.productName !== undefined && !isStr(b.productName)) err('branding.productName must be a string.');
      if (b.logos !== undefined) {
        if (!Array.isArray(b.logos)) err('branding.logos must be an array of { src, alt }.');
        else b.logos.forEach((logo, i) => {
          const w = `branding.logos[${i}]`;
          if (!isObj(logo)) { err(`${w} must be an object.`); return; }
          if (!isStr(logo.src)) err(`${w}: missing string "src" (relative to the project folder).`);
          if (!isStr(logo.alt)) err(`${w}: missing string "alt".`);
          if (logo.invert !== undefined && typeof logo.invert !== 'boolean') err(`${w}.invert must be true or false.`);
        });
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
