// SPDX-License-Identifier: GPL-3.0-or-later
import type { Catalog, Description, DescriptionShard, Item, Recipe } from './types.ts';

const base = import.meta.env.BASE_URL;

export interface Store {
  catalog: Catalog;
  items: Map<string, Item>;
  recipes: Map<string, Recipe>;
  description(item: Item): Promise<Description | undefined>;
}

export const iconUrl = (item: Item | undefined): string =>
  item?.icon ? `${base}icons/${item.icon}` : `${base}placeholder.svg`;

export async function loadStore(): Promise<Store> {
  const res = await fetch(`${base}data/catalog.json`);
  if (!res.ok) throw new Error(`catalog.json: HTTP ${res.status}`);
  const catalog = (await res.json()) as Catalog;
  const shards = new Map<string, Promise<DescriptionShard>>();
  return {
    catalog,
    items: new Map(catalog.items.map((i) => [i.id, i])),
    recipes: new Map(catalog.recipes.map((r) => [r.id, r])),
    async description(item) {
      let shard = shards.get(item.cat);
      if (!shard) {
        shard = fetch(`${base}data/desc/${item.cat}.json`).then((r) =>
          r.ok ? (r.json() as Promise<DescriptionShard>) : {},
        );
        shards.set(item.cat, shard);
      }
      return (await shard)[item.id];
    },
  };
}
