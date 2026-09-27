# NMS Crafting Handbook

Catálogo bilíngue (🇧🇷 PT-BR / 🇺🇸 EN) de **como conseguir cada item do No Man's Sky**: crafting,
refinaria e culinária. Itens sem receita mostram a descrição do jogo + notas em Markdown.

_Bilingual (PT-BR / EN) No Man's Sky handbook: how to get every item via crafting, refining or
cooking._

## Funcionalidades

- **Busca** instantânea em português e inglês (ignora acentos, tolera erros de digitação), por nome,
  grupo ou ID; filtros por tipo de receita e categoria.
- **Feito de** — as receitas que produzem o item, com ingredientes clicáveis.
- **Usado em** — todas as receitas em que o item é ingrediente, agrupadas por tipo.
- **Proporção E/S** em cada receita (ex.: `50 : 1`) e quantidade de cada ingrediente **por unidade**
  produzida; campo **Quantidade desejada** que escala os ingredientes (em execuções inteiras).
- **Montar nave** (`#/builder`) — as 281 peças de nave (Caça, Transportador, Explorador, Solar)
  classificadas por slot (cockpit/fuselagem, asas, motores, velas solares), com **prévia
  esquemática** da nave montada usando os ícones oficiais, escolha aleatória, valor total e link
  compartilhável. Cada peça mostra onde encaixa e um atalho "Montar com esta peça".
- **Corvetas** — 162 peças (cockpits, habitação, reatores, motores, trem de pouso, estabilizadores,
  chapeamento, armas, escudos, interior...) com nomes oficiais em PT-BR, ícones e as 32 receitas
  da Oficina de corveta. No "Montar nave", a montagem soma os **materiais para fabricar**. Dados do
  [NMSE](https://github.com/vectorcmdr/NMSE) (NMS 7.03), já que o AssistantNMS ainda não publica
  corvetas; peças faltantes podem entrar por
  [`scripts/overrides/corvette.yaml`](scripts/overrides/corvette.yaml).
- **Planejar cargueiro** (`#/freighter`) — mapa visto de cima (algo que o jogo não oferece) para
  desenhar a base do cargueiro antes de construir: 41 módulos atuais (corredores, salas, escadas,
  exterior) com nomes oficiais em PT-BR; clique ou arraste para colocar, vários decks ligados por
  escadas, corredores que assumem o formato certo (reto, L, T, cruzamento) como no jogo, alerta de
  módulos sem ligação com a entrada, contagem de módulos e **materiais totais**. O plano fica salvo
  no navegador e pode ser compartilhado por link ou exportado/importado em JSON.
- **Ícones oficiais** do jogo, tema claro/escuro, layout mobile.

## Dados

|                     |                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Versão alvo do jogo | **NMS 7.01 — COSMOS** (lançado em 09/09/2026)                                                                          |
| Fonte               | [AssistantNMS/App](https://github.com/AssistantNMS/App) — ver [`data/SOURCE.json`](data/SOURCE.json)                   |
| Corvetas            | [NMSE](https://github.com/vectorcmdr/NMSE) (AGPL-3.0) — ver [`data/raw/nmse/SOURCE.json`](data/raw/nmse/SOURCE.json)   |
| Conteúdo            | 3.706 itens (162 peças de corveta) · 1.427 receitas de crafting · 357 de refinaria · 1.323 de culinária · 2.879 ícones |

> ⚠️ Os dados mais recentes publicados pelo AssistantNMS são de **08/10/2025**, anteriores ao
> COSMOS. Itens adicionados depois disso podem estar faltando — o site mostra esse aviso. Itens
> verificados podem ser adicionados manualmente em
> [`scripts/overrides/cosmos.yaml`](scripts/overrides/cosmos.yaml).

Os dados **ficam versionados no repositório**: `dev`, `build` e o CI não acessam a rede.

```
data/raw/{en,pt-br}/   JSON bruto do AssistantNMS (cópia única, atual)
data/SOURCE.json       commit de origem + versão do jogo
data/raw/nmse/         peças de corveta normalizadas do NMSE (+ SOURCE.json)
public/data/           catálogo gerado (catalog.json + desc/<categoria>.json)
public/icons/          ícones oficiais convertidos para .webp
scripts/overrides/     itens/receitas manuais (YAML)
content/descriptions/  notas "como obter" em Markdown (<id>.pt.md / <id>.en.md)
```

## Uso

```bash
npm install
npm run dev          # servidor local
npm test             # testes do grafo de receitas
npm run build        # typecheck + build estático em dist/
npm run data:build   # regenera public/data a partir de data/raw (offline)
```

### Atualizar os dados (manual, só quando necessário)

```bash
npm run data:update -- --ref main --game-version 7.01 --game-name COSMOS --game-date 2026-09-09
git diff --stat      # revise itens novos/removidos antes de commitar
npm run data:update-nmse       # corvetas + módulos de cargueiro + ícones a partir do NMSE
```

Baixa só os JSON `en`/`pt-br` e os ícones usados (clone esparso), converte os ícones, grava
`data/SOURCE.json` e regenera o catálogo. O build falha se alguma receita referenciar um item
inexistente e avisa quando um override manual já existe na fonte.

## Deploy

O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica no GitHub Pages a
cada push na `main` (ative _Settings → Pages → Source: GitHub Actions_).

## Licença

[GPL-3.0-or-later](LICENSE) — dados derivados do AssistantNMS (GPL-3.0). _No Man's Sky_, nomes e
ícones dos itens © Hello Games; projeto de fã não oficial. Veja [`NOTICE.md`](NOTICE.md).
