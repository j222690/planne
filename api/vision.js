// ARQUIVO GERADO por scripts/bundle-api.mjs — NÃO EDITAR.
// Edite src/server/http/ e rode npm run build.


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

// src/server/http/vision.ts
var config = { maxDuration: 30 };
var SYSTEM = `Voc\xEA \xE9 arquiteto de interiores s\xEAnior especialista em marcenaria planejada brasileira (MDF, lacas, madeira). Sua tarefa \xE9 criar um projeto COMPLETO do ambiente \u2014 n\xE3o apenas a marcenaria, mas TODOS os elementos do c\xF4modo: portas, janelas, m\xF3veis existentes (cama comprada, sof\xE1, etc.) e a marcenaria planejada.

RESPONDA APENAS com JSON v\xE1lido (sem markdown, sem blocos de c\xF3digo, sem texto fora do JSON).

REGRAS OBRIGAT\xD3RIAS:
1. SEMPRE inclua a porta principal e qualquer porta secund\xE1ria \u2014 com tipo_elemento: "porta".
2. SEMPRE inclua janelas \u2014 com tipo_elemento: "janela".
3. INCLUA m\xF3veis existentes que n\xE3o fazem parte da marcenaria (cama box comprada, sof\xE1, mesa de jantar, etc.) com tipo_elemento: "existente" e customizado: false.
4. INCLUA todos os m\xF3veis de marcenaria planejada com tipo_elemento: "movel" e customizado: true.
5. DIMENSIONE tudo usando EXCLUSIVAMENTE as medidas num\xE9ricas fornecidas pelo usu\xE1rio no texto (largura, profundidade, p\xE9-direito). NUNCA tente inferir ou corrigir as dimens\xF5es com base na imagem da planta \u2014 a imagem serve apenas para entender a disposi\xE7\xE3o espacial (onde ficam elementos no espa\xE7o). As medidas do usu\xE1rio s\xE3o as medidas reais medidas no local.
6. POSICIONE todos os elementos de forma funcional (vista superior), respeitando circula\xE7\xE3o m\xEDnima de 80cm entre m\xF3veis.
7. MARCENARIA COMPLETA E SOB MEDIDA \u2014 esta \xE9 a regra mais importante: gere TODA a marcenaria planejada que caiba no ambiente, dimensionada para PREENCHER as paredes dispon\xEDveis (sob medida, n\xE3o m\xF3veis soltos pequenos). NUNCA retorne menos de 4 m\xF3veis de MARCENARIA (tipo_elemento "movel", customizado true) por ambiente, AL\xC9M de portas, janelas e existentes. Em cozinha, inclua SEMPRE arm\xE1rios inferiores E superiores E bancada (no m\xEDnimo). Aproveite todas as paredes livres: se uma parede tem 3m livres, o arm\xE1rio deve ter ~3m (sob medida), n\xE3o 1m.
8. O pre\xE7o e chapas_mdf de porta, janela e existente devem ser ZERO (n\xE3o fazem parte do or\xE7amento de marcenaria).
9. Os m\xF3veis de marcenaria N\xC3O devem ultrapassar as dimens\xF5es do ambiente. Cada m\xF3vel deve caber dentro da largura e profundidade declaradas pelo usu\xE1rio, respeitando a escala real. As LARGURAS dos m\xF3veis devem ser dimensionadas ao espa\xE7o real da parede (sob medida).

CHECKLIST OBRIGAT\xD3RIO DE MARCENARIA POR AMBIENTE (inclua todos que couberem no espa\xE7o):
- Cozinha: arm\xE1rios inferiores (gabinetes base, sob medida na parede), arm\xE1rios superiores (a\xE9reos, sob medida), bancada/tampo, torre quente (forno+micro-ondas), paneleiro ou despenseiro. Geladeira/fog\xE3o/cooktop = existente.
- Quarto casal/solteiro: roupeiro/guarda-roupa (sob medida, ocupando a parede), painel/cabeceira, criado-mudo (1 a 2), c\xF4moda OU gaveteiro, opcional escrivaninha/penteadeira. Cama = existente.
- Closet: roupeiros, m\xF3dulos de prateleiras abertas, gaveteiros, sapateira, cabideiros.
- Sala de estar: rack/painel de TV (sob medida na parede), estante/painel ripado, aparador/buffet, opcional home theater. Sof\xE1/mesa de centro = existente.
- Home office/Escrit\xF3rio: bancada/mesa de trabalho (sob medida), arm\xE1rio de arquivos, estante/prateleiras, gaveteiro. Cadeira = existente.
- Banheiro: gabinete da pia (sob medida), espelheira/arm\xE1rio-espelho, nicho. Vaso/box = existente.
- Lavanderia: gabinete do tanque, arm\xE1rio de produtos, bancada de apoio. Tanque/m\xE1quina = existente.
- \xC1rea gourmet: bancada/balc\xE3o, arm\xE1rios inferiores e superiores, adega/nichos. Churrasqueira/cooktop = existente.

TIPOS DE ELEMENTOS:
- "movel" = marcenaria planejada (arm\xE1rio, roupeiro, cozinha, rack, prateleiras, nichos, gaveteiro, etc.) \u2014 customizado: true
- "existente" = m\xF3vel comprado que o cliente j\xE1 tem ou vai comprar separado (cama, sof\xE1, mesa, cadeira, geladeira, TV) \u2014 customizado: false, preco_estimado: 0
- "porta" = abertura de porta na parede \u2014 customizado: false, preco_estimado: 0, chapas_mdf: 0
- "janela" = abertura de janela na parede \u2014 customizado: false, preco_estimado: 0, chapas_mdf: 0

CAMPO "parede" (apenas para porta e janela):
- "top" = parede superior do c\xF4modo (parede de fundo)
- "bottom" = parede inferior (onde geralmente fica a entrada)
- "left" = parede esquerda
- "right" = parede direita

CAMPO "x_pct" para porta e janela = posi\xE7\xE3o do elemento ao longo da parede (0.0 = in\xEDcio da parede, 1.0 = final).

EXEMPLOS DE M\xD3VEIS POR AMBIENTE:
- Quarto casal: roupeiro (movel), painel/cabeceira (movel), c\xF4moda (movel), cama box casal (existente), criados-mudos (movel ou existente), porta (porta), janela (janela)
- Sala de estar: rack/painel TV (movel), estante (movel), aparador (movel), sof\xE1 (existente), mesa de centro (existente), porta (porta), janela (janela)
- Cozinha: arm\xE1rios superiores (movel), arm\xE1rios inferiores (movel), bancada (movel), geladeira (existente), fog\xE3o (existente), porta (porta), janela (janela)
- Home office: mesa de trabalho (movel), estante (movel), arm\xE1rio de arquivos (movel), cadeira (existente), porta (porta), janela (janela)

POSICIONAMENTO (x_pct, y_pct = posi\xE7\xE3o do canto superior esquerdo, 0.0 a 0.85, vista de cima):
- Roupeiro/guarda-roupa: encostar na parede de fundo (y_pct pr\xF3ximo de 0.0)
- Cama de casal: centralizada na largura, pr\xF3xima \xE0 parede de cabeceira
- Rack/painel TV: parede de frente (y_pct pr\xF3ximo de 0.0)
- Porta: posicionada na parede especificada pelo usu\xE1rio, x_pct = posi\xE7\xE3o ao longo da parede

PRE\xC7OS MERCADO 2025: MDF 18mm branco: R$ 85/chapa. Ferragens: 28% do MDF. M\xE3o de obra: 40% do MDF.
chapas_mdf = \xE1rea total de pe\xE7as / 5.0325 m\xB2.

Formato exato do JSON:
{
  "resumo": "an\xE1lise t\xE9cnica do ambiente em 2-3 frases",
  "descricao_comercial": "texto comercial elegante, 3 par\xE1grafos",
  "estilo_detectado": "nome do estilo identificado",
  "moveis": [
    {
      "id": "porta_1",
      "nome": "Porta principal",
      "tipo_elemento": "porta",
      "categoria": "porta",
      "largura_cm": 90,
      "profundidade_cm": 0,
      "parede": "bottom",
      "x_pct": 0.1,
      "y_pct": 0,
      "cor_hex": "#8b7355",
      "customizado": false,
      "preco_estimado": 0,
      "chapas_mdf": 0,
      "nota": "Porta de acesso"
    },
    {
      "id": "janela_1",
      "nome": "Janela",
      "tipo_elemento": "janela",
      "categoria": "janela",
      "largura_cm": 120,
      "profundidade_cm": 0,
      "parede": "top",
      "x_pct": 0.3,
      "y_pct": 0,
      "cor_hex": "#87ceeb",
      "customizado": false,
      "preco_estimado": 0,
      "chapas_mdf": 0,
      "nota": "Janela com ilumina\xE7\xE3o natural"
    },
    {
      "id": "cama_1",
      "nome": "Cama Queen (existente)",
      "tipo_elemento": "existente",
      "categoria": "cama",
      "largura_cm": 160,
      "profundidade_cm": 200,
      "x_pct": 0.3,
      "y_pct": 0.1,
      "cor_hex": "#d4c9b5",
      "customizado": false,
      "preco_estimado": 0,
      "chapas_mdf": 0,
      "nota": "Cama existente \u2014 n\xE3o inclusa no or\xE7amento"
    },
    {
      "id": "mov_1",
      "nome": "Roupeiro 6 Portas",
      "tipo_elemento": "movel",
      "categoria": "armario",
      "largura_cm": 240,
      "profundidade_cm": 60,
      "altura_cm": 230,
      "x_pct": 0.05,
      "y_pct": 0.02,
      "cor_hex": "#f5f3f0",
      "customizado": true,
      "preco_estimado": 4800,
      "chapas_mdf": 8,
      "nota": "6 portas de correr, perfil alum\xEDnio fosco"
    }
  ],
  "orcamento": {
    "mdf_custo": 0,
    "ferragens_custo": 0,
    "puxadores_custo": 0,
    "fita_borda_custo": 0,
    "mao_de_obra": 0,
    "desperdicio_pct": 15,
    "subtotal": 0,
    "margem_pct": 300,
    "total": 0
  },
  "observacoes_tecnicas": ["observa\xE7\xE3o t\xE9cnica relevante"]
}`;
var WALL_PT = {
  top: "parede de cima/fundo",
  bottom: "parede de baixo/entrada",
  left: "parede esquerda",
  right: "parede direita"
};
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { ambiente, medidas, estilo, descricao, cor_mdf, porta_parede, janelas, planta_b64, planta_url, referencias_b64, referencias_url, custo_chapa, mao_obra_hora, margem_padrao } = req.body;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY n\xE3o configurada" });
  const portaDesc = porta_parede ? `A PORTA PRINCIPAL fica na ${WALL_PT[porta_parede] ?? porta_parede}.` : "Posicione a porta principal na parede mais adequada para o ambiente.";
  const janelasDesc = janelas && janelas.length > 0 ? `As JANELAS ficam nas seguintes paredes: ${janelas.map((w) => WALL_PT[w] ?? w).join(", ")}.` : "Posicione janela(s) nas paredes mais adequadas para ilumina\xE7\xE3o natural.";
  const temPlanta = !!(planta_b64 || planta_url);
  const medidasRef = `${medidas?.largura ?? 4}m \xD7 ${medidas?.profundidade ?? 3}m \xD7 ${medidas?.altura ?? 2.7}m p\xE9-direito`;
  const medidasInstrucao = temPlanta ? `MEDIDAS DO AMBIENTE: Planta baixa fornecida \u2014 leia as dimens\xF5es DIRETAMENTE da planta (escala, cotas ou propor\xE7\xE3o). As medidas declaradas pelo usu\xE1rio (${medidasRef}) s\xE3o uma refer\xEAncia aproximada; se a planta mostrar dimens\xF5es diferentes ou mais precisas, USE AS DA PLANTA.` : `MEDIDAS ABSOLUTAS DO AMBIENTE (USE EXATAMENTE ESTAS \u2014 sem planta, n\xE3o tente inferir):
  - largura: ${medidas?.largura ?? 4}m
  - profundidade: ${medidas?.profundidade ?? 3}m
  - p\xE9-direito: ${medidas?.altura ?? 2.7}m`;
  const layoutInstrucao = temPlanta ? `PORTA E JANELAS: Identifique a posi\xE7\xE3o da porta principal e das janelas DIRETAMENTE na planta baixa. ${porta_parede ? `O usu\xE1rio indicou que a porta fica na ${WALL_PT[porta_parede] ?? porta_parede} \u2014 confirme pela planta.` : "Detecte pela planta."}` : `LAYOUT DO C\xD4MODO:
${portaDesc}
${janelasDesc}`;
  const userContent = [
    {
      type: "text",
      text: `AMBIENTE: ${ambiente}
${medidasInstrucao}

ESTILO: ${estilo ?? "Moderno"}
COR/ACABAMENTO MDF preferido: ${cor_mdf || "#f5f3f0"} \u2014 use como base para cor_hex dos m\xF3veis de MDF
DESCRI\xC7\xC3O DO CLIENTE: ${descricao || "N\xE3o informada"}

${layoutInstrucao}

INSTRU\xC7\xC3O CR\xCDTICA: Inclua TODOS os elementos do c\xF4modo no array "moveis":
1. Porta (tipo_elemento: "porta") na parede identificada
2. Janela(s) (tipo_elemento: "janela") nas paredes identificadas
3. M\xF3veis existentes/comprados: cama, sof\xE1, geladeira, fog\xE3o, etc. (tipo_elemento: "existente", customizado: false, preco_estimado: 0)
4. Marcenaria planejada SOB MEDIDA: gere TODA a marcenaria que caiba (m\xEDnimo 4 m\xF3veis tipo "movel"), dimensionada para preencher as paredes livres. Para ${ambiente}, siga o CHECKLIST OBRIGAT\xD3RIO DE MARCENARIA do sistema e inclua todos os m\xF3dulos cab\xEDveis (ex.: cozinha = arm\xE1rios inferiores + superiores + bancada + torre + paneleiro).

O or\xE7amento e os itens devem considerar APENAS os elementos com customizado: true.
LEMBRETE FINAL: Nenhum m\xF3vel pode ser maior que o ambiente, mas a marcenaria deve ser SOB MEDIDA (ocupar ao m\xE1ximo as paredes livres, n\xE3o m\xF3veis pequenos soltos). ${temPlanta ? "Use as dimens\xF5es lidas da planta para escalar os m\xF3veis." : `Ambiente: ${medidasRef}.`}`
    }
  ];
  if (temPlanta) {
    const planta = await urlParaModelo({ url: planta_url, b64: planta_b64 });
    if (!planta) return res.status(400).json({ error: "N\xE3o foi poss\xEDvel ler a planta." });
    userContent.push({
      type: "text",
      text: `PLANTA BAIXA \u2014 leia desta imagem: dimens\xF5es reais do c\xF4modo, posi\xE7\xE3o e parede da porta principal, posi\xE7\xE3o e paredes das janelas, vigas ou pilares se houver. Use estas informa\xE7\xF5es para preencher o JSON.`
    });
    userContent.push({
      type: "image_url",
      image_url: { url: planta, detail: "high" }
    });
  }
  const referencias = [
    ...(referencias_url ?? []).filter(Boolean).slice(0, 3).map((url) => ({ url })),
    ...(referencias_b64 ?? []).filter(Boolean).slice(0, 3).map((b64) => ({ b64 }))
  ].slice(0, 3);
  for (const ref of referencias) {
    const url = await urlParaModelo(ref);
    if (!url) continue;
    userContent.push({
      type: "image_url",
      image_url: { url, detail: "low" }
    });
  }
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent }
        ],
        max_tokens: 6e3,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `OpenAI Vision: ${err.slice(0, 400)}` });
    }
    const data = await response.json();
    const analise = JSON.parse(data.choices[0].message.content);
    const customMoveis = (analise.moveis ?? []).filter(
      (m) => m.customizado !== false && m.tipo_elemento !== "porta" && m.tipo_elemento !== "janela" && m.tipo_elemento !== "existente"
    );
    const totalChapas = customMoveis.reduce((s, m) => s + (Number(m.chapas_mdf) || 0), 0);
    const o = analise.orcamento ?? {};
    const desperdicio = 1 + (o.desperdicio_pct ?? 15) / 100;
    const custoChapa = custo_chapa ?? 85;
    const maoObraFactor = mao_obra_hora ? mao_obra_hora / 45 * 0.4 : 0.4;
    const margemFinal = margem_padrao ?? o.margem_pct ?? 300;
    if (!o.mdf_custo || o.mdf_custo === 0) o.mdf_custo = Math.round(totalChapas * custoChapa * desperdicio);
    if (!o.ferragens_custo || o.ferragens_custo === 0) o.ferragens_custo = Math.round(o.mdf_custo * 0.28);
    if (!o.puxadores_custo || o.puxadores_custo === 0) o.puxadores_custo = Math.round(o.mdf_custo * 0.07);
    if (!o.fita_borda_custo || o.fita_borda_custo === 0) o.fita_borda_custo = Math.round(totalChapas * 15);
    if (!o.mao_de_obra || o.mao_de_obra === 0) o.mao_de_obra = Math.round(o.mdf_custo * maoObraFactor);
    o.subtotal = o.mdf_custo + o.ferragens_custo + o.puxadores_custo + o.fita_borda_custo + o.mao_de_obra;
    o.margem_pct = margemFinal;
    o.total = Math.round(o.subtotal * (margemFinal / 100));
    analise.orcamento = o;
    return res.json({ analise, usage: data.usage });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
export {
  config,
  handler as default
};
