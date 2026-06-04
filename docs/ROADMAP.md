# PLANNE ROADMAP
> Arquivo de rastreamento das fases. Atualizado automaticamente pelo arquiteto principal.
> Última atualização: 2026-06-04

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

## FASE 2 — MOTOR PARAMÉTRICO V1 ⏳ AGUARDANDO AUTORIZAÇÃO

**Objetivo:** Gerar cozinhas lineares automaticamente.

**Critério de aceite:**
```
Parede 4m → Projeto → Peças → Ferragens
```

**Entregáveis planejados:**
- [ ] `src/lib/motor-parametrico/biblioteca-cozinha.ts` — 16 módulos base + 16 aéreos
- [ ] `src/lib/motor-parametrico/layout-cozinha-linear.ts` — algoritmo de encaixe
- [ ] `src/lib/motor-parametrico/adapters.ts` — bridge para `_calc.ts`
- [ ] `api/motor-parametrico.ts` — endpoint serverless
- [ ] Testes: layout 320cm, 400cm, parede com porta, parede com janela
- [ ] UI: botão "Motor Paramétrico" em `app.ia-projetos.tsx` para cozinhas

---

## FASE 3 — RULE ENGINE ⏳ PENDENTE

**Objetivo:** Validar projetos automaticamente.

**Entregáveis:**
- [ ] Validação de circulação mínima (90cm)
- [ ] Validação de distâncias mínimas entre módulos
- [ ] Validação de portas e janelas
- [ ] Sistema de score: Aprovado / Aprovado com alertas / Reprovado

---

## FASE 4 — ENGENHARIA AUTOMÁTICA ⏳ PENDENTE

**Objetivo:** Transformar projeto em produção.

**Entregáveis:**
- [ ] Lista de peças completa (integrada com Fase 2)
- [ ] Lista de ferragens
- [ ] Lista de materiais
- [ ] Lista de compras

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
