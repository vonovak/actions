<div align="center">
  <h1>expo/actions/repack-app-artifact</h1>
  <p>Composite action for fingerprint-based app repackaging with artifact management</p>
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

`repack-app-artifact` is a composite GitHub Action that simplifies the fingerprint-based repackaging workflow. It combines [`fingerprint-query-artifact`](../fingerprint-query-artifact/README.md), [`repack-app`](../repack-app/README.md), and [`fingerprint-update-artifact`](../fingerprint-update-artifact/README.md) into a single step.

This action automatically handles:

- Querying for compatible artifacts from the fingerprint database
- Downloading and repacking when fingerprint is compatible
- Building from scratch when fingerprint changes or no artifact exists
- Uploading and updating the fingerprint database with the new artifact

## Usage

To use this action, add the following code to your workflow:

```yaml
- name: Check fingerprint
  id: fingerprint
  uses: expo/actions/fingerprint@main
  with:
    fingerprint-state-output-file: ${{ runner.temp }}/fingerprint-state.json

- name: Repack app with artifact management
  uses: expo/actions/repack-app-artifact@main
  with:
    platform: android
    fingerprint-state-file: ${{ runner.temp }}/fingerprint-state.json
    build-command: |
      npx expo prebuild -p android
      cd android
      ./gradlew :app:assembleRelease
    build-output: android/app/build/outputs/apk/release/app-release.apk
    artifact-name: android-build
```

### Configuration options

This action is customizable through variables defined in the [`action.yml`](action.yml).
Here is a summary of all the input options you can use.

| variable                      | required | description                                                                                            |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| **platform**                  | ✅       | The platform to repack (`android` or `ios`)                                                            |
| **fingerprint-state-file**    | ✅       | The fingerprint state file generated from `expo/actions/fingerprint` action                            |
| **build-command**             | ✅       | The command to run for building the app when fingerprint changes                                       |
| **build-output**              | ✅       | Path to the built app output (e.g., `android/app/build/outputs/apk/release/app-release.apk`)           |
| **artifact-name**             | ✅       | Name for the uploaded artifact                                                                         |
| **github-token**              | ❌       | GitHub token for downloading artifacts. Default is `github.token`                                      |
| **working-directory**         | ❌       | The relative directory of your Expo app. Default is `${{ github.workspace }}`                          |
| **output-directory**          | ❌       | Directory path where the downloaded app or repacked app will be saved. Default is `${{ runner.temp }}` |
| **repack-version**            | ❌       | `@expo/repack-app` version to install. Default is `latest`                                             |
| **build-command-shell**       | ❌       | The shell to use for the build command. Default is `bash`                                              |
| **packager**                  | ❌       | The package manager used to install the fingerprint tools. Default is `yarn`                           |
| **fingerprint-db-cache-key**  | ❌       | A cache key to use for fingerprint database. Default is `fingerprint-db`                               |
| **fingerprint-db-cache-path** | ❌       | The path to the fingerprint database cache                                                             |
| **saving-db-branch**          | ❌       | The branch for saving the fingerprint database                                                         |
| **retention-days**            | ❌       | Duration after which artifact will expire in days                                                      |
| **compression-level**         | ❌       | The level of compression for Zlib (0-9). Default is `6`                                                |
| **include-hidden-files**      | ❌       | Whether to include hidden files in the artifact. Default is `false`                                    |

### Available outputs

This action will set the following action outputs.

| output name         | description                                                    |
| ------------------- | -------------------------------------------------------------- |
| **artifact-id**     | The uploaded artifact ID                                       |
| **artifact-url**    | The uploaded artifact URL                                      |
| **artifact-digest** | The uploaded artifact digest (SHA-256)                         |
| **repack-executed** | Whether repack was executed                                    |
| **build-executed**  | Whether build-command was executed (true if no artifact found) |

## Example workflows

Here's a complete example workflow using this all-in-one action:

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

      - name: Repack app with artifact management
        uses: expo/actions/repack-app-artifact@main
        with:
          platform: android
          fingerprint-state-file: ${{ runner.temp }}/fingerprint-state.json
          build-command: |
            npx expo prebuild -p android
            cd android
            ./gradlew :app:assembleRelease
          build-output: android/app/build/outputs/apk/release/app-release.apk
          artifact-name: android-build
```

This simplified workflow automatically handles the complete repack flow without requiring manual orchestration of query, download, repack, build, upload, and update steps.

<div align="center">
  <br />
  with :heart:&nbsp;<strong>Expo</strong>
  <br />
</div>
