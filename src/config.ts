/**
 * config.ts — app-level configuration, set before the build.
 *
 * This is the ONE place the app names a concrete project. It deliberately sits
 * outside `src/engine/**`, which must stay domain-neutral.
 */

/** Folder under `public/` that holds one subfolder per project. */
export const PROJECTS_ROOT = 'projects/';

/** Project used when no `?project=` query parameter is supplied. */
export const DEFAULT_PROJECT = 'hdb';

/** Product name shown in the brand bar when a project does not override it. */
export const PRODUCT_NAME = 'Agentic Factory';

/**
 * Project folder names are used to build a fetch path, so keep them to plain
 * path-safe characters. Requiring the first character to be alphanumeric or "_"
 * rejects "..", "./", slashes and absolute URLs, which would otherwise resolve
 * somewhere confusing. ("_" is allowed so `?project=_template` previews the
 * starter project.)
 */
const VALID_ID = /^[A-Za-z0-9_][A-Za-z0-9._-]*$/;

/**
 * Resolve the project id from a URL, falling back to DEFAULT_PROJECT when the
 * parameter is absent or malformed.
 */
export function resolveProjectId(search: string = location.search): string {
  const raw = new URLSearchParams(search).get('project')?.trim();
  if (!raw) return DEFAULT_PROJECT;
  if (!VALID_ID.test(raw)) {
    console.warn(`[config] Ignoring invalid ?project=${raw}; using "${DEFAULT_PROJECT}".`);
    return DEFAULT_PROJECT;
  }
  return raw;
}

/** Folder URL (trailing slash) for a project id. */
export function projectDir(id: string): string {
  return `${PROJECTS_ROOT}${id}/`;
}
