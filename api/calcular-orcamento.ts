import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM = `Você é especialista em marcenaria planejada brasileira.
Dado um ambiente com medidas e uma lista de materiais disponíveis no estoque,
calcule EXATAMENTE quais materiais e quantidades são necessários para o projeto.

REGRAS DE CÁLCULO:
- Chapas MDF/MDP: área total de painéis ÷ 5.04m² (chapa padrão 2750×1830mm). Arredonde para cima.
- Ferragens (dobradiças): 2 por porta pequena, 3 por porta alta (>120cm).
- Corrediças: 2 por gaveta.
- Puxadores: 1 por porta, 1 por gaveta.
- Fita de borda: perímetro total dos painéis × 1.15 (desperdício), em metros.
- Parafusos/conectores: estimativa por corpo de armário.
- Mão de obra: estime em horas com base na complexidade.

USE APENAS materiais da lista fornecida. Se um material não estiver na lista, ignore.
Calcule quantidades realistas para Chapecó/SC, Brasil, 2025.

RESPONDA APENAS com JSON válido (sem markdown):
{
  "itens": [
    {
      "material_id": "uuid-exato-do-material",
      "descricao": "nome descritivo do item no orçamento",
      "quantidade": 4.5,
      "unidade": "chapa",
      "preco_custo": 85.00,
      "preco_unitario": 130.77
    }
  ],
  "resumo": "descrição curta do projeto para o campo observações",
  "total_estimado": 0
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    ambiente, medidas, descricao, materiais, planta_b64, margem_pct = 35,
  } = req.body as {
    ambiente: string;
    medidas: { largura: number; profundidade: number; altura: number };
    descricao: string;
    materiais: { id: string; nome: string; unidade: string; preco_custo: number; preco_venda: number; categoria: string | null }[];
    planta_b64?: string;
    margem_pct?: number;
  };

  if (!materiais?.length) return res.status(400).json({ error: "Nenhum material fornecido" });

  const catalogoTexto = materiais.map((m) =>
    `- ID: ${m.id} | ${m.nome} | unidade: ${m.unidade} | custo: R$${m.preco_custo} | venda: R$${m.preco_venda} | categoria: ${m.categoria ?? "geral"}`
  ).join("\n");

  const userPrompt = `AMBIENTE: ${ambiente}
MEDIDAS: ${medidas.largura}m (largura) × ${medidas.profundidade}m (profundidade) × ${medidas.altura}m (altura)
DESCRIÇÃO DO PROJETO: ${descricao || "Mobiliário planejado para o ambiente"}
MARGEM: ${margem_pct}%

MATERIAIS DISPONÍVEIS NO ESTOQUE:
${catalogoTexto}

Calcule os materiais e quantidades necessários para este projeto.`;

  try {
    let responseText: string;

    if (planta_b64) {
      // Com imagem da planta: usa GPT-4o Vision
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
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${planta_b64}`, detail: "high" } },
              ],
            },
          ],
          max_tokens: 2500,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json() as { choices: { message: { content: string } }[] };
      responseText = d.choices[0].message.content;
    } else {
      // Sem imagem: usa Groq (mais rápido e barato)
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
          max_tokens: 2500,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json() as { choices: { message: { content: string } }[] };
      responseText = d.choices[0].message.content;
    }

    const parsed = JSON.parse(responseText);

    // Garante que preco_unitario existe (recalcula pela margem se vier zerado)
    const itens = (parsed.itens ?? []).map((it: {
      material_id: string; descricao: string; quantidade: number;
      unidade: string; preco_custo: number; preco_unitario: number;
    }) => {
      const custo = Number(it.preco_custo) || 0;
      const unitario = Number(it.preco_unitario) > 0
        ? it.preco_unitario
        : parseFloat((custo / (1 - margem_pct / 100)).toFixed(2));
      return { ...it, preco_custo: custo, preco_unitario: unitario };
    });

    return res.json({ itens, resumo: parsed.resumo ?? "", total_estimado: parsed.total_estimado ?? 0 });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro ao calcular" });
  }
}
