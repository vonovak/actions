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
