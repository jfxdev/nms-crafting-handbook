// SPDX-License-Identifier: GPL-3.0-or-later
// MANUAL, network-bound: refresh data/raw + public/icons from AssistantNMS, then rebuild the catalog.
//
//   npm run data:update -- [--ref <branch|sha>] [--game-version 7.01] \
//     [--game-name COSMOS] [--game-date 2026-09-09]
//
// Review the resulting git diff (new/removed items) before committing.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { ITEM_FILES, RECIPE_FILES, UPSTREAM_LANGS } from './lib/catalog.ts';
import { run as buildCatalog } from './build-catalog.ts';

const REPO = 'https://github.com/AssistantNMS/App';
const ICON_SIZE = 96;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'data/SOURCE.json');
const previous = existsSync(sourcePath) ? JSON.parse(readFileSync(sourcePath, 'utf8')) : {};

const { values: args } = parseArgs({
  options: {
    ref: { type: 'string', default: 'main' },
    'game-version': { type: 'string', default: previous.gameVersion ?? '7.01' },
    'game-name': { type: 'string', default: previous.gameVersionName ?? 'COSMOS' },
    'game-date': { type: 'string', default: previous.gameReleaseDate ?? '2026-09-09' },
  },
});

const git = (cwd: string, ...a: string[]) =>
  execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

const tmp = mkdtempSync(join(tmpdir(), 'anms-'));
try {
  const files = [...Object.keys(ITEM_FILES), ...Object.keys(RECIPE_FILES)];
  console.log(`fetching ${REPO} @ ${args.ref} (sparse, blobless)...`);
  git(tmp, 'init', '-q');
  git(tmp, 'remote', 'add', 'origin', REPO);
  git(
    tmp,
    'sparse-checkout',
    'set',
    '--no-cone',
    ...Object.values(UPSTREAM_LANGS).map((l) => `/assets/json/${l}/`),
  );
  git(tmp, 'fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', args.ref!);
  git(tmp, 'checkout', '-q', 'FETCH_HEAD');
  const sha = git(tmp, 'rev-parse', 'HEAD');
  const commitDate = git(tmp, 'log', '-1', '--format=%cI');

  // Raw JSON: keep a single current copy; history lives in git.
  const rawDir = join(root, 'data/raw');
  rmSync(rawDir, { recursive: true, force: true });
  for (const lang of Object.values(UPSTREAM_LANGS)) {
    mkdirSync(join(rawDir, lang), { recursive: true });
    for (const f of files) {
      cpSync(
        join(tmp, 'assets/json', lang, `${f}.lang.json`),
        join(rawDir, lang, `${f}.lang.json`),
      );
    }
  }

  // Icons: only those referenced by catalog items.
  const icons = new Set<string>();
  for (const f of Object.keys(ITEM_FILES)) {
    const list = JSON.parse(readFileSync(join(rawDir, 'en', `${f}.lang.json`), 'utf8')) as {
      Icon?: string;
    }[];
    for (const x of list) if (x.Icon) icons.add(x.Icon);
  }
  const dirs = [...new Set([...icons].map((i) => dirname(i)))];
  git(tmp, 'sparse-checkout', 'add', ...dirs.map((d) => `/assets/images/${d}/`));
  const iconDir = join(root, 'public/icons');
  rmSync(iconDir, { recursive: true, force: true });
  let ok = 0;
  const missing: string[] = [];
  for (const icon of [...icons].sort()) {
    const src = join(tmp, 'assets/images', icon);
    if (!existsSync(src)) {
      missing.push(icon);
      continue;
    }
    const dest = join(iconDir, icon.replace(/\.\w+$/, '.webp'));
    mkdirSync(dirname(dest), { recursive: true });
    await sharp(src)
      .resize(ICON_SIZE, ICON_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(dest);
    ok++;
  }
  console.log(`icons: ${ok} converted, ${missing.length} missing upstream`);
  if (missing.length)
    console.log(
      `  missing: ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? ', ...' : ''}`,
    );

  writeFileSync(
    sourcePath,
    JSON.stringify(
      {
        repo: REPO,
        ref: args.ref,
        sha,
        commitDate,
        gameVersion: args['game-version'],
        gameVersionName: args['game-name'],
        gameReleaseDate: args['game-date'],
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`source: ${sha} (${commitDate})`);
  buildCatalog();
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
