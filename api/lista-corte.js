// ARQUIVO GERADO por scripts/bundle-api.mjs — NÃO EDITAR.
// Edite src/server/http/ e rode npm run build.


// api/_calc.ts
var ESP = 15;
var FUNDO = 6;
var MAX_PECA = 2690;
var SHEET_AREA = 2.75 * 1.85;
function cm2mm(v) {
  return Math.round(v * 10);
}
function splitPecas(base, largura, comprimento) {
  if (largura <= MAX_PECA && comprimento <= MAX_PECA) {
    return [{ ...base, largura_mm: largura, comprimento_mm: comprimento }];
  }
  const dim = comprimento > MAX_PECA ? comprimento : largura;
  const isLarg = largura > MAX_PECA;
  const segs = Math.ceil(dim / MAX_PECA);
  const segSize = Math.ceil(dim / segs);
  return Array.from({ length: segs }, (_, i) => ({
    ...base,
    peca: `${base.peca} \u2014 M\xF3dulo ${i + 1}/${segs}`,
    largura_mm: isLarg ? Math.min(segSize, largura - i * segSize) : largura,
    comprimento_mm: !isLarg ? Math.min(segSize, comprimento - i * segSize) : comprimento,
    quantidade: base.quantidade,
    observacao: `Jun\xE7\xE3o com 2 cavilhas 8\xD730mm + parafuso M8`
  }));
}
function pecasCorpo(m, sufixo, larg, prof, alt, mdfCaixa, mdfExt) {
  const result = [];
  const nom = m.nome + (sufixo ? ` \u2014 ${sufixo}` : "");
  const temFundo = m.tem_fundo !== false;
  const largInt = larg - 2 * ESP;
  const altInt = alt - 2 * ESP;
  const profFundo = temFundo ? prof - FUNDO : prof;
  result.push(...splitPecas({ movel: nom, peca: "Lateral", material: mdfCaixa, largura_mm: prof, comprimento_mm: alt, quantidade: 2, fita_l: false, fita_r: false, fita_t: true, fita_b: false, observacao: "" }, prof, alt));
  result.push(...splitPecas({ movel: nom, peca: "Teto", material: mdfCaixa, largura_mm: largInt, comprimento_mm: prof, quantidade: 1, fita_l: false, fita_r: false, fita_t: true, fita_b: false, observacao: "" }, largInt, prof));
  result.push(...splitPecas({ movel: nom, peca: "Base", material: mdfCaixa, largura_mm: largInt, comprimento_mm: prof, quantidade: 1, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" }, largInt, prof));
  if (m.prateleiras > 0) {
    result.push(...splitPecas({ movel: nom, peca: "Prateleira", material: mdfCaixa, largura_mm: largInt, comprimento_mm: profFundo, quantidade: m.prateleiras, fita_l: false, fita_r: false, fita_t: true, fita_b: false, observacao: "" }, largInt, profFundo));
  }
  result.push({ movel: nom, peca: "Engrosso", material: mdfCaixa, largura_mm: 50, comprimento_mm: altInt, quantidade: 4, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "Refor\xE7o frontal para batida das portas" });
  if (temFundo) {
    result.push(...splitPecas({ movel: nom, peca: "Fundo", material: "MDF 6mm Branco TX (fundo)", largura_mm: largInt, comprimento_mm: altInt, quantidade: 1, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" }, largInt, altInt));
  }
  if (m.portas > 0) {
    const tp = m.tipo_porta ?? "abrir";
    const portaLarg = Math.round(larg / m.portas);
    if (tp === "abrir_vidro" || tp === "correr_vidro") {
      const espVidro = tp === "correr_vidro" ? 8 : 6;
      result.push({ movel: nom, peca: "Porta", material: `Vidro temperado ${espVidro}mm`, largura_mm: portaLarg, comprimento_mm: alt, quantidade: m.portas, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "Fornecedor de vidro \u2014 temperado, bordas lapidadas" });
    } else if (tp === "abrir_espelho" || tp === "correr_espelho") {
      result.push({ movel: nom, peca: "Porta", material: "Espelho 4mm", largura_mm: portaLarg, comprimento_mm: alt, quantidade: m.portas, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "Espelho colado em estrutura MDF de suporte" });
    } else if (tp !== "sem") {
      result.push(...splitPecas({ movel: nom, peca: "Porta", material: mdfExt, largura_mm: portaLarg, comprimento_mm: alt, quantidade: m.portas, fita_l: true, fita_r: true, fita_t: true, fita_b: true, observacao: "" }, portaLarg, alt));
    }
  }
  if (m.gavetas > 0) {
    const gavLarg = Math.round(largInt / m.gavetas);
    const gavCorpoAlt = 110;
    const gavProfInt = profFundo - 2 * ESP;
    result.push({ movel: nom, peca: "Frente de gaveta", material: mdfExt, largura_mm: gavLarg, comprimento_mm: 160, quantidade: m.gavetas, fita_l: true, fita_r: true, fita_t: true, fita_b: true, observacao: "" });
    result.push({ movel: nom, peca: "Lateral de gaveta", material: mdfCaixa, largura_mm: Math.max(gavProfInt, 10), comprimento_mm: gavCorpoAlt, quantidade: m.gavetas * 2, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" });
    result.push({ movel: nom, peca: "Traseira de gaveta", material: mdfCaixa, largura_mm: gavLarg - 2 * ESP, comprimento_mm: gavCorpoAlt, quantidade: m.gavetas, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" });
    result.push({ movel: nom, peca: "Fundo de gaveta", material: "MDF 6mm Branco TX (fundo)", largura_mm: gavLarg - 2 * ESP, comprimento_mm: Math.max(gavProfInt, 10), quantidade: m.gavetas, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: "" });
  }
  if (m.tem_rodape) {
    const altRodape = cm2mm((m.pe_altura_cm ?? 15) + 5);
    result.push({ movel: nom, peca: "Rodap\xE9", material: mdfCaixa, largura_mm: larg, comprimento_mm: altRodape, quantidade: 1, fita_l: false, fita_r: false, fita_t: true, fita_b: false, observacao: `Altura = p\xE9s ${m.pe_altura_cm ?? 15}cm + 5cm` });
  }
  if (m.tem_roda_teto && m.altura_teto_cm) {
    const altMovel = sufixo ? alt : cm2mm(m.altura_cm);
    const folga = cm2mm(m.altura_teto_cm) - altMovel;
    if (folga > 0) {
      result.push(...splitPecas({ movel: nom, peca: "Roda-teto", material: mdfCaixa, largura_mm: larg, comprimento_mm: folga, quantidade: 1, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: `Fechar folga de ${(folga / 10).toFixed(0)}cm at\xE9 o teto` }, larg, folga));
    }
  }
  if (m.pe_madeira) {
    const altPe = cm2mm(m.pe_altura_cm ?? 15);
    const largRipa = Math.max(10, larg - cm2mm(9));
    result.push({ movel: nom, peca: "P\xE9 maci\xE7o (frente/fundo)", material: "Madeira maci\xE7a (pinus/eucalipto)", largura_mm: largRipa, comprimento_mm: altPe, quantidade: 2, fita_l: false, fita_r: false, fita_t: false, fita_b: false, observacao: `Ripa ${(largRipa / 10).toFixed(0)}cm \xD7 ${m.pe_altura_cm ?? 15}cm \u2014 recuo 4,5cm c/ lado` });
  }
  return result;
}
function calcularMetrosFita(pecas) {
  let metros = 0;
  for (const p of pecas) {
    if (p.fita_t) metros += p.largura_mm / 1e3 * p.quantidade;
    if (p.fita_b) metros += p.largura_mm / 1e3 * p.quantidade;
    if (p.fita_l) metros += p.comprimento_mm / 1e3 * p.quantidade;
    if (p.fita_r) metros += p.comprimento_mm / 1e3 * p.quantidade;
  }
  return metros;
}
function gerarListaCorte(moveis) {
  const pecas = [];
  for (const m of moveis) {
    const larg = cm2mm(m.largura_cm);
    const prof = cm2mm(m.profundidade_cm);
    const alt = cm2mm(m.altura_cm);
    const mdfCaixa = `MDF 15mm Branco TX (caixa)`;
    const mdfExt = `MDF 15mm (envelope)`;
    if (m.formato === "L") {
      pecas.push(...pecasCorpo(m, "Bra\xE7o A", larg, prof, alt, mdfCaixa, mdfExt));
      const larg2 = cm2mm(m.arm2_largura_cm ?? 80);
      const prof2 = cm2mm(m.arm2_profundidade_cm ?? m.profundidade_cm);
      pecas.push(...pecasCorpo(m, "Bra\xE7o B", larg2, prof2, alt, mdfCaixa, mdfExt));
    } else {
      pecas.push(...pecasCorpo(m, "", larg, prof, alt, mdfCaixa, mdfExt));
    }
    if (m.tem_ripado) {
      const ripaLarg = m.ripa_largura_mm ?? 30;
      const ripaEsp = m.ripa_espessura_mm ?? 15;
      const numRipas = Math.floor(larg / (ripaLarg * 2));
      if (numRipas > 0) {
        pecas.push({
          movel: m.nome,
          peca: "Ripa",
          material: `MDF ${ripaEsp}mm \u2014 Ripas`,
          largura_mm: ripaLarg,
          comprimento_mm: alt,
          quantidade: numRipas,
          fita_l: false,
          fita_r: false,
          fita_t: true,
          fita_b: true,
          observacao: `${numRipas} ripas ${ripaLarg}mm larg., espa\xE7amento ${ripaLarg}mm`
        });
      }
    }
  }
  const metrosFita = calcularMetrosFita(pecas);
  const totalPecas = pecas.reduce((s, p) => s + p.quantidade, 0);
  return {
    pecas,
    resumo: {
      total_pecas: totalPecas,
      metros_fita: parseFloat((metrosFita * 1.15).toFixed(2))
    }
  };
}

// src/server/require-user.ts
import { createClient } from "@supabase/supabase-js";
function header(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
function readAccessToken(req) {
  const raw = header(req, "authorization");
  if (raw) {
    const match = raw.match(/^Bearer\s+(\S+)/i);
    if (match?.[1]) return match[1].trim();
  }
  const body = req.body;
  const fromBody = body?.userToken ?? body?.user_token;
  if (typeof fromBody === "string" && fromBody.trim()) return fromBody.trim();
  return null;
}
async function requireUser(req, res) {
  const token = readAccessToken(req);
  if (!token) {
    res.status(401).json({ error: "N\xE3o autenticado" });
    return null;
  }
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "Supabase n\xE3o configurado" });
    return null;
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "N\xE3o autenticado" });
    return null;
  }
  return { id: data.user.id, token };
}

// src/server/http/lista-corte.ts
var config = { maxDuration: 15 };
var SHEET_W = 2750;
var SHEET_H = 1850;
var NAO_CHAPA = /madeira\s*maci|vidro|espelho/i;
function guillotineSplit(free, pw, ph) {
  const result = [];
  if (free.w - pw > 5) result.push({ x: free.x + pw, y: free.y, w: free.w - pw, h: ph });
  if (free.h - ph > 5) result.push({ x: free.x, y: free.y + ph, w: free.w, h: free.h - ph });
  return result;
}
function calcularChapas(pecas) {
  const byMat = /* @__PURE__ */ new Map();
  const invalidas = [];
  for (const p of pecas) {
    if (!p.largura_mm || !p.comprimento_mm || !p.quantidade) continue;
    if (NAO_CHAPA.test(p.material)) continue;
    const list = byMat.get(p.material) ?? [];
    const label = `${p.peca ?? ""}${p.movel ? ` (${p.movel})` : ""}`;
    for (let i = 0; i < p.quantidade; i++) {
      list.push({ w: p.largura_mm, h: p.comprimento_mm, label });
    }
    byMat.set(p.material, list);
  }
  const results = [];
  for (const [material, pieces] of byMat) {
    pieces.sort((a, b) => b.w * b.h - a.w * a.h);
    const sheets = [];
    const sheetLayouts = [];
    for (const piece of pieces) {
      const orientations = [];
      if (piece.w <= SHEET_W && piece.h <= SHEET_H) orientations.push([piece.w, piece.h]);
      if (piece.h <= SHEET_W && piece.w <= SHEET_H) orientations.push([piece.h, piece.w]);
      if (orientations.length === 0) {
        invalidas.push({
          peca: piece.label,
          material,
          largura_mm: piece.w,
          comprimento_mm: piece.h,
          motivo: `Excede a chapa padr\xE3o ${SHEET_W}\xD7${SHEET_H}mm em ambas as orienta\xE7\xF5es`
        });
        continue;
      }
      let placed = false;
      outerLoop: for (let si = 0; si < sheets.length; si++) {
        const freeRects = sheets[si];
        for (const [pw, ph] of orientations) {
          let bestIdx = -1;
          let bestWaste = Infinity;
          for (let i = 0; i < freeRects.length; i++) {
            const r = freeRects[i];
            if (pw <= r.w && ph <= r.h) {
              const waste = r.w * r.h - pw * ph;
              if (waste < bestWaste) {
                bestWaste = waste;
                bestIdx = i;
              }
            }
          }
          if (bestIdx >= 0) {
            const chosen = freeRects.splice(bestIdx, 1)[0];
            freeRects.push(...guillotineSplit(chosen, pw, ph));
            sheetLayouts[si].push({ x: chosen.x, y: chosen.y, w: pw, h: ph, label: piece.label });
            placed = true;
            break outerLoop;
          }
        }
      }
      if (!placed) {
        const [pw, ph] = orientations[0];
        sheets.push(guillotineSplit({ x: 0, y: 0, w: SHEET_W, h: SHEET_H }, pw, ph));
        sheetLayouts.push([{ x: 0, y: 0, w: pw, h: ph, label: piece.label }]);
      }
    }
    const raw = sheets.length;
    const comFolga = raw + Math.max(1, Math.ceil(raw * 0.15));
    results.push({
      material,
      chapas_otimizadas: raw,
      chapas_com_folga: comFolga,
      layouts: sheetLayouts.map((placed, i) => ({ sheet_index: i, placed }))
    });
  }
  return { materiais: results, invalidas };
}
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { moveis } = req.body;
  if (!moveis?.length) return res.status(400).json({ error: "moveis \xE9 obrigat\xF3rio" });
  try {
    const resultado = gerarListaCorte(moveis);
    const { materiais: chapas, invalidas } = calcularChapas(resultado.pecas);
    const totalChapas = chapas.reduce((s, c) => s + c.chapas_com_folga, 0);
    return res.json({
      ...resultado,
      pecas_invalidas: invalidas,
      resumo: {
        ...resultado.resumo,
        chapas_estimadas: totalChapas,
        chapas_por_material: chapas,
        pecas_invalidas_count: invalidas.length
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
export {
  config,
  handler as default
};
