import type { VercelRequest, VercelResponse } from "@vercel/node";
import { calcularOrcamento } from "./_calc";
import type { MovelInput as CalcMovelInput } from "./_calc";

function detectMime(b64: string): string {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

interface MovelConfig {
  id: string;
  tipo: string;
  nome: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  portas: number;
  tipo_porta: "abrir" | "correr" | "sem";
  gavetas: number;
  prateleiras: number;
  tem_fundo?: boolean;
  tem_rodape?: boolean;
  tem_pes?: boolean;
  tem_roda_teto?: boolean;
  altura_teto_cm?: number;
  mdf_id?: string;
  fundo_id?: string;
  dobradica_id?: string;
  corrediça_porta_id?: string;
  corrediça_gaveta_id?: string;
  puxador_id?: string;
}

type CatItem = { id: string; nome: string; preco_custo: number; preco_venda: number; unidade: string; categoria: string | null };

function moveisToParagraph(moveis: MovelConfig[], catalogo: CatItem[]): string {
  const findMat = (id?: string) => id ? catalogo.find((m) => m.id === id) : null;

  return moveis.map((m, i) => {
    const mdf = findMat(m.mdf_id);
    const fundo = findMat(m.fundo_id);
    const dobradica = findMat(m.dobradica_id);
    const corrPt = findMat(m.corrediça_porta_id);
    const corrGav = findMat(m.corrediça_gaveta_id);
    const puxador = findMat(m.puxador_id);

    const dobQtd = m.portas > 0 && m.tipo_porta === "abrir"
      ? m.portas * (m.altura_cm > 150 ? 3 : 2)
      : 0;
    const corrPtPares = m.portas > 0 && m.tipo_porta === "correr"
      ? Math.ceil(m.portas / 2)
      : 0;

    const matLinhas = [
      mdf ? `  MDF estrutura: ID=${mdf.id} | ${mdf.nome} | custo R$${mdf.preco_custo} — USE ESTE` : "  MDF estrutura: escolher o mais adequado do catálogo",
      (m.tem_fundo ?? true) && fundo ? `  Fundo 6mm: ID=${fundo.id} | ${fundo.nome} — USE ESTE` : "",
      (m.tem_fundo ?? true) && !fundo ? "  Fundo 6mm: incluir obrigatoriamente (chapa 6mm do catálogo)" : "",
      dobradica && dobQtd > 0 ? `  Dobradiça: ID=${dobradica.id} | ${dobradica.nome} | qtd=${dobQtd} — USE ESTA` : "",
      !dobradica && dobQtd > 0 ? `  Dobradiças: ${dobQtd} unidades — escolher do catálogo` : "",
      corrPt && corrPtPares > 0 ? `  Corrediça porta: ID=${corrPt.id} | ${corrPt.nome} | qtd=${corrPtPares} pares + trilho — USE ESTA` : "",
      !corrPt && corrPtPares > 0 ? `  Corrediça porta: ${corrPtPares} par(es) + trilho — escolher do catálogo` : "",
      corrGav && m.gavetas > 0 ? `  Corrediça gaveta: ID=${corrGav.id} | ${corrGav.nome} | qtd=${m.gavetas} pares — USE ESTA` : "",
      !corrGav && m.gavetas > 0 ? `  Corrediça gaveta: ${m.gavetas} par(es) — escolher do catálogo` : "",
      puxador && (m.portas + m.gavetas) > 0 ? `  Puxador: ID=${puxador.id} | ${puxador.nome} | qtd=${m.portas + m.gavetas} — USE ESTE` : "",
      !puxador && (m.portas + m.gavetas) > 0 ? `  Puxadores: ${m.portas + m.gavetas} unidades — escolher do catálogo` : "",
    ].filter(Boolean).join("\n");

    const pecasLongas: string[] = [];
    if (m.largura_cm > 269) pecasLongas.push(`largura ${m.largura_cm}cm > 269cm → teto, base e prateleiras DIVIDIDOS EM SEGMENTOS`);
    if (m.altura_cm > 269) pecasLongas.push(`altura ${m.altura_cm}cm > 269cm → laterais DIVIDIDAS EM SEGMENTOS`);

    return [
      `${i + 1}. ${m.nome}`,
      `   Dimensões: ${m.largura_cm}cm L × ${m.profundidade_cm}cm P × ${m.altura_cm}cm H`,
      pecasLongas.length > 0 ? `   ⚠ PEÇAS LONGAS: ${pecasLongas.join("; ")}` : "",
      `   Portas: ${m.portas}${m.portas > 0 ? ` (${m.tipo_porta})` : ""}  Gavetas: ${m.gavetas}  Prateleiras: ${m.prateleiras}`,
      `   Fundo traseiro: ${(m.tem_fundo ?? true) ? "SIM" : "NÃO"}`,
      m.tem_rodape ? "   Rodapé (faixa 15cm): SIM — incluir painel MDF 15cm × largura do móvel" : "",
      m.tem_pes ? "   Pés reguláveis: SIM — 4 pés por corpo" : "",
      m.tem_roda_teto && m.altura_teto_cm
        ? `   Roda-teto: SIM — teto a ${m.altura_teto_cm}cm, móvel com ${m.altura_cm}cm → folga de ${m.altura_teto_cm - m.altura_cm}cm a preencher`
        : "",
      matLinhas,
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

const SYSTEM = `Você é especialista em marcenaria planejada brasileira.
Dado um projeto com móveis configurados, calcule EXATAMENTE quais materiais e quantidades são necessários.

DIMENSÕES DOS MÓVEIS:
- As dimensões (largura_cm, profundidade_cm, altura_cm) fornecidas pelo usuário são ABSOLUTAS e definitivas.
- Use-as exatamente como especificadas para calcular todos os materiais — NÃO ajuste com base na planta baixa.
- A planta baixa (quando fornecida) serve APENAS para contexto espacial: verificar se uma porta de abrir tem folga, identificar obstáculos, posição de janelas/tomadas. Nunca use a planta para redimensionar os móveis.

LIMITE FÍSICO DA CHAPA — REGRA MAIS IMPORTANTE:
- Chapa padrão MDF/MDP: 2750mm × 1830mm (275cm × 183cm). NENHUMA peça pode ter dimensão > 269cm.
- Se largura_cm ou profundidade_cm do móvel for > 269cm, os painéis DEVEM ser divididos em módulos/segmentos:
  Exemplo: topo de 300cm → 2 segmentos (ex.: 160cm + 140cm). Cada segmento consome parte de uma chapa separada.
- Ao calcular chapas, trate CADA SEGMENTO como peça independente. NÃO some toda a área e divida por 5,04m² quando há peças longas — isso subestima o consumo porque ignora o desperdício de folha ao fatiar segmentos.
- Método correto para peças longas: calcule a área de cada segmento individualmente + sobra perdida da chapa ao lado. Adicione ≥10% extra de perda por corte em móveis com peças > 269cm.
- Na justificativa: sempre mencione "peça dividida em X segmentos pois excede 269cm (limite da chapa)".

REGRAS DE CÁLCULO:
- Espessura padrão da caixa (estrutura): MDF 15mm — use sempre como padrão salvo especificação contrária.
- Fundo traseiro padrão: MDF 6mm Branco TX — sempre incluir quando "Fundo traseiro: SIM".
- Chapas MDF/MDP: some a área total de painéis de cada móvel ÷ 5.04m² (chapa padrão 2750×1830mm). Arredonde para cima. Para peças longas (> 269cm), aplique o método de segmentos acima.
- Dobradiças: 2 por porta altura ≤150cm, 3 por porta altura >150cm. USE OBRIGATORIAMENTE se tipo_porta = "abrir".
- Corrediça de porta de correr: 1 par de corrediça + 1 trilho por par de folhas. USE OBRIGATORIAMENTE se tipo_porta = "correr".
- Corrediça de gaveta: 1 par por gaveta. OBRIGATÓRIO se gavetas > 0.
- Puxadores: 1 por porta + 1 por gaveta.
- Fita de borda: perímetro dos painéis expostos × 1.15 (desperdício), em metros lineares.
- Parafusos/conectores: estimativa por corpo de armário (Minifix, cavilhas).
- Fundo em MDF 6mm Branco TX: incluir SE e SOMENTE SE "Fundo traseiro: SIM" estiver indicado no móvel.
- Rodapé: se indicado, calcular faixa MDF 15cm × largura do móvel (frente + laterais expostas).
- Pés reguláveis: 4 unidades por corpo de armário, se indicado.
- Roda-teto: se indicado, painel MDF para fechar a folga entre topo do móvel e o teto (largura × diferença de altura).

IMPORTANTE: Cada item deve ter obrigatoriamente os campos "movel" (nome exato do móvel) e "justificativa" (explicação curta de como chegou naquela quantidade).

USE APENAS materiais da lista fornecida. Se um material necessário não estiver na lista, omita-o.
Calcule quantidades realistas para marcenaria planejada Chapecó/SC, Brasil, 2025.

RESPONDA APENAS com JSON válido (sem markdown):
{
  "itens": [
    {
      "movel": "Roupeiro",
      "material_id": "uuid-exato",
      "descricao": "MDF 15mm Branco TX — estrutura do roupeiro",
      "justificativa": "2 lat. 60×230cm + teto + base + divisória = 8,6m² → 2 chapas",
      "quantidade": 2,
      "unidade": "chapa",
      "preco_custo": 92.00,
      "preco_unitario": 141.54
    }
  ],
  "resumo": "Orçamento detalhado para [ambiente]: [lista dos móveis]. Total calculado com base nas dimensões fornecidas, incluindo ferragens automáticas conforme configuração de portas e gavetas."
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    ambiente, moveis, medidas, descricao, materiais, planta_b64, margem_pct = 35, restricoes_espaciais,
  } = req.body as {
    ambiente: string;
    moveis?: MovelConfig[];
    medidas?: { largura: number; profundidade: number; altura: number };
    descricao?: string;
    materiais: { id: string; nome: string; unidade: string; preco_custo: number; preco_venda: number; categoria: string | null }[];
    planta_b64?: string;
    margem_pct?: number;
    restricoes_espaciais?: {
      paredes: { id: string; descricao: string; largura_cm: number; espaco_util_cm: number; obstaculos?: string | null }[];
      largura_cm: number; profundidade_cm: number; altura_cm: number;
    };
  };

  if (!materiais?.length) return res.status(400).json({ error: "Nenhum material fornecido" });
  if (!moveis?.length && !planta_b64) return res.status(400).json({ error: "Informe os móveis ou uma planta baixa" });

  // Filtrar catálogo apenas aos materiais relevantes para os móveis configurados
  const temPortasAbrir = moveis?.some((m) => m.portas > 0 && m.tipo_porta === "abrir");
  const temPortasCorrer = moveis?.some((m) => m.portas > 0 && m.tipo_porta === "correr");
  const temGavetas = moveis?.some((m) => m.gavetas > 0);
  const temPuxadores = moveis?.some((m) => m.portas > 0 || m.gavetas > 0);
  const temFundo = moveis?.some((m) => m.tem_fundo ?? true);

  const catalogoFiltrado = materiais.filter((m) => {
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
    // IDs selecionados diretamente pelo usuário — sempre incluir
    const idsUsados = new Set([
      ...(moveis?.map((mv) => mv.mdf_id).filter(Boolean) ?? []),
      ...(moveis?.map((mv) => mv.fundo_id).filter(Boolean) ?? []),
      ...(moveis?.map((mv) => mv.dobradica_id).filter(Boolean) ?? []),
      ...(moveis?.map((mv) => mv.corrediça_porta_id).filter(Boolean) ?? []),
      ...(moveis?.map((mv) => mv.corrediça_gaveta_id).filter(Boolean) ?? []),
      ...(moveis?.map((mv) => mv.puxador_id).filter(Boolean) ?? []),
    ]);
    if (idsUsados.has(m.id)) return true;
    return false;
  });

  const catalogoTexto = catalogoFiltrado.map((m) =>
    `- ID: ${m.id} | ${m.nome} | ${m.unidade} | custo:R$${m.preco_custo} | venda:R$${m.preco_venda}`
  ).join("\n");

  const moveisParagraph = moveis?.length ? moveisToParagraph(moveis, materiais) : "";

  const restricoesTexto = restricoes_espaciais
    ? [
        `RESTRIÇÕES ESPACIAIS DO AMBIENTE (extraídas da planta):`,
        `  Pé-direito (altura máxima): ${restricoes_espaciais.altura_cm}cm`,
        `  Largura total: ${restricoes_espaciais.largura_cm}cm | Profundidade total: ${restricoes_espaciais.profundidade_cm}cm`,
        ...restricoes_espaciais.paredes.map((p) =>
          `  Parede ${p.id} — ${p.descricao}: ${p.espaco_util_cm}cm úteis de ${p.largura_cm}cm total${p.obstaculos ? ` (${p.obstaculos})` : ""}`
        ),
        `ATENÇÃO: As dimensões dos móveis abaixo são ABSOLUTAS. Use-as exatamente. As restrições acima são apenas para contexto — se algum móvel exceder o espaço, mencione no "resumo" mas calcule os materiais com as dimensões fornecidas.`,
      ].join("\n")
    : "";

  const userPrompt = [
    `AMBIENTE: ${ambiente}`,
    medidas?.largura ? `MEDIDAS DO AMBIENTE: ${medidas.largura}m L × ${medidas.profundidade}m P × ${medidas.altura}m H` : "",
    planta_b64 ? "MEDIDAS: extrair da planta baixa fornecida" : "",
    restricoesTexto || "",
    moveisParagraph ? `\nMÓVEIS CONFIGURADOS:\n${moveisParagraph}` : "",
    descricao ? `\nOBSERVAÇÕES: ${descricao}` : "",
    `\nMARGEM: ${margem_pct}%`,
    `\nMATERIAIS DISPONÍVEIS NO ESTOQUE:\n${catalogoTexto}`,
    "\nCalcule todos os materiais necessários para cada móvel listado acima. Inclua chapas, ferragens, fitas de borda e conectores. Retorne o campo 'movel' com o nome exato de cada móvel e 'justificativa' explicando o cálculo de quantidade.",
  ].filter(Boolean).join("\n");

  // Caminho determinístico: móveis configurados sem planta baixa
  if (moveis?.length && !planta_b64) {
    try {
      const moveisMapped = moveis.map((m) => ({
        ...m,
        mdf_caixa_id: m.mdf_id,
      })) as unknown as CalcMovelInput[];
      const itens = calcularOrcamento(moveisMapped, catalogoFiltrado, margem_pct);
      return res.json({ itens, resumo: `Orçamento calculado para ${moveis.length} móvel(is).`, total_estimado: 0 });
    } catch (e) {
      return res.status(500).json({ error: e instanceof Error ? e.message : "Erro ao calcular" });
    }
  }

  // Caminho com IA: planta baixa (visão GPT-4o)
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: `data:${detectMime(planta_b64!)};base64,${planta_b64}`, detail: "high" } },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) throw new Error(await r.text());
    const d = await r.json() as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(d.choices[0].message.content);

    const itens = (parsed.itens ?? []).map((it: {
      movel?: string; justificativa?: string; material_id: string; descricao: string;
      quantidade: number; unidade: string; preco_custo: number; preco_unitario: number;
    }) => {
      const custo = Number(it.preco_custo) || 0;
      const unitario = Number(it.preco_unitario) > 0
        ? it.preco_unitario
        : parseFloat((custo / (1 - margem_pct / 100)).toFixed(2));
      return {
        ...it,
        movel: it.movel ?? "Geral",
        justificativa: it.justificativa ?? "",
        preco_custo: custo,
        preco_unitario: unitario,
      };
    });

    return res.json({ itens, resumo: parsed.resumo ?? "", total_estimado: parsed.total_estimado ?? 0 });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro ao calcular" });
  }
}
