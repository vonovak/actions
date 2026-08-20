<div align="center">
  <h1>expo/actions/resolve-expo-versions</h1>
  <p>Resolve Expo SDK version specifiers into concrete versions for matrix builds</p>
</div>

<p align="center">
  <a href="https://github.com/expo/actions/releases" title="Latest release">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/package-json/v/expo/actions?style=flat-square&color=0366D6&labelColor=49505A">
      <img alt="Latest release" src="https://img.shields.io/github/package-json/v/expo/actions?style=flat-square&color=0366D6&labelColor=D1D5DA" />
    </picture>
  </a>
  <a href="https://github.com/expo/actions/actions" title="Workflow status">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/actions/workflow/status/expo/actions/test.yml?branch=main&style=flat-square&labelColor=49505A">
      <img alt="Workflow status" src="https://img.shields.io/github/actions/workflow/status/expo/actions/test.yml?branch=main&style=flat-square&labelColor=D1D5DA" />
    </picture>
  </a>
</p>

<p align="center">
  <a href="#usage"><b>Usage</b></a>
  &nbsp;&nbsp;&mdash;&nbsp;&nbsp;
  <a href="#available-outputs"><b>Outputs</b></a>
  &nbsp;&nbsp;&mdash;&nbsp;&nbsp;
  <a href="#example-workflows"><b>Examples</b></a>
  &nbsp;&nbsp;&mdash;&nbsp;&nbsp;
  <a href="https://github.com/expo/actions/blob/main/CHANGELOG.md"><b>Changelog</b></a>
</p>

<br />

> **Warning**
> This sub action is experimental and might change without notice. Use it at your own risk

## Overview

`resolve-expo-versions` turns relative Expo SDK version specifiers into concrete versions. It exists so a workflow can say "the latest three SDK versions" without hardcoding numbers that go stale every release.

It accepts these specifiers, comma-separated:

| specifier  | resolves to                                            |
| ---------- | ------------------------------------------------------ |
| `52`       | itself, unchanged                                      |
| `latest`   | the current stable SDK major, from the npm `expo` tag   |
| `latest-N` | the current stable SDK major minus `N`                 |
| `next`, `canary` | itself, unchanged (dist-tag)                     |

The npm registry is queried at most once per run, and not at all when every specifier is already concrete. Resolving below SDK 45 is an error.

Pair it with [`build-expo-app`](../build-expo-app/README.md), which uses this action internally to resolve its own `expo-version` input.

## Usage

To use this action, add the following code to your workflow:

```yaml
- name: Resolve Expo versions
  id: versions
  uses: expo/actions/resolve-expo-versions@main
  with:
    expo-version: latest,latest-1,next

- name: Show the resolved versions
  run: echo '${{ steps.versions.outputs.versions }}' # ["57","56","next"]
```

### Configuration options

This action is customizable through variables defined in the [`action.yml`](action.yml).
Here is a summary of all the input options you can use.

| variable         | required | description                                                                                                                       |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **expo-version** | ❌       | Comma-separated version specifiers: numeric (`52`), `latest`, `latest-N`, `next`, or `canary`. Default is `latest`                 |
| **single**       | ❌       | Require exactly one resolved version (a list is rejected, not truncated), and set `resolved-version` and `template-tag`. Default is `false` |

### Available outputs

This action will set the following action outputs.

| output name          | description                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **versions**         | JSON array of resolved SDK versions, for use with `fromJSON()` in a matrix strategy               |
| **resolved-version** | The single resolved SDK version. Only set when `single` is `true`                                 |
| **template-tag**     | The npm dist-tag to request from an app template package. Only set when `single` is `true`        |

`template-tag` exists because templates publish `sdk-<major>` tags (`expo-template-blank-typescript@sdk-54`), while the `expo` package takes a bare major (`expo@54`). For `next` and `canary` the tag is the plain dist-tag.

## Example workflows

Resolve a set of versions in one job, then fan out over them:

```yaml
name: CI compatibility

on:
  schedule:
    - cron: '0 4 * * 1'
  workflow_dispatch:

jobs:
  versions:
    runs-on: ubuntu-latest
    outputs:
      versions: ${{ steps.versions.outputs.versions }}
    steps:
      - name: Resolve Expo versions
        id: versions
        uses: expo/actions/resolve-expo-versions@main
        with:
          expo-version: latest,latest-1,latest-2,next

  test:
    needs: versions
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        expo-version: ${{ fromJSON(needs.versions.outputs.versions) }}
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 📦 Install dependencies
        run: yarn install

      - name: Build Expo app
        uses: expo/actions/build-expo-app@main
        with:
          expo-version: ${{ matrix.expo-version }}
```

Each matrix job receives a concrete version, so the SDK under test appears in the job name and the npm registry is queried only once.

<div align="center">
  <br />
  with :heart:&nbsp;<strong>Expo</strong>
  <br />
</div>
