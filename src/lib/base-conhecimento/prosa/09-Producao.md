# Base Universal de Conhecimento da Marcenaria — Planne
## Módulo 9: PRODUÇÃO

> **Status:** Nono módulo da base. Cobre plano de corte/nesting, Sistema 32 de furação, sequência de usinagem e etiquetagem de peças. Mesma metodologia dos módulos anteriores.

---

## ÍNDICE DO MÓDULO
1. Plano de corte e nesting — otimização de aproveitamento de chapa
2. Sistema 32 — padrão de furação sequencial
3. Sequência de usinagem (furo → rasgo → corte)
4. Etiquetagem e rastreabilidade de peças

---

## 1. PLANO DE CORTE E NESTING — OTIMIZAÇÃO DE APROVEITAMENTO DE CHAPA

### 1.1 — Função e parâmetros de entrada do plano de corte

**Categoria:** Produção / Plano de corte / Otimização

**Descrição:** O plano de corte é o documento técnico que detalha o melhor aproveitamento das chapas de MDF/MDP disponíveis, reduzindo desperdício de material e otimizando o tempo de produção.<cite index="326-1">O plano de corte MDF é um documento técnico essencial para a marcenaria, que detalha o melhor aproveitamento das chapas de MDF, reduzindo desperdícios e otimizando o tempo de produção</cite> O processo de "nesting" (denominação técnica do algoritmo de distribuição) considera parâmetros como dimensões das chapas disponíveis, medidas e formatos de cada peça, espessura do corte da ferramenta (kerf), direção de corte (quando o material exige), limites de rotação das peças, e regras específicas da máquina/processo produtivo.<cite index="335-1">Dimensões das chapas disponíveis. Medidas e formatos das peças. Espessura do corte da ferramenta. Direção de corte, quando o material exige esse cuidado. Limites de rotação das peças. Regras específicas da máquina e do processo produtivo</cite>

**Quando aplicar:** Toda produção de marcenaria planejada, antes de liberar qualquer corte físico de chapa.

**Quando NÃO aplicar:** Não há dispensa — mesmo produções unitárias/artesanais se beneficiam de um plano de corte básico, ainda que manual.

**Condições:** O aproveitamento deve ser medido sobre a chapa inteira (a margem/refilo conta como sobra), porque é a chapa inteira que é efetivamente paga — uma prática de honestidade de cálculo citada por ferramentas especializadas do setor.<cite index="329-1">O aproveitamento é medido sobre a chapa inteira (margem conta como sobra), porque é a chapa inteira que você paga</cite>

**Limitações:** Planos de corte mal dimensionados podem gerar peças faltantes na produção, exigindo corte emergencial de chapa adicional — erro caro tanto em tempo quanto em material.<cite index="332-1">Planos mal dimensionados podem gerar peças faltantes</cite>

**Alternativas:** Algoritmos de nesting automatizado (MaxRects e variantes, com rotação de 90°, multi-chapa) em vez de organização manual do layout — o software aplica algoritmos que simulam inúmeras combinações de posicionamento em segundos, superando o potencial de economia do método manual em operações mais complexas.<cite index="332-1">No modelo tradicional, o programador organiza manualmente o layout das peças, utilizando seu conhecimento e experiência, já em operações mais complexas, esse método tende a limitar o potencial de economia. O software de nesting aplica algoritmos que simulam inúmeras combinações de posicionamento em poucos segundos</cite>

**Impacto estrutural:** Nenhum diretamente (parâmetro de produção, não de resistência da peça final).

**Impacto financeiro:** Crítico — é uma das principais alavancas de redução de custo de matéria-prima em toda a operação de marcenaria.

**Impacto estético:** Médio (direção do veio/padrão decorativo depende do plano de corte, ver módulo Estrutura item 5.1 sobre engrosso).

**Nível de importância:** Crítico.

**Fonte:** Guia da Marcenaria (blog técnico); Elite Solda e Robótica (blog especializado em CNC); Token Engenharia (ferramenta de nesting online).

**Fabricante:** N/A (categoria de processo/software, não fabricante de material).

**Observações:** O conhecimento do profissional continua essencial mesmo com uso de algoritmos dedicados — o papel do software é potencializar a experiência do time, não substituí-la.<cite index="332-1">O conhecimento do profissional continua essencial, porém, o uso de algoritmos dedicados amplia a capacidade de análise e padroniza resultados. O papel do software é potencializar a experiência do time, e não substituí-la</cite>

---

### 1.2 — Indicadores de aproveitamento e retorno sobre investimento

**Categoria:** Produção / Plano de corte / Métricas

**Descrição:** Para avaliar o ganho de um software/processo de nesting, a prática recomendada é acompanhar o índice médio de aproveitamento de chapa (exemplos de faixa citados: 75%, 80%, 85%) e comparar o consumo de chapas antes e depois da implantação de um processo otimizado, traduzindo cada ponto percentual de ganho em quantidade de chapas que deixam de ser compradas.<cite index="332-1">Comparar o consumo de chapas antes e depois da implantação. Acompanhar o índice médio de aproveitamento (por exemplo: 75%, 80%, 85%). Traduzir cada ponto percentual de ganho em quantidade de chapas que deixam de ser compradas</cite>

**Quando aplicar:** Análise de viabilidade de investimento em software de otimização de corte ou mudança de processo produtivo.

**Quando NÃO aplicar:** Produções muito pequenas/esporádicas podem não justificar o investimento em ferramentas avançadas — o cálculo de retorno deve considerar o volume de produção real da marcenaria.

**Condições:** Um exemplo prático de cálculo (ferramenta gratuita de nesting) mostrou, para um lote de 30 peças, necessidade de 2 chapas de 3.000×1.200 mm, com aproveitamento de 42,8% e sobra de 4,12 m² — ilustrando que aproveitamentos baixos (abaixo de 50%) são plenamente possíveis em lotes pequenos ou com peças de formato difícil de encaixar.<cite index="328-1">No lote-exemplo da página, 30 peças pedem 2 chapas de 3000×1200 mm, com aproveitamento de 42,8% e sobra de 4,12 m²</cite>

**Limitações:** O resultado do nesting orienta orçamento e compra de material, mas o plano de produção completo (contorno real da peça, sequência de operação da máquina, ordem de laminação/aplicação de fita de borda) continua sendo uma etapa separada de engenharia de fabricação — o nesting não substitui o planejamento operacional completo.<cite index="328-1">O resultado orienta orçamento e compra de material; o plano de produção (contorno real, sequência de tocha, laminação) continua sendo etapa de engenharia de fabricação</cite>

**Alternativas:** Sistemas mais completos (ERP integrado com módulo de nesting) para marcenarias de maior porte, versus ferramentas avulsas gratuitas/pagas para marcenarias menores ou de pedido individual.

**Impacto estrutural:** Nenhum.

**Impacto financeiro:** Crítico.

**Impacto estético:** Nenhum.

**Nível de importância:** Alto (gestão/métricas de produção).

**Fonte:** Elite Solda e Robótica; Token Engenharia.

**Fabricante:** N/A.

**Observações:** Marcenarias que trabalham com pedido individual em lotes unitários têm produtividade de nesting inerentemente diferente (e geralmente menor aproveitamento) do que fábricas que produzem em série com peças repetidas — este é um fator de contexto importante para não comparar aproveitamentos de forma descontextualizada.<cite index="333-1">Sua produtividade é incomparável dentro deste modelo de fabricação, o lote múltiplo. Não se pode afirmar o mesmo para marcenarias que trabalham o pedido individual em lotes unitários</cite>

---

### 1.3 — Seccionadora vs. CNC/nesting flexível

**Categoria:** Produção / Equipamento / Processo

**Descrição:** A seccionadora trabalha com "altura de corte variável", permitindo processar simultaneamente diversas chapas empilhadas em um mesmo avanço de material — sua grande vantagem é a produtividade em lote múltiplo (peças repetidas, produção em série); já centros CNC com nesting oferecem layout de corte mais flexível, mais adequado a peças de formato variado e produção sob encomenda unitária.<cite index="334-1">O grande diferencial da seccionadora é que ela trabalha com uma "altura de corte variável", o que permite processar simultaneamente diversas chapas em um mesmo avanço do material... a grande característica das seccionadoras é a questão da produtividade do lote, ou seja, seguir um plano de corte que trate simultaneamente da geração de peças repetidas para produtos em série</cite> <cite index="334-1">O nesting tem um layout de corte mais flexível</cite>

**Quando aplicar:** Decisão de investimento em equipamento de produção — seccionadora para operações de alto volume/série, CNC/nesting para operações de projeto sob medida com grande variedade de peças únicas.

**Quando NÃO aplicar:** Marcenarias de pequeno porte com baixo volume geral podem não justificar nenhum dos dois investimentos de grande porte, mantendo processo manual ou semi-manual.

**Condições:** A escolha do equipamento deve ser cruzada com o perfil real de produção da marcenaria (série vs. sob medida) antes de qualquer decisão de investimento.

**Limitações:** Seccionadoras não têm a mesma flexibilidade de formato/nesting de peças variadas que uma CNC oferece — são otimizadas para outro perfil de produção.

**Alternativas:** Combinação dos dois equipamentos na mesma planta industrial, cada um dedicado ao tipo de demanda que melhor atende (série na seccionadora, sob medida na CNC).

**Impacto estrutural:** Nenhum.

**Impacto financeiro:** Crítico (decisão de investimento em maquinário de alto valor).

**Impacto estético:** Nenhum.

**Nível de importância:** Alto (nível de gestão industrial, não de projeto individual).

**Fonte:** Claudio Perin Consultoria (blog especializado em marcenaria/indústria moveleira, "Marcenaria 4.0").

**Fabricante:** N/A (categoria de equipamento, não marca específica).

**Observações:** Este item é mais relevante para o módulo de "inteligência de produção" do Planne voltado a fábricas/marcenarias industriais do que para o projetista individual — mas é importante que o motor de regras reconheça essa diferença de contexto ao sugerir fluxos de trabalho.

---

## 2. SISTEMA 32 — PADRÃO DE FURAÇÃO SEQUENCIAL

### 2.1 — Definição e medidas-padrão do Sistema 32

**Categoria:** Produção / Furação / Padronização

**Descrição:** O Sistema 32 é uma técnica de furação amplamente difundida na Europa (no Brasil, praticada principalmente por grandes indústrias, devido à necessidade de máquinas de furação padronizadas), baseada em três medidas-padrão uniformes: (1) a distância de um furo até o outro é sempre 32 mm, tanto na horizontal quanto na vertical; (2) a fileira de furos nas laterais é posicionada a 37 mm da borda frontal do móvel; (3) as demais medidas de ferragem (dobradiças, corrediças) de diferentes fabricantes são desenhadas para coincidir com essa grade de 32 mm.<cite index="337-1">Sistema 32 é muito difundido em países da Europa, enquanto, no Brasil, apenas grandes indústrias detêm essa tecnologia, devido as máquinas de furação serem padronizada múltiplas de 32 mm</cite> <cite index="337-1">1º A distância de um furo até outro furo é 32 mm, tanto na horizontal como na vertical; 2º A fileira de furos nas laterais é posicionada em 37 mm (na parte interior) da borda do móvel</cite> <cite index="338-1">Esta técnica consiste na distância de 32mm de um furo até o outro, tanto na horizontal quanto na vertical, sendo amplamente recomendada para montagem de Dobradiças, Corrediças, Prateleiras, gavetas e todas as ferragens necessárias para a montagem de móveis</cite>

**Quando aplicar:** Todo projeto de furação de lateral de móvel (para prateleiras ajustáveis, dobradiças, corrediças), especialmente em produção industrializada/seriada.

**Quando NÃO aplicar:** Marcenarias artesanais de pedido único, sem máquina de furação padronizada em múltiplos de 32 mm, podem não conseguir aplicar o sistema com a mesma precisão — nesses casos, gabaritos específicos (item 2.2) tornam-se ainda mais importantes.

**Condições:** A maior parte das ferragens de indústria (dobradiças, corrediças de gaveta) já é projetada e desenvolvida tendo em mente as medições métricas do Sistema 32 — ou seja, especificar ferragem compatível com o sistema evita a necessidade de furação customizada fora do padrão.<cite index="338-1">A maior parte dos equipamentos da indústria de móveis, tais como dobradiças, corrediças de gaveta, etc… já são projetados e desenvolvidos tendo em mente as medições métricas do Sistema 32</cite>

**Limitações:** Fabricantes de puxador, por exemplo, frequentemente usam distâncias entre furos "quebradas" (96 mm, 128 mm, 160 mm etc.), que não seguem exatamente a lógica do Sistema 32 — nem toda ferragia do móvel está sob essa mesma grade padronizada.<cite index="349-1">Você já percebeu quanto um puxador alça tem medidas tão estranhas? A distância entre furos possui 128mm? 256mm? Por que não fizeram medidas padrões e redondas</cite>

**Alternativas:** Furação customizada ponto a ponto (sem seguir grade padronizada) para projetos muito específicos ou ferragens fora do padrão de mercado — solução mais lenta e sujeita a mais erro humano.

**Impacto estrutural:** Alto — furação incorreta ou desalinhada compromete diretamente a fixação da ferragem e, por consequência, a integridade funcional do móvel.

**Impacto financeiro:** Alto — padronização reduz tempo de produção e erro, com impacto direto em produtividade e custo de retrabalho.

**Impacto estético:** Médio.

**Nível de importância:** Crítico (é o padrão-base de toda a indústria moveleira que utiliza usinagem em série).

**Fonte:** Blog técnico do SENAI (Prof. Riverson Tobias do Vale, instrutor de marcenaria, SENAI São José dos Pinhais); Blog da Marcenaria (Marceneiro Expresso).

**Fabricante:** N/A (padrão de indústria, não específico de um fabricante — porém referenciado por praticamente todos os fabricantes de ferragem consultados nos módulos anteriores).

**Observações:** Este é um dos itens mais estratégicos de toda a base para o Planne: se o motor de regras adotar o Sistema 32 como grade nativa de furação, toda a compatibilidade entre diferentes fabricantes de ferragem (Blum, Häfele, Hettich — ver módulo Ferragens) fica naturalmente resolvida, já que todos operam sobre a mesma referência métrica internacional.

---

### 2.2 — Gabaritos de furação e desafios de alinhamento

**Categoria:** Produção / Furação / Ferramentas

**Descrição:** Gabaritos de furação (shelf-pin jigs, gabaritos de cavilha) são ferramentas físicas que garantem o alinhamento correto dos furos de acordo com a grade do Sistema 32 ou com a posição de dispositivos de montagem (minifix, cavilha) — mesmo pequenos desalinhamentos (poucos milímetros) entre furos comprometem o encaixe final da peça.<cite index="345-1">Um milímetro que seja, de desalinhamento entre os furos, já acaba comprometendo o encaixe</cite>

**Quando aplicar:** Toda operação de furação manual (sem CNC/seccionadora automatizada), especialmente para cavilhas e dispositivos de montagem tipo Girofix/minifix.

**Quando NÃO aplicar:** Furação automatizada por CNC (com programa digital de posicionamento) dispensa gabarito físico, já que a máquina executa a furação com precisão programada.

**Condições:** Gabaritos de qualidade superior (com sistema de travas) reduzem o problema de "firmeza"/deslizamento do gabarito durante a furação manual, evitando o desalinhamento citado como o maior desafio da técnica.<cite index="345-1">Por possuir travas, evita o problema da "firmeza" mencionado</cite>

**Limitações:** Trabalhar com cavilha manualmente é considerado por marceneiros experientes uma tarefa "chatinha" (trabalhosa e sujeita a erro), sendo mais eficiente na indústria, onde a furação é feita em máquinas programadas.<cite index="345-1">É muito eficiente na indústria, onde a furação é feita em máquinas. Fazer em casa, na mão, é difícil</cite>

**Alternativas:** Investimento em CNC com programa de furação digital para marcenarias que produzem em volume suficiente para justificar o custo do equipamento, eliminando a dependência de gabaritos manuais.

**Impacto estrutural:** Crítico (desalinhamento de furação compromete diretamente o encaixe estrutural da peça).

**Impacto financeiro:** Médio (gabaritos de qualidade custam mais, mas reduzem retrabalho).

**Impacto estético:** Alto — furos desalinhados são visíveis e depreciam a percepção de qualidade do acabamento.

**Nível de importância:** Alto.

**Fonte:** Marceneiros & Bricoleiros (fórum técnico brasileiro); Zinni Gabaritos (fabricante de gabaritos, manual técnico).

**Fabricante:** Zinni Gabaritos (linha de gabaritos para minifix, VB/Rafix, cavilhas, dobradiças caneco, suportes de prateleira).

**Observações:** A profundidade de furação para o "canal" do parafuso do sistema minifix é recomendada em 12 mm, segundo manual técnico de fabricante de gabaritos — parâmetro útil de referência para validação automática no motor de regras do Planne.<cite index="343-1">Recomendamos 12mm profundidade... gabarito Cavilha para realizar a furação do "canal" do parafuso do minifix (du)</cite>

---

## 3. SEQUÊNCIA DE USINAGEM (FURO → RASGO → CORTE)

### 3.1 — Ordem de operações na usinagem CNC

**Categoria:** Produção / Usinagem / Sequenciamento

**Descrição:** Softwares de plano de corte/nesting permitem configurar a sequência em que a máquina CNC executa as diferentes operações sobre cada peça — por exemplo, a ordem "FUROS → RASGO → CORTE" é citada como configuração possível, definindo que furos e rasgos (canais para dispositivos de montagem, cabos, etc.) sejam usinados antes do corte final de contorno da peça.<cite index="341-1">Escolha em qual sequência o nesting vai executar as operações. Por exemplo: FUROS - RASGO - CORTE</cite>

**Quando aplicar:** Configuração de qualquer fluxo de produção industrializado em CNC/seccionadora com múltiplas operações por peça.

**Quando NÃO aplicar:** Produção manual/artesanal sem máquina CNC segue lógica de sequência própria, geralmente definida pelo marceneiro conforme a ferramenta disponível (furadeira, tupia, serra), não por configuração de software.

**Condições:** A definição da origem da posição dos eixos iniciais das fresas, o sentido de carregamento da chapa na máquina, e a configuração de referências de brocas para troca rápida são parâmetros complementares que devem ser configurados junto com a sequência de operações.<cite index="341-1">Defina a origem da posição dos eixos iniciais das fresas para executar as operações... Determina o sentido do carregando da chapa na máquina para receber as operações... Permite configurar referências de brocas para troca rápida</cite>

**Limitações:** A sequência incorreta de operações pode comprometer a estabilidade da peça durante a usinagem (por exemplo, cortar o contorno final antes de furar pode deixar a peça sem apoio firme para as operações subsequentes).

**Alternativas:** Sequência alternativa (corte parcial → furos → corte final) para peças muito pequenas ou frágeis, quando a estabilidade durante a usinagem é uma preocupação maior que a velocidade do processo.

**Impacto estrutural:** Médio (sequência incorreta pode gerar imprecisão dimensional ou dano à peça durante a usinagem).

**Impacto financeiro:** Médio (retrabalho por erro de sequência tem custo direto de material e tempo de máquina).

**Impacto estético:** Baixo-médio.

**Nível de importância:** Alto (nível de engenharia de produção industrial).

**Fonte:** DinaBox (documentação de software de plano de corte com nesting).

**Fabricante:** N/A (configuração de software, aplicável a diferentes marcas de CNC).

**Observações:** Este item deve ser tratado como parâmetro avançado/técnico no motor de regras do Planne — de maior relevância para marcenarias industrializadas com CNC própria do que para o projetista que apenas especifica o móvel.

---

## 4. ETIQUETAGEM E RASTREABILIDADE DE PEÇAS

### 4.1 — Função das etiquetas de identificação na produção

**Categoria:** Produção / Etiquetagem / Rastreabilidade

**Descrição:** Etiquetas impressas (em impressoras especiais ou comuns) para identificar e rastrear peças produzidas são citadas como funcionalidade padrão de softwares de plano de corte, auxiliando diretamente as etapas de produção e montagem — cada peça cortada recebe uma identificação que a associa ao projeto/módulo/posição final no móvel.<cite index="327-1">Imprima etiquetas em impressoras especiais ou comuns para identificar e rastrear as peças produzidas, auxiliando na produção e montagem</cite>

**Quando aplicar:** Toda produção com múltiplas peças por projeto e/ou múltiplos projetos simultâneos na mesma marcenaria — praticamente universal a partir de um volume mínimo de produção.

**Quando NÃO aplicar:** Produção unitária muito simples (poucas peças, um único módulo) pode dispensar etiquetagem formal, usando identificação manual (marcação a lápis) sem grande risco de erro.

**Condições:** A geração de etiquetas deve estar integrada ao próprio plano de corte/nesting, para que a identificação já saia associada à posição de corte de cada peça na chapa, evitando etapa manual adicional de correspondência.<cite index="336-1">Várias opções de configuração para impressão de planos de cortes, com diversos métodos de otimização para melhor aproveitamento e fácil geração de etiquetas de identificação</cite>

**Limitações:** Etiquetagem manual (sem integração ao software de plano de corte) é mais sujeita a erro humano de transcrição/correspondência entre peça física e posição de projeto.

**Alternativas:** Códigos de barra ou QR code na etiqueta, para leitura automatizada em etapas posteriores (separação, embalagem, conferência antes do transporte — ver módulo Transporte, a ser detalhado).

**Impacto estrutural:** Nenhum.

**Impacto financeiro:** Médio — erros de identificação de peça geram retrabalho significativo na montagem em obra, muitas vezes identificado apenas no momento da instalação final.

**Impacto estético:** Nenhum diretamente (mas erros de identificação podem levar a montagem incorreta com impacto estético).

**Nível de importância:** Alto.

**Fonte:** Otimize Nesting (ficha de funcionalidades de software); DinaBox (documentação de software).

**Fabricante:** N/A (funcionalidade padrão de diversos softwares do setor: Otimize Nesting, DinaBox, MaxCut, Cutlist Optimizer, entre outros citados nas fontes consultadas).

**Observações:** Este item se conecta diretamente ao módulo "Montagem" (a ser detalhado) — a etiquetagem correta na produção é o que viabiliza uma sequência de montagem eficiente em obra, especialmente em projetos com muitos módulos e peças semelhantes entre si.

---

## PRÓXIMOS PASSOS SUGERIDOS

Módulos concluídos até aqui: **Cozinhas**, **Ferragens**, **Estrutura**, **Portas e Gavetas**, **Materiais**, **Closets**, **Banheiros**, **Escritórios** e **Produção** (este documento). Sequência restante:

10. **Transporte** — peso, elevadores, portas, escadas, caminhões, divisão de peças.
11. **Montagem** — sequência, ferramentas, tempo, número de montadores, espaço.
12. **Economia** — redução de desperdício, engrossos econômicos, padronização, melhor aproveitamento de chapas.

Continuando em sequência para o módulo **Transporte**.
