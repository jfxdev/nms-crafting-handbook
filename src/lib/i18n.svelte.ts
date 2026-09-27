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
    en: 'No corvette parts in the catalog. Run npm run data:update-nmse or add verified parts in scripts/overrides/corvette.yaml.',
    pt: 'Nenhuma peça de corveta no catálogo. Rode npm run data:update-nmse ou adicione peças verificadas em scripts/overrides/corvette.yaml.',
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
  freighter: { en: 'Freighter planner', pt: 'Planejar cargueiro' },
  freighterIntro: {
    en: 'Plan your freighter base from above — something the game cannot show — and follow it when building. Each corridor, room or staircase takes one grid cell; corridors join their neighbours automatically, like in the game, and stairs lead to the deck above.',
    pt: 'Planeje a base do seu cargueiro vista de cima — o que o jogo não mostra — e siga o plano ao construir. Cada corredor, sala ou escada ocupa uma célula; os corredores se unem aos vizinhos automaticamente, como no jogo, e as escadas levam ao deck de cima.',
  },
  freighterNote: {
    en: 'The grid is logical: set its size to your freighter’s build area. Walls, doors and windows are not planned here.',
    pt: 'A grade é lógica: ajuste o tamanho à área de construção do seu cargueiro. Paredes, portas e janelas não entram no plano.',
  },
  kind_corridor: { en: 'Corridors', pt: 'Corredores' },
  kind_room: { en: 'Rooms', pt: 'Salas' },
  kind_stairs: { en: 'Stairs', pt: 'Escadas' },
  kind_exterior: { en: 'Exterior', pt: 'Exterior' },
  toolSelect: { en: 'Inspect', pt: 'Inspecionar' },
  toolErase: { en: 'Erase', pt: 'Apagar' },
  toolEntrance: { en: 'Entrance', pt: 'Entrada' },
  deck: { en: 'Deck {n}', pt: 'Deck {n}' },
  addDeckAbove: { en: 'Add deck above', pt: 'Adicionar deck acima' },
  addDeckBelow: { en: 'Add deck below', pt: 'Adicionar deck abaixo' },
  removeDeck: { en: 'Remove empty deck', pt: 'Remover deck vazio' },
  gridSize: { en: 'Grid', pt: 'Grade' },
  width: { en: 'Width', pt: 'Largura' },
  length: { en: 'Length', pt: 'Comprimento' },
  zoomIn: { en: 'Zoom in', pt: 'Aumentar zoom' },
  zoomOut: { en: 'Zoom out', pt: 'Diminuir zoom' },
  undo: { en: 'Undo', pt: 'Desfazer' },
  redo: { en: 'Redo', pt: 'Refazer' },
  clearDeck: { en: 'Clear deck', pt: 'Limpar deck' },
  newPlan: { en: 'New plan', pt: 'Novo plano' },
  confirmNew: {
    en: 'Discard the current plan and start a new one?',
    pt: 'Descartar o plano atual e começar um novo?',
  },
  bow: { en: 'Bow · bridge', pt: 'Proa · ponte' },
  stern: { en: 'Stern', pt: 'Popa' },
  pickModule: {
    en: 'Pick a module, then click or drag on the grid.',
    pt: 'Escolha um módulo e clique ou arraste na grade.',
  },
  paintHint: { en: 'Placing: {name}', pt: 'Colocando: {name}' },
  cellEmpty: { en: 'Empty cell', pt: 'Célula vazia' },
  cellAt: { en: 'Column {x}, row {y}, deck {z}', pt: 'Coluna {x}, linha {y}, deck {z}' },
  shape_single: { en: 'isolated', pt: 'isolado' },
  shape_end: { en: 'dead end', pt: 'sem saída' },
  shape_straight: { en: 'straight', pt: 'reto' },
  shape_corner: { en: 'L-junction', pt: 'junção em L' },
  shape_t: { en: 'T-junction', pt: 'junção em T' },
  shape_cross: { en: 'cross junction', pt: 'cruzamento' },
  shapeIs: { en: 'Takes the {shape} shape', pt: 'Assume o formato {shape}' },
  leadsUp: { en: 'Leads up to deck {n}', pt: 'Sobe para o deck {n}' },
  modules: { en: 'Modules', pt: 'Módulos' },
  noModules: { en: 'Nothing placed yet.', pt: 'Nada colocado ainda.' },
  checks: { en: 'Checks', pt: 'Verificações' },
  allGood: {
    en: 'Everything is connected to the entrance.',
    pt: 'Tudo está conectado à entrada.',
  },
  issue_noEntrance: {
    en: 'The entrance cell (deck {z}) is empty: place a module there so the base joins the bridge.',
    pt: 'A célula de entrada (deck {z}) está vazia: coloque um módulo nela para ligar a base à ponte.',
  },
  issue_unreachable: {
    en: '{n} module(s) not connected to the entrance.',
    pt: '{n} módulo(s) sem ligação com a entrada.',
  },
  issue_stairsNowhere: {
    en: '{n} staircase(s) with nothing on the deck above.',
    pt: '{n} escada(s) sem nada no deck de cima.',
  },
  exportJson: { en: 'Export', pt: 'Exportar' },
  importJson: { en: 'Import', pt: 'Importar' },
  importError: { en: 'Could not read that plan.', pt: 'Não foi possível ler esse plano.' },
  footer: {
    en: 'Unofficial fan project, not affiliated with Hello Games. Code and data: GPL-3.0-or-later. Item data from AssistantNMS (GPL-3.0); corvette parts and freighter modules from NMSE (AGPL-3.0). No Man’s Sky, item names and icons © Hello Games.',
    pt: 'Projeto de fã não oficial, sem afiliação com a Hello Games. Código e dados: GPL-3.0-or-later. Dados dos itens do AssistantNMS (GPL-3.0); peças de corveta e módulos de cargueiro do NMSE (AGPL-3.0). No Man’s Sky, nomes e ícones dos itens © Hello Games.',
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
