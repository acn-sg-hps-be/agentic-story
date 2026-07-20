/**
 * types.ts — the scenario schema, expressed as TypeScript. This is the single
 * source of truth for what a scenario JSON may contain. Documented for authors
 * in SCHEMA.md. The engine is domain-neutral: nothing here mentions any story.
 */

/** An agent inside a station. `icon` names an `icon:*` primitive. */
export interface Agent {
  name: string;
  icon: string;
  /** Optional short "what it does" shown in the agent's popup. */
  description?: string;
  /** Optional "what it produces" shown in the agent's popup. */
  output?: string;
  /** Optional per-agent media (image/video). Falls back to the station media. */
  media?: string;
}

/** A composable visual state: one base + zero-or-more badges (primitive names). */
export interface ObjectStateSpec {
  base: string;
  badges?: string[];
}

/** The human who supplies an input (the "human factor"). */
export interface Persona {
  role: string;
  quote: string;
  /** Names an `avatar:*` primitive; defaults to `person`. */
  avatar?: string;
}

export interface InputNode {
  id: string;
  label: string;
  /** Shape token: an object base (envelope/chat/…) or an icon glyph. */
  icon: string;
  description: string;
  media?: string;
  /** Optional "the input format" line shown in the input popup. */
  inputFormat?: string;
  /** Object state the item starts in; must exist in `objectStates`. */
  startsAs: string;
  persona?: Persona;
}

export interface StationNode {
  id: string;
  label: string;
  agents: Agent[];
  description: string;
  media?: string;
  /** Object state applied when the item reaches this station. */
  transformTo: string;
  /** Optional station tower look 0..3; defaults to a per-index variant. */
  variant?: number;
}

export interface OutputNode {
  id: string;
  label: string;
  icon: string;
  description: string;
  media?: string;
  /** Optional punchy value headline for the final outcomes bar; else label. */
  value?: string;
  /** Object state the emitted output is shown in. */
  fromState: string;
}

export type StepType = 'actor-intro' | 'input-appear' | 'move-to' | 'process' | 'output-emit';

export interface Step {
  type: StepType;
  /** id of the node this step refers to (input/station/output). */
  ref: string;
  caption: string;
  /** milliseconds this step dwells during autoplay. */
  dwell: number;
  /** optional media id to surface (reserved; popups use node/agent media). */
  media?: string;
  /** optional per-step override of the station's transformTo. */
  transformTo?: string;
}

export interface Plot {
  id: string;
  name: string;
  steps: Step[];
}

export interface Scenario {
  id: string;
  title: string;
  subtitle?: string;
  objectStates: Record<string, ObjectStateSpec>;
  inputs: InputNode[];
  stations: StationNode[];
  outputs: OutputNode[];
  plots: Plot[];
}

/** App-level product branding (tool chrome, NOT story content). */
export interface Branding {
  title: string;
  mark: string;
  /** Optional drop-in logo image path; defaults to the code-drawn mark. */
  logo?: string;
}

/** A scenario after loading: parsed data + the base URL its media resolves against. */
export interface LoadedScenario {
  scenario: Scenario;
  /** Directory URL of the scenario JSON; media paths resolve relative to it. */
  baseUrl: string;
}

/** Registry entry from scenarios/index.json. */
export interface ScenarioRef {
  id: string;
  title: string;
  path: string;
}
