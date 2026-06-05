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

## FASE 5 — ORÇAMENTO INTELIGENTE ⏳ PENDENTE

**Objetivo:** Calcular custos automaticamente.

**Entregáveis:**
- [ ] MDF por chapa (18mm, 15mm, 6mm)
- [ ] Ferragens por contagem real
- [ ] Produção (horas × valor/hora por etapa)
- [ ] Instalação (deslocamento + equipe)
- [ ] Margens configuráveis por empresa
- [ ] 3 versões: econômica / intermediária / premium

---

## FASE 6 — AMBIENTES COMPLEXOS ⏳ PENDENTE

**Entregáveis:**
- [ ] Cozinha em L
- [ ] Cozinha em U
- [ ] Ilha
- [ ] Closet
- [ ] Dormitório
- [ ] Banheiro
- [ ] Lavanderia

---

## FASE 7 — LEITURA DE PLANTAS ⏳ PENDENTE

**Entregáveis:**
- [ ] PDF → AmbienteGeometrico
- [ ] DWG → AmbienteGeometrico (via dxf-parser)
- [ ] Imagem com OpenCV (detecção de escala real)
- [ ] Extração geométrica precisa (cotas, pilares, vigas)

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
