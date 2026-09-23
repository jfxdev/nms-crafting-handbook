// SPDX-License-Identifier: GPL-3.0-or-later
// Pure, offline catalog builder: raw AssistantNMS JSON (en + pt-br) -> normalized catalog.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type {
  Catalog,
  DescriptionShard,
  Item,
  Localized,
  Qty,
  Recipe,
  RecipeType,
  Source,
} from '../../src/types.ts';

/** Upstream item files -> category key. Order defines the category order in the UI. */
export const ITEM_FILES: Record<string, string> = {
  RawMaterials: 'raw',
  Products: 'products',
  Technology: 'technology',
  TechnologyModule: 'techModules',
  UpgradeModules: 'upgrades',
  ConstructedTechnology: 'constructed',
  Buildings: 'buildings',
  Cooking: 'cooking',
  Curiosity: 'curiosities',
  TradeItems: 'trade',
  ProceduralProducts: 'procedural',
  Others: 'others',
};

/** Upstream recipe files -> recipe type (crafting recipes come from items' RequiredItems). */
export const RECIPE_FILES: Record<string, RecipeType> = {
  Refinery: 'refine',
  NutrientProcessor: 'cook',
};

export const UPSTREAM_LANGS = { en: 'en', pt: 'pt-br' } as const;

interface RawQty {
  Id: string;
  Quantity: number;
}
interface RawItem {
  Id: string;
  Icon?: string;
  Name: string;
  Group?: string;
  Description?: string;
  BaseValueUnits?: number;
  CurrencyType?: string;
  MaxStackSize?: number;
  Colour?: string;
  RequiredItems?: RawQty[];
}
interface RawRecipe {
  Id: string;
  Inputs: RawQty[];
  Output: RawQty;
  Time?: string;
  Operation?: string;
}

interface OverrideItem {
  id: string;
  cat?: string;
  name: Localized;
  group?: Localized;
  description?: Localized;
  icon?: string | null;
  value?: number;
  currency?: string;
  source?: string;
}
interface OverrideRecipe {
  id?: string;
  type: RecipeType;
  inputs: Qty[];
  output: Qty;
  time?: number;
  op?: Localized;
}
export interface Overrides {
  items?: OverrideItem[];
  recipes?: OverrideRecipe[];
}

export interface BuildInput {
  rawDir: string;
  source: Omit<Source, 'stale'>;
  overrides: Overrides[];
  /** content/descriptions directory with <id>.<en|pt>.md files. */
  notesDir?: string;
  /** Returns true when the webp icon exists (relative to icons/). */
  hasIcon: (path: string) => boolean;
}

export interface BuildOutput {
  catalog: Catalog;
  descriptions: Record<string, DescriptionShard>;
  warnings: string[];
}

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Reduced "inputs:outputs" ratio; falls back to a decimal when quantities aren't integers. */
export function ratioOf(inputs: Qty[], output: Qty): string {
  const total = inputs.reduce((s, i) => s + i.qty, 0);
  const out = output.qty;
  if (Number.isInteger(total) && Number.isInteger(out) && total > 0 && out > 0) {
    const g = gcd(total, out);
    return `${total / g}:${out / g}`;
  }
  return `${round(total / out)}:1`;
}

const round = (n: number) => Math.round(n * 10000) / 10000;

export function perUnitOf(inputs: Qty[], output: Qty): Qty[] {
  return inputs.map((i) => ({ id: i.id, qty: round(i.qty / output.qty) }));
}

function makeRecipe(base: Omit<Recipe, 'ratio' | 'perUnit'>): Recipe {
  return {
    ...base,
    ratio: ratioOf(base.inputs, base.output),
    perUnit: perUnitOf(base.inputs, base.output),
  };
}

const toQty = (q: RawQty): Qty => ({ id: q.Id, qty: q.Quantity });

function readNotes(notesDir: string | undefined): Map<string, Partial<Localized>> {
  const notes = new Map<string, Partial<Localized>>();
  if (!notesDir || !existsSync(notesDir)) return notes;
  for (const file of readdirSync(notesDir).sort()) {
    const m = /^(.+)\.(en|pt)\.md$/.exec(file);
    if (!m) continue;
    const [, id, lang] = m as unknown as [string, string, 'en' | 'pt'];
    const entry = notes.get(id) ?? {};
    entry[lang] = readFileSync(join(notesDir, file), 'utf8').trim();
    notes.set(id, entry);
  }
  return notes;
}

export function loadOverrides(dir: string): Overrides[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()
    .map((f) => (parseYaml(readFileSync(join(dir, f), 'utf8')) ?? {}) as Overrides);
}

export function buildCatalog(input: BuildInput): BuildOutput {
  const warnings: string[] = [];
  const items = new Map<string, Item>();
  const descriptions: Record<string, DescriptionShard> = {};
  const recipes: Recipe[] = [];

  const read = <T>(lang: keyof typeof UPSTREAM_LANGS, file: string): T =>
    readJson<T>(join(input.rawDir, UPSTREAM_LANGS[lang], `${file}.lang.json`));

  // Items (+ crafting recipes from RequiredItems).
  for (const [file, cat] of Object.entries(ITEM_FILES)) {
    const en = read<RawItem[]>('en', file);
    const pt = new Map(read<RawItem[]>('pt', file).map((x) => [x.Id, x]));
    descriptions[cat] ??= {};
    for (const x of en) {
      if (items.has(x.Id)) {
        warnings.push(`duplicate item id ${x.Id} in ${file}`);
        continue;
      }
      const p = pt.get(x.Id);
      if (!p) warnings.push(`missing pt-br translation for ${x.Id}`);
      const icon = x.Icon ? x.Icon.replace(/\.\w+$/, '.webp') : null;
      items.set(x.Id, {
        id: x.Id,
        cat,
        name: { en: x.Name, pt: p?.Name || x.Name },
        group: { en: x.Group ?? '', pt: p?.Group || x.Group || '' },
        icon: icon && input.hasIcon(icon) ? icon : null,
        value: x.BaseValueUnits ?? 0,
        currency: x.CurrencyType ?? 'Credits',
        ...(x.MaxStackSize ? { stack: x.MaxStackSize } : {}),
        ...(x.Colour ? { colour: x.Colour } : {}),
        obtain: [],
      });
      descriptions[cat]![x.Id] = {
        text: { en: x.Description ?? '', pt: p?.Description || x.Description || '' },
      };
      const req = (x.RequiredItems ?? []).filter((r) => r.Id);
      if (req.length) {
        recipes.push(
          makeRecipe({
            id: `craft-${x.Id}`,
            type: 'craft',
            inputs: req.map(toQty),
            output: { id: x.Id, qty: 1 },
            source: 'assistantnms',
          }),
        );
      }
    }
  }

  // Refiner and nutrient processor recipes.
  for (const [file, type] of Object.entries(RECIPE_FILES)) {
    const en = read<RawRecipe[]>('en', file);
    const pt = new Map(read<RawRecipe[]>('pt', file).map((x) => [x.Id, x]));
    for (const r of en) {
      const time = r.Time ? Number(r.Time) : undefined;
      const op = r.Operation
        ? { en: r.Operation, pt: pt.get(r.Id)?.Operation || r.Operation }
        : undefined;
      recipes.push(
        makeRecipe({
          id: r.Id,
          type,
          inputs: r.Inputs.filter((i) => i.Id).map(toQty),
          output: toQty(r.Output),
          ...(time !== undefined && Number.isFinite(time) ? { time } : {}),
          ...(op ? { op } : {}),
          source: 'assistantnms',
        }),
      );
    }
  }

  // Manual overrides (e.g. COSMOS items not yet in the upstream data).
  for (const ov of input.overrides) {
    for (const o of ov.items ?? []) {
      if (items.has(o.id)) {
        warnings.push(`override item ${o.id} already exists upstream; the override can be removed`);
        continue;
      }
      const cat = o.cat ?? 'others';
      items.set(o.id, {
        id: o.id,
        cat,
        name: o.name,
        group: o.group ?? { en: '', pt: '' },
        icon: o.icon && input.hasIcon(o.icon) ? o.icon : null,
        value: o.value ?? 0,
        currency: o.currency ?? 'Credits',
        obtain: [],
        manual: true,
      });
      descriptions[cat] ??= {};
      descriptions[cat]![o.id] = { text: o.description ?? { en: '', pt: '' } };
    }
    for (const [n, r] of (ov.recipes ?? []).entries()) {
      const { id, ...rest } = r;
      recipes.push(
        makeRecipe({
          ...rest,
          id: id ?? `override-${r.type}-${r.output.id}-${n}`,
          source: 'override',
        }),
      );
    }
  }

  // Notes (hand-written Markdown).
  for (const [id, notes] of readNotes(input.notesDir)) {
    const item = items.get(id);
    if (!item) {
      warnings.push(`notes for unknown item ${id}`);
      continue;
    }
    descriptions[item.cat]![id]!.notes = notes;
  }

  // Integrity: every referenced id must exist.
  const orphans = new Set<string>();
  for (const r of recipes) {
    for (const q of [...r.inputs, r.output])
      if (!items.has(q.id)) orphans.add(`${r.id} -> ${q.id}`);
  }
  if (orphans.size) {
    throw new Error(`Recipes reference unknown items:\n  ${[...orphans].join('\n  ')}`);
  }

  // Indexes.
  const producedBy: Record<string, string[]> = {};
  const usedIn: Record<string, string[]> = {};
  for (const r of recipes) {
    (producedBy[r.output.id] ??= []).push(r.id);
    const item = items.get(r.output.id)!;
    if (!item.obtain.includes(r.type)) item.obtain.push(r.type);
    for (const id of new Set(r.inputs.map((i) => i.id))) (usedIn[id] ??= []).push(r.id);
  }
  const typeOrder: RecipeType[] = ['craft', 'refine', 'cook'];
  for (const item of items.values()) {
    item.obtain.sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));
  }

  const source: Source = {
    ...input.source,
    stale: Date.parse(input.source.commitDate) < Date.parse(input.source.gameReleaseDate),
  };
  if (source.stale) {
    warnings.push(
      `upstream data (${input.source.commitDate}) predates ${source.gameVersionName} ` +
        `${source.gameVersion} (${source.gameReleaseDate}); newer items may be missing`,
    );
  }

  const categories = [
    ...new Set([...Object.values(ITEM_FILES), ...[...items.values()].map((i) => i.cat)]),
  ];
  return {
    catalog: {
      source,
      categories,
      items: [...items.values()],
      recipes,
      producedBy,
      usedIn,
    },
    descriptions,
    warnings,
  };
}
