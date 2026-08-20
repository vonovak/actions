<div align="center">
  <h1>expo/actions/build-expo-app</h1>
  <p>Smoke-test a library against any Expo SDK version</p>
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

`build-expo-app` is a composite GitHub Action for checking that a library still works on a given Expo SDK version. It sets up an Expo app, bundles the JS, and optionally runs a real native build.

This action automatically handles:

- Creating a new Expo app from a template, or bumping an existing one to the target SDK
- Running `expo prebuild` to generate the native projects
- Bundling the JS with `expo export`
- Building the native app with `xcodebuild` on macOS runners, or Gradle elsewhere

Version resolution is delegated to [`resolve-expo-versions`](../resolve-expo-versions/README.md).

> [!NOTE]
> This action references a sibling action from the same commit, which requires GitHub Actions runner 2.336.0 or newer. That syntax is not available on GitHub Enterprise Server.

## Usage

To use this action, add the following code to your workflow:

```yaml
- name: Build Expo app
  uses: expo/actions/build-expo-app@main
  with:
    expo-version: latest # or 54, latest-1, next, canary
    setup-hook: |
      yarn add file:$GITHUB_WORKSPACE
```

### Configuration options

This action is customizable through variables defined in the [`action.yml`](action.yml).
Here is a summary of all the input options you can use.

| variable                | required | description                                                                                                                 |
| ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **expo-version**        | ✅       | Expo SDK version: numeric (`52`), `latest`, `latest-N` (`latest-1`, `latest-2`), `next`, or `canary`                          |
| **app-path**            | ❌       | Path where the app exists or will be created, also used as the project name. Default is `expo-test-app`                       |
| **app-template**        | ❌       | Template used for new apps. Default is `expo-template-blank-typescript`                                                      |
| **setup-hook**          | ❌       | Script to run after the app is created or updated, to install your package or edit `App.tsx` and `app.json`                   |
| **build**               | ❌       | Comma-separated list of steps to run (`prebuild`, `export`, `ios`, `android`). Default is `prebuild,export,ios,android`       |
| **ios-scheme**          | ❌       | iOS scheme name. Auto-detected from the generated Xcode workspace if not provided                                            |
| **android-gradle-task** | ❌       | Gradle task for the Android build. Default is `assembleRelease`                                                              |
| **upload-app**          | ❌       | Upload the app directory as an artifact for debugging, which runs even on failure. Default is `false`                          |

The `ios` step runs only on macOS runners; `android` runs on the others. A `build` list with both is fine — each runner picks its step.

### Available outputs

This action will set the following action outputs.

| output name               | description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| **resolved-expo-version** | The resolved Expo SDK version (numeric major, `next`, or `canary`)   |

## Example workflows

Check a library against the newest SDK every week, on both platforms:

```yaml
name: CI compatibility

on:
  schedule:
    - cron: '0 4 * * 1'
  workflow_dispatch:

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 📦 Install dependencies
        run: yarn install

      - name: Build Expo app
        uses: expo/actions/build-expo-app@main
        with:
          expo-version: latest
          setup-hook: |
            yarn add file:$GITHUB_WORKSPACE
          upload-app: true
```

To test several SDK versions, resolve them once and fan out. See the [`resolve-expo-versions` examples](../resolve-expo-versions/README.md#example-workflows) for the full matrix workflow.

<div align="center">
  <br />
  with :heart:&nbsp;<strong>Expo</strong>
  <br />
</div>
