import { resolvePackageVersion } from './packages';

export type VersionSpecifier = string;
export type ResolvedVersion = string;

/**
 * Resolve a comma-separated list of Expo SDK version specifiers to concrete versions.
 *
 * Supported specifiers:
 * - `next`, `canary` — passed through as-is (dist-tags)
 * - `52` — numeric, normalised to its major
 * - `latest` — resolved to current stable SDK major version
 * - `latest-N` — resolved to (latest major - N)
 *
 * The result preserves input order and contains no duplicates.
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

  // Deduplicate, because `latest,57` collapses to the same major once resolved. Duplicates
  // would produce identical matrix jobs and collide on artifact names.
  const resolved = await Promise.all(specs.map((spec) => resolveSpec(spec, getLatest)));

  return [...new Set(resolved)];
}

const LATEST_OFFSET_RE = /^latest-(\d+)$/;
const NUMERIC_RE = /^\d+$/;

/** Oldest SDK these actions still work with. Applies to every specifier that resolves to a major. */
const MIN_SDK_VERSION = 45;

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
    return checkNotTooOld(parseInt(spec, 10), spec);
  }

  if (spec === 'latest') {
    return String(await getLatest());
  }

  const match = spec.match(LATEST_OFFSET_RE);
  if (match) {
    const offset = parseInt(match[1], 10);
    return checkNotTooOld((await getLatest()) - offset, spec);
  }

  throw new Error(
    `Invalid expo-version specifier: '${spec}'. Expected: next, canary, latest, latest-N, or a numeric SDK version (e.g. 52)`
  );
}

/** Normalise a resolved major to a string, rejecting SDKs these actions cannot set up. */
function checkNotTooOld(version: number, spec: string): ResolvedVersion {
  if (version < MIN_SDK_VERSION) {
    throw new Error(
      `Resolved version ${version} (from '${spec}') is too old. Minimum supported SDK is ${MIN_SDK_VERSION}.`
    );
  }

  return String(version);
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
