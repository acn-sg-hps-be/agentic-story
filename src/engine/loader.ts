/**
 * loader.ts — fetch + parse + validate a scenario JSON, and resolve its media
 * paths. Fully offline: everything is fetched from the app's own origin.
 */

import { validateScenario } from './schema';
import type { LoadedScenario, Scenario, ScenarioRef } from './types';

export class ScenarioError extends Error {
  constructor(message: string, readonly details: string[] = []) {
    super(message);
    this.name = 'ScenarioError';
  }
}

/** Load the scenario registry (list of available scenarios). */
export async function loadRegistry(url = 'scenarios/index.json'): Promise<ScenarioRef[]> {
  const res = await fetch(url);
  if (!res.ok) throw new ScenarioError(`Could not load the scenario list (${res.status}).`);
  const data = await res.json();
  if (!data || !Array.isArray(data.scenarios)) throw new ScenarioError('scenarios/index.json is missing a "scenarios" array.');
  return data.scenarios as ScenarioRef[];
}

/** Fetch, parse and validate one scenario. Throws ScenarioError on failure. */
export async function loadScenario(path: string): Promise<LoadedScenario> {
  let res: Response;
  try {
    res = await fetch(path);
  } catch {
    throw new ScenarioError(`Could not reach the scenario file at "${path}".`);
  }
  if (!res.ok) throw new ScenarioError(`Scenario file "${path}" could not be loaded (${res.status}).`);

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ScenarioError(`Scenario file "${path}" is not valid JSON.`);
  }

  const result = validateScenario(data);
  if (!result.ok) {
    throw new ScenarioError('This scenario has some problems that need fixing:', result.errors);
  }
  if (result.warnings.length) {
    console.warn('[scenario warnings]\n' + result.warnings.map((w) => ' • ' + w).join('\n'));
  }

  return { scenario: data as Scenario, baseUrl: dirOf(path) };
}

/** Directory portion of a path, e.g. "scenarios/hdb/scenario.json" -> "scenarios/hdb/". */
function dirOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i >= 0 ? path.slice(0, i + 1) : '';
}

/** Resolve a scenario-relative media path to a fetchable URL (or null if none). */
export function resolveMedia(baseUrl: string, media: string | undefined): string | null {
  if (!media) return null;
  if (/^(https?:)?\/\//.test(media) || media.startsWith('/')) return media;
  return baseUrl + media;
}
