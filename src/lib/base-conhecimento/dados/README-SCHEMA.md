# Base de Conhecimento do Planne — Camada 2 (Estruturada / Executável)

Este diretório é a **Camada 2** da base: conhecimento estruturado, consumível por software (Knowledge Engine / Rule Engine / IA), gerado automaticamente a partir da **Camada 1** (os 12 arquivos `.md` legíveis por humanos, mantidos sem alteração de conteúdo).

Nenhuma informação técnica foi adicionada, removida ou reescrita nesta conversão — apenas reorganizada em campos.

## Arquivos

- `00-knowledge-base-consolidada.json` — todos os 112 átomos de conhecimento em um único arquivo (uso: carga inicial em bulk no banco/engine).
- `01-cozinhas.json` ... `12-economia.json` — os mesmos átomos, um arquivo por módulo (uso: carga incremental / debug por domínio).
- `entidades.json` — registro de todas as entidades/subcategorias mencionadas e quais átomos pertencem a cada uma.
- `relacionamentos.json` — referências cruzadas detectadas automaticamente entre módulos (ex.: um átomo de "Portas e Gavetas" que cita o módulo "Ferragens").
- `grafo_core.json` — grafo núcleo curado manualmente com as entidades, propriedades e relações mais centrais e recorrentes (Porta→Dobradiça→Peso→Material, MDF possui espessura, Corrediça possui carga máxima, Prateleira→risco→Empenamento→mitigado_por→Reforço/Engrosso, etc.) — usar como semente do grafo antes de expandir com extração adicional.

## Schema do Átomo de Conhecimento

Cada item em `atomos` segue esta estrutura:

```json
{
  "id": "string — identificador único, gerado por módulo+subcategoria+título",
  "entidade": "string — o assunto/subcategoria principal do conhecimento",
  "categoria": "string — nome do módulo de origem (Cozinhas, Ferragens, ...)",
  "subcategoria": "string — seção dentro do módulo",
  "titulo": "string — título original da regra",
  "tipo": "regra_obrigatoria | recomendacao | boa_pratica | alerta | restricao",
  "descricao": "string — motivo técnico / explicação da regra (texto original preservado)",
  "condicoes": {
    "quando_aplicar": "string",
    "condicoes_adicionais": "string"
  },
  "restricoes": {
    "quando_nao_aplicar": "string",
    "limitacoes": "string"
  },
  "acoes_recomendadas": "string — alternativas / ações sugeridas",
  "motivo_tecnico": "string — mesmo conteúdo de descricao (explicação causal)",
  "impacto": {
    "estrutural": "nenhum | baixo | médio | alto | crítico",
    "financeiro": "nenhum | baixo | médio | alto | crítico",
    "estetico": "nenhum | baixo | médio | alto | crítico"
  },
  "prioridade": "baixo | médio | alto | crítico",
  "confianca": {
    "score": "0-100, calculado a partir do tipo de fonte",
    "base": "norma_oficial | fabricante_oficial | manual_tecnico_fabricante | estudo_academico | blog_tecnico_especializado | comunidade"
  },
  "fonte": "string — texto original do campo Fonte",
  "fabricante": "string ou null — texto original do campo Fabricante (null quando N/A)",
  "observacoes": "string — texto original do campo Observações (frequentemente contém referências cruzadas a outros módulos)",
  "tags": ["array de palavras-chave extraídas automaticamente"],
  "modulo_origem": "string — ex. '02-Ferragens', para rastreabilidade até a Camada 1",
  "versao": {"numero": 1, "origem": "migracao_v1_markdown"}
}
```

## Regra de sincronização entre as duas camadas

- A Camada 1 (`.md`) permanece a fonte de leitura humana e **não deve ser editada manualmente** sem também regenerar a Camada 2.
- Cada átomo carrega `modulo_origem`, permitindo sempre rastrear de volta ao arquivo/seção `.md` que o gerou.
- Qualquer nova entrada futura deve ser escrita primeiro na Camada 1 seguindo o mesmo template de campos (Categoria, Descrição, Quando aplicar, Quando NÃO aplicar, Condições, Limitações, Alternativas, Impactos, Nível de importância, Fonte, Fabricante, Observações) e depois reprocessada pelo script de conversão — isso é o que mantém as duas camadas sincronizadas sem trabalho manual duplicado.

## Limitações conhecidas desta primeira versão (v1)

- `relacionamentos.json` captura apenas referências cruzadas *entre módulos* (nível grosso), extraídas por padrão de texto ("módulo X") dentro do campo Observações — não é ainda um grafo completo de entidade-a-entidade granular. O `grafo_core.json` supre parcialmente essa lacuna com um núcleo curado manualmente.
- A classificação de `tipo` (regra_obrigatoria/recomendacao/boa_pratica/alerta/restricao) é heurística, baseada em palavras-chave — indicada para uso imediato pelo Rule Engine, mas recomenda-se revisão amostral antes de tratar como 100% definitiva.
- O campo `confianca.score` é calculado por regra de negócio simples (tipo de fonte), não por avaliação humana individual de cada átomo.

Nenhuma dessas limitações exige nova pesquisa ou nova arquitetura — são ajustes de refinamento sobre a estrutura já gerada, quando o time achar necessário.
