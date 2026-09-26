// SPDX-License-Identifier: GPL-3.0-or-later
import type { Lang, Localized, RecipeType } from './types.ts';

const STRINGS = {
  title: { en: 'NMS Crafting Handbook', pt: 'NMS Crafting Handbook' },
  tagline: {
    en: 'How to get every No Man’s Sky item — crafting, refining and cooking.',
    pt: 'Como conseguir cada item do No Man’s Sky — crafting, refinaria e culinária.',
  },
  searchPlaceholder: {
    en: 'Search items (English or Portuguese)…',
    pt: 'Buscar itens (em português ou inglês)…',
  },
  loading: { en: 'Loading…', pt: 'Carregando…' },
  loadError: { en: 'Failed to load the catalog: {error}', pt: 'Falha ao carregar o catálogo: {error}' },
  all: { en: 'All', pt: 'Todos' },
  noRecipe: { en: 'No recipe', pt: 'Sem receita' },
  allCategories: { en: 'All categories', pt: 'Todas as categorias' },
  showing: { en: 'Showing {n} of {total}', pt: 'Mostrando {n} de {total}' },
  noResults: { en: 'No items found.', pt: 'Nenhum item encontrado.' },
  back: { en: '← Back to search', pt: '← Voltar à busca' },
  notFound: { en: 'Item not found.', pt: 'Item não encontrado.' },
  howToGet: { en: 'How to obtain', pt: 'Como obter' },
  madeFrom: { en: 'Made from', pt: 'Feito de' },
  usedIn: { en: 'Used in', pt: 'Usado em' },
  notUsed: { en: 'Not used in any recipe.', pt: 'Não é usado em nenhuma receita.' },
  description: { en: 'Description', pt: 'Descrição' },
  desiredQty: { en: 'Desired quantity', pt: 'Quantidade desejada' },
  ratio: { en: 'I/O ratio', pt: 'Proporção E/S' },
  perUnit: { en: 'per 1 {item}', pt: 'por 1 {item}' },
  forQty: { en: 'For {n}:', pt: 'Para {n}:' },
  runs: { en: '{n} run(s)', pt: '{n} execução(ões)' },
  time: { en: 'Time', pt: 'Tempo' },
  value: { en: 'Value', pt: 'Valor' },
  stack: { en: 'Max stack', pt: 'Pilha máx.' },
  manual: { en: 'added manually', pt: 'adicionado manualmente' },
  showAll: { en: 'Show all {n}', pt: 'Mostrar todas as {n}' },
  noDescription: {
    en: 'No description available yet.',
    pt: 'Ainda não há descrição disponível.',
  },
  dataVersion: { en: 'Data: NMS {v} {name}', pt: 'Dados: NMS {v} {name}' },
  staleWarning: {
    en: 'Base data from AssistantNMS dated {date}, before {name}: items added since may be missing.',
    pt: 'Base de dados do AssistantNMS de {date}, anterior ao {name}: itens adicionados depois podem estar faltando.',
  },
  theme: { en: 'Toggle theme', pt: 'Alternar tema' },
  aboutData: { en: 'About the data', pt: 'Sobre os dados' },
  close: { en: 'Close', pt: 'Fechar' },
  voiceSearch: { en: 'Search by voice', pt: 'Buscar por voz' },
  listening: { en: 'Listening…', pt: 'Ouvindo…' },
  footer: {
    en: 'Unofficial fan project, not affiliated with Hello Games. Code and data: GPL-3.0-or-later. Item data from AssistantNMS (GPL-3.0). No Man’s Sky, item names and icons © Hello Games.',
    pt: 'Projeto de fã não oficial, sem afiliação com a Hello Games. Código e dados: GPL-3.0-or-later. Dados dos itens do AssistantNMS (GPL-3.0). No Man’s Sky, nomes e ícones dos itens © Hello Games.',
  },
} satisfies Record<string, Localized>;

export type StringKey = keyof typeof STRINGS;

export const RECIPE_LABEL: Record<RecipeType, Localized> = {
  craft: { en: 'Crafting', pt: 'Crafting' },
  refine: { en: 'Refiner', pt: 'Refinaria' },
  cook: { en: 'Cooking', pt: 'Culinária' },
};

export const CATEGORY_LABEL: Record<string, Localized> = {
  raw: { en: 'Raw materials', pt: 'Matérias-primas' },
  products: { en: 'Products', pt: 'Produtos' },
  technology: { en: 'Technology', pt: 'Tecnologia' },
  techModules: { en: 'Technology modules', pt: 'Módulos de tecnologia' },
  upgrades: { en: 'Upgrade modules', pt: 'Módulos de melhoria' },
  constructed: { en: 'Constructed technology', pt: 'Tecnologia construída' },
  buildings: { en: 'Buildings', pt: 'Construções' },
  cooking: { en: 'Cooking', pt: 'Culinária' },
  curiosities: { en: 'Curiosities', pt: 'Curiosidades' },
  trade: { en: 'Trade items', pt: 'Itens de comércio' },
  procedural: { en: 'Procedural products', pt: 'Produtos procedurais' },
  others: { en: 'Others', pt: 'Outros' },
};

const LANG_KEY = 'nms-handbook:lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'pt') return saved;
  } catch {
    /* storage unavailable */
  }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

const initial = initialLang();
document.documentElement.lang = initial === 'pt' ? 'pt-BR' : 'en';
let langState = $state<Lang>(initial);

export const lang = {
  get current(): Lang {
    return langState;
  },
};

export function setLang(next: Lang): void {
  langState = next;
  document.documentElement.lang = next === 'pt' ? 'pt-BR' : 'en';
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    /* storage unavailable */
  }
}

export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return STRINGS[key][langState].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export const loc = (v: Localized): string => v[langState] || v.en;
export const other = (v: Localized): string => v[langState === 'en' ? 'pt' : 'en'];

const numberFormat = () =>
  new Intl.NumberFormat(langState === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: 4 });
export const fmt = (n: number): string => numberFormat().format(n);
