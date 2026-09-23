// SPDX-License-Identifier: GPL-3.0-or-later
import MiniSearch from 'minisearch';
import type { Item } from './types.ts';

/** Lowercase and strip accents so "refinaria" matches "Refinária" and "cafe" matches "Café". */
export const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export interface ItemIndex {
  search(query: string): string[];
}

export function createIndex(items: Item[]): ItemIndex {
  const ms = new MiniSearch<{
    id: string;
    nameEn: string;
    namePt: string;
    groupEn: string;
    groupPt: string;
  }>({
    fields: ['id', 'nameEn', 'namePt', 'groupEn', 'groupPt'],
    processTerm: (term) => normalize(term),
    searchOptions: {
      prefix: true,
      fuzzy: (term) => (term.length > 3 ? 0.2 : false),
      combineWith: 'AND',
      boost: { nameEn: 3, namePt: 3, id: 2 },
    },
  });
  ms.addAll(
    items.map((i) => ({
      id: i.id,
      nameEn: i.name.en,
      namePt: i.name.pt,
      groupEn: i.group.en,
      groupPt: i.group.pt,
    })),
  );
  return { search: (q) => ms.search(q).map((r) => r.id as string) };
}
