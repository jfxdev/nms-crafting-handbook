// SPDX-License-Identifier: GPL-3.0-or-later
// MANUAL, network-bound: refresh data/raw/nmse (corvette parts + freighter base modules) and
// public/icons/{corvette,freighter} from NMSE (vectorcmdr/NMSE, game data extracted from No Man's
// Sky), then rebuild the catalog.
//
//   npm run data:update-nmse -- [--ref <branch|sha>]
//
// AssistantNMS does not publish corvette modules and lacks newer freighter rooms; NMSE has both.
// Review the git diff before committing.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import type { RawNmsePart } from './lib/catalog.ts';
import { freighterKindOf } from '../src/lib/freighter.ts';
import { run as buildCatalog } from './build-catalog.ts';

const REPO = 'https://github.com/vectorcmdr/NMSE';
const ICON_SIZE = 96;
/** NMSE item tables searched to name recipe ingredients (resolved to catalog ids by name). */
const INGREDIENT_TABLES = ['Raw Materials', 'Products', 'Curiosities', 'Trade', 'Others', 'Food'];
/** Game icons that are the "Needs an Icon" placeholder texture (checked by eye on each update). */
const PLACEHOLDER_ICONS = new Set(['B_LAN_B.png']);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({ options: { ref: { type: 'string', default: 'main' } } });

interface NmseItem {
  Id: string;
  Icon?: string;
  Name: string;
  Name_LocStr?: string;
  Group?: string;
  Subtitle_LocStr?: string;
  Description?: string;
  Description_LocStr?: string;
  BaseValueUnits?: number;
  CurrencyType?: string;
  MaxStackSize?: number;
  Colour?: string;
  CorvettePartCategory?: string;
  BuildableOnFreighter?: boolean;
  RequiredItems?: { Id: string; Quantity: number }[];
}

const git = (cwd: string, ...a: string[]) =>
  execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

const tmp = mkdtempSync(join(tmpdir(), 'nmse-'));
try {
  console.log(`fetching ${REPO} @ ${args.ref} (sparse, blobless)...`);
  git(tmp, 'init', '-q');
  git(tmp, 'remote', 'add', 'origin', REPO);
  const json = (f: string) => `/Resources/json/${f}`;
  git(
    tmp,
    'sparse-checkout',
    'set',
    '--no-cone',
    '/README.md',
    json('Corvette.json'),
    json('Buildings.json'),
    json('lang/pt-BR.json'),
    ...INGREDIENT_TABLES.map((t) => json(`${t}.json`)),
  );
  git(tmp, 'fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', args.ref!);
  git(tmp, 'checkout', '-q', 'FETCH_HEAD');
  const sha = git(tmp, 'rev-parse', 'HEAD');
  const commitDate = git(tmp, 'log', '-1', '--format=%cI');
  const gameVersion =
    /Latest Supported Game Version:\*\*\s*([\d.]+)/.exec(
      readFileSync(join(tmp, 'README.md'), 'utf8'),
    )?.[1] ?? '';

  const pt = readJson<Record<string, string>>(join(tmp, json('lang/pt-BR.json')));
  const ptOf = (key?: string) => (key ? (pt[`${key}_L`] ?? pt[key]) : undefined);
  const names = new Map<string, string>();
  for (const t of INGREDIENT_TABLES) {
    for (const x of readJson<NmseItem[]>(join(tmp, json(`${t}.json`)))) names.set(x.Id, x.Name);
  }

  const toPart = (
    x: NmseItem,
    category: string,
    name = { en: x.Name, pt: ptOf(x.Name_LocStr)! },
  ) => ({
    id: x.Id,
    icon: x.Icon ?? null,
    category,
    name,
    group: { en: x.Group ?? '', pt: ptOf(x.Subtitle_LocStr) ?? x.Group ?? '' },
    description: {
      en: x.Description ?? '',
      pt: ptOf(x.Description_LocStr) ?? x.Description ?? '',
    },
    value: x.BaseValueUnits ?? 0,
    currency: x.CurrencyType ?? 'Credits',
    ...(x.MaxStackSize ? { stack: x.MaxStackSize } : {}),
    ...(x.Colour ? { colour: x.Colour } : {}),
    requires: (x.RequiredItems ?? []).map((r) => {
      const name = names.get(r.Id);
      if (!name) throw new Error(`${x.Id}: unknown ingredient ${r.Id}`);
      return { name, qty: r.Quantity };
    }),
  });

  // Corvette: one entry per part name; NMSE lists every placement/colour variant (16 per plate).
  const corvette: RawNmsePart[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const x of readJson<NmseItem[]>(join(tmp, json('Corvette.json')))) {
    // Unreleased placeholders have no localized name ("Bld Big Gen 4").
    if (!ptOf(x.Name_LocStr) || /^Bld /.test(x.Name)) {
      skipped++;
      continue;
    }
    if (seen.has(x.Name)) continue;
    seen.add(x.Name);
    corvette.push(toPart(x, x.CorvettePartCategory ?? 'None'));
  }
  console.log(`corvette parts: ${corvette.length} (${skipped} unreleased placeholders skipped)`);

  // Freighter base modules used by the freighter planner (current system, not the legacy one).
  const freighter: RawNmsePart[] = [];
  for (const x of readJson<NmseItem[]>(join(tmp, json('Buildings.json')))) {
    const kind = freighterKindOf(x.Id);
    if (!kind || !x.BuildableOnFreighter || !ptOf(x.Name_LocStr)) continue;
    // Storage Room 0-9 pair with Storage Container 0-9 but share one name in the game data.
    const n = /^FRE_ROOM_STORE(\d)$/.exec(x.Id)?.[1];
    const pt = ptOf(x.Name_LocStr)!;
    const name = n ? { en: `${x.Name} ${n}`, pt: `${pt} ${n}` } : { en: x.Name, pt };
    freighter.push(toPart(x, kind, name));
  }
  console.log(`freighter modules: ${freighter.length}`);

  // Icons.
  for (const [dir, parts] of [
    ['corvette', corvette],
    ['freighter', freighter],
  ] as const) {
    const icons = parts.flatMap((p) => (p.icon ? [p.icon] : []));
    git(tmp, 'sparse-checkout', 'add', ...icons.map((i) => `/Resources/images/${i}`));
    const iconDir = join(root, 'public/icons', dir);
    rmSync(iconDir, { recursive: true, force: true });
    mkdirSync(iconDir, { recursive: true });
    for (const p of parts) {
      const src = p.icon && join(tmp, 'Resources/images', p.icon);
      if (!src || !existsSync(src) || PLACEHOLDER_ICONS.has(p.icon!)) {
        console.log(`  no icon: ${p.id}`);
        p.icon = null;
        continue;
      }
      p.icon = `${dir}/${p.id}.webp`;
      await sharp(src)
        .resize(ICON_SIZE, ICON_SIZE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(join(root, 'public/icons', p.icon));
    }
  }

  const outDir = join(root, 'data/raw/nmse');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'corvette.json'), JSON.stringify(corvette, null, 1) + '\n');
  writeFileSync(join(outDir, 'freighter.json'), JSON.stringify(freighter, null, 1) + '\n');
  writeFileSync(
    join(outDir, 'SOURCE.json'),
    JSON.stringify(
      { repo: REPO, ref: args.ref, sha, commitDate, license: 'AGPL-3.0', gameVersion },
      null,
      2,
    ) + '\n',
  );
  console.log(`source: ${sha} (${commitDate}), game ${gameVersion}`);
  buildCatalog();
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
