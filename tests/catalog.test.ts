// SPDX-License-Identifier: GPL-3.0-or-later
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildCatalog,
  loadOverrides,
  perUnitOf,
  ratioOf,
  type BuildOutput,
} from '../scripts/lib/catalog.ts';

const root = join(import.meta.dirname, '..');
let out: BuildOutput;

beforeAll(() => {
  out = buildCatalog({
    rawDir: join(root, 'data/raw'),
    source: JSON.parse(readFileSync(join(root, 'data/SOURCE.json'), 'utf8')),
    overrides: loadOverrides(join(root, 'scripts/overrides')),
    notesDir: join(root, 'content/descriptions'),
    hasIcon: (p) => existsSync(join(root, 'public/icons', p)),
  });
});

const recipe = (id: string) => out.catalog.recipes.find((r) => r.id === id)!;
const item = (id: string) => out.catalog.items.find((i) => i.id === id)!;

describe('catalog graph', () => {
  it('builds Metal Plating from 50 Ferrite Dust', () => {
    const r = recipe('craft-prod6');
    expect(r.type).toBe('craft');
    expect(r.inputs).toEqual([{ id: 'raw8', qty: 50 }]);
    expect(r.output).toEqual({ id: 'prod6', qty: 1 });
    expect(out.catalog.producedBy['prod6']).toContain('craft-prod6');
  });

  it('indexes where an ingredient is used', () => {
    expect(out.catalog.usedIn['raw8']).toContain('craft-prod6');
  });

  it('indexes refiner outputs', () => {
    expect(out.catalog.producedBy['raw56']).toContain('ref1');
    expect(recipe('ref1').op?.pt).toMatch(/nanit/i);
  });

  it('merges pt-br names by id', () => {
    expect(item('prod6').name).toEqual({ en: 'Metal Plating', pt: 'Placa de metal' });
  });

  it('derives how each item is obtained', () => {
    expect(item('prod6').obtain).toContain('craft');
    expect(item('raw56').obtain).toContain('refine');
  });

  it('has every referenced id and an icon for almost every item', () => {
    const ids = new Set(out.catalog.items.map((i) => i.id));
    for (const r of out.catalog.recipes) {
      for (const q of [...r.inputs, r.output]) expect(ids.has(q.id)).toBe(true);
    }
    const withIcon = out.catalog.items.filter((i) => i.icon).length;
    expect(withIcon / out.catalog.items.length).toBeGreaterThan(0.99);
  });

  it('attaches hand-written notes', () => {
    expect(out.descriptions['raw']!['raw8']!.notes?.pt).toBeTruthy();
  });

  it('flags data that predates the targeted game release', () => {
    const { commitDate, gameReleaseDate } = out.catalog.source;
    expect(out.catalog.source.stale).toBe(Date.parse(commitDate) < Date.parse(gameReleaseDate));
  });
});

describe('I/O ratio', () => {
  it('computes ratio and per-unit for crafting', () => {
    const r = recipe('craft-prod6');
    expect(r.ratio).toBe('50:1');
    expect(r.perUnit).toEqual([{ id: 'raw8', qty: 50 }]);
  });

  it('gives fractional per-unit amounts when a refiner outputs several units', () => {
    const r = recipe('ref1');
    expect(r.output.qty).toBe(15);
    expect(r.ratio).toBe('1:15');
    expect(r.perUnit[0]!.qty).toBeCloseTo(1 / 15, 4);
  });

  it('reduces ratios and handles multiple inputs', () => {
    const inputs = [
      { id: 'a', qty: 2 },
      { id: 'b', qty: 2 },
    ];
    expect(ratioOf(inputs, { id: 'c', qty: 2 })).toBe('2:1');
    expect(perUnitOf(inputs, { id: 'c', qty: 2 })).toEqual([
      { id: 'a', qty: 1 },
      { id: 'b', qty: 1 },
    ]);
  });
});
