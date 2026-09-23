// SPDX-License-Identifier: GPL-3.0-or-later
// Offline: data/raw + overrides + content/descriptions -> public/data/{catalog.json,desc/*.json}.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog, loadOverrides } from './lib/catalog.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function run(): void {
  const source = JSON.parse(readFileSync(join(root, 'data/SOURCE.json'), 'utf8'));
  const { catalog, descriptions, warnings } = buildCatalog({
    rawDir: join(root, 'data/raw'),
    source,
    overrides: loadOverrides(join(root, 'scripts/overrides')),
    notesDir: join(root, 'content/descriptions'),
    hasIcon: (p) => existsSync(join(root, 'public/icons', p)),
  });

  const out = join(root, 'public/data');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'desc'), { recursive: true });
  writeFileSync(join(out, 'catalog.json'), JSON.stringify(catalog));
  for (const [cat, shard] of Object.entries(descriptions)) {
    writeFileSync(join(out, 'desc', `${cat}.json`), JSON.stringify(shard));
  }

  for (const w of warnings) console.warn(`warn: ${w}`);
  const byType = catalog.recipes.reduce<Record<string, number>>(
    (acc, r) => ({ ...acc, [r.type]: (acc[r.type] ?? 0) + 1 }),
    {},
  );
  const noIcon = catalog.items.filter((i) => !i.icon).length;
  const noRecipe = catalog.items.filter((i) => !i.obtain.length).length;
  console.log(
    `catalog: ${catalog.items.length} items (${noRecipe} without recipe, ${noIcon} without icon), ` +
      `recipes ${JSON.stringify(byType)}`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
