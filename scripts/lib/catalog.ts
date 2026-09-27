// SPDX-License-Identifier: GPL-3.0-or-later
// Pure, offline catalog builder: raw AssistantNMS JSON (en + pt-br) -> normalized catalog.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { KIND_ORDER, type FreighterKind } from '../../src/lib/freighter.ts';
import { corvetteSlotOf, isValidPart, starshipPartOf } from '../../src/lib/parts.ts';
import type {
  Catalog,
  DescriptionShard,
  Item,
  Localized,
  Part,
  Qty,
  Recipe,
  RecipeType,
  Source,
} from '../../src/lib/types.ts';

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

/** Categories for ship-builder parts, pulled out of their upstream file's category. */
export const PART_CATEGORIES: Record<Part['kind'], string> = {
  starship: 'starshipParts',
  corvette: 'corvetteParts',
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
  /** Ship-builder slot, e.g. { kind: corvette, cls: corvette, slot: habitation }. */
  part?: Part;
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

/** Normalized NMSE part (data/raw/nmse/{corvette,freighter}.json, see scripts/update-nmse.ts). */
export interface RawNmsePart {
  id: string;
  /** Path under icons/ once converted (NMSE file name before that). */
  icon: string | null;
  /** Corvette: NMSE CorvettePartCategory ("Cockpit", "Gear, Engine"...). Freighter: planner kind. */
  category: string;
  name: Localized;
  group: Localized;
  description: Localized;
  value: number;
  currency: string;
  stack?: number;
  colour?: string;
  /** Ingredients by English name; resolved to catalog ids at build time. */
  requires: { name: string; qty: number }[];
}

export interface BuildInput {
  rawDir: string;
  /** data/raw/nmse/corvette.json, when present. */
  corvetteFile?: string;
  /** data/raw/nmse/freighter.json, when present. */
  freighterFile?: string;
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
      const part = starshipPartOf(x.Group ?? '', x.Description ?? '');
      if (!part && /^(Fighter|Hauler|Explorer|Solar) Starship Component$/.test(x.Group ?? ''))
        warnings.push(`unclassified starship part ${x.Id} (${x.Group})`);
      const itemCat = part ? PART_CATEGORIES[part.kind] : cat;
      items.set(x.Id, {
        id: x.Id,
        cat: itemCat,
        name: { en: x.Name, pt: p?.Name || x.Name },
        group: { en: x.Group ?? '', pt: p?.Group || x.Group || '' },
        icon: icon && input.hasIcon(icon) ? icon : null,
        value: x.BaseValueUnits ?? 0,
        currency: x.CurrencyType ?? 'Credits',
        ...(x.MaxStackSize ? { stack: x.MaxStackSize } : {}),
        ...(x.Colour ? { colour: x.Colour } : {}),
        obtain: [],
        ...(part ? { part } : {}),
      });
      descriptions[itemCat] ??= {};
      descriptions[itemCat]![x.Id] = {
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

  // NMSE: corvette parts and freighter base modules, crafted when they list ingredients.
  const byName = new Map<string, string>();
  for (const item of items.values()) {
    const n = item.name.en.toLowerCase();
    byName.set(n, byName.has(n) ? '' : item.id);
  }
  const inputsOf = (x: RawNmsePart): Qty[] =>
    x.requires.map((r) => {
      const id = byName.get(r.name.toLowerCase());
      if (!id) throw new Error(`NMSE part ${x.id}: ingredient "${r.name}" not found`);
      return { id, qty: r.qty };
    });
  const addNmse = (x: RawNmsePart, cat: string, extra: Partial<Item>) => {
    if (items.has(x.id)) {
      warnings.push(`duplicate NMSE part id ${x.id}`);
      return;
    }
    items.set(x.id, {
      id: x.id,
      cat,
      name: x.name,
      group: x.group,
      icon: x.icon && input.hasIcon(x.icon) ? x.icon : null,
      value: x.value,
      currency: x.currency,
      ...(x.stack ? { stack: x.stack } : {}),
      ...(x.colour ? { colour: x.colour } : {}),
      obtain: [],
      ...extra,
    });
    descriptions[cat] ??= {};
    descriptions[cat]![x.id] = { text: x.description };
    if (x.requires.length) {
      recipes.push(
        makeRecipe({
          id: `craft-${x.id}`,
          type: 'craft',
          inputs: inputsOf(x),
          output: { id: x.id, qty: 1 },
          source: 'nmse',
        }),
      );
    }
  };

  if (input.corvetteFile && existsSync(input.corvetteFile)) {
    for (const x of readJson<RawNmsePart[]>(input.corvetteFile)) {
      const slot = corvetteSlotOf(x.category, x.group.en);
      if (!slot) throw new Error(`corvette part ${x.id}: unknown category ${x.category}`);
      addNmse(x, PART_CATEGORIES.corvette, { part: { kind: 'corvette', cls: 'corvette', slot } });
    }
  }

  // Freighter modules: reuse the upstream item when name and recipe match (AssistantNMS has most of
  // them, often without a pt-br name); otherwise add the NMSE one.
  if (input.freighterFile && existsSync(input.freighterFile)) {
    const sig = (qs: Qty[]) =>
      qs
        .map((q) => `${q.id}:${q.qty}`)
        .sort()
        .join();
    const base = (s: string) => s.toLowerCase().replace(/ \d$/, '');
    const linked = new Set<string>();
    for (const x of readJson<RawNmsePart[]>(input.freighterFile)) {
      const kind = x.category as FreighterKind;
      if (!KIND_ORDER.includes(kind)) throw new Error(`freighter module ${x.id}: bad kind ${kind}`);
      const want = sig(inputsOf(x));
      const match = [...items.values()].find(
        (i) =>
          !linked.has(i.id) &&
          !i.manual &&
          i.cat === 'buildings' &&
          base(i.name.en) === base(x.name.en) &&
          sig(recipes.find((r) => r.id === `craft-${i.id}`)?.inputs ?? []) === want,
      );
      if (!match) {
        addNmse(x, 'buildings', { freighter: kind });
        continue;
      }
      linked.add(match.id);
      match.freighter = kind;
      // Official pt-br names (and the numbered storage rooms) from the game's own strings.
      if (match.name.pt === match.name.en || match.name.en !== x.name.en) match.name = x.name;
      if (match.group.pt === match.group.en) match.group = x.group;
    }
  }

  // Manual overrides (e.g. COSMOS items not yet in the upstream data).
  for (const ov of input.overrides) {
    for (const o of ov.items ?? []) {
      if (items.has(o.id)) {
        warnings.push(`override item ${o.id} already exists upstream; the override can be removed`);
        continue;
      }
      if (o.part && !isValidPart(o.part)) {
        throw new Error(`override item ${o.id}: unknown part ${JSON.stringify(o.part)}`);
      }
      const cat = o.cat ?? (o.part ? PART_CATEGORIES[o.part.kind] : 'others');
      items.set(o.id, {
        id: o.id,
        cat,
        name: o.name,
        group: o.group ?? { en: '', pt: '' },
        icon: o.icon && input.hasIcon(o.icon) ? o.icon : null,
        value: o.value ?? 0,
        currency: o.currency ?? 'Credits',
        obtain: [],
        ...(o.part ? { part: o.part } : {}),
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
    ...new Set([
      ...Object.values(ITEM_FILES),
      ...Object.values(PART_CATEGORIES),
      ...[...items.values()].map((i) => i.cat),
    ]),
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
