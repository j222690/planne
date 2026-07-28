// ─── Regras da Base de Conhecimento da Marcenaria (digest para a IA) ─────────
// Digest curado dos átomos de decisão da Base de Conhecimento
// (src/lib/base-conhecimento/dados/*.json). Vive aqui, em api/, porque as
// funções serverless são self-contained e não importam de src/. Cada regra cita
// o átomo/norma de origem, mantendo a resposta da IA rastreável.
//
// Ao atualizar a base, reflita as regras numéricas aqui também.

export const REGRAS_BASE_MARCENARIA = `REGRAS OFICIAIS DA MARCENARIA (Base de Conhecimento Planne — use como fonte, cite quando relevante):

FERRAGENS
- Dobradiças por altura da folha: 2 até 90cm, 3 até 200cm, 4 até 240cm, 5 acima. [base: EN 1935 / catálogos Blum-Hettich]
- Portas pesadas (elevatórias): por peso de frente — até 22kg=5, até 27kg=6, até 32kg=7 dobradiças.
- Dobradiça de copo Ø35mm serve porta de 14–26mm de espessura.
- Corrediça telescópica: ~30kg/par (padrão), ~45kg (reforçada); escolha pela profundidade da gaveta (300/400/500mm).
- Puxador: 1 por porta + 1 por gaveta.

PORTAS E GAVETAS
- Largura MÁXIMA por folha de abrir em MDF: ~600mm (acima "cai"/deforma — dividir ou usar correr). Confortável 400–500mm.
- Porta de correr: até ~1200mm por folha.
- Folgas: ~2mm nas laterais (embutida) e ~3mm entre folhas de bater.
- Gavetas: ≥20mm entre frentes + ~10mm de folga superior/inferior. Porta acima de gavetas desconta a altura da zona de gavetas.
- Pistão a gás (basculante): força(kg) = 6 × peso da porta(kg) × altura(m).

ESTRUTURA E MATERIAIS
- Chapa padrão do mercado BR: 2750 × 1850mm (Guararapes RUC / Arauco). Nenhuma peça > 269cm.
- Espessuras: 15mm = caixaria/estrutura; 18mm = portas, tampos, prateleira de vão longo; 25mm = tampo/vão muito longo.
- Prateleira com vão > 80cm em 15mm enverga: usar 18mm OU reforço central (testeira). Espaçamento vertical confortável entre prateleiras: 22–45cm.
- Fundo 6mm é ESTRUTURAL (trava o esquadro em 90°): incluir sempre que possível; móvel grande sem fundo torce.
- Engrosso: 2ª chapa (6–15mm) colada para dar espessura/robustez (ex.: 15+6=21mm) — dobra a área daquela peça no corte.
- Área úmida (cozinha, banheiro, lavanderia, gourmet): usar MDF hidrófugo (RUC/Ultra) ou MDP; evitar MDF comum. Zona molhada (sob cuba/tanque): sem fundo de MDF.

ERGONOMIA
- Cozinha: bancada a 90cm; aéreo a 150cm do piso, profundidade 33cm; gabinete base profundidade 55cm.
- Banheiro: bancada a 85cm. Roupeiro: profundidade 60cm; cabideiro de camisas a 160cm, de vestidos a 180cm.
- Circulação em cozinha: mínimo 80cm, ideal 120cm (corredor duplo/ilha).`;
