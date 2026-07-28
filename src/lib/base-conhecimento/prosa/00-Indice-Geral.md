# Base Universal de Conhecimento da Marcenaria — Planne
## Índice Geral

Este é o índice da base de conhecimento em construção para o motor de inteligência do Planne. Cada arquivo é um módulo independente, mas com referências cruzadas entre si — sempre que um item de um módulo depende de outro, isso está indicado nas "Observações" da respectiva regra.

### Módulos concluídos (base inicial completa — 12 de 12)

| Nº | Módulo | Arquivo | Conteúdo |
|----|--------|---------|----------|
| 1 | Cozinhas | `01-Cozinhas.md` | Triângulo de trabalho, geladeira, cooktop/fogão, forno de embutir, micro-ondas/torre quente, coifa, lava-louças, cubas, bancadas, armários aéreos, despenseiros, boas práticas de processo |
| 2 | Ferragens | `02-Ferragens.md` | Dobradiças (quantidade, tipos, capacidade de carga), corrediças (carga, extração), puxadores (posicionamento), dispositivos de montagem (minifix, cavilha, VB/Rafix) |
| 3 | Estrutura | `03-Estrutura.md` | Espessuras de MDF/MDP, vão máximo e carga de prateleiras, fundo estrutural (travamento), empenamento (causas/prevenção), engrosso/tamponamento, reforço com cantoneira |
| 4 | Portas e Gavetas | `04-Portas-e-Gavetas.md` | Folgas e recobrimento, largura máxima por folha, porta de correr, porta camarão, porta basculante/pistão a gás, gavetas (folgas e montagem) |
| 5 | Materiais | `05-Materiais.md` | MDF vs. MDP, linhas hidrófugas (RUC Guararapes, Ultra Duratex, Hidrófugo Arauco), compensado naval, dimensões-padrão de chapa |
| 6 | Closets | `06-Closets.md` | Cabideiros, sapateiras, maleiros, nichos, gavetas por categoria de item, metragem/circulação, iluminação e espelhos/joalheiros |
| 7 | Banheiros | `07-Banheiros.md` | Altura de bancada/pia, gabinete sob a pia (sifão/ventilação/umidade), espelhos, rodabanca/frontão/testeira, materiais resistentes à umidade |
| 8 | Escritórios | `08-Escritorios.md` | Altura de mesa e NR-17, posicionamento de monitor, compartimento de CPU (ventilação), gestão de cabos, gaveteiros de escritório |
| 9 | Produção | `09-Producao.md` | Plano de corte/nesting, Sistema 32 de furação, sequência de usinagem, etiquetagem e rastreabilidade |
| 10 | Transporte | `10-Transporte.md` | Dimensões de elevador/porta de acesso, içamento vs. desmontagem, divisão de peças, acondicionamento de carga |
| 11 | Montagem | `11-Montagem.md` | Sequência completa de instalação, ferramentas por tipo de acabamento, ajuste fino/regulagem, contratação e garantia |
| 12 | Economia | `12-Economia.md` | Redução de desperdício via plano de corte, reaproveitamento de retalhos, metodologia 5S/Kaizen, KPIs de aproveitamento |

### Metodologia (válida para todos os módulos)

- Pesquisa real em fontes técnicas: fabricantes (Blum, Häfele, Hettich, Rometal, Arauco, Duratex, Guararapes, FGVTN, Soprano etc.), blogs técnicos especializados de marcenaria, fóruns profissionais, catálogos oficiais e um estudo acadêmico (UnB) sobre flexão de painéis.
- Conteúdo reescrito em linguagem própria — nunca copiado literalmente das fontes.
- Números conflitantes entre fontes são registrados como **faixas**, não como valor único — o motor de regras do Planne deve tratar essas faixas como válidas simultaneamente, priorizando o manual do fabricante específico quando disponível.
- Cada regra segue o formato: Título, Categoria, Descrição, Quando aplicar, Quando NÃO aplicar, Condições, Limitações, Alternativas, Impacto estrutural, Impacto financeiro, Impacto estético, Nível de importância, Fonte, Fabricante, Observações.

### Status: base inicial de 12 módulos concluída ✅

Todas as 12 categorias definidas no escopo original foram pesquisadas e documentadas neste ciclo.

### Possíveis extensões futuras (fora do escopo original, mencionadas na solicitação inicial)

- **Aprofundamento internacional** — normas e boas práticas específicas da Alemanha, Itália, Estados Unidos, Canadá e Austrália (o material atual já cita fontes internacionais pontuais — NKBA, EN 1935, TÜV — mas um levantamento dedicado por país ainda não foi feito).
- **Subcategorias ainda tratadas de forma resumida** — painéis de TV/ripados como categoria própria, nichos como módulo isolado (hoje tratados apenas cruzados dentro de Estrutura/Cozinhas/Closets), iluminação técnica aprofundada.
- **Conteúdo de escolas técnicas (SENAI)** de forma mais extensa — o material do SENAI apareceu pontualmente (ex.: Sistema 32, módulo Produção), mas um levantamento dedicado ao acervo técnico do SENAI ainda pode ser aprofundado.
- **Normas ABNT específicas por ambiente** (cozinhas, escritórios, closets, móveis infantis) de forma mais sistemática — hoje citadas pontualmente (NBR 13103, NBR 9050) mas não como levantamento normativo dedicado.

Qualquer novo módulo/extensão deve seguir a mesma numeração sequencial (13, 14...) e o mesmo formato estruturado, mantendo a "Wikipedia da Marcenaria" organizada e fácil de consumir por um motor de regras/IA no futuro.
