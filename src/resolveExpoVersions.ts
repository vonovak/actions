import { resolvePackageVersion } from './packages';

export type VersionSpecifier = string;
export type ResolvedVersion = string;

/**
 * Resolve a comma-separated list of Expo SDK version specifiers to concrete versions.
 *
 * Supported specifiers:
 * - `next`, `canary` — passed through as-is (dist-tags)
 * - `52` — numeric, passed through as-is
 * - `latest` — resolved to current stable SDK major version
 * - `latest-N` — resolved to (latest major - N)
 */
export async function resolveExpoVersions(
  input: string,
  fetchLatestVersion: () => Promise<number> = fetchLatestExpoMajor
): Promise<ResolvedVersion[]> {
  const specs = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (specs.length === 0) {
    throw new Error('expo-version input is empty');
  }

  // Memoize the promise, not the value, so concurrent specs share a single lookup
  let latestVersion: Promise<number> | null = null;
  const getLatest = () => (latestVersion ??= fetchLatestVersion());

  return Promise.all(specs.map((spec) => resolveSpec(spec, getLatest)));
}

const LATEST_OFFSET_RE = /^latest-(\d+)$/;
const NUMERIC_RE = /^\d+$/;

/** Dist-tags that map to no fixed SDK major. Both `expo` and the app templates publish these. */
const DIST_TAGS = new Set(['next', 'canary']);

async function resolveSpec(
  spec: string,
  getLatest: () => Promise<number>
): Promise<ResolvedVersion> {
  if (DIST_TAGS.has(spec)) {
    return spec;
  }

  if (NUMERIC_RE.test(spec)) {
    return spec;
  }

  if (spec === 'latest') {
    return String(await getLatest());
  }

  const match = spec.match(LATEST_OFFSET_RE);
  if (match) {
    const offset = parseInt(match[1], 10);
    const resolved = (await getLatest()) - offset;
    if (resolved < 45) {
      throw new Error(
        `Resolved version ${resolved} (from ${spec}) is too old. Minimum supported SDK is 45.`
      );
    }
    return String(resolved);
  }

  throw new Error(
    `Invalid expo-version specifier: '${spec}'. Expected: next, canary, latest, latest-N, or a numeric SDK version (e.g. 52)`
  );
}

/**
 * The npm dist-tag to request from an app template package.
 *
 * Templates publish `sdk-<major>` tags, but neither `sdk-next` nor `sdk-canary` exists.
 * The `expo` package takes the resolved version as-is instead, because it prunes old
 * `sdk-*` tags and accepts a bare major as a semver range.
 */
export function toTemplateTag(version: ResolvedVersion): string {
  return DIST_TAGS.has(version) ? version : `sdk-${version}`;
}

export async function fetchLatestExpoMajor(): Promise<number> {
  const version = await resolvePackageVersion('expo', 'latest');
  const major = parseInt(version.split('.')[0], 10);

  if (isNaN(major)) {
    throw new Error(`Failed to parse latest Expo SDK version from npm: ${version}`);
  }

  return major;
}
