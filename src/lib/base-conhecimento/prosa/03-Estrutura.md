# Base Universal de Conhecimento da Marcenaria — Planne
## Módulo 3: ESTRUTURA

> **Status:** Terceiro módulo da base (após "Cozinhas" e "Ferragens"). Cobre travamentos, engrossos, tampos, empenamento, reforços, prateleiras (carga/vão) e fundo estrutural. Mesma metodologia de pesquisa e formato dos módulos anteriores.

---

## ÍNDICE DO MÓDULO
1. Espessuras de MDF/MDP e função estrutural de cada uma
2. Prateleiras — vão máximo e capacidade de carga
3. Fundo do móvel — função estrutural (travamento traseiro)
4. Empenamento — causas e prevenção
5. Engrosso e tamponamento — técnicas de composição de espessura e acabamento
6. Esquadro e travamento diagonal

---

## 1. ESPESSURAS DE MDF/MDP E FUNÇÃO ESTRUTURAL DE CADA UMA

### 1.1 — Tabela geral de aplicação por espessura

**Categoria:** Estrutura / Materiais / Dimensionamento

**Descrição:** O mercado brasileiro de marcenaria trabalha essencialmente com quatro faixas de espessura de MDF, cada uma com aplicação estrutural preferencial: 15 mm (caixaria/estrutura interna de móveis sem carga excessiva, divisórias, fundos estruturados), 18 mm (padrão de excelência para portas, tampos de móveis médios, laterais estruturais e prateleiras de guarda-roupa — o mais usado em projetos residenciais de alto padrão), e 25 mm (tampos de mesa, prateleiras de vão longo, portas mais pesadas e colunas que recebem carga superior).<cite index="132-1">O MDF de 15mm é o coringa para estruturas que não recebem carga excessiva... MDF 18mm: sendo a espessura mais comum em móveis planejados residenciais de alto padrão, oferece o equilíbrio perfeito entre custo, estabilidade estrutural e durabilidade... MDF 25mm: quando o projeto exige suporte de carga superior ou um design mais imponente, é a escolha técnica correta</cite>

**Quando aplicar:** Definição inicial de espessura de qualquer peça do móvel, antes de calcular vãos e cargas específicas (itens 2 e seguintes deste módulo).

**Quando NÃO aplicar:** Peças de fundo (não estrutural) costumam usar espessuras menores (3–9 mm), fora dessa tabela geral — ver item 3.

**Condições:** A escolha da espessura correta impacta diretamente o custo: como regra prática, cada 3 mm a mais de espessura pode representar 15–20% de aumento no custo do material.<cite index="136-1">Como regra prática: cada 3mm a mais de espessura pode representar 15-20% de aumento no custo do material</cite>

**Limitações:** Espessuras maiores (25 mm+) aumentam significativamente o peso do móvel montado, com impacto direto em transporte e fixação na parede.

**Alternativas:** Uso de engrosso (item 5) para simular uma espessura maior sem pagar o preço de uma chapa inteira mais grossa.

**Impacto estrutural:** Crítico — é a decisão-base de todo o dimensionamento estrutural do móvel.

**Impacto financeiro:** Crítico — espessura é um dos maiores componentes de custo de material em marcenaria planejada.

**Impacto estético:** Alto — espessuras maiores (25 mm) transmitem sensação de robustez e "peso visual" valorizada em projetos de alto padrão.

**Nível de importância:** Crítico.

**Fonte:** Arauco Brasil (blog institucional do fabricante); Móveis Goiânia (guia técnico); Gasômetro Madeiras.

**Fabricante:** Arauco, Duratex, Guararapes (citados como referência de catálogo de espessuras).

**Observações:** Chapas de 15 mm também são citadas como boa base para dobradiças em portas com espelho ou vidro, e chapas de 18 mm como as mais indicadas para acomodar puxadores, dobradiças e perfis de alumínio em portas grandes.<cite index="146-1">Chapas com espessuras de 18mm e que não estejam danificadas são ótimas para acomodar puxadores, dobradiças e perfis de alumínio</cite>

---

### 1.2 — Frequência de uso como critério adicional de espessura

**Categoria:** Estrutura / Dimensionamento

**Descrição:** Além do peso e do vão, a frequência de abertura/fechamento da peça deve influenciar a escolha de espessura — um gaveteiro de uso diário intenso precisa de mais resistência estrutural do que um armário raramente aberto, mesmo que ambos armazenem cargas semelhantes.<cite index="136-1">Um gaveteiro de uso diário precisa de mais resistência que um armário raramente aberto</cite>

**Quando aplicar:** Especificação de espessura em móveis de uso intensivo (cozinha, área de serviço) versus móveis de uso ocasional (armário de quarto de hóspedes, despensa de acesso raro).

**Quando NÃO aplicar:** Não é um critério isolado — deve sempre ser combinado com peso de carga e vão, nunca usado sozinho para justificar redução de espessura.

**Condições:** Recomenda-se espessuras maiores nas partes mais solicitadas de móveis de cozinha, que são abertos de maneira diária e constante.<cite index="136-1">Para móveis de cozinha, que são abertos de maneira diária e constante, recomenda-se espessuras maiores nas partes mais solicitadas</cite>

**Limitações:** Difícil de quantificar objetivamente ("uso intenso" não tem definição numérica padronizada no setor) — depende de julgamento do projetista.

**Alternativas:** Reforçar a ferragem (corrediças/dobradiças de linha superior) como alternativa a aumentar espessura, quando o custo de material for mais restritivo que o de ferragem.

**Impacto estrutural:** Alto (fadiga de material por uso repetido).

**Impacto financeiro:** Médio.

**Impacto estético:** Baixo.

**Nível de importância:** Médio-alto.

**Fonte:** Móveis Goiânia (guia técnico).

**Fabricante:** N/A.

**Observações:** Este critério deveria ser capturado no motor de regras do Planne como um input qualitativo do usuário ("frequência de uso esperada"), afetando a recomendação de espessura e de linha de ferragem em conjunto.

---

## 2. PRATELEIRAS — VÃO MÁXIMO E CAPACIDADE DE CARGA

### 2.1 — Relação entre vão, espessura e flecha (deformação)

**Categoria:** Estrutura / Prateleiras / Engenharia de materiais

**Descrição:** Estudos técnicos sobre flexão estática em painéis de MDF/MDP mostram que a deformação (flecha) de uma prateleira depende da espessura da chapa, da distância entre apoios (vão) e da carga aplicada — a relação segue uma fórmula de engenharia de materiais onde a flecha (∆) é proporcional à carga (p) e ao cubo do vão (L³), e inversamente proporcional ao módulo de elasticidade (E), à largura (b) e ao cubo da espessura (S³).<cite index="135-1">Onde ∆ é a flecha em mm, "p" a carga distribuída em kg, "L" a distância entre apoios em mm, "S" a espessura da chapa em mm, "E" o módulo de elasticidade em N/mm² e "b" a largura da prateleira em mm</cite> Uma regra prática derivada de estudos de flexão estática indica uma relação ideal vão/espessura superior a 20 — ou seja, para uma prateleira de 18 mm, o vão máximo recomendado seria de aproximadamente 360 mm para cargas normais.<cite index="136-1">Estudos científicos mostram que a relação ideal entre vão (L) e espessura (h) em ensaios de flexão estática chega a ser superior a vinte; isso significa que para uma prateleira de 18mm, o vão máximo recomendado seria de 360mm para cargas normais</cite>

**Quando aplicar:** Dimensionamento de qualquer prateleira interna de armário, estante ou nicho, especialmente em vãos longos (acima de 60 cm).

**Quando NÃO aplicar:** Prateleiras com apoio contínuo (encaixadas em ranhura lateral a lateral, sem vão livre) não seguem esta lógica de vão — o vão relevante nesse caso é zero ou mínimo.

**Condições:** Para cargas concentradas (não distribuídas uniformemente — ex.: um único objeto pesado no centro da prateleira), os valores de vão máximo devem ser reduzidos em 30–40% em relação aos calculados para carga distribuída.<cite index="136-1">Para cargas concentradas (não distribuídas), reduza esses valores em 30-40%</cite>

**Limitações:** O tempo de permanência da carga também influencia a deformação (fluência/creep) — estudos técnicos notam que muitas referências de mercado não especificam claramente por quanto tempo a prateleira permaneceu sob carga durante os ensaios, o que introduz incerteza nas tabelas populares.<cite index="135-1">As cargas foram uniformemente distribuídas, no entanto não foi mencionado o procedimento de ensaios nem o tempo que as prateleiras permaneceram sob efeito de carga</cite>

**Alternativas:** Reforço com cantoneira/perfil metálico sob a prateleira, ou suporte central adicional, quando o vão desejado excede o recomendado para a espessura disponível.

**Impacto estrutural:** Crítico.

**Impacto financeiro:** Médio (aumentar espessura ou adicionar suportes tem custo, mas evita retrabalho por prateleira arqueada).

**Impacto estético:** Alto — prateleira com flecha visível é um dos defeitos mais visíveis e mal percebidos pelo cliente em móveis planejados.

**Nível de importância:** Crítico.

**Fonte:** Repositório UnB (estudo técnico "Particleboard and MDF for Shelving", tese de mestrado); Móveis Goiânia (guia aplicado).

**Fabricante:** Estudo cita dados testados em MDF e MDP genéricos, não uma marca específica.

**Observações:** Esta fórmula de engenharia (flexão estática) é a base técnica mais rigorosa encontrada na pesquisa e deveria ser o núcleo do motor de cálculo de vão máximo do Planne, com a ressalva de aplicar fator de segurança adicional por conta da incerteza sobre tempo de carga sustentada (fluência).

---

### 2.2 — Exemplos práticos de capacidade de carga por espessura

**Categoria:** Estrutura / Prateleiras / Referência prática

**Descrição:** Como referência prática (não substituindo o cálculo de engenharia do item 2.1), o mercado usa exemplos como: uma prateleira de MDF de 15 mm pode suportar livros sem envergar em um vão de 40 cm, mas para um vão de 1 metro seria necessário usar 18 mm ou 25 mm.<cite index="134-1">Uma prateleira de espessura de 15mm em MDF pode aguentar livros sem envergar se tiver 40 cm por exemplo; se usar um metro de comprimento, teria que usar 18mm ou 25mm</cite> Produtos comerciais de prateleira pronta (18 mm, sem suporte, 60 cm de largura) declaram suportar 10 kg distribuídos como referência de mercado.<cite index="133-1">Suporta 10 kg distribuídos</cite>

**Quando aplicar:** Como validação cruzada rápida de um cálculo de engenharia mais detalhado, ou quando não há tempo/dados suficientes para o cálculo completo do item 2.1.

**Quando NÃO aplicar:** Não deve ser usado como única fonte de verdade em projetos de carga elevada (biblioteca, despensa com muitos itens pesados) — nesses casos, o cálculo de flexão (item 2.1) é obrigatório.

**Condições:** Vão de suporte de parede (mão-francesa) a cada 40 cm no mínimo, com haste compatível com a largura da prateleira.<cite index="138-1">A cada 400mm pelo menos é necessário que tenha um suporte invisível instalado na parede e a haste que ficará dentro da madeira seja compatível com a largura</cite>

**Limitações:** Valores de "peso suportado" divulgados comercialmente muitas vezes não especificam se a carga é distribuída ou concentrada, nem o tempo de permanência — usar com cautela e sempre com margem de segurança.

**Alternativas:** Consultar tabela de referência específica do fabricante da prateleira/suporte antes de assumir um valor genérico de mercado.

**Impacto estrutural:** Alto.

**Impacto financeiro:** Baixo.

**Impacto estético:** Médio.

**Nível de importância:** Alto (uso prático cotidiano do projetista).

**Fonte:** Habitissimo (fórum de perguntas técnicas); Marcena (loja de móveis sob medida, tabela de referência própria).

**Fabricante:** N/A (referências de mercado genéricas).

**Observações:** O motor de regras do Planne deveria, idealmente, oferecer as duas camadas: um cálculo de engenharia rigoroso (item 2.1) para o núcleo do sistema, e uma tabela de referência rápida (este item) para verificação de bom senso e comunicação simplificada com o cliente final.

---

## 3. FUNDO DO MÓVEL — FUNÇÃO ESTRUTURAL (TRAVAMENTO TRASEIRO)

### 3.1 — Fundo como elemento de travamento, não apenas de vedação

**Categoria:** Estrutura / Travamentos

**Descrição:** O fundo do móvel (a chapa traseira) não deve ser tratado apenas como uma vedação estética — ele cumpre função estrutural de travamento, mantendo o esquadro (ângulo de 90°) do corpo do móvel e evitando que a caixa "abra" ou torça com o uso. Móveis com fundo fino simplesmente pregado, sem função de travamento real, tendem a perder o esquadro com o tempo, comprometendo o alinhamento de portas e gavetas.<cite index="124-1">O móvel planejado bem executado tem estrutura de travamento mais firme, laterais dimensionadas para o vão exato e fundo mais resistente, não apenas uma chapa fina pregada atrás; no modulado comum, a peça depende de medidas padrão e costuma sofrer quando precisa ser adaptada na instalação</cite>

**Quando aplicar:** Todo projeto de móvel modulado com estrutura em caixa (armários, gaveteiros, estantes fechadas).

**Quando NÃO aplicar:** Módulos totalmente abertos (estantes sem fundo, painéis vazados) não têm essa função de travamento pelo fundo — nesses casos, o travamento precisa vir de outro elemento (traseira parcial, cantoneiras, ou a própria fixação na parede).

**Condições:** Duas espessuras de fundo são comuns no mercado: 3 mm, encaixado em ranhura (sistema mais barato e mais rápido de montar), ou 6 mm, parafusado (mais resistente, mais indicado quando o fundo também precisa contribuir estruturalmente).<cite index="123-1">O fundo pode ser de 3 mm (ranhura) ou 6 mm (parafusado)</cite>

**Limitações:** Fundo de 3 mm em ranhura tem função de travamento mais limitada — indicado para móveis leves ou de uso pouco intenso; para móveis de cozinha e áreas de uso pesado, o fundo de 6 mm parafusado é mais indicado.

**Alternativas:** Uso de cantoneiras metálicas em diagonal (ver item 6) como reforço complementar ao fundo, especialmente em módulos fixados na parede que recebem carga lateral.

**Impacto estrutural:** Crítico.

**Impacto financeiro:** Baixo-médio (diferença de custo entre fundo de 3 mm e 6 mm é pequena frente ao ganho estrutural).

**Impacto estético:** Baixo (fundo normalmente não é visível, exceto em móveis com fundo aparente/decorativo).

**Nível de importância:** Crítico.

**Fonte:** Guia da Marcenaria (blog técnico); Rio Marcenaria Fina (blog institucional de marcenaria local).

**Fabricante:** N/A.

**Observações:** É comum, segundo relatos do setor, que marcenarias de baixo custo usem MDP de baixa densidade com fundo fino e fita de borda mal colada, sem proteção contra vapor/umidade — o resultado citado é inchamento, perda de parafuso e empenamento generalizado, especialmente em cozinha e banheiro.<cite index="124-1">Em muitos casos, usa MDP de baixa densidade, fundo fino, travamento simples e fita de borda colada com adesivo comum, sem proteção adequada contra vapor, calor e umidade... o resultado disso? Porta empenada, prateleira embarrigada, armário com cheiro ruim e cliente gastando duas vezes no mesmo ambiente</cite>

---

### 3.2 — Montagem sobre superfície plana antes de fixar o fundo

**Categoria:** Estrutura / Processo de montagem

**Descrição:** Na montagem de móveis (planejados ou modulados), o corpo do móvel deve ser estruturado sobre uma superfície plana e forrada, com portas e gavetas alinhadas, antes de o fundo traseiro ser definitivamente fixado (pregado/parafusado) — porque é o fundo que "trava" o esquadro final da peça.<cite index="128-1">O montador precisa ter o cuidado de estruturar o móvel em uma superfície plana e forrada para garantir o alinhamento de portas e gavetas antes de pregar o fundo traseiro</cite>

**Quando aplicar:** Todo processo de montagem de móvel em caixa, seja planejado sob medida ou modulado de fábrica.

**Quando NÃO aplicar:** Não há exceção — mesmo módulos pequenos se beneficiam desta sequência de montagem.

**Condições:** Uso de esquadro para verificar o ângulo de 90° antes da fixação do fundo é etapa obrigatória de controle de qualidade.<cite index="127-1">O esquadro é usado pra verificar e traçar ângulos retos (90°)... ele garante que as peças estejam alinhadas e que cortes, encaixes e montagens saiam simétricos</cite>

**Limitações:** Erro nesta etapa é de difícil correção posterior — uma vez que o fundo é fixado fora de esquadro, a correção exige desmontagem parcial do móvel.

**Alternativas:** Uso de gabaritos de montagem e niveladores de módulo para reduzir a dependência da habilidade manual do montador nesta etapa crítica.

**Impacto estrutural:** Crítico.

**Impacto financeiro:** Alto se o erro só for percebido após a instalação completa (retrabalho em campo é mais caro que na oficina).

**Impacto estético:** Alto — esquadro incorreto é a causa-raiz mais comum de "portas tortas" e "gavetas emperradas" relatadas por clientes finais.

**Nível de importância:** Crítico.

**Fonte:** Hábito Diário Free (guia de montagem); Empoeirados (guia de uso do esquadro).

**Fabricante:** N/A (processo, não produto).

**Observações:** Esta é uma regra de processo (não de especificação de material/ferragem), mas de altíssimo valor para o módulo "Montagem" do Planne (a ser detalhado em rodada futura) — vale registrar aqui a interseção direta com Estrutura.

---

## 4. EMPENAMENTO — CAUSAS E PREVENÇÃO

### 4.1 — Causa técnica raiz: diferença de absorção de umidade entre as faces

**Categoria:** Estrutura / Empenamento / Materiais

**Descrição:** O empenamento de painéis de MDF ocorre principalmente quando há diferença na absorção/liberação de umidade entre as duas faces da chapa — por exemplo, uma face em contato com solo/ambiente úmido absorve umidade e se expande, enquanto a face oposta, exposta a ar seco ou luz solar direta, se contrai, gerando tensão interna que resulta em deformação.<cite index="145-1">São as mudanças de umidade entre as várias partes do MDF, por exemplo, onde um lado da folha seca mais rápido do que o outro, que podem causar tensões que levam ao empenamento</cite>

**Quando aplicar:** Análise de causa raiz sempre que um empenamento for identificado, antes de aplicar qualquer correção.

**Quando NÃO aplicar:** Empenamento por armazenamento inadequado (calços desalinhados, pilha mal apoiada) tem causa diferente — mecânica, não de umidade — e deve ser tratado separadamente (ver item 4.3).

**Condições:** Aplicar o mesmo acabamento (revestimento/laminado) nas duas faces da peça é a prevenção mais citada tecnicamente, pois equilibra a taxa de absorção/liberação de umidade entre as faces.<cite index="144-1">Em casos onde uma das faces está crua ou com acabamento simples, adicionar um revestimento na face oposta ajuda a reequilibrar as tensões da placa; exemplo: adicionar laminado melamínico na face interna da porta, espelhando a estrutura da face externa</cite>

**Limitações:** O MDF é altamente higroscópico (absorve prontamente água tanto por contato direto quanto pela atmosfera em ambientes úmidos), o que torna a exposição em obras/canteiros um risco relevante antes mesmo da instalação final.<cite index="145-1">O MDF tem uma alta capacidade de absorção e suga qualquer água com a qual ele entra em contato, seja diretamente... ou da atmosfera, ao ser usado em condições úmidas</cite>

**Alternativas:** Uso de laminado melamínico (não poroso) como barreira de proteção — reduz significativamente o risco de inchaço/empenamento por absorção direta de umidade pela superfície, embora as bordas não seladas continuem vulneráveis.<cite index="147-1">O laminado não é poroso, o que significa que evita que a umidade penetre diretamente na superfície da porta... no entanto, embora o laminado ofereça esta proteção, as bordas da porta, se não forem vedadas, ainda poderão absorver umidade</cite>

**Impacto estrutural:** Crítico.

**Impacto financeiro:** Alto (substituição de portas empenadas é uma das reclamações mais caras e recorrentes do setor).

**Impacto estético:** Crítico.

**Nível de importância:** Crítico.

**Fonte:** Marcenaria de Hoje (blog técnico); Portal Tudo Para Móveis (guia para profissionais); Zhejiang Jingtang Door Industry (fabricante internacional, artigo técnico sobre laminado melamínico).

**Fabricante:** N/A (regra de material, válida para qualquer fabricante de MDF).

**Observações:** Diferente da madeira maciça (onde a direção da fibra e a posição de origem no tronco influenciam fortemente o risco de empenamento), o MDF combina fibras de diversas madeiras, o que reduz — mas não elimina — essa fonte específica de instabilidade dimensional.<cite index="145-1">Em madeiras naturais, há muito mais coisas que podem influenciar o empenamento, por exemplo, a direção da fibra da madeira... o MDF combina fibras de várias madeiras duras e macias, eliminando essas fraquezas potenciais</cite>

---

### 4.2 — Limite de tolerância e critério de substituição

**Categoria:** Estrutura / Empenamento / Controle de qualidade

**Descrição:** Existe um limiar prático de torção acima do qual a correção deixa de ser viável e a peça deve ser substituída: quando a torção excede 5 mm ou interfere na abertura e no alinhamento da porta, a recomendação técnica é substituir a peça, reaproveitando ferragens e revestimentos quando possível.<cite index="144-1">Quando a torção excede 5 mm ou interfere na abertura e no alinhamento, o mais indicado é substituir a porta; no entanto, é possível reaproveitar dobradiças, puxadores e até mesmo revestimentos</cite>

**Quando aplicar:** Controle de qualidade em pós-venda/assistência técnica, para decidir entre correção (item 4.3) e substituição integral da peça.

**Quando NÃO aplicar:** Empenamentos muito leves (dentro da tolerância de regulagem 3D das dobradiças modernas, tipicamente ±2–3 mm) podem ser corrigidos apenas com o ajuste fino da própria ferragem, sem necessidade de qualquer intervenção na chapa.

**Condições:** Medir a torção com régua ou nível, com a porta posicionada em superfície plana, antes de decidir o caminho de correção.<cite index="144-1">Com a porta posicionada em uma superfície plana, meça a torção com uma régua ou nível</cite>

**Limitações:** O critério de 5 mm é uma referência prática de mercado, não uma norma técnica formal — pode variar conforme a tolerância aceitável definida em contrato com o cliente.

**Alternativas:** Para empenamentos leves recentes (causados por variação climática pontual), a técnica de "reeducar" a madeira com peso e calor controlado por 24–48h é citada como alternativa viável antes de considerar substituição.<cite index="142-1">Posicione pesos... sobre a área curvada e deixe agir por 24 a 48 horas. Isso pode ajudar a "reeducar" a madeira</cite>

**Impacto estrutural:** Alto.

**Impacto financeiro:** Alto — decisão entre reparo e substituição tem impacto direto no custo de garantia/assistência técnica.

**Impacto estético:** Alto.

**Nível de importância:** Alto (critério de decisão operacional).

**Fonte:** Portal Tudo Para Móveis; Estado de Minas (matéria de consumo, prática popular).

**Fabricante:** N/A.

**Observações:** Este é um excelente candidato a virar uma regra automatizada de "diagnóstico" no motor do Planne — o sistema poderia orientar tecnicamente a assistência técnica sobre quando vale a pena tentar reparo versus substituição, com base na medida de torção informada.

---

### 4.3 — Prevenção pelo armazenamento correto do MDF (antes da fabricação)

**Categoria:** Estrutura / Empenamento / Logística

**Descrição:** Grande parte do empenamento tem origem antes mesmo da fabricação do móvel — na estocagem incorreta ou prolongada das chapas de MDF, no uso de calços desalinhados entre as chapas empilhadas, ou no armazenamento em locais úmidos ou muito expostos a variações climáticas.<cite index="146-1">A estocagem incorreta ou prolongada dos painéis de MDF, o uso de calços desalinhados ou, ainda, o armazenamento em lugares úmidos ou muito expostos às variações climáticas são os principais vilões</cite>

**Quando aplicar:** Toda gestão de estoque de chapas em marcenaria/fábrica, antes mesmo do corte das peças.

**Quando NÃO aplicar:** Não há exceção — mesmo estoques de curta duração (poucos dias) se beneficiam do armazenamento correto, especialmente em regiões de clima úmido.

**Condições:** Painéis armazenados nas bordas ou no topo/base das pilhas têm maior propensão a empenar levemente durante a estocagem — esse efeito inicial costuma ser corrigido durante a própria produção do móvel (uso dessas chapas em peças menores ou de menor exigência estética), reservando os painéis do meio da pilha para tampos e portas maiores/mais visíveis.<cite index="146-1">Os efeitos iniciais de empenamento podem ser corrigidos nessas áreas durante a produção do móvel... já os painéis dispostos no meio das pilhas podem ser usados em tampos e portas</cite>

**Limitações:** Exige disciplina de estoque (local coberto, protegido de intempéries, longe de fontes de umidade e calor intenso) que nem toda marcenaria pequena consegue manter estruturalmente.<cite index="146-1">Armazene as chapas em local coberto, protegido das intempéries climáticas e longe de fontes de umidade e de calor intenso</cite>

**Alternativas:** Uso de MDF de pinus (em vez de eucalipto) para maior estabilidade estrutural e resistência a variações de temperatura, segundo orientação técnica de fabricante nacional.<cite index="146-1">O MDF de Pinus, diferente do Eucalipto, apresenta estrutura mais estável e fibras mais longas; também é mais resistente às variações de temperatura</cite>

**Impacto estrutural:** Alto (prevenção na origem é sempre mais barata que correção posterior).

**Impacto financeiro:** Médio (organização de estoque tem custo logístico, mas evita perdas de material).

**Impacto estético:** Médio.

**Nível de importância:** Alto (prevenção, não cura).

**Fonte:** Guararapes (blog institucional do fabricante, com declaração do gerente técnico).

**Fabricante:** Guararapes (declaração explícita citando diferença entre MDF de pinus e de eucalipto).

**Observações:** Para portas grandes (dormitórios), o uso de desempenadores (acessório metálico que ajuda no alinhamento e compensa o movimento natural do painel) é uma recomendação técnica adicional citada pelo fabricante.<cite index="146-1">Para a fabricação de grandes portas, como de dormitórios, também é recomendado utilizar desempenadores; além de ajudar no alinhamento da porta, esse acessório serve para compensar o movimento natural do painel</cite>

---

## 5. ENGROSSO E TAMPONAMENTO — TÉCNICAS DE COMPOSIÇÃO DE ESPESSURA E ACABAMENTO

### 5.1 — Engrosso: simulação de espessura maior por colagem de chapas

**Categoria:** Estrutura / Técnica de produção / Economia

**Descrição:** O "engrosso" é a técnica de colar (ou parafusar) uma chapa fina adicional (tipicamente 6 a 9 mm) sobre uma peça já cortada, para alcançar uma espessura final que o mercado não disponibiliza pronta, ou para dar maior sustentação e aparência mais robusta à caixaria. Um exemplo citado no setor: uma caixaria de 15 mm engrossada com uma chapa de 6 mm resulta em 21 mm de espessura aparente.<cite index="150-1">O MDF de 6 a 9mm é muito utilizado como engrossamento para alcançar medidas de espessura que o mercado não dispõe, sendo combinados com outras chapas... esta técnica usa chapas de 6mm para dar maior sustentação e uma aparência mais robusta à caixaria de 15mm, resultando em 21mm de espessura aparente</cite>

**Quando aplicar:** Quando se deseja o efeito visual/estrutural de uma chapa mais grossa (25 mm, por exemplo) sem pagar o custo total de uma chapa inteira nessa espessura — comum em tampos, laterais frontais e bordas de destaque.

**Quando NÃO aplicar:** Em peças que exigem resistência estrutural real e homogênea ao longo de toda a extensão (não apenas nas bordas visíveis), o engrosso parcial não substitui uma chapa inteiriça da espessura necessária — o engrosso é primariamente uma técnica de composição visual/de borda, não de reforço estrutural distribuído.

**Condições:** No processo de corte, é preciso manter a direção do padrão/veio nas laterais e no tampo ao planejar o engrosso, colando peças com veios contínuos e refilando na esquadrejadeira para um resultado visualmente monolítico.<cite index="126-1">Planeje o corte mantendo a direção do padrão nas laterais e tampo; se necessário, engrosse colando duas peças com veios contínuos e refilando na esquadrejadeira</cite>

**Limitações:** Desalinhamento entre as chapas coladas durante o engrosso é um erro recorrente de produção — se grande demais, a correção é trabalhosa e pode comprometer o acabamento final.<cite index="154-1">O processo de adição dos engrosso deve ser feito evitando desalinhamento entre as chapas; se houver algum erro grande demais, fazer as correções se torna algo trabalhoso e nem sempre fica com o acabamento desejado</cite>

**Alternativas:** Uso de cavilhas na usinagem do engrosso para garantir o alinhamento dos sarrafos/chapas — sugestão recorrente de marceneiros experientes em fóruns técnicos do setor, incluindo cuidado para que a profundidade do furo (ex.: 8 mm) não ultrapasse a espessura combinada das chapas no caso de engrosso triplo.<cite index="153-1">Adicionar a opção de utilizar cavilhas na usinagem para garantir o alinhamento dos sarrafos nos tampos, de forma que a profundidade do furo de 8mm não ultrapasse o tampo superior e nem o tampo/sarrafo inferior no caso de engrosso triplo</cite>

**Impacto estrutural:** Médio (contribui para rigidez de borda, mas não substitui espessura plena distribuída).

**Impacto financeiro:** Positivo — é uma técnica de economia deliberada, citada explicitamente no índice geral do projeto Planne como boa prática ("engrossos econômicos").

**Impacto estético:** Alto — bem executado, resulta em acabamento indistinguível de uma chapa inteiriça mais grossa.

**Nível de importância:** Alto (equilíbrio custo/estética/estrutura).

**Fonte:** Móveis Goiânia (guia completo de espessuras); Ploys/Modo Criativo (guia de tamponamento); comunidade Hellomob (discussão técnica entre marceneiros usuários de software).

**Fabricante:** N/A (técnica de processo, aplicável a qualquer fabricante de MDF).

**Observações:** Este item se conecta diretamente ao módulo "Economia" do índice geral do projeto Planne (engrossos econômicos, melhor aproveitamento de chapas) — vale tratamento cruzado no motor de regras entre os módulos Estrutura e Economia.

---

### 5.2 — Tamponamento: acabamento premium que também reforça estrutura

**Categoria:** Estrutura / Acabamento / Técnica de produção

**Descrição:** Tamponamento é o revestimento externo — laterais, base, tampo e, por vezes, fundo aparente — que cobre a estrutura/caixaria do móvel com uma segunda camada de MDF (geralmente entre 15 e 18 mm), escondendo parafusos e furações de montagem e criando um contorno visualmente contínuo e "monolítico".<cite index="126-1">Tamponamento é o envoltório — laterais, base, tampo e, às vezes, fundo aparente — que reveste a estrutura (caixaria) do móvel; ele esconde os parafusos e as bordas da caixa, criando um contorno contínuo e nobre</cite>

**Quando aplicar:** Móveis de padrão superior onde a estética de "peça única" (sem furação visível) é prioridade, e também em móveis destinados a armazenar objetos pesados, onde a camada extra contribui para resistência.<cite index="155-1">Além do fator aparência, existe o fator resistência, móveis com tamponamentos tendem a ficar mais resistentes; logo, se o seu móvel será usado para armazenar objetos pesados, pode ser uma alternativa acertada escolher fazer tamponamentos</cite>

**Quando NÃO aplicar:** Móveis de entrada/econômicos, onde o custo adicional de material e mão de obra do tamponamento não se justifica frente ao padrão de acabamento contratado.

**Condições:** Existe debate técnico, estético e ambiental sobre o uso indiscriminado do tamponamento — deve ser avaliado caso a caso, não como padrão automático em todo projeto.<cite index="155-1">A controvérsia sobre o tamponamento em móveis: existem alguns debates estéticos, técnicos e ambientais</cite>

**Limitações:** Aumenta o consumo de material (MDF extra) e o tempo de produção, com impacto direto no custo final e na pegada ambiental do móvel (mais matéria-prima consumida por unidade produzida).

**Alternativas:** Fita de borda de alta qualidade, sem tamponamento completo, quando o objetivo é apenas esconder a borda do miolo do MDF, sem a necessidade de cobrir furações inteiras de montagem.

**Impacto estrutural:** Médio-alto (camada extra de material contribui para rigidez geral).

**Impacto financeiro:** Alto (mais consumo de chapa e mão de obra).

**Impacto estético:** Crítico — é um dos diferenciais mais valorizados entre "marcenaria de padrão alto" e "móvel modulado comum".

**Nível de importância:** Alto.

**Fonte:** Meu Móvel Planejado (guia passo a passo); Ploys/Modo Criativo (guia técnico de tamponamento).

**Fabricante:** N/A.

**Observações:** A largura das réguas/sarrafos usados no tamponamento não segue uma regra fixa — a prática de mercado varia, com alguns profissionais usando menos ou mais que 7 cm, dependendo do projeto.<cite index="155-1">A largura para essas réguas não é uma regra; alguns profissionais podem usar menos ou mais que 7 cm</cite>

---

## 6. ESQUADRO E TRAVAMENTO DIAGONAL

### 6.1 — Cantoneiras em diagonal como reforço de esquadro

**Categoria:** Estrutura / Reforços / Ferragens complementares

**Descrição:** Cantoneiras metálicas de reforço, instaladas em cantos opostos de um módulo (formando uma diagonal), distribuem a força de forma equilibrada e ajudam a manter o esquadro do móvel — técnica particularmente relevante em nichos e pequenos módulos fixados na parede.<cite index="131-1">Para máximo resultado na instalação de nichos e pequenos módulos na parede, use a Cantoneira de união em cantos opostos, formando uma diagonal; assim, o travamento distribui a força igualmente e mantém o esquadro perfeito</cite>

**Quando aplicar:** Nichos, pequenos módulos suspensos e reforço estrutural complementar em peças que recebem carga lateral ou torção (não apenas peso vertical).

**Quando NÃO aplicar:** Módulos grandes com fundo estrutural robusto (item 3.1) já bem travado podem dispensar cantoneiras adicionais, exceto em pontos específicos de maior solicitação.

**Condições:** Para chapas de MDF de 15 mm, usar parafusos de 4×14 mm para fixação no móvel e parafuso de 4×40 mm com bucha de 6 mm para fixação na parede.<cite index="131-1">Para chapas de MDF de 15mm, utilize parafusos 4x14mm para fixação firme no móvel, já para a parede utilize parafuso 4x40mm e bucha 6mm</cite>

**Limitações:** Cantoneiras aparentes (não embutidas) podem comprometer a estética em móveis de acabamento fino — nesses casos, preferir reforço interno (fundo espesso, sarrafos) em vez de cantoneira visível.

**Alternativas:** Reforço via fundo estrutural (item 3) como alternativa "invisível" à cantoneira aparente.

**Impacto estrutural:** Alto — é uma solução de baixo custo e alta eficácia para reforço estrutural pontual.

**Impacto financeiro:** Baixo (cantoneiras são ferragem de baixo custo unitário).

**Impacto estético:** Médio (dependendo de ficar aparente ou oculta).

**Nível de importância:** Alto para nichos e módulos pequenos; médio para móveis grandes já bem travados por outros meios.

**Fonte:** Marvit (ficha técnica de produto/ferragem).

**Fabricante:** Marvit (referência de produto, mas a técnica é genérica e aplicável a qualquer cantoneira metálica equivalente).

**Observações:** Esta regra se conecta diretamente ao módulo "Nichos" do índice geral do Planne (fixação, resistência) — recomenda-se tratamento cruzado entre os módulos Estrutura e Nichos/Painéis.

---

## PRÓXIMOS PASSOS SUGERIDOS

Módulos concluídos até aqui: **Cozinhas**, **Ferragens** e **Estrutura** (este documento). Sugestão de sequência para as próximas rodadas:

1. **Portas e Gavetas** — folgas, recuos, limites de peso/dimensão, tipos especiais (correr, camarão, basculante, pivotante) — complementa diretamente os módulos de Ferragens e Estrutura já construídos.
2. **Materiais** — MDF, MDP, compensado (Arauco, Duratex, Berneck, Guararapes, Greenplac) — densidade, espessuras-padrão, resistência à umidade (aprofunda o que já foi tocado neste módulo de Estrutura).
3. **Closets** — cabideiros, maleiros, sapateiras, calceiros, joalheiros.
4. **Banheiros e Escritórios**.
5. **Produção, Transporte, Montagem, Economia** — conhecimento operacional.

Seguimos agora para **Portas e Gavetas**?
