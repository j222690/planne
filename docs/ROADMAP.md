# PLANNE ROADMAP
> Arquivo de rastreamento das fases. Atualizado automaticamente pelo arquiteto principal.
> Última atualização: 2026-06-05 — Fases 1, 2 e 3 concluídas (86 testes verdes)

---

## REGRA GERAL
- Sempre concluir uma fase antes de iniciar a próxima.
- Nunca pular etapas.
- Sempre preservar compatibilidade com o sistema atual.
- Toda implementação deve possuir: testes, documentação, plano de rollback.

---

## FASE 1 — FUNDAÇÃO ✅ CONCLUÍDA

**Objetivo:** Criar o núcleo definitivo do sistema.

| Entregável | Status | Arquivo |
|---|---|---|
| `AmbienteGeometrico` | ✅ | `src/lib/motor-parametrico/tipos.ts` |
| `ModuloParametrico` | ✅ | `src/lib/motor-parametrico/tipos.ts` |
| `ProjetoFabricavel` | ✅ | `src/lib/motor-parametrico/tipos.ts` |
| Estrutura de entidades (13 total) | ✅ | `src/lib/motor-parametrico/tipos.ts` |
| Funções puras: `calcularPecas`, `calcularFerragens` | ✅ | `src/lib/motor-parametrico/pecas.ts` |
| Bridge: `plantaToAmbiente`, `criarAmbienteManual` | ✅ | `src/lib/motor-parametrico/ambiente.ts` |
| Base de testes (Vitest) | ✅ | `src/lib/motor-parametrico/__tests__/` |
| Migração SQL | ✅ | `supabase/migrations/20260604_fase1_fundacao.sql` |

**Arquivos criados:**
```
src/lib/motor-parametrico/tipos.ts        — 13 entidades centrais
src/lib/motor-parametrico/ambiente.ts     — funções de AmbienteGeometrico
src/lib/motor-parametrico/pecas.ts        — calcularPecas, calcularFerragens, calcularMetricas
src/lib/motor-parametrico/index.ts        — API pública (re-exports)
src/lib/motor-parametrico/__tests__/ambiente.test.ts
src/lib/motor-parametrico/__tests__/pecas.test.ts
vitest.config.ts
supabase/migrations/20260604_fase1_fundacao.sql
```

**Arquivos modificados:**
```
api/analisar-planta.ts  — adiciona campo ambiente_geometrico no response
package.json            — adiciona scripts test, test:watch, test:ui
```

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_room_projects_ambiente;
DROP INDEX IF EXISTS idx_room_projects_origem;
ALTER TABLE room_projects DROP COLUMN IF EXISTS projeto_fabricavel, DROP COLUMN IF EXISTS origem;
```

---

## FASE 2 — MOTOR PARAMÉTRICO V1 ✅ CONCLUÍDA

**Objetivo:** Gerar cozinhas lineares automaticamente.

**Critério de aceite (atingido):**
```
Parede 4m → Projeto → Peças → Ferragens ✅
```

| Entregável | Status | Arquivo |
|---|---|---|
| Biblioteca de módulos (8 base + 8 aéreos) | ✅ | `src/lib/motor-parametrico/biblioteca-cozinha.ts` |
| Algoritmo de layout linear + encaixe greedy | ✅ | `src/lib/motor-parametrico/layout-cozinha-linear.ts` |
| Bridge para `_calc.ts` | ✅ | `src/lib/motor-parametrico/adapters.ts` |
| Endpoint serverless (< 100ms, zero IA) | ✅ | `api/motor-parametrico.ts` |
| Testes do algoritmo (33 casos) | ✅ | `src/lib/motor-parametrico/__tests__/layout.test.ts` |
| UI: painel "Motor Paramétrico" para cozinhas | ✅ | `src/routes/app.ia-projetos.tsx` |

**Validações do algoritmo `encaixarModulos`:**
- 400cm → 400cm exato · 320cm → 320cm exato · 380cm → 380cm exato
- Nenhum módulo < 30cm ou > 90cm · Aproveitamento ≥ 85% (paredes 300–500cm)

**Rollback:** remover `api/motor-parametrico.ts`, os 4 arquivos da biblioteca/layout e o painel UI. O `_calc.ts` legado nunca foi tocado.

---

## FASE 3 — RULE ENGINE ✅ CONCLUÍDA

**Objetivo:** Validar projetos automaticamente.

**Critério de aceite (atingido):**
```
Resultado → Aprovado / Aprovado com alertas / Reprovado ✅
```

| Entregável | Status | Detalhe |
|---|---|---|
| `validarProjeto()` — função pura auditável | ✅ | `src/lib/motor-parametrico/rule-engine.ts` |
| Validação de circulação mínima (80cm / 90cm) | ✅ | erro < 80cm · alerta < 90cm |
| Validação de módulo dentro da parede | ✅ | erro se ultrapassa o limite físico |
| Validação de módulo invadindo porta | ✅ | erro se sobrepõe vão de porta |
| Validação de base sob janela baixa | ✅ | alerta se peitoril < 90cm |
| Validação de aéreo colidindo com teto | ✅ | erro/alerta por folga |
| Validação de largura de módulo (30–90cm) | ✅ | alerta fora da faixa |
| Validação de aproveitamento (< 85%) | ✅ | alerta |
| Validação de ponto hidráulico atendido | ✅ | alerta se sem gabinete adjacente |
| Sistema de score 0–100 + status | ✅ | erro −25 · alerta −8 |
| Testes do Rule Engine (19 casos) | ✅ | `src/lib/motor-parametrico/__tests__/rule-engine.test.ts` |

**Integração:** `gerarLayoutCozinhaLinear()` já retorna o campo `validacao` (aditivo, não quebra Fase 2). O endpoint expõe `validacao`, `status_validacao` e `score_validacao`.

**Total acumulado: 86 testes passando, 0 erros TypeScript no motor.**

**Rollback:** remover `rule-engine.ts` e seu teste; remover o campo `validacao` de `ResultadoLayout` e os exports no `index.ts`. Tudo aditivo.

---

## FASE 4 — ENGENHARIA AUTOMÁTICA ✅ CONCLUÍDA

**Objetivo:** Transformar projeto em produção.

| Entregável | Status | Função |
|---|---|---|
| Lista de peças consolidada (agrupa idênticas) | ✅ | `consolidarPecas()` |
| Lista de ferragens agregada por tipo+marca | ✅ | `consolidarFerragens()` |
| Lista de materiais (chapas por espessura + custo) | ✅ | `consolidarMateriais()` |
| Metros de fita de borda (líquido + desperdício) | ✅ | `consolidarFita()` |
| Lista de compras (necessário − estoque) | ✅ | `gerarListaCompras()` |
| Pacote completo de engenharia | ✅ | `gerarEngenharia()` |
| Testes (26 casos) | ✅ | `__tests__/engenharia.test.ts` |

**Arquivo criado:** `src/lib/motor-parametrico/engenharia.ts`

**Características:**
- Todas as funções puras (sem I/O), consolidam dados já calculados na Fase 1/2.
- Peças idênticas (mesmo material + dimensão + fita) são agrupadas e contadas.
- Desperdício de chapa (15%) e de fita (15%) aplicados no dimensionamento.
- `gerarListaCompras()` desconta estoque atual e compatível com a entidade `ListaCompras` do núcleo.

**Integração:** o endpoint `api/motor-parametrico.ts` agora retorna o campo `engenharia` com peças, ferragens, materiais, fita e resumo de custos. Aditivo, não quebra Fases 2/3.

**Total acumulado: 112 testes passando, 0 erros TypeScript no motor.**

**Rollback:** remover `engenharia.ts` e seu teste; remover o campo `engenharia` do endpoint e os exports no `index.ts`. Tudo aditivo.

---

## FASE 5 — ORÇAMENTO INTELIGENTE ✅ CONCLUÍDA

**Objetivo:** Calcular custos automaticamente.

| Entregável | Status | Detalhe |
|---|---|---|
| MDF por chapa (18mm, 15mm, 6mm) | ✅ | via `consolidarMateriais` (Fase 4) |
| Ferragens por contagem real | ✅ | tabela `PRECO_FERRAGEM_REF` (18 tipos) |
| Produção (horas × valor/hora) | ✅ | 5 etapas: corte, bordagem, usinagem, montagem, acabamento |
| Instalação (deslocamento + equipe) | ✅ | horas × valor + km × custo |
| Custos indiretos | ✅ | overhead + impostos (regime) + comissão |
| Margens configuráveis por empresa | ✅ | `ConfiguracaoCusto` (default BR 2026) |
| 3 versões: econômica/intermediária/premium | ✅ | `gerarTresVersoes()` |
| Testes (20 casos) | ✅ | `__tests__/orcamento-inteligente.test.ts` |

**Arquivo criado:** `src/lib/motor-parametrico/orcamento-inteligente.ts`

**Função principal:** `calcularOrcamentoCompleto(projeto, versao, config)` decompõe o custo em
material + produção + instalação + indiretos → preço de venda com margem real.

**Sanidade econômica (cozinha 4m × 3m, 14 módulos):**
| Versão | Custo total | Preço de venda | Margem |
|---|---|---|---|
| Econômica | R$ 5.278 | R$ 8.120 | 35% |
| Intermediária | R$ 6.654 | R$ 12.098 | 45% |
| Premium | R$ 9.397 | R$ 22.373 | 58% |

**Integração:** o endpoint retorna o campo `orcamentos` (3 versões com custos completos).
A `ConfiguracaoCusto` usa defaults de mercado; tela de configuração por empresa fica para
fase futura (migração + UI), sem bloquear o motor.

**Total acumulado: 132 testes passando, 0 erros TypeScript no motor.**

**Rollback:** remover `orcamento-inteligente.ts` e seu teste; remover o campo `orcamentos`
do endpoint e os exports no `index.ts`. Tudo aditivo.

---

## FASE 6 — AMBIENTES COMPLEXOS ✅ CONCLUÍDA

**Objetivo:** Estender o motor para todos os ambientes da casa.

| Entregável | Status | Gerador |
|---|---|---|
| Cozinha em L (2 paredes + canto) | ✅ | `gerarLayoutCozinhaL()` |
| Cozinha em U (3 paredes + 2 cantos) | ✅ | `gerarLayoutCozinhaU()` |
| Ilha (central + circulação) | ✅ | `gerarLayoutIlha()` |
| Dormitório (roupeiros) | ✅ | `gerarLayoutDormitorio()` |
| Closet em L (mix funcional) | ✅ | `gerarLayoutCloset()` |
| Banheiro (gabinete pia + espelheira) | ✅ | `gerarLayoutBanheiro()` |
| Lavanderia (tanque + armário serviço) | ✅ | `gerarLayoutLavanderia()` |

**Arquitetura criada:**
```
layout-shared.ts          — fundação: material, config, encaixe, instanciação, montagem
regras-corte-comuns.ts    — RegraCorte/RegraFerragem reutilizáveis (corpo, porta, gaveta, ferragens)
biblioteca-quarto.ts      — roupeiro, gaveteiro, cabideiro, sapateira
biblioteca-servicos.ts    — gabinete pia, espelheira, gabinete tanque, armário serviço
layout-cozinha-l-u.ts     — cozinhas L e U com tratamento de canto (recuo 55cm)
layout-ilha.ts            — ilha central com validação de circulação (90cm)
layout-quarto.ts          — dormitório e closet
layout-servicos.ts        — banheiro e lavanderia (prioriza ponto hidráulico)
```

**Destaques técnicos:**
- Refatoração da cozinha linear (Fase 2) para usar a fundação compartilhada — zero regressão.
- Tratamento de canto em L/U: parede secundária recua a profundidade do gabinete (55cm)
  para não colidir no canto. Validado por testes de não-sobreposição.
- Ilha valida circulação mínima de 90cm em ambos os eixos antes de dimensionar.
- Banheiro/lavanderia escolhem a parede pelo ponto hidráulico quando presente.
- Roupeiros altos (250cm) recebem 4 dobradiças por porta automaticamente.
- Rule Engine (Fase 3), Engenharia (Fase 4) e Orçamento (Fase 5) rodam em TODOS os ambientes.

**Endpoint:** `api/motor-parametrico.ts` aceita `tipo_layout` (cozinha_linear, cozinha_l,
cozinha_u, ilha, dormitorio, closet, banheiro, lavanderia) e despacha para o gerador correto.

**Total acumulado: 163 testes passando, 0 erros TypeScript no motor.**

**Rollback:** os novos arquivos são aditivos; a refatoração da cozinha linear preserva a API
pública (`gerarLayoutCozinhaLinear`, `encaixarModulos`). Reverter = remover os 8 arquivos
novos e restaurar a versão anterior de `layout-cozinha-linear.ts`.

---

## FASE 7 — LEITURA DE PLANTAS ✅ CONCLUÍDA

**Objetivo:** Transformar plantas (DXF/imagem/PDF) em AmbienteGeometrico.

| Entregável | Status | Detalhe |
|---|---|---|
| DXF → AmbienteGeometrico | ✅ | parser DXF próprio, geometria exata |
| Extração geométrica precisa | ✅ | bounding box, paredes, unidades, aberturas |
| Imagem → AmbienteGeometrico | ✅ | via IA Vision (reusa OpenAI) + `plantaToAmbiente` |
| PDF → AmbienteGeometrico | ✅ | PDF imagem via IA Vision |
| Pipeline unificado | ✅ | `interpretarPlanta()` roteia por formato |

**Arquivos criados:**
```
dxf-parser.ts          — parser DXF puro (LINE, LWPOLYLINE, ARC, INSERT, $INSUNITS)
extracao-geometrica.ts — DXF → AmbienteGeometrico (dimensões reais + aberturas)
interpretar-planta.ts  — pipeline: dxf | imagem | pdf | manual → AmbienteGeometrico
api/leitura-planta.ts  — endpoint (DXF determinístico + IA Vision para imagem/PDF)
```

**Decisões técnicas (alinhadas à Vision):**
- **Parser DXF próprio, zero dependências** — DXF é texto (pares código-valor);
  evita problemas de build no serverless e dá **geometria exata** (cotas reais,
  não estimativa de IA). É "a engenharia constrói, não a IA".
- **Detecção de unidade** via `$INSUNITS`; se ausente, estima pela magnitude do
  bounding box (m / cm / mm).
- **Aberturas**: portas detectadas por arcos (folha de porta gira), janelas por
  layer; paredes por layer (`PAREDES/WALL`) ou contorno geral.
- **OpenCV pesado descartado** — `opencv4nodejs` não compila no Vercel. A visão
  computacional avançada fica para infra dedicada; DXF preciso + IA Vision já
  cobre os casos reais de plantas.
- **Nível de confiança** retornado (DXF com unidade declarada > IA Vision > estimativa).

**Integração:** o `AmbienteGeometrico` extraído alimenta diretamente o motor de
layout (teste de integração DXF → cozinha confirma o fluxo ponta a ponta).

**Total acumulado: 193 testes passando, 0 erros TypeScript no motor.**

**Rollback:** arquivos aditivos. Reverter = remover os 3 módulos da Fase 7,
o endpoint `api/leitura-planta.ts` e os exports no `index.ts`.

---

## FASE 8 — PLANO DE CORTE ⏳ PENDENTE

**Entregáveis:**
- [ ] Nesting 2D industrial (substituir guillotine atual)
- [ ] Otimização de chapas (meta: < 12% desperdício)
- [ ] Etiquetas por peça
- [ ] QR Codes por peça
- [ ] Exportação DXF/CSV para CNC

---

## FASE 9 — PCP ⏳ PENDENTE

**Entregáveis:**
- [ ] Cronograma automático de produção
- [ ] Sequenciamento de etapas (DAG)
- [ ] Integração com produção e instalação
- [ ] Lista de compras com prazo de entrega

---

## FASE 10 — IA MARCENEIRA ⏳ PENDENTE

**Entregáveis:**
- [ ] Conhecimento técnico de MDF e ferragens
- [ ] Sugestões de layout baseadas em normas (NBR)
- [ ] Estimativas de produção calibradas
- [ ] Análise de custos regionais

---

## FASE 11 — COPILOTO DA MARCENARIA ⏳ PENDENTE

**Entregáveis:**
- [ ] Chat operacional integrado ao motor
- [ ] Indicadores de negócio em tempo real
- [ ] Análises preditivas (margem, prazo, estoque)
- [ ] Sugestões automáticas de otimização
