// Shared helper: bundles a TypeScript module from src/ with esbuild (already installed with Vite)
// and imports it, so the checks below run against the real store code.
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function load(entrySource) {
  const dir = mkdtempSync(join(tmpdir(), 'wristgame-'));
  try {
    const result = await build({
      stdin: { contents: entrySource, resolveDir: process.cwd(), loader: 'ts' },
      bundle: true,
      format: 'esm',
      platform: 'node',
      write: false,
      logLevel: 'silent',
    });
    const file = join(dir, 'bundle.mjs');
    writeFileSync(file, result.outputFiles[0].text);
    return await import(pathToFileURL(file).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
