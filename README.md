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
- **Ícones oficiais** do jogo, tema claro/escuro, layout mobile.

## Dados

|                     |                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| Versão alvo do jogo | **NMS 7.01 — COSMOS** (lançado em 09/09/2026)                                                        |
| Fonte               | [AssistantNMS/App](https://github.com/AssistantNMS/App) — ver [`data/SOURCE.json`](data/SOURCE.json) |
| Conteúdo            | 3.544 itens · 1.395 receitas de crafting · 357 de refinaria · 1.323 de culinária · 2.718 ícones      |

> ⚠️ Os dados mais recentes publicados pelo AssistantNMS são de **08/10/2025**, anteriores ao
> COSMOS. Itens adicionados depois disso podem estar faltando — o site mostra esse aviso. Itens
> verificados podem ser adicionados manualmente em
> [`scripts/overrides/cosmos.yaml`](scripts/overrides/cosmos.yaml).

Os dados **ficam versionados no repositório**: `dev`, `build` e o CI não acessam a rede.

```
data/raw/{en,pt-br}/   JSON bruto do AssistantNMS (cópia única, atual)
data/SOURCE.json       commit de origem + versão do jogo
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
