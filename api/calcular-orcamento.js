// ARQUIVO GERADO por scripts/bundle-api.mjs — NÃO EDITAR.
// Edite src/server/http/ e rode npm run build.


// api/_calc.ts
var SHEET_AREA = 2.75 * 1.85;
function dobradicasPorAltura(altura_cm) {
  if (altura_cm <= 90) return 2;
  if (altura_cm <= 200) return 3;
  if (altura_cm <= 240) return 4;
  return 5;
}
function findCat(catalogo, matcher) {
  return catalogo.find((c) => {
    try {
      return matcher(c);
    } catch {
      return false;
    }
  });
}
function calcularOrcamento(moveis, catalogo, margem_pct) {
  const itens = [];
  const find = (fn) => findCat(catalogo, fn);
  for (const m of moveis) {
    const larg = m.largura_cm;
    const prof = m.profundidade_cm;
    const alt = m.altura_cm;
    const temFundo = m.tem_fundo !== false;
    const tp = m.tipo_porta ?? "abrir";
    const largInt = larg - 3;
    const altInt = alt - 3;
    const profFundo = temFundo ? prof - 0.6 : prof;
    const addItem = (it) => {
      const custo = it.preco_custo;
      const venda = it.preco_unitario ?? parseFloat((custo * (margem_pct / 100)).toFixed(2));
      itens.push({ ...it, preco_unitario: venda });
    };
    const areaLaterais = 2 * (prof * alt);
    const areaTopBase = 2 * (largInt * prof);
    const areaPrat = m.prateleiras * (largInt * profFundo);
    const areaEngrossos = 4 * (0.5 * altInt);
    const areaGavCorpo = m.gavetas > 0 ? m.gavetas * (2 * (prof * 0.11) + (largInt / m.gavetas - 3) * 0.11 + (largInt / m.gavetas - 3) * prof * 0.6) : 0;
    const totalCaixa_m2 = (areaLaterais + areaTopBase + areaPrat + areaEngrossos + areaGavCorpo) / 1e4;
    const chapasCaixa = Math.ceil(totalCaixa_m2 / SHEET_AREA);
    const mdfCaixa = m.mdf_caixa_id ? find((c) => c.id === m.mdf_caixa_id) : find((c) => /^mdf.*(15mm|15 mm)/i.test(c.nome) && /branco.*tx/i.test(c.nome)) ?? find((c) => /^mdf.*(15mm|15 mm)/i.test(c.nome));
    if (mdfCaixa && chapasCaixa > 0) {
      addItem({ movel: m.nome, material_id: mdfCaixa.id, descricao: `${mdfCaixa.nome} \u2014 estrutura de ${m.nome}`, justificativa: `2 lat ${prof}\xD7${alt}cm + teto/base ${largInt}\xD7${prof}cm + ${m.prateleiras} prat + engrossos = ${totalCaixa_m2.toFixed(2)}m\xB2 \u2192 ${chapasCaixa} chapa(s)`, quantidade: chapasCaixa, unidade: "chapa", preco_custo: mdfCaixa.preco_custo });
    }
    const portasMDF = m.portas > 0 && !["abrir_vidro", "abrir_espelho", "correr_vidro", "correr_espelho", "sem"].includes(tp);
    if (portasMDF) {
      const areaPortas_m2 = m.portas * (larg / m.portas) * alt / 1e4;
      const chapasPortas = Math.ceil(areaPortas_m2 / SHEET_AREA);
      const mdfExt = m.mdf_externo_id ? find((c) => c.id === m.mdf_externo_id) : mdfCaixa;
      if (mdfExt && chapasPortas > 0) {
        addItem({ movel: m.nome, material_id: mdfExt.id, descricao: `${mdfExt.nome} \u2014 portas de ${m.nome}`, justificativa: `${m.portas} porta(s) ${Math.round(larg / m.portas)}\xD7${alt}cm = ${areaPortas_m2.toFixed(2)}m\xB2 \u2192 ${chapasPortas} chapa(s)`, quantidade: chapasPortas, unidade: "chapa", preco_custo: mdfExt.preco_custo });
      }
    }
    if (m.gavetas > 0) {
      const areaFrenteGav_m2 = m.gavetas * (largInt / m.gavetas) * 16 / 1e4;
      const chapasFrenteGav = Math.ceil(areaFrenteGav_m2 / SHEET_AREA);
      const mdfExt = m.mdf_externo_id ? find((c) => c.id === m.mdf_externo_id) : mdfCaixa;
      if (mdfExt && chapasFrenteGav > 0) {
        addItem({ movel: m.nome, material_id: mdfExt.id, descricao: `${mdfExt.nome} \u2014 frentes de gaveta de ${m.nome}`, justificativa: `${m.gavetas} frente(s) ${Math.round(largInt / m.gavetas)}\xD716cm = ${areaFrenteGav_m2.toFixed(2)}m\xB2`, quantidade: chapasFrenteGav, unidade: "chapa", preco_custo: mdfExt.preco_custo });
      }
    }
    if (temFundo) {
      const areaFundo_m2 = largInt * altInt / 1e4;
      const chapasFundo = Math.ceil(areaFundo_m2 / SHEET_AREA);
      const mdfFundo = m.fundo_id ? find((c) => c.id === m.fundo_id) : find((c) => /6mm/i.test(c.nome) && /branco.*tx/i.test(c.nome)) ?? find((c) => /6mm/i.test(c.nome) && /fundo|mdf/i.test(c.nome));
      if (mdfFundo && chapasFundo > 0) {
        addItem({ movel: m.nome, material_id: mdfFundo.id, descricao: `${mdfFundo.nome} \u2014 fundo de ${m.nome}`, justificativa: `Fundo ${largInt}\xD7${altInt}cm = ${areaFundo_m2.toFixed(2)}m\xB2 \u2192 ${chapasFundo} chapa(s)`, quantidade: chapasFundo, unidade: "chapa", preco_custo: mdfFundo.preco_custo });
      }
    }
    if (m.portas > 0 && tp === "abrir") {
      const dobPorPorta = dobradicasPorAltura(alt);
      const dobQtd = m.portas * dobPorPorta;
      const dob = m.dobradica_id ? find((c) => c.id === m.dobradica_id) : find((c) => /dobrad/i.test(c.nome));
      if (dob) {
        addItem({ movel: m.nome, material_id: dob.id, descricao: `${dob.nome} \u2014 ${m.nome}`, justificativa: `${m.portas} porta(s) \xD7 ${dobPorPorta} dobradi\xE7as = ${dobQtd} un.`, quantidade: dobQtd, unidade: dob.unidade, preco_custo: dob.preco_custo });
      }
    }
    if (m.portas > 0 && (tp === "correr" || tp === "correr_vidro" || tp === "correr_espelho")) {
      const pares = Math.ceil(m.portas / 2);
      const corrPt = m.corredi\u00E7a_porta_id ? find((c) => c.id === m.corredi\u00E7a_porta_id) : find((c) => /corredi/i.test(c.nome) && !/gaveta|telesc/i.test(c.nome));
      if (corrPt) {
        addItem({ movel: m.nome, material_id: corrPt.id, descricao: `${corrPt.nome} \u2014 portas correr de ${m.nome}`, justificativa: `${m.portas} portas \u2192 ${pares} par(es) + trilho`, quantidade: pares, unidade: "par", preco_custo: corrPt.preco_custo });
      }
    }
    if (m.gavetas > 0) {
      const corrGav = m.corredi\u00E7a_gaveta_id ? find((c) => c.id === m.corredi\u00E7a_gaveta_id) : find((c) => /corredi/i.test(c.nome) && /gaveta|telesc/i.test(c.nome));
      if (corrGav) {
        addItem({ movel: m.nome, material_id: corrGav.id, descricao: `${corrGav.nome} \u2014 gavetas de ${m.nome}`, justificativa: `${m.gavetas} gaveta(s) = ${m.gavetas} par(es)`, quantidade: m.gavetas, unidade: "par", preco_custo: corrGav.preco_custo });
      }
    }
    if (m.portas > 0 || m.gavetas > 0) {
      const qtdPux = m.portas + m.gavetas;
      const pux = m.puxador_id ? find((c) => c.id === m.puxador_id) : find((c) => /puxador/i.test(c.nome));
      if (pux) {
        addItem({ movel: m.nome, material_id: pux.id, descricao: `${pux.nome} \u2014 ${m.nome}`, justificativa: `${m.portas} porta(s) + ${m.gavetas} gav. = ${qtdPux} un.`, quantidade: qtdPux, unidade: pux.unidade, preco_custo: pux.preco_custo });
      }
    }
    let fita_m = 0;
    fita_m += 2 * (alt / 100);
    fita_m += 2 * (largInt / 100);
    fita_m += m.prateleiras * (largInt / 100);
    if (portasMDF) fita_m += m.portas * 2 * ((larg / m.portas + alt) / 100);
    if (m.gavetas > 0) fita_m += m.gavetas * 2 * ((largInt / m.gavetas + 16) / 100);
    fita_m *= 1.15;
    const fitaBorda = find((c) => /fita.*(borda|bord)/i.test(c.nome) || /borda.*fita/i.test(c.nome));
    if (fitaBorda && fita_m > 0) {
      addItem({ movel: m.nome, material_id: fitaBorda.id, descricao: `${fitaBorda.nome} \u2014 ${m.nome}`, justificativa: `Per\xEDmetro exposto \xD7 1.15 = ${fita_m.toFixed(2)}m`, quantidade: parseFloat(fita_m.toFixed(2)), unidade: "m", preco_custo: fitaBorda.preco_custo });
    }
    if (m.tem_ripado) {
      const ripaLarg = m.ripa_largura_mm ?? 30;
      const ripaEsp = m.ripa_espessura_mm ?? 15;
      const numRipas = Math.floor(larg * 10 / (ripaLarg * 2));
      const areaRipas_m2 = numRipas * alt * 10 * ripaLarg / 1e6;
      const chapasRipas = Math.ceil(areaRipas_m2 / SHEET_AREA);
      const mdfRipa = ripaEsp === 6 ? find((c) => /6mm/i.test(c.nome) && /branco.*tx/i.test(c.nome)) ?? find((c) => /6mm/i.test(c.nome)) : find((c) => c.id === m.mdf_caixa_id) ?? find((c) => /15mm/i.test(c.nome) && /branco.*tx/i.test(c.nome)) ?? find((c) => /15mm/i.test(c.nome));
      if (mdfRipa && chapasRipas > 0) {
        addItem({ movel: m.nome, material_id: mdfRipa.id, descricao: `${mdfRipa.nome} \u2014 ripas de ${m.nome}`, justificativa: `${numRipas} ripas ${ripaLarg}mm larg. \xD7 ${alt}cm alt. (esp. ${ripaEsp}mm) = ${areaRipas_m2.toFixed(2)}m\xB2 \u2192 ${chapasRipas} chapa(s)`, quantidade: chapasRipas, unidade: "chapa", preco_custo: mdfRipa.preco_custo });
      }
      const fitaRipas_m = numRipas * 2 * (ripaLarg / 1e3) * 1.15;
      const fitaRipa = find((c) => /fita.*(borda|bord)/i.test(c.nome) || /borda.*fita/i.test(c.nome));
      if (fitaRipa && fitaRipas_m > 0) {
        addItem({ movel: m.nome, material_id: fitaRipa.id, descricao: `${fitaRipa.nome} \u2014 fita das ripas de ${m.nome}`, justificativa: `${numRipas} ripas \xD7 2 bordas (topo+base) \xD7 ${ripaLarg}mm \xD7 1.15 = ${fitaRipas_m.toFixed(2)}m`, quantidade: parseFloat(fitaRipas_m.toFixed(2)), unidade: "m", preco_custo: fitaRipa.preco_custo });
      }
    }
    const minifix = find((c) => /minifix/i.test(c.nome));
    if (minifix) {
      const qtdMinifix = 8 + m.prateleiras * 4 + m.gavetas * 4;
      addItem({ movel: m.nome, material_id: minifix.id, descricao: `${minifix.nome} \u2014 ${m.nome}`, justificativa: `8 por corpo + 4 por prateleira + 4 por gaveta = ${qtdMinifix} un.`, quantidade: qtdMinifix, unidade: minifix.unidade, preco_custo: minifix.preco_custo });
    }
    if (m.tem_pes) {
      const pes = find((c) => /p[eé]s?\s|regulav/i.test(c.nome));
      if (pes) {
        const qtdPes = larg > 150 ? 6 : 4;
        addItem({ movel: m.nome, material_id: pes.id, descricao: `${pes.nome} \u2014 ${m.nome}`, justificativa: `${qtdPes} p\xE9s regul\xE1veis por corpo`, quantidade: qtdPes, unidade: pes.unidade, preco_custo: pes.preco_custo });
      }
    }
    if (m.tem_rodape) {
      const altRodape = (m.pe_altura_cm ?? 15) + 5;
      const areaRodape_m2 = larg * altRodape / 1e4;
      const chapasRodape = Math.ceil(areaRodape_m2 / SHEET_AREA);
      if (mdfCaixa && chapasRodape > 0) {
        addItem({ movel: m.nome, material_id: mdfCaixa.id, descricao: `${mdfCaixa.nome} \u2014 rodap\xE9 de ${m.nome}`, justificativa: `Rodap\xE9 ${larg}\xD7${altRodape}cm (p\xE9s ${m.pe_altura_cm ?? 15}cm+5) = ${areaRodape_m2.toFixed(2)}m\xB2`, quantidade: chapasRodape, unidade: "chapa", preco_custo: mdfCaixa.preco_custo });
      }
    }
  }
  return itens;
}

// api/_regras-base.ts
var REGRAS_BASE_MARCENARIA = `REGRAS OFICIAIS DA MARCENARIA (Base de Conhecimento Planne \u2014 use como fonte, cite quando relevante):

FERRAGENS
- Dobradi\xE7as por altura da folha: 2 at\xE9 90cm, 3 at\xE9 200cm, 4 at\xE9 240cm, 5 acima. [base: EN 1935 / cat\xE1logos Blum-Hettich]
- Portas pesadas (elevat\xF3rias): por peso de frente \u2014 at\xE9 22kg=5, at\xE9 27kg=6, at\xE9 32kg=7 dobradi\xE7as.
- Dobradi\xE7a de copo \xD835mm serve porta de 14\u201326mm de espessura.
- Corredi\xE7a telesc\xF3pica: ~30kg/par (padr\xE3o), ~45kg (refor\xE7ada); escolha pela profundidade da gaveta (300/400/500mm).
- Puxador: 1 por porta + 1 por gaveta.

PORTAS E GAVETAS
- Largura M\xC1XIMA por folha de abrir em MDF: ~600mm (acima "cai"/deforma \u2014 dividir ou usar correr). Confort\xE1vel 400\u2013500mm.
- Porta de correr: at\xE9 ~1200mm por folha.
- Folgas: ~2mm nas laterais (embutida) e ~3mm entre folhas de bater.
- Gavetas: \u226520mm entre frentes + ~10mm de folga superior/inferior. Porta acima de gavetas desconta a altura da zona de gavetas.
- Pist\xE3o a g\xE1s (basculante): for\xE7a(kg) = 6 \xD7 peso da porta(kg) \xD7 altura(m).

ESTRUTURA E MATERIAIS
- Chapa padr\xE3o do mercado BR: 2750 \xD7 1850mm (Guararapes RUC / Arauco). Nenhuma pe\xE7a > 269cm.
- Espessuras: 15mm = caixaria/estrutura; 18mm = portas, tampos, prateleira de v\xE3o longo; 25mm = tampo/v\xE3o muito longo.
- Prateleira com v\xE3o > 80cm em 15mm enverga: usar 18mm OU refor\xE7o central (testeira). Espa\xE7amento vertical confort\xE1vel entre prateleiras: 22\u201345cm.
- Fundo 6mm \xE9 ESTRUTURAL (trava o esquadro em 90\xB0): incluir sempre que poss\xEDvel; m\xF3vel grande sem fundo torce.
- Engrosso: 2\xAA chapa (6\u201315mm) colada para dar espessura/robustez (ex.: 15+6=21mm) \u2014 dobra a \xE1rea daquela pe\xE7a no corte.
- \xC1rea \xFAmida (cozinha, banheiro, lavanderia, gourmet): usar MDF hidr\xF3fugo (RUC/Ultra) ou MDP; evitar MDF comum. Zona molhada (sob cuba/tanque): sem fundo de MDF.

ERGONOMIA
- Cozinha: bancada a 90cm; a\xE9reo a 150cm do piso, profundidade 33cm; gabinete base profundidade 55cm.
- Banheiro: bancada a 85cm. Roupeiro: profundidade 60cm; cabideiro de camisas a 160cm, de vestidos a 180cm.
- Circula\xE7\xE3o em cozinha: m\xEDnimo 80cm, ideal 120cm (corredor duplo/ilha).`;

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

// src/server/midia.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var MAX_BYTES = 8 * 1024 * 1024;
var MAX_B64_CHARS = 6e6;
function detectMime(b64) {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  if (b64.startsWith("JVBER")) return "application/pdf";
  return "image/jpeg";
}
function stripDataUrl(value) {
  return value.replace(/^data:[^;]+;base64,/, "");
}
function isSupabaseHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith(".supabase.co") || host.endsWith(".supabase.in")) return true;
    const configured = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    if (!configured) return false;
    return new URL(configured).hostname.toLowerCase() === host;
  } catch {
    return false;
  }
}
async function urlParaModelo(opts) {
  if (opts.url && isSupabaseHttpsUrl(opts.url)) {
    const looksPdf = (opts.mime ?? "").includes("pdf") || /\.pdf(\?|$)/i.test(opts.url);
    if (!looksPdf) return opts.url;
    const inline = await baixarMidiaPermitida(opts.url);
    if (!inline) return null;
    return `data:${inline.mime};base64,${inline.data}`;
  }
  if (!opts.b64) return null;
  const raw = stripDataUrl(opts.b64);
  if (!raw || raw.length > MAX_B64_CHARS) return null;
  const mime = opts.mime || detectMime(raw);
  return `data:${mime};base64,${raw}`;
}
async function baixarMidiaPermitida(url) {
  if (!isSupabaseHttpsUrl(url)) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) return null;
  const mime = (response.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  return { data: buf.toString("base64"), mime };
}

// src/server/http/calcular-orcamento.ts
function moveisToParagraph(moveis, catalogo) {
  const findMat = (id) => id ? catalogo.find((m) => m.id === id) : null;
  return moveis.map((m, i) => {
    const mdf = findMat(m.mdf_caixa_id);
    const fundo = findMat(m.fundo_id);
    const dobradica = findMat(m.dobradica_id);
    const corrPt = findMat(m.corredi\u00E7a_porta_id);
    const corrGav = findMat(m.corredi\u00E7a_gaveta_id);
    const puxador = findMat(m.puxador_id);
    const dobPorPorta = m.altura_cm <= 90 ? 2 : m.altura_cm <= 200 ? 3 : m.altura_cm <= 240 ? 4 : 5;
    const dobQtd = m.portas > 0 && m.tipo_porta === "abrir" ? m.portas * dobPorPorta : 0;
    const corrPtPares = m.portas > 0 && m.tipo_porta === "correr" ? Math.ceil(m.portas / 2) : 0;
    const matLinhas = [
      mdf ? `  MDF estrutura: ID=${mdf.id} | ${mdf.nome} | custo R$${mdf.preco_custo} \u2014 USE ESTE` : "  MDF estrutura: escolher o mais adequado do cat\xE1logo",
      (m.tem_fundo ?? true) && fundo ? `  Fundo 6mm: ID=${fundo.id} | ${fundo.nome} \u2014 USE ESTE` : "",
      (m.tem_fundo ?? true) && !fundo ? "  Fundo 6mm: incluir obrigatoriamente (chapa 6mm do cat\xE1logo)" : "",
      dobradica && dobQtd > 0 ? `  Dobradi\xE7a: ID=${dobradica.id} | ${dobradica.nome} | qtd=${dobQtd} \u2014 USE ESTA` : "",
      !dobradica && dobQtd > 0 ? `  Dobradi\xE7as: ${dobQtd} unidades \u2014 escolher do cat\xE1logo` : "",
      corrPt && corrPtPares > 0 ? `  Corredi\xE7a porta: ID=${corrPt.id} | ${corrPt.nome} | qtd=${corrPtPares} pares + trilho \u2014 USE ESTA` : "",
      !corrPt && corrPtPares > 0 ? `  Corredi\xE7a porta: ${corrPtPares} par(es) + trilho \u2014 escolher do cat\xE1logo` : "",
      corrGav && m.gavetas > 0 ? `  Corredi\xE7a gaveta: ID=${corrGav.id} | ${corrGav.nome} | qtd=${m.gavetas} pares \u2014 USE ESTA` : "",
      !corrGav && m.gavetas > 0 ? `  Corredi\xE7a gaveta: ${m.gavetas} par(es) \u2014 escolher do cat\xE1logo` : "",
      puxador && m.portas + m.gavetas > 0 ? `  Puxador: ID=${puxador.id} | ${puxador.nome} | qtd=${m.portas + m.gavetas} \u2014 USE ESTE` : "",
      !puxador && m.portas + m.gavetas > 0 ? `  Puxadores: ${m.portas + m.gavetas} unidades \u2014 escolher do cat\xE1logo` : ""
    ].filter(Boolean).join("\n");
    const pecasLongas = [];
    if (m.largura_cm > 269) pecasLongas.push(`largura ${m.largura_cm}cm > 269cm \u2192 teto, base e prateleiras DIVIDIDOS EM SEGMENTOS`);
    if (m.altura_cm > 269) pecasLongas.push(`altura ${m.altura_cm}cm > 269cm \u2192 laterais DIVIDIDAS EM SEGMENTOS`);
    return [
      `${i + 1}. ${m.nome}`,
      `   Dimens\xF5es: ${m.largura_cm}cm L \xD7 ${m.profundidade_cm}cm P \xD7 ${m.altura_cm}cm H`,
      pecasLongas.length > 0 ? `   \u26A0 PE\xC7AS LONGAS: ${pecasLongas.join("; ")}` : "",
      `   Portas: ${m.portas}${m.portas > 0 ? ` (${m.tipo_porta})` : ""}  Gavetas: ${m.gavetas}  Prateleiras: ${m.prateleiras}`,
      `   Fundo traseiro: ${m.tem_fundo ?? true ? "SIM" : "N\xC3O"}`,
      m.tem_rodape ? "   Rodap\xE9 (faixa 15cm): SIM \u2014 incluir painel MDF 15cm \xD7 largura do m\xF3vel" : "",
      m.tem_pes ? "   P\xE9s regul\xE1veis: SIM \u2014 4 p\xE9s por corpo" : "",
      m.tem_roda_teto && m.altura_teto_cm ? `   Roda-teto: SIM \u2014 teto a ${m.altura_teto_cm}cm, m\xF3vel com ${m.altura_cm}cm \u2192 folga de ${m.altura_teto_cm - m.altura_cm}cm a preencher` : "",
      matLinhas
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}
var SYSTEM = `Voc\xEA \xE9 especialista em marcenaria planejada brasileira.
Dado um projeto com m\xF3veis configurados, calcule EXATAMENTE quais materiais e quantidades s\xE3o necess\xE1rios.

DIMENS\xD5ES DOS M\xD3VEIS:
- As dimens\xF5es (largura_cm, profundidade_cm, altura_cm) fornecidas pelo usu\xE1rio s\xE3o ABSOLUTAS e definitivas.
- Use-as exatamente como especificadas para calcular todos os materiais \u2014 N\xC3O ajuste com base na planta baixa.
- A planta baixa (quando fornecida) serve APENAS para contexto espacial: verificar se uma porta de abrir tem folga, identificar obst\xE1culos, posi\xE7\xE3o de janelas/tomadas. Nunca use a planta para redimensionar os m\xF3veis.

LIMITE F\xCDSICO DA CHAPA \u2014 REGRA MAIS IMPORTANTE:
- Chapa padr\xE3o MDF/MDP: 2750mm \xD7 1850mm (275cm \xD7 185cm). NENHUMA pe\xE7a pode ter dimens\xE3o > 269cm.
- Se largura_cm ou profundidade_cm do m\xF3vel for > 269cm, os pain\xE9is DEVEM ser divididos em m\xF3dulos/segmentos:
  Exemplo: topo de 300cm \u2192 2 segmentos (ex.: 160cm + 140cm). Cada segmento consome parte de uma chapa separada.
- Ao calcular chapas, trate CADA SEGMENTO como pe\xE7a independente. N\xC3O some toda a \xE1rea e divida por 5,09m\xB2 quando h\xE1 pe\xE7as longas \u2014 isso subestima o consumo porque ignora o desperd\xEDcio de folha ao fatiar segmentos.
- M\xE9todo correto para pe\xE7as longas: calcule a \xE1rea de cada segmento individualmente + sobra perdida da chapa ao lado. Adicione \u226510% extra de perda por corte em m\xF3veis com pe\xE7as > 269cm.
- Na justificativa: sempre mencione "pe\xE7a dividida em X segmentos pois excede 269cm (limite da chapa)".

REGRAS DE C\xC1LCULO:
- Espessura padr\xE3o da caixa (estrutura): MDF 15mm \u2014 use sempre como padr\xE3o salvo especifica\xE7\xE3o contr\xE1ria.
- Fundo traseiro padr\xE3o: MDF 6mm Branco TX \u2014 sempre incluir quando "Fundo traseiro: SIM".
- Chapas MDF/MDP: some a \xE1rea total de pain\xE9is de cada m\xF3vel \xF7 5.09m\xB2 (chapa padr\xE3o 2750\xD71850mm). Arredonde para cima. Para pe\xE7as longas (> 269cm), aplique o m\xE9todo de segmentos acima.
- Dobradi\xE7as (regra da base): 2 por porta \u226490cm, 3 por porta \u2264200cm, 4 por porta \u2264240cm, 5 acima. USE OBRIGATORIAMENTE se tipo_porta = "abrir".
- Corredi\xE7a de porta de correr: 1 par de corredi\xE7a + 1 trilho por par de folhas. USE OBRIGATORIAMENTE se tipo_porta = "correr".
- Corredi\xE7a de gaveta: 1 par por gaveta. OBRIGAT\xD3RIO se gavetas > 0.
- Puxadores: 1 por porta + 1 por gaveta.
- Fita de borda: per\xEDmetro dos pain\xE9is expostos \xD7 1.15 (desperd\xEDcio), em metros lineares.
- Parafusos/conectores: estimativa por corpo de arm\xE1rio (Minifix, cavilhas).
- Fundo em MDF 6mm Branco TX: incluir SE e SOMENTE SE "Fundo traseiro: SIM" estiver indicado no m\xF3vel.
- Rodap\xE9: se indicado, calcular faixa MDF 15cm \xD7 largura do m\xF3vel (frente + laterais expostas).
- P\xE9s regul\xE1veis: 4 unidades por corpo de arm\xE1rio, se indicado.
- Roda-teto: se indicado, painel MDF para fechar a folga entre topo do m\xF3vel e o teto (largura \xD7 diferen\xE7a de altura).

IMPORTANTE: Cada item deve ter obrigatoriamente os campos "movel" (nome exato do m\xF3vel) e "justificativa" (explica\xE7\xE3o curta de como chegou naquela quantidade).

USE APENAS materiais da lista fornecida. Se um material necess\xE1rio n\xE3o estiver na lista, omita-o.
Calcule quantidades realistas para marcenaria planejada Chapec\xF3/SC, Brasil, 2025.

RESPONDA APENAS com JSON v\xE1lido (sem markdown):
{
  "itens": [
    {
      "movel": "Roupeiro",
      "material_id": "uuid-exato",
      "descricao": "MDF 15mm Branco TX \u2014 estrutura do roupeiro",
      "justificativa": "2 lat. 60\xD7230cm + teto + base + divis\xF3ria = 8,6m\xB2 \u2192 2 chapas",
      "quantidade": 2,
      "unidade": "chapa",
      "preco_custo": 92.00,
      "preco_unitario": 141.54
    }
  ],
  "resumo": "Or\xE7amento detalhado para [ambiente]: [lista dos m\xF3veis]. Total calculado com base nas dimens\xF5es fornecidas, incluindo ferragens autom\xE1ticas conforme configura\xE7\xE3o de portas e gavetas."
}`;
var config = { maxDuration: 30 };
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireUser(req, res);
  if (!auth) return;
  try {
    const {
      ambiente,
      moveis,
      medidas,
      descricao,
      materiais,
      planta_b64,
      planta_url,
      margem_pct = 300,
      restricoes_espaciais
    } = req.body ?? {};
    if (!materiais?.length) return res.status(400).json({ error: "Nenhum material fornecido" });
    const temPlanta = !!(planta_b64 || planta_url);
    if (!moveis?.length && !temPlanta) return res.status(400).json({ error: "Informe os m\xF3veis ou uma planta baixa" });
    if (moveis?.length) {
      const invalido = moveis.find((m) => ![m.largura_cm, m.profundidade_cm, m.altura_cm].every((v) => Number.isFinite(v) && v > 0));
      if (invalido) {
        return res.status(400).json({
          error: `M\xF3vel "${invalido.nome || "sem nome"}" tem medida inv\xE1lida (largura, profundidade e altura devem ser maiores que zero).`
        });
      }
    }
    const temPortasAbrir = moveis?.some((m) => m.portas > 0 && (m.tipo_porta === "abrir" || m.tipo_porta === "abrir_vidro" || m.tipo_porta === "abrir_espelho"));
    const temPortasCorrer = moveis?.some((m) => m.portas > 0 && (m.tipo_porta === "correr" || m.tipo_porta === "correr_vidro" || m.tipo_porta === "correr_espelho"));
    const temGavetas = moveis?.some((m) => m.gavetas > 0);
    const temPuxadores = moveis?.some((m) => m.portas > 0 || m.gavetas > 0);
    const temFundo = moveis?.some((m) => m.tem_fundo ?? true);
    const idsUsados = /* @__PURE__ */ new Set([
      ...moveis?.flatMap((mv) => [
        mv.mdf_caixa_id,
        mv.mdf_externo_id,
        mv.fundo_id,
        mv.dobradica_id,
        mv.corredi\u00E7a_porta_id,
        mv.corredi\u00E7a_gaveta_id,
        mv.puxador_id
      ]).filter(Boolean) ?? []
    ]);
    const catalogoFiltrado = materiais.filter((m) => {
      if (!m.nome) return false;
      const n = m.nome.toLowerCase();
      if (/^mdf|^mdp/i.test(m.nome)) return true;
      if (/fita.*(borda|bord)/i.test(n) || /borda.*fita/i.test(n)) return true;
      if (/minifix|cavilha|parafuso|conector/i.test(n)) return true;
      if (/6mm|fundo/i.test(n) && temFundo) return true;
      if (/dobrad/i.test(n) && temPortasAbrir) return true;
      if (/corredi/i.test(n) && !/gaveta|telesc/i.test(n) && temPortasCorrer) return true;
      if (/corredi/i.test(n) && /gaveta|telesc/i.test(n) && temGavetas) return true;
      if (/^puxador/i.test(m.nome) && temPuxadores) return true;
      if (/^p[eé]s?\s|regulav/i.test(n)) return true;
      if (idsUsados.has(m.id)) return true;
      return false;
    });
    if (moveis?.length && !temPlanta) {
      const itens2 = calcularOrcamento(moveis, catalogoFiltrado, margem_pct);
      return res.json({ itens: itens2, resumo: `Or\xE7amento calculado para ${moveis.length} m\xF3vel(is).`, total_estimado: 0 });
    }
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY n\xE3o configurada" });
    const catalogoTexto = catalogoFiltrado.map(
      (m) => `- ID: ${m.id} | ${m.nome} | ${m.unidade} | custo:R$${m.preco_custo} | venda:R$${m.preco_venda}`
    ).join("\n");
    const moveisParagraph = moveis?.length ? moveisToParagraph(moveis, materiais) : "";
    const restricoesTexto = restricoes_espaciais ? [
      `RESTRI\xC7\xD5ES ESPACIAIS DO AMBIENTE (extra\xEDdas da planta):`,
      `  P\xE9-direito (altura m\xE1xima): ${restricoes_espaciais.altura_cm}cm`,
      `  Largura total: ${restricoes_espaciais.largura_cm}cm | Profundidade total: ${restricoes_espaciais.profundidade_cm}cm`,
      ...restricoes_espaciais.paredes.map(
        (p) => `  Parede ${p.id} \u2014 ${p.descricao}: ${p.espaco_util_cm}cm \xFAteis de ${p.largura_cm}cm total${p.obstaculos ? ` (${p.obstaculos})` : ""}`
      ),
      `ATEN\xC7\xC3O: As dimens\xF5es dos m\xF3veis abaixo s\xE3o ABSOLUTAS. Use-as exatamente. As restri\xE7\xF5es acima s\xE3o apenas para contexto.`
    ].join("\n") : "";
    const userPrompt = [
      `AMBIENTE: ${ambiente}`,
      medidas?.largura ? `MEDIDAS DO AMBIENTE: ${medidas.largura}m L \xD7 ${medidas.profundidade}m P \xD7 ${medidas.altura}m H` : "",
      temPlanta ? "MEDIDAS: extrair da planta baixa fornecida" : "",
      restricoesTexto || "",
      moveisParagraph ? `
M\xD3VEIS CONFIGURADOS:
${moveisParagraph}` : "",
      descricao ? `
OBSERVA\xC7\xD5ES: ${descricao}` : "",
      `
MARGEM: ${margem_pct}%`,
      `
MATERIAIS DISPON\xCDVEIS NO ESTOQUE:
${catalogoTexto}`,
      "\nCalcule todos os materiais necess\xE1rios. Retorne 'movel' e 'justificativa' para cada item."
    ].filter(Boolean).join("\n");
    const imagemUrl = await urlParaModelo({ url: planta_url, b64: planta_b64 });
    if (!imagemUrl) return res.status(400).json({ error: "N\xE3o foi poss\xEDvel ler a planta baixa" });
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `${SYSTEM}

${REGRAS_BASE_MARCENARIA}` },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imagemUrl, detail: "high" } }
            ]
          }
        ],
        max_tokens: 4e3,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
    if (!r.ok) throw new Error(`OpenAI: ${(await r.text()).slice(0, 300)}`);
    const d = await r.json();
    const parsed = JSON.parse(d.choices[0].message.content);
    const itens = (parsed.itens ?? []).map((it) => {
      const custo = Number(it.preco_custo) || 0;
      const unitario = Number(it.preco_unitario) > 0 ? it.preco_unitario : parseFloat((custo * (margem_pct / 100)).toFixed(2));
      return { ...it, movel: it.movel ?? "Geral", justificativa: it.justificativa ?? "", preco_custo: custo, preco_unitario: unitario };
    });
    return res.json({ itens, resumo: parsed.resumo ?? "", total_estimado: parsed.total_estimado ?? 0 });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno no servidor" });
  }
}
export {
  config,
  handler as default
};
