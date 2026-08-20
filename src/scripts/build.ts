import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, styleText } from 'node:util';

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function run(input = resolveInput()) {
  // Build all actions
  await build(input);
  // Enable watch mode
  if (input.watch) {
    for await (const event of fs.promises.watch(path.join(__dirname, '../src'), {
      recursive: true,
    })) {
      console.log(styleText('dim', `${event.eventType}: ${event.filename}`));
      await build(input);
    }
  }
}

/**
 * Build all (sub)actions as standalone entry points.
 * This enables GitHub Actions to execute single actions as fast as possible.
 */
async function build(input: ReturnType<typeof resolveInput>) {
  const startedAt = Date.now();

  try {
    const result = await Bun.build({
      entrypoints: resolveActions(input.actionsDir),
      outdir: input.buildDir,
      // Build the CLI for node
      target: 'node',
      format: 'cjs',
      // Minify the code
      minify: true,
      sourcemap: 'none',
      plugins: [],
      external: ['@expo/fingerprint', 'module', 'sqlite3'],
    });

    normalizeBundledPaths(result.outputs.map((file) => file.path));

    console.log(
      `✅ Build succeeded in ${Date.now() - startedAt}ms`,
      styleText(
        'dim',
        '\n  - ' +
          result.outputs
            .map((file) => `${path.basename(file.path)}: ${bytesToSizeText(file.size)}`)
            .join('\n  - ')
      )
    );
  } catch (error) {
    console.error(`❌ Build failed in ${Date.now() - startedAt}ms`);
    if (input.watch) {
      console.error(error);
    } else {
      throw error;
    }
  }
}

/**
 * Rewrite the absolute repository path out of the bundles.
 *
 * Bun replaces `__dirname` in bundled CJS dependencies with the absolute directory it
 * built from, which would make the committed output differ on every machine. `build/` is
 * committed, so the output has to be reproducible.
 */
function normalizeBundledPaths(filePaths: string[]) {
  const repoPrefix = `${path.resolve(__dirname, '../..')}/`;

  for (const filePath of filePaths) {
    const source = fs.readFileSync(filePath, 'utf8');
    const normalized = source.replaceAll(repoPrefix, '');

    if (normalized !== source) {
      fs.writeFileSync(filePath, normalized);
    }
  }
}

/** Resolve all action entrypoints */
function resolveActions(dir: string) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entity) => entity.isFile())
    .map((entity) => path.join(dir, entity.name));
}

// See: https://stackoverflow.com/a/14919494
function bytesToSizeText(bytes: number, decimals = 2) {
  const thresh = 1000;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  const r = 10 ** decimals;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(decimals) + ' ' + units[u];
}

function resolveInput() {
  const actionsDir = path.resolve(__dirname, '../actions');
  const buildDir = path.resolve(__dirname, '../../build');

  const { values } = parseArgs({
    strict: false,
    options: {
      watch: { type: 'boolean' },
    },
  });

  return {
    actionsDir,
    buildDir,
    watch: !!values.watch,
  };
}
