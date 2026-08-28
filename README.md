<div align="center">
  <h1>expo/actions</h1>
  <p>A collection of GitHub Actions for Expo projects</p>
</div>

<br />

## Actions

### [`expo/actions/fingerprint`](./fingerprint#readme)

A GitHub Action that checks project fingerprinting for pull requests using [`@expo/fingerprint`](https://www.npmjs.com/package/@expo/fingerprint).

### [`expo/actions/repack-app`](./repack-app#readme)

A GitHub Action that repackages apps from fingerprint-compatible builds with new JavaScript bundles and app metadata without rebuilding the entire native project.

### [`expo/actions/repack-app-artifact`](./repack-app-artifact#readme)

A composite GitHub Action that simplifies the fingerprint-based repackaging workflow by combining artifact querying, downloading, repacking, building, uploading, and database updates into a single step.

### [`expo/actions/build-expo-app`](./build-expo-app#readme)

A composite GitHub Action for smoke-testing library compatibility with different Expo SDK versions. Sets up an Expo app, runs prebuild, exports JS bundles, and optionally builds native iOS and Android apps.

### [`expo/actions/resolve-expo-versions`](./resolve-expo-versions#readme)

A GitHub Action that resolves Expo SDK version specifiers such as `latest` and `latest-1` into concrete versions, for use with `fromJSON()` in a matrix strategy.

## Reusable workflows

### [`expo/actions/.github/workflows/expo-compat.yml`](./.github/workflows/expo-compat.yml)

A ready-made compatibility workflow for Expo libraries. It packs the library once, then fans out over every SDK version and runner, creating a blank app and installing the tarball the way a new user would.

Use it instead of wiring up `resolve-expo-versions` and `build-expo-app` yourself:

```yaml
name: expo compatibility

on:
  pull_request:
  schedule:
    - cron: '0 4 1 * *' # monthly

jobs:
  compat:
    uses: expo/actions/.github/workflows/expo-compat.yml@main
    with:
      expo-versions: latest,latest-1
      config-plugins: '["my-library"]'
```

That covers two SDK versions on two runners. macOS builds iOS and everything else builds Android, so a two-runner matrix covers both platforms.

Pull requests stop at `expo export`. Native builds run on every other trigger, because they are slow and macOS minutes are expensive. Pass `build` to override.

This workflow always builds a blank app and installs the packed library into it, which is what a new user gets. To test an app that already exists in your repository, such as an example app you bump to each new SDK, call [`build-expo-app`](./build-expo-app#readme) directly with `app-path`.

The library's package manager is detected from its lockfile, so most repositories need no `install-command`. See the [input descriptions](./.github/workflows/expo-compat.yml) for the rest — `package-path`, `build-command`, `copy-files`, `setup-hook`, `app-template`, `runners`, `java-version` and `upload-app`.

## Contributing

All GitHub Actions in this repository are open-source and contributions are welcome.
To get up and running with this repository locally, follow these steps:

1. Clone a fork of this repository
2. Install dependencies with [Bun](https://bun.com)
   ```bash
   bun install
   ```
3. Make any change to the code
4. Rebuild the actions
   ```bash
   bun run build
   ```
5. Make sure code is formatted and tested
   ```bash
   bun run lint --fix
   bun run test
   ```
6. Open a PR with your contribution 🎉

<div align="center">
  <br />
  with&nbsp;❤️&nbsp;&nbsp;<a href="https://expo.dev/home"><strong>Expo</strong></a>
  <br />
</div>
