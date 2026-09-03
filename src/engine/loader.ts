/**
 * loader.ts — fetch + parse + validate a project manifest and its scenario
 * JSONs, and resolve their relative asset paths. Fully offline: everything is
 * fetched from the app's own origin.
 */

import { validateProject, validateScenario } from './schema';
import type { LoadedProject, LoadedScenario, ProjectLogo, ProjectManifest, Scenario } from './types';

export class ScenarioError extends Error {
  constructor(message: string, readonly details: string[] = []) {
    super(message);
    this.name = 'ScenarioError';
  }
}

/**
 * Fetch and parse one JSON config file. `label` names the file type so the
 * message reads naturally ("project file" / "scenario file").
 */
async function fetchJson(url: string, label: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ScenarioError(`Could not reach the ${label} at "${url}".`);
  }
  if (!res.ok) throw new ScenarioError(`The ${label} "${url}" could not be loaded (${res.status}).`);

  const body = await res.text();
  try {
    return JSON.parse(body);
  } catch {
    // A dev server with an index.html fallback answers an unknown path with the
    // app's own page and HTTP 200, so an HTML body here means the file is
    // simply not there — say that rather than blaming the JSON.
    if (/^\s*</.test(body)) {
      throw new ScenarioError(`No ${label} was found at "${url}" — the server returned a web page instead. Check that the folder and file name are right.`);
    }
    throw new ScenarioError(`The ${label} "${url}" is not valid JSON.`);
  }
}

/**
 * Load one project: fetch its `project.json`, validate it, and resolve every
 * scenario and logo path against the project folder. `dir` must end in "/".
 */
export async function loadProject(dir: string): Promise<LoadedProject> {
  const url = dir + 'project.json';
  const data = await fetchJson(url, 'project file');

  const result = validateProject(data);
  if (!result.ok) {
    throw new ScenarioError(`The project file "${url}" has some problems that need fixing:`, result.errors);
  }

  const manifest = data as ProjectManifest;
  return {
    manifest,
    baseUrl: dir,
    scenarios: manifest.scenarios.map((ref) => ({ ...ref, path: dir + ref.path })),
    logos: (manifest.branding?.logos ?? []).map((logo): ProjectLogo => ({
      ...logo,
      src: resolveMedia(dir, logo.src) ?? logo.src,
    })),
  };
}

/** Fetch, parse and validate one scenario. Throws ScenarioError on failure. */
export async function loadScenario(path: string): Promise<LoadedScenario> {
  const data = await fetchJson(path, 'scenario file');

  const result = validateScenario(data);
  if (!result.ok) {
    throw new ScenarioError('This scenario has some problems that need fixing:', result.errors);
  }
  if (result.warnings.length) {
    console.warn('[scenario warnings]\n' + result.warnings.map((w) => ' • ' + w).join('\n'));
  }

  return { scenario: data as Scenario, baseUrl: dirOf(path) };
}

/** Directory portion of a path, e.g. "a/b/scenario.json" -> "a/b/". */
function dirOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i >= 0 ? path.slice(0, i + 1) : '';
}

/** Resolve a base-relative asset path to a fetchable URL (or null if none). */
export function resolveMedia(baseUrl: string, media: string | undefined): string | null {
  if (!media) return null;
  if (/^(https?:)?\/\//.test(media) || media.startsWith('/')) return media;
  return baseUrl + media;
}
