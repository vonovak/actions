<div align="center">
  <h1>expo/actions/repack-app</h1>
  <p>Repackage apps from fingerprint compatible builds</p>
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

`repack-app` is a GitHub Action that repacks apps with new JavaScript bundles and app metadata without rebuilding the entire native project. This action is designed to work with the [`fingerprint` action](../fingerprint/README.md) to enable faster builds when only JavaScript code or app metadata have changed. This action only works with Expo apps and uses [`app.json`](https://docs.expo.dev/versions/latest/config/app/) as the metadata source of truth.

When combined with [`fingerprint`](../fingerprint/action.yml), [`fingerprint-query-artifact`](../fingerprint-query-artifact/action.yml), and [`fingerprint-update-artifact`](../fingerprint-update-artifact/action.yml), this action allows you to:

- If fingerprint is compatible:
  - Download a previously built app artifact that matches the fingerprint
  - Repackage without rebuilding the whole app
  - Upload the repacked app, saving significant build time
- If fingerprint is incompatible:
  - Run a native build
  - Upload the app

## Usage

To use this action, add the following code to your workflow:

```yaml
- name: Repack app
  uses: expo/actions/repack-app@main
  with:
    platform: android # or ios
    source-app: path/to/previous/build.apk # or .app for iOS
```

### Configuration options

This action is customizable through variables defined in the [`action.yml`](action.yml).
Here is a summary of all the input options you can use.

| variable              | required | description                                                                          |
| --------------------- | -------- | ------------------------------------------------------------------------------------ |
| **platform**          | ✅       | The platform to repack (`android` or `ios`)                                          |
| **source-app**        | ✅       | Path to the source app artifact to repack                                            |
| **output-directory**  | ❌       | Directory path where the repacked app will be saved. Default is `${{ runner.temp }}` |
| **working-directory** | ❌       | The relative directory of your Expo app. Default is `${{ github.workspace }}`        |
| **repack-version**    | ❌       | `@expo/repack-app` version to install. Default is `latest`                           |

### Available outputs

This action will set the following action outputs.

| output name     | description                           |
| --------------- | ------------------------------------- |
| **output-path** | The path to the repacked app artifact |

## Example workflows

> [!TIP]
> If the setup is too complex for you, you can refer to the [`repack-app-artifact` action](../repack-app-artifact/README.md) which provides an all-in-one composite action.

Here's a complete example workflow that uses fingerprinting to conditionally repack or build an Android app:

```yaml
name: CI repack

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize]

jobs:
  repack-android:
    runs-on: ubuntu-latest
    concurrency: fingerprint-${{ github.event_name != 'pull_request' && 'main' || github.run_id }}
    permissions:
      actions: write # Allow updating action caches
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 24.x
          cache: yarn

      - name: 🔨 Use JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: 📦 Install dependencies
        run: yarn install

      - name: Check fingerprint
        id: fingerprint
        uses: expo/actions/fingerprint@main
        with:
          fingerprint-state-output-file: ${{ runner.temp }}/fingerprint-state.json

      - name: Query artifact from fingerprint database (Android)
        id: android-query-artifact
        uses: expo/actions/fingerprint-query-artifact@main
        with:
          fingerprint-state-file: ${{ runner.temp }}/fingerprint-state.json
          platform: android

      - name: Download artifact (Android)
        id: android-download-artifact
        if: steps.android-query-artifact.outputs.run-id != ''
        uses: actions/download-artifact@v4
        with:
          name: android-build
          path: ${{ runner.temp }}/previous-build
          github-token: ${{ github.token }}
          run-id: ${{ steps.android-query-artifact.outputs.run-id }}

      - name: Repack (Android)
        id: android-repack
        if: steps.android-download-artifact.outputs.download-path != ''
        uses: expo/actions/repack-app@main
        with:
          platform: android
          source-app: ${{ steps.android-download-artifact.outputs.download-path }}

      - name: Build (Android)
        id: android-build
        if: ${{ steps.android-query-artifact.outputs.run-id == '' }}
        run: |
          npx expo prebuild -p android
          cd android
          ./gradlew :app:assembleRelease

      - name: Upload artifact (Android)
        id: android-upload-artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-build
          path: ${{ steps.android-repack.outputs.output-path || 'android/app/build/outputs/apk/release/app-release.apk' }}

      - name: Update uploaded artifact for fingerprint (Android)
        id: android-update-fingerprint
        uses: expo/actions/fingerprint-update-artifact@main
        with:
          fingerprint-state-file: ${{ runner.temp }}/fingerprint-state.json
          platform: android
          artifact-id: ${{ steps.android-upload-artifact.outputs.artifact-id }}
          artifact-url: ${{ steps.android-upload-artifact.outputs.artifact-url }}
          artifact-digest: ${{ steps.android-upload-artifact.outputs.artifact-digest }}
```

<div align="center">
  <br />
  with :heart:&nbsp;<strong>Expo</strong>
  <br />
</div>
