import { describe, expect, it } from 'bun:test';

import { resolveExpoVersions, toTemplateTag } from '../resolveExpoVersions';

const mockLatest = async () => 53;

describe(resolveExpoVersions, () => {
  it.each<[string, string[]]>([
    ['52', ['52']],
    ['next', ['next']],
    ['canary', ['canary']],
    ['latest', ['53']],
    ['latest-1', ['52']],
    ['latest-3', ['50']],
    ['latest,latest-1,next', ['53', '52', 'next']],
    [' latest , 52 , next ', ['53', '52', 'next']],
    ['55,latest,latest-2', ['55', '53', '51']],
  ])('%s -> %j', async (input, expected) => {
    expect(await resolveExpoVersions(input, mockLatest)).toEqual(expected);
  });

  it.each<[string, string]>([
    ['', 'empty'],
    ['foo', 'Invalid expo-version specifier'],
    ['latest-20', 'too old'],
  ])('%s throws %s', async (input, error) => {
    await expect(resolveExpoVersions(input, mockLatest)).rejects.toThrow(error);
  });

  it.each<[string, number]>([
    ['latest,latest-1,latest-2', 1],
    ['52,51', 0],
  ])('%s fetches latest %d time(s)', async (input, expected) => {
    let calls = 0;

    await resolveExpoVersions(input, async () => {
      calls++;
      return 53;
    });

    expect(calls).toBe(expected);
  });
});

describe(toTemplateTag, () => {
  it.each<[string, string]>([
    ['54', 'sdk-54'],
    ['next', 'next'],
    ['canary', 'canary'],
  ])('%s -> %s', (version, expected) => {
    expect(toTemplateTag(version)).toBe(expected);
  });
});
