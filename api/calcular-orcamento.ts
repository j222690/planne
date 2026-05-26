import type { VercelRequest, VercelResponse } from "@vercel/node";

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
}

function moveisToParagraph(moveis: MovelConfig[]): string {
  return moveis.map((m, i) => {
    const ferragensAuto: string[] = [];
    if (m.portas > 0) {
      if (m.tipo_porta === "abrir") {
        ferragensAuto.push(`${m.portas * 2} dobradiças (2 por folha)`);
        ferragensAuto.push(`${m.portas} puxador(es)`);
      } else if (m.tipo_porta === "correr") {
        const pares = Math.ceil(m.portas / 2);
        ferragensAuto.push(`${pares} par(es) de corrediça de porta + trilho duplo`);
      }
    }
    if (m.gavetas > 0) {
      ferragensAuto.push(`${m.gavetas} par(es) de corrediça de gaveta telescópica`);
      ferragensAuto.push(`${m.gavetas} puxador(es) de gaveta`);
    }

    return [
      `${i + 1}. ${m.nome} (${m.tipo})`,
      `   Dimensões: ${m.largura_cm}cm L × ${m.profundidade_cm}cm P × ${m.altura_cm}cm H`,
      `   Portas: ${m.portas}${m.portas > 0 ? ` — abertura: ${m.tipo_porta}` : ""}`,
      `   Gavetas: ${m.gavetas}   Prateleiras: ${m.prateleiras}`,
      ferragensAuto.length > 0 ? `   Ferragens obrigatórias: ${ferragensAuto.join("; ")}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

const SYSTEM = `Você é especialista em marcenaria planejada brasileira.
Dado um projeto com móveis configurados, calcule EXATAMENTE quais materiais e quantidades são necessários.

REGRAS DE CÁLCULO:
- Chapas MDF/MDP: some a área total de painéis de cada móvel ÷ 5.04m² (chapa padrão 2750×1830mm). Arredonde para cima.
- Dobradiças: exatamente conforme especificado (2 por porta pequena ≤120cm, 3 por porta alta >120cm).
- Corrediça de porta de correr: 1 par de corrediça + 1 trilho por par de folhas. USE OBRIGATORIAMENTE se tipo_porta = "correr".
- Corrediça de gaveta: 1 par por gaveta. OBRIGATÓRIO se gavetas > 0.
- Puxadores: 1 por porta + 1 por gaveta.
- Fita de borda: perímetro dos painéis expostos × 1.15 (desperdício), em metros lineares.
- Parafusos/conectores: estimativa por corpo de armário (Minifix, cavilhas).
- Fundo em MDF 6mm: apenas se o móvel tiver fundo (armários, roupeiros — não bancadas ou ripados).

IMPORTANTE: Cada item deve ter obrigatoriamente os campos "movel" (nome exato do móvel) e "justificativa" (explicação curta de como chegou naquela quantidade).

USE APENAS materiais da lista fornecida. Se um material necessário não estiver na lista, omita-o.
Calcule quantidades realistas para marcenaria planejada Chapecó/SC, Brasil, 2025.

RESPONDA APENAS com JSON válido (sem markdown):
{
  "itens": [
    {
      "movel": "Roupeiro",
      "material_id": "uuid-exato",
      "descricao": "MDF 18mm Branco — estrutura do roupeiro",
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
    ambiente, moveis, medidas, descricao, materiais, planta_b64, margem_pct = 35,
  } = req.body as {
    ambiente: string;
    moveis?: MovelConfig[];
    medidas?: { largura: number; profundidade: number; altura: number };
    descricao?: string;
    materiais: { id: string; nome: string; unidade: string; preco_custo: number; preco_venda: number; categoria: string | null }[];
    planta_b64?: string;
    margem_pct?: number;
  };

  if (!materiais?.length) return res.status(400).json({ error: "Nenhum material fornecido" });
  if (!moveis?.length && !planta_b64 && !descricao) return res.status(400).json({ error: "Informe os móveis ou uma planta baixa" });

  const catalogoTexto = materiais.map((m) =>
    `- ID: ${m.id} | ${m.nome} | unidade: ${m.unidade} | custo: R$${m.preco_custo} | venda: R$${m.preco_venda}`
  ).join("\n");

  const moveisParagraph = moveis?.length ? moveisToParagraph(moveis) : "";

  const userPrompt = [
    `AMBIENTE: ${ambiente}`,
    medidas?.largura ? `MEDIDAS DO AMBIENTE: ${medidas.largura}m L × ${medidas.profundidade}m P × ${medidas.altura}m H` : "",
    planta_b64 ? "MEDIDAS: extrair da planta baixa fornecida" : "",
    moveisParagraph ? `\nMÓVEIS CONFIGURADOS:\n${moveisParagraph}` : "",
    descricao ? `\nOBSERVAÇÕES: ${descricao}` : "",
    `\nMARGEM: ${margem_pct}%`,
    `\nMATERIAIS DISPONÍVEIS NO ESTOQUE:\n${catalogoTexto}`,
    "\nCalcule todos os materiais necessários para cada móvel listado acima. Inclua chapas, ferragens, fitas de borda e conectores. Retorne o campo 'movel' com o nome exato de cada móvel e 'justificativa' explicando o cálculo de quantidade.",
  ].filter(Boolean).join("\n");

  try {
    let responseText: string;

    if (planta_b64) {
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
                { type: "image_url", image_url: { url: `data:${detectMime(planta_b64)};base64,${planta_b64}`, detail: "high" } },
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
      responseText = d.choices[0].message.content;
    } else {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY não configurada" });

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 4000,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json() as { choices: { message: { content: string } }[] };
      responseText = d.choices[0].message.content;
    }

    const parsed = JSON.parse(responseText);

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
