// ─── Cálculo determinístico de marcenaria planejada ─────────────────────────
// Substitui a IA para lógica padrão — usado por calcular-orcamento e lista-corte

export interface MovelInput {
  id?: string;
  nome: string;
  tipo?: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  portas: number;
  tipo_porta?: string;
  gavetas: number;
  prateleiras: number;
  tem_fundo?: boolean;
  tem_rodape?: boolean;
  tem_pes?: boolean;
  pe_madeira?: boolean;
  pe_altura_cm?: number;
  tem_roda_teto?: boolean;
  altura_teto_cm?: number;
  tem_ripado?: boolean;
  ripa_espessura_mm?: number;
  ripa_largura_mm?: number;
  formato?: "retangular" | "L";
  arm2_largura_cm?: number;
  arm2_profundidade_cm?: number;
  detalhes?: string;
  mdf_caixa_id?: string;
  mdf_externo_id?: string;
  fundo_id?: string;
  dobradica_id?: string;
  corrediça_porta_id?: string;
  corrediça_gaveta_id?: string;
  puxador_id?: string;
  mdf_id?: string;
}

export interface CatItem {
  id: string;
  nome: string;
  unidade: string;
  preco_custo: number;
  preco_venda: number;
  categoria: string | null;
}

export interface ItemOrcamento {
  movel: string;
  material_id?: string;
  descricao: string;
  justificativa: string;
  quantidade: number;
  unidade: string;
  preco_custo: number;
  preco_unitario: number;
}

export interface PecaCorte {
  movel: string;
  peca: string;
  material: string;
  largura_mm: number;
  comprimento_mm: number;
  quantidade: number;
  fita_l: boolean;
  fita_r: boolean;
  fita_t: boolean;
  fita_b: boolean;
  observacao: string;
}

// ── Constantes de espessura (mm) ─────────────────────────────────────────────
const ESP = 15;     // MDF estrutura 15mm
const FUNDO = 6;    // MDF fundo 6mm
const MAX_PECA = 2690; // Comprimento máximo de peça (chapa 2750mm - folga)
const SHEET_AREA = 2.750 * 1.830; // m²

// ── Helpers ───────────────────────────────────────────────────────────────────
function cm2mm(v: number) { return Math.round(v * 10); }

function findCat(catalogo: CatItem[], matcher: (n: CatItem) => boolean): CatItem | undefined {
  return catalogo.find((c) => { try { return matcher(c); } catch { return false; } });
}

function splitPecas(base: Omit<PecaCorte, "peca"> & { peca: string }, largura: number, comprimento: number): PecaCorte[] {
  // Divide peças que excedam MAX_PECA em segmentos
  if (largura <= MAX_PECA && comprimento <= MAX_PECA) {
    return [{ ...base, largura_mm: largura, comprimento_mm: comprimento }];
  }
  const dim = comprimento > MAX_PECA ? comprimento : largura;
  const isLarg = largura > MAX_PECA;
  const segs = Math.ceil(dim / MAX_PECA);
  const segSize = Math.ceil(dim / segs);
  return Array.from({ length: segs }, (_, i) => ({
    ...base,
    peca: `${base.peca} — Módulo ${i + 1}/${segs}`,
    largura_mm: isLarg ? Math.min(segSize, largura - i * segSize) : largura,
    comprimento_mm: !isLarg ? Math.min(segSize, comprimento - i * segSize) : comprimento,
    quantidade: base.quantidade,
    observacao: `Junção com 2 cavilhas 8×30mm + parafuso M8`,
  }));
}

// ── Gerar peças de corte para um corpo simples (retangular) ──────────────────
function pecasCorpo(
  m: MovelInput,
  sufixo: string,
  larg: number, prof: number, alt: number,
  mdfCaixa: string,
  mdfExt: string,
): PecaCorte[] {
  const result: PecaCorte[] = [];
  const nom = m.nome + (sufixo ? ` — ${sufixo}` : "");
  const temFundo = m.tem_fundo !== false;

  const largInt = larg - 2 * ESP;
  const altInt = alt - 2 * ESP;
  const profFundo = temFundo ? prof - FUNDO : prof;

  // 2x Laterais
  result.push(...splitPecas({ movel: nom, peca: "Lateral", material: mdfCaixa, largura_mm: prof, comprimento_mm: alt, quantidade: 2, fita_l: false, fita_r: false, fita_t: true, fita_b: false, observacao: "" }, prof, alt));

  // Teto
  result.push(...splitPecas({ movel: nom, peca: "Teto", material: mdfCaixa, largura_mm: largInt, comprimento_mm: prof, quantidade: 1, fita_l: false, fita_r: false, fita_t: true, fita_b: false, observacao: "" }, largInt, prof));

  // Base
  result.push(...splitPecas({ movel: nom, peca: "Base", material: mdfCaixa, largura_mm: largInt, comprimento_mm: prof, quantidade: 1, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" }, largInt, prof));

  // Prateleiras
  if (m.prateleiras > 0) {
    result.push(...splitPecas({ movel: nom, peca: "Prateleira", material: mdfCaixa, largura_mm: largInt, comprimento_mm: profFundo, quantidade: m.prateleiras, fita_l: false, fita_r: false, fita_t: true, fita_b: false, observacao: "" }, largInt, profFundo));
  }

  // 4x Engrossos (borda frontal dos painéis verticais)
  result.push({ movel: nom, peca: "Engrosso", material: mdfCaixa, largura_mm: 50, comprimento_mm: altInt, quantidade: 4, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "Reforço frontal para batida das portas" });

  // Fundo 6mm
  if (temFundo) {
    result.push(...splitPecas({ movel: nom, peca: "Fundo", material: "MDF 6mm Branco TX (fundo)", largura_mm: largInt, comprimento_mm: altInt, quantidade: 1, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" }, largInt, altInt));
  }

  // Portas
  if (m.portas > 0) {
    const tp = m.tipo_porta ?? "abrir";
    const portaLarg = Math.round(larg / m.portas);
    if (tp === "abrir_vidro" || tp === "correr_vidro") {
      const espVidro = tp === "correr_vidro" ? 8 : 6;
      result.push({ movel: nom, peca: "Porta", material: `Vidro temperado ${espVidro}mm`, largura_mm: portaLarg, comprimento_mm: alt, quantidade: m.portas, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "Fornecedor de vidro — temperado, bordas lapidadas" });
    } else if (tp === "abrir_espelho" || tp === "correr_espelho") {
      result.push({ movel: nom, peca: "Porta", material: "Espelho 4mm", largura_mm: portaLarg, comprimento_mm: alt, quantidade: m.portas, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "Espelho colado em estrutura MDF de suporte" });
    } else if (tp !== "sem") {
      result.push(...splitPecas({ movel: nom, peca: "Porta", material: mdfExt, largura_mm: portaLarg, comprimento_mm: alt, quantidade: m.portas, fita_l: true, fita_r: true, fita_t: true, fita_b: true, observacao: "" }, portaLarg, alt));
    }
  }

  // Gavetas
  if (m.gavetas > 0) {
    const gavLarg = Math.round(largInt / m.gavetas);
    const gavCorpoAlt = 110; // altura lateral do corpo da gaveta
    const gavProfInt = profFundo - 2 * ESP;

    result.push({ movel: nom, peca: "Frente de gaveta", material: mdfExt, largura_mm: gavLarg, comprimento_mm: 160, quantidade: m.gavetas, fita_l: true, fita_r: true, fita_t: true, fita_b: true, observacao: "" });
    result.push({ movel: nom, peca: "Lateral de gaveta", material: mdfCaixa, largura_mm: Math.max(gavProfInt, 10), comprimento_mm: gavCorpoAlt, quantidade: m.gavetas * 2, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" });
    result.push({ movel: nom, peca: "Traseira de gaveta", material: mdfCaixa, largura_mm: gavLarg - 2 * ESP, comprimento_mm: gavCorpoAlt, quantidade: m.gavetas, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" });
    result.push({ movel: nom, peca: "Fundo de gaveta", material: "MDF 6mm Branco TX (fundo)", largura_mm: gavLarg - 2 * ESP, comprimento_mm: Math.max(gavProfInt, 10), quantidade: m.gavetas, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" });
  }

  // Rodapé — altura = pe_altura_cm + 5 (mesmo recuo que os pés)
  if (m.tem_rodape) {
    const altRodape = cm2mm((m.pe_altura_cm ?? 15) + 5);
    result.push({ movel: nom, peca: "Rodapé", material: mdfCaixa, largura_mm: larg, comprimento_mm: altRodape, quantidade: 1, fita_l: false, fita_r: false, fita_t: true, fita_b: false, observacao: `Altura = pés ${m.pe_altura_cm ?? 15}cm + 5cm` });
  }

  // Roda-teto — folga entre topo do móvel e o teto (móvel já deve ter altura = teto−10cm)
  if (m.tem_roda_teto && m.altura_teto_cm) {
    const altMovel = sufixo ? alt : cm2mm(m.altura_cm);
    const folga = cm2mm(m.altura_teto_cm) - altMovel;
    if (folga > 0) {
      result.push(...splitPecas({ movel: nom, peca: "Roda-teto", material: mdfCaixa, largura_mm: larg, comprimento_mm: folga, quantidade: 1, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: `Fechar folga de ${(folga / 10).toFixed(0)}cm até o teto` }, larg, folga));
    }
  }

  // Pés de madeira maciça — 2 ripas horizontais (frente + fundo), 9cm menor que o móvel
  if (m.pe_madeira) {
    const altPe = cm2mm(m.pe_altura_cm ?? 15);
    const largRipa = Math.max(10, larg - cm2mm(9)); // 9cm menor = recuo de 4,5cm c/ lado
    result.push({ movel: nom, peca: "Pé maciço (frente/fundo)", material: "Madeira maciça (pinus/eucalipto)", largura_mm: largRipa, comprimento_mm: altPe, quantidade: 2, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: `Ripa ${(largRipa / 10).toFixed(0)}cm × ${(m.pe_altura_cm ?? 15)}cm — recuo 4,5cm c/ lado` });
  }

  return result;
}

// ── Metragem de fita de borda ────────────────────────────────────────────────
/**
 * Soma os metros lineares de fita de borda de um conjunto de peças.
 *
 * Convenção geométrica de cada peça (largura_mm × comprimento_mm):
 *   - fita_t / fita_b (topo/base) correm ao longo da LARGURA
 *   - fita_l / fita_r (esquerda/direita) correm ao longo do COMPRIMENTO
 * Logo, uma peça com fita nos 4 lados consome o perímetro: 2·(largura+comprimento).
 */
export function calcularMetrosFita(pecas: PecaCorte[]): number {
  let metros = 0;
  for (const p of pecas) {
    if (p.fita_t) metros += (p.largura_mm / 1000) * p.quantidade;
    if (p.fita_b) metros += (p.largura_mm / 1000) * p.quantidade;
    if (p.fita_l) metros += (p.comprimento_mm / 1000) * p.quantidade;
    if (p.fita_r) metros += (p.comprimento_mm / 1000) * p.quantidade;
  }
  return metros;
}

// ── Gerar lista de peças completa para todos os móveis ───────────────────────
export function gerarListaCorte(moveis: MovelInput[]): { pecas: PecaCorte[]; resumo: { total_pecas: number; metros_fita: number } } {
  const pecas: PecaCorte[] = [];

  for (const m of moveis) {
    const larg = cm2mm(m.largura_cm);
    const prof = cm2mm(m.profundidade_cm);
    const alt = cm2mm(m.altura_cm);

    const mdfCaixa = `MDF 15mm Branco TX (caixa)`;
    const mdfExt = `MDF 15mm (envelope)`;

    if (m.formato === "L") {
      // Braço A (principal)
      pecas.push(...pecasCorpo(m, "Braço A", larg, prof, alt, mdfCaixa, mdfExt));
      // Braço B — usa arm2_*
      const larg2 = cm2mm(m.arm2_largura_cm ?? 80);
      const prof2 = cm2mm(m.arm2_profundidade_cm ?? m.profundidade_cm);
      pecas.push(...pecasCorpo(m, "Braço B", larg2, prof2, alt, mdfCaixa, mdfExt));
    } else {
      pecas.push(...pecasCorpo(m, "", larg, prof, alt, mdfCaixa, mdfExt));
    }

    // Ripas
    if (m.tem_ripado) {
      const ripaLarg = m.ripa_largura_mm ?? 30;
      const ripaEsp = m.ripa_espessura_mm ?? 15;
      const numRipas = Math.floor(larg / (ripaLarg * 2));
      if (numRipas > 0) {
        pecas.push({
          movel: m.nome,
          peca: "Ripa",
          material: `MDF ${ripaEsp}mm — Ripas`,
          largura_mm: ripaLarg,
          comprimento_mm: alt,
          quantidade: numRipas,
          fita_l: false,
          fita_r: false,
          fita_t: true,
          fita_b: true,
          observacao: `${numRipas} ripas ${ripaLarg}mm larg., espaçamento ${ripaLarg}mm`,
        });
      }
    }
  }

  // Calcular metros de fita (ver calcularMetrosFita para a convenção geométrica).
  const metrosFita = calcularMetrosFita(pecas);

  const totalPecas = pecas.reduce((s, p) => s + p.quantidade, 0);

  return {
    pecas,
    resumo: {
      total_pecas: totalPecas,
      metros_fita: parseFloat((metrosFita * 1.15).toFixed(2)),
    },
  };
}

// ── Calcular materiais e preços para o orçamento ─────────────────────────────
export function calcularOrcamento(moveis: MovelInput[], catalogo: CatItem[], margem_pct: number): ItemOrcamento[] {
  const itens: ItemOrcamento[] = [];

  const find = (fn: (c: CatItem) => boolean) => findCat(catalogo, fn);

  for (const m of moveis) {
    const larg = m.largura_cm;
    const prof = m.profundidade_cm;
    const alt = m.altura_cm;
    const temFundo = m.tem_fundo !== false;
    const tp = m.tipo_porta ?? "abrir";
    const largInt = larg - 3; // cm, descontando 2 laterais (15mm cada = 3cm)
    const altInt = alt - 3;
    const profFundo = temFundo ? prof - 0.6 : prof;

    const addItem = (it: Omit<ItemOrcamento, "preco_unitario"> & { preco_unitario?: number }) => {
      const custo = it.preco_custo;
      // margem_pct é um multiplicador: 300 = venda 3× o custo
      const venda = it.preco_unitario ?? parseFloat((custo * (margem_pct / 100)).toFixed(2));
      itens.push({ ...it, preco_unitario: venda });
    };

    // ── MDF caixa (estrutura 15mm) ────────────────────────────────────────────
    // Área: 2 laterais + teto + base + prateleiras + engrossos
    const areaLaterais = 2 * (prof * alt);
    const areaTopBase = 2 * (largInt * prof);
    const areaPrat = m.prateleiras * (largInt * profFundo);
    const areaEngrossos = 4 * (0.5 * (altInt));
    const areaGavCorpo = m.gavetas > 0
      ? m.gavetas * (2 * (prof * 0.11) + (largInt / m.gavetas - 3) * 0.11 + (largInt / m.gavetas - 3) * prof * 0.6)
      : 0;
    const totalCaixa_m2 = (areaLaterais + areaTopBase + areaPrat + areaEngrossos + areaGavCorpo) / 10000;
    const chapasCaixa = Math.ceil(totalCaixa_m2 / SHEET_AREA);

    const mdfCaixa = m.mdf_caixa_id
      ? find(c => c.id === m.mdf_caixa_id)
      : find(c => /^mdf.*(15mm|15 mm)/i.test(c.nome) && /branco.*tx/i.test(c.nome)) ?? find(c => /^mdf.*(15mm|15 mm)/i.test(c.nome));

    if (mdfCaixa && chapasCaixa > 0) {
      addItem({ movel: m.nome, material_id: mdfCaixa.id, descricao: `${mdfCaixa.nome} — estrutura de ${m.nome}`, justificativa: `2 lat ${prof}×${alt}cm + teto/base ${largInt}×${prof}cm + ${m.prateleiras} prat + engrossos = ${totalCaixa_m2.toFixed(2)}m² → ${chapasCaixa} chapa(s)`, quantidade: chapasCaixa, unidade: "chapa", preco_custo: mdfCaixa.preco_custo });
    }

    // ── MDF envelope (portas MDF — não vidro/espelho) ─────────────────────────
    const portasMDF = m.portas > 0 && !["abrir_vidro", "abrir_espelho", "correr_vidro", "correr_espelho", "sem"].includes(tp);
    if (portasMDF) {
      const areaPortas_m2 = m.portas * (larg / m.portas) * alt / 10000;
      const chapasPortas = Math.ceil(areaPortas_m2 / SHEET_AREA);

      const mdfExt = m.mdf_externo_id
        ? find(c => c.id === m.mdf_externo_id)
        : mdfCaixa;

      if (mdfExt && chapasPortas > 0) {
        addItem({ movel: m.nome, material_id: mdfExt.id, descricao: `${mdfExt.nome} — portas de ${m.nome}`, justificativa: `${m.portas} porta(s) ${Math.round(larg / m.portas)}×${alt}cm = ${areaPortas_m2.toFixed(2)}m² → ${chapasPortas} chapa(s)`, quantidade: chapasPortas, unidade: "chapa", preco_custo: mdfExt.preco_custo });
      }
    }

    // Frente gavetas (MDF envelope)
    if (m.gavetas > 0) {
      const areaFrenteGav_m2 = m.gavetas * (largInt / m.gavetas) * 16 / 10000;
      const chapasFrenteGav = Math.ceil(areaFrenteGav_m2 / SHEET_AREA);
      const mdfExt = m.mdf_externo_id ? find(c => c.id === m.mdf_externo_id) : mdfCaixa;
      if (mdfExt && chapasFrenteGav > 0) {
        addItem({ movel: m.nome, material_id: mdfExt.id, descricao: `${mdfExt.nome} — frentes de gaveta de ${m.nome}`, justificativa: `${m.gavetas} frente(s) ${Math.round(largInt / m.gavetas)}×16cm = ${areaFrenteGav_m2.toFixed(2)}m²`, quantidade: chapasFrenteGav, unidade: "chapa", preco_custo: mdfExt.preco_custo });
      }
    }

    // ── Fundo 6mm ─────────────────────────────────────────────────────────────
    if (temFundo) {
      const areaFundo_m2 = largInt * altInt / 10000;
      const chapasFundo = Math.ceil(areaFundo_m2 / SHEET_AREA);

      const mdfFundo = m.fundo_id
        ? find(c => c.id === m.fundo_id)
        : find(c => /6mm/i.test(c.nome) && /branco.*tx/i.test(c.nome)) ?? find(c => /6mm/i.test(c.nome) && /fundo|mdf/i.test(c.nome));

      if (mdfFundo && chapasFundo > 0) {
        addItem({ movel: m.nome, material_id: mdfFundo.id, descricao: `${mdfFundo.nome} — fundo de ${m.nome}`, justificativa: `Fundo ${largInt}×${altInt}cm = ${areaFundo_m2.toFixed(2)}m² → ${chapasFundo} chapa(s)`, quantidade: chapasFundo, unidade: "chapa", preco_custo: mdfFundo.preco_custo });
      }
    }

    // ── Dobradiças ────────────────────────────────────────────────────────────
    if (m.portas > 0 && tp === "abrir") {
      const dobQtd = m.portas * (alt > 150 ? 3 : 2);
      const dob = m.dobradica_id
        ? find(c => c.id === m.dobradica_id)
        : find(c => /dobrad/i.test(c.nome));

      if (dob) {
        addItem({ movel: m.nome, material_id: dob.id, descricao: `${dob.nome} — ${m.nome}`, justificativa: `${m.portas} porta(s) × ${alt > 150 ? 3 : 2} dobradiças = ${dobQtd} un.`, quantidade: dobQtd, unidade: dob.unidade, preco_custo: dob.preco_custo });
      }
    }

    // ── Corrediça porta de correr ─────────────────────────────────────────────
    if (m.portas > 0 && (tp === "correr" || tp === "correr_vidro" || tp === "correr_espelho")) {
      const pares = Math.ceil(m.portas / 2);
      const corrPt = m.corrediça_porta_id
        ? find(c => c.id === m.corrediça_porta_id)
        : find(c => /corredi/i.test(c.nome) && !/gaveta|telesc/i.test(c.nome));

      if (corrPt) {
        addItem({ movel: m.nome, material_id: corrPt.id, descricao: `${corrPt.nome} — portas correr de ${m.nome}`, justificativa: `${m.portas} portas → ${pares} par(es) + trilho`, quantidade: pares, unidade: "par", preco_custo: corrPt.preco_custo });
      }
    }

    // ── Corrediça gaveta ──────────────────────────────────────────────────────
    if (m.gavetas > 0) {
      const corrGav = m.corrediça_gaveta_id
        ? find(c => c.id === m.corrediça_gaveta_id)
        : find(c => /corredi/i.test(c.nome) && /gaveta|telesc/i.test(c.nome));

      if (corrGav) {
        addItem({ movel: m.nome, material_id: corrGav.id, descricao: `${corrGav.nome} — gavetas de ${m.nome}`, justificativa: `${m.gavetas} gaveta(s) = ${m.gavetas} par(es)`, quantidade: m.gavetas, unidade: "par", preco_custo: corrGav.preco_custo });
      }
    }

    // ── Puxadores ─────────────────────────────────────────────────────────────
    if (m.portas > 0 || m.gavetas > 0) {
      const qtdPux = m.portas + m.gavetas;
      const pux = m.puxador_id
        ? find(c => c.id === m.puxador_id)
        : find(c => /puxador/i.test(c.nome));

      if (pux) {
        addItem({ movel: m.nome, material_id: pux.id, descricao: `${pux.nome} — ${m.nome}`, justificativa: `${m.portas} porta(s) + ${m.gavetas} gav. = ${qtdPux} un.`, quantidade: qtdPux, unidade: pux.unidade, preco_custo: pux.preco_custo });
      }
    }

    // ── Fita de borda ─────────────────────────────────────────────────────────
    let fita_m = 0;
    fita_m += 2 * (alt / 100);             // bordas frontais das 2 laterais
    fita_m += 2 * (largInt / 100);         // bordas frontais teto + base
    fita_m += m.prateleiras * (largInt / 100); // bordas frontais prateleiras
    if (portasMDF) fita_m += m.portas * 2 * ((larg / m.portas + alt) / 100); // 4 bordas por porta
    if (m.gavetas > 0) fita_m += m.gavetas * 2 * ((largInt / m.gavetas + 16) / 100); // frentes de gaveta
    fita_m *= 1.15; // desperdício

    const fitaBorda = find(c => /fita.*(borda|bord)/i.test(c.nome) || /borda.*fita/i.test(c.nome));
    if (fitaBorda && fita_m > 0) {
      addItem({ movel: m.nome, material_id: fitaBorda.id, descricao: `${fitaBorda.nome} — ${m.nome}`, justificativa: `Perímetro exposto × 1.15 = ${fita_m.toFixed(2)}m`, quantidade: parseFloat(fita_m.toFixed(2)), unidade: "m", preco_custo: fitaBorda.preco_custo });
    }

    // ── Ripado ────────────────────────────────────────────────────────────────
    if (m.tem_ripado) {
      const ripaLarg = m.ripa_largura_mm ?? 30;
      const ripaEsp = m.ripa_espessura_mm ?? 15;
      const numRipas = Math.floor((larg * 10) / (ripaLarg * 2));
      const areaRipas_m2 = (numRipas * alt * 10 * ripaLarg) / 1_000_000;
      const chapasRipas = Math.ceil(areaRipas_m2 / SHEET_AREA);

      const mdfRipa = ripaEsp === 6
        ? (find(c => /6mm/i.test(c.nome) && /branco.*tx/i.test(c.nome)) ?? find(c => /6mm/i.test(c.nome)))
        : (find(c => c.id === m.mdf_caixa_id) ?? find(c => /15mm/i.test(c.nome) && /branco.*tx/i.test(c.nome)) ?? find(c => /15mm/i.test(c.nome)));

      if (mdfRipa && chapasRipas > 0) {
        addItem({ movel: m.nome, material_id: mdfRipa.id, descricao: `${mdfRipa.nome} — ripas de ${m.nome}`, justificativa: `${numRipas} ripas ${ripaLarg}mm larg. × ${alt}cm alt. (esp. ${ripaEsp}mm) = ${areaRipas_m2.toFixed(2)}m² → ${chapasRipas} chapa(s)`, quantidade: chapasRipas, unidade: "chapa", preco_custo: mdfRipa.preco_custo });
      }

      // Fita de borda nas ripas: topo + base de cada ripa
      const fitaRipas_m = numRipas * 2 * (ripaLarg / 1000) * 1.15;
      const fitaRipa = find(c => /fita.*(borda|bord)/i.test(c.nome) || /borda.*fita/i.test(c.nome));
      if (fitaRipa && fitaRipas_m > 0) {
        addItem({ movel: m.nome, material_id: fitaRipa.id, descricao: `${fitaRipa.nome} — fita das ripas de ${m.nome}`, justificativa: `${numRipas} ripas × 2 bordas (topo+base) × ${ripaLarg}mm × 1.15 = ${fitaRipas_m.toFixed(2)}m`, quantidade: parseFloat(fitaRipas_m.toFixed(2)), unidade: "m", preco_custo: fitaRipa.preco_custo });
      }
    }

    // ── Conectores (minifix / cavilhas) ───────────────────────────────────────
    const minifix = find(c => /minifix/i.test(c.nome));
    if (minifix) {
      const qtdMinifix = 8 + m.prateleiras * 4 + m.gavetas * 4;
      addItem({ movel: m.nome, material_id: minifix.id, descricao: `${minifix.nome} — ${m.nome}`, justificativa: `8 por corpo + 4 por prateleira + 4 por gaveta = ${qtdMinifix} un.`, quantidade: qtdMinifix, unidade: minifix.unidade, preco_custo: minifix.preco_custo });
    }

    // ── Pés reguláveis ────────────────────────────────────────────────────────
    if (m.tem_pes) {
      const pes = find(c => /p[eé]s?\s|regulav/i.test(c.nome));
      if (pes) {
        const qtdPes = larg > 150 ? 6 : 4;
        addItem({ movel: m.nome, material_id: pes.id, descricao: `${pes.nome} — ${m.nome}`, justificativa: `${qtdPes} pés reguláveis por corpo`, quantidade: qtdPes, unidade: pes.unidade, preco_custo: pes.preco_custo });
      }
    }

    // ── Rodapé (painel MDF) ───────────────────────────────────────────────────
    if (m.tem_rodape) {
      const altRodape = (m.pe_altura_cm ?? 15) + 5;
      const areaRodape_m2 = (larg * altRodape) / 10000;
      const chapasRodape = Math.ceil(areaRodape_m2 / SHEET_AREA);
      if (mdfCaixa && chapasRodape > 0) {
        addItem({ movel: m.nome, material_id: mdfCaixa.id, descricao: `${mdfCaixa.nome} — rodapé de ${m.nome}`, justificativa: `Rodapé ${larg}×${altRodape}cm (pés ${m.pe_altura_cm ?? 15}cm+5) = ${areaRodape_m2.toFixed(2)}m²`, quantidade: chapasRodape, unidade: "chapa", preco_custo: mdfCaixa.preco_custo });
      }
    }
  }

  return itens;
}
