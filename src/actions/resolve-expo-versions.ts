import { getBooleanInput, getInput, info, setOutput } from '@actions/core';

import { executeAction } from '../actions';
import { resolveExpoVersions, toTemplateTag } from '../resolveExpoVersions';

executeAction(runAction);

async function runAction() {
  const input = getInput('expo-version') || 'latest';
  const single = !getInput('single') ? false : getBooleanInput('single');

  info(`Resolving expo-version: ${input}`);

  const versions = await resolveExpoVersions(input);
  const json = JSON.stringify(versions);

  info(`Resolved versions: ${json}`);
  setOutput('versions', json);

  if (!single) {
    return;
  }

  if (versions.length !== 1) {
    throw new Error(
      `Expected 'expo-version' to resolve to exactly one version, but '${input}' resolved to ${versions.length}: ${versions.join(', ')}`
    );
  }

  setOutput('resolved-version', versions[0]);
  setOutput('template-tag', toTemplateTag(versions[0]));
}
