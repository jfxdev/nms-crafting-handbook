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
  loadError: {
    en: 'Failed to load the catalog: {error}',
    pt: 'Falha ao carregar o catálogo: {error}',
  },
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
  builder: { en: 'Ship builder', pt: 'Montar nave' },
  builderIntro: {
    en: 'Pick a class and one part per slot to preview the assembled ship. Parts come from breaking down ships at the Starship Outfitting unit; assemble them at the Starship Fabricator.',
    pt: 'Escolha a classe e uma peça por slot para ver a prévia da nave montada. As peças vêm de desmontar naves no Starship Outfitting; a montagem é feita no Starship Fabricator.',
  },
  preview: { en: 'Preview', pt: 'Prévia' },
  previewNote: {
    en: 'Schematic preview composed from the official part icons (not a 3D render).',
    pt: 'Prévia esquemática composta com os ícones oficiais das peças (não é um render 3D).',
  },
  emptySlot: { en: 'Empty', pt: 'Vazio' },
  parts: { en: '{n} parts', pt: '{n} peças' },
  filterParts: { en: 'Filter parts…', pt: 'Filtrar peças…' },
  randomize: { en: 'Random', pt: 'Aleatória' },
  clear: { en: 'Clear', pt: 'Limpar' },
  copyLink: { en: 'Copy link', pt: 'Copiar link' },
  copied: { en: 'Link copied!', pt: 'Link copiado!' },
  build: { en: 'Build', pt: 'Montagem' },
  totalValue: { en: 'Total value', pt: 'Valor total' },
  noSelection: { en: 'No part selected yet.', pt: 'Nenhuma peça selecionada ainda.' },
  remove: { en: 'Remove', pt: 'Remover' },
  fitsIn: { en: 'Fits: {cls} · {slot}', pt: 'Encaixa em: {cls} · {slot}' },
  buildWith: { en: 'Build with this part', pt: 'Montar com esta peça' },
  corvetteNoData: {
    en: 'No corvette parts in the catalog. Run npm run data:update-corvette or add verified parts in scripts/overrides/corvette.yaml.',
    pt: 'Nenhuma peça de corveta no catálogo. Rode npm run data:update-corvette ou adicione peças verificadas em scripts/overrides/corvette.yaml.',
  },
  corvetteSource: {
    en: 'Corvette parts: game data extracted by NMSE (AGPL-3.0). Build them at the Corvette Workshop aboard any space station.',
    pt: 'Peças de corveta: dados do jogo extraídos pelo NMSE (AGPL-3.0). A montagem é feita na Oficina de corveta de qualquer estação espacial.',
  },
  materials: { en: 'Materials to craft', pt: 'Materiais para fabricar' },
  materialsFor: {
    en: 'Only {n} of the chosen parts have a crafting recipe; the others are rewards or bought.',
    pt: 'Só {n} das peças escolhidas têm receita; as demais são recompensas ou compradas.',
  },
  footer: {
    en: 'Unofficial fan project, not affiliated with Hello Games. Code and data: GPL-3.0-or-later. Item data from AssistantNMS (GPL-3.0); corvette parts from NMSE (AGPL-3.0). No Man’s Sky, item names and icons © Hello Games.',
    pt: 'Projeto de fã não oficial, sem afiliação com a Hello Games. Código e dados: GPL-3.0-or-later. Dados dos itens do AssistantNMS (GPL-3.0); peças de corveta do NMSE (AGPL-3.0). No Man’s Sky, nomes e ícones dos itens © Hello Games.',
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
  starshipParts: { en: 'Starship parts', pt: 'Peças de nave' },
  corvetteParts: { en: 'Corvette parts', pt: 'Peças de corveta' },
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
