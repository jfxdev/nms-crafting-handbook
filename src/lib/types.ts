// SPDX-License-Identifier: GPL-3.0-or-later
// Shared shape of the generated catalog (public/data/catalog.json).

export type Lang = 'en' | 'pt';
export type Localized = Record<Lang, string>;
export type RecipeType = 'craft' | 'refine' | 'cook';

export interface Qty {
  id: string;
  qty: number;
}

export interface Item {
  id: string;
  /** Category key, also the name of the description shard (data/desc/<cat>.json). */
  cat: string;
  name: Localized;
  group: Localized;
  /** Path under icons/ (e.g. "products/6.webp"), or null when no icon is available. */
  icon: string | null;
  value: number;
  currency: string;
  stack?: number;
  colour?: string;
  /** Recipe types that produce this item; empty means gathered/bought/rewarded. */
  obtain: RecipeType[];
  /** Added by hand from scripts/overrides (not present in the upstream data). */
  manual?: boolean;
}

export interface Recipe {
  id: string;
  type: RecipeType;
  inputs: Qty[];
  output: Qty;
  /** Time reported by the game data, in seconds (refiner / nutrient processor). */
  time?: number;
  op?: Localized;
  /** Total input units : output units, reduced (e.g. "50:1"). */
  ratio: string;
  /** Input quantity needed per single unit of output. */
  perUnit: Qty[];
  source: 'assistantnms' | 'override';
}

export interface Source {
  repo: string;
  ref: string;
  sha: string;
  commitDate: string;
  gameVersion: string;
  gameVersionName: string;
  gameReleaseDate: string;
  /** True when the upstream data predates the targeted game release. */
  stale: boolean;
}

export interface Catalog {
  source: Source;
  categories: string[];
  items: Item[];
  recipes: Recipe[];
  producedBy: Record<string, string[]>;
  usedIn: Record<string, string[]>;
}

export interface Description {
  /** In-game description, with the game's colour markup (<TAG>text<>). */
  text: Localized;
  /** Optional hand-written Markdown ("how to obtain"). */
  notes?: Partial<Localized>;
}

export type DescriptionShard = Record<string, Description>;
