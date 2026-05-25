import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM = `Você é designer de interiores sênior especialista em móveis planejados brasileiros (MDF, lacas, madeira).
Analise o ambiente descrito e as imagens fornecidas (planta baixa e referências visuais).

RESPONDA APENAS com JSON válido (sem markdown, sem explicações fora do JSON):

{
  "resumo": "análise técnica do ambiente em 2-3 frases",
  "descricao_comercial": "texto de venda elegante e persuasivo, 3-4 parágrafos, foca em benefícios, qualidade e exclusividade",
  "estilo_detectado": "Moderno Minimalista",
  "moveis": [
    {
      "id": "mov_1",
      "nome": "Armário Planejado 2 Portas",
      "categoria": "armario",
      "largura_cm": 120,
      "profundidade_cm": 55,
      "altura_cm": 220,
      "x_pct": 0.05,
      "y_pct": 0.05,
      "cor_hex": "#d4c5b0",
      "preco_estimado": 4500,
      "chapas_mdf": 5.5,
      "nota": "Com iluminação LED interna e espelho bronze"
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
    "margem_pct": 35,
    "total": 0
  },
  "observacoes_tecnicas": [
    "Verificar instalação elétrica para iluminação embutida",
    "Piso nivelado obrigatório antes da instalação"
  ]
}

REGRAS:
- x_pct e y_pct são posições relativas no canvas (0.0 a 0.9), vista superior do ambiente
- Use preços de mercado Chapecó/SC 2025. MDF 18mm: R$ 85/chapa. MDF BP: R$ 70/chapa.
- chapas_mdf é a quantidade de chapas 2750×1830mm necessárias para o móvel
- Calcule orcamento realista baseado nas chapas de todos os móveis
- Categoria: armario, mesa, sofa, cama, rack, estante, bancada, escritório, outro`;

interface MovelIA {
  chapas_mdf?: number;
}

interface OrcamentoIA {
  mdf_custo?: number;
  ferragens_custo?: number;
  puxadores_custo?: number;
  fita_borda_custo?: number;
  mao_de_obra?: number;
  desperdicio_pct?: number;
  subtotal?: number;
  margem_pct?: number;
  total?: number;
}

interface AnaliseIA {
  moveis: MovelIA[];
  orcamento: OrcamentoIA;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ambiente, medidas, estilo, descricao, planta_b64, referencias_b64 } = req.body as {
    ambiente: string;
    medidas: { largura: number; profundidade: number; altura: number };
    estilo: string;
    descricao: string;
    planta_b64?: string;
    referencias_b64?: string[];
  };

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

  const userContent: unknown[] = [
    {
      type: "text",
      text: `Ambiente: ${ambiente}
Medidas: ${medidas?.largura ?? 4}m × ${medidas?.profundidade ?? 3}m | Pé-direito: ${medidas?.altura ?? 2.7}m
Estilo desejado: ${estilo ?? "Moderno"}
Descrição adicional: ${descricao || "Não informada"}

Gere um projeto completo de marcenaria planejada para este ambiente.`,
    },
  ];

  if (planta_b64) {
    const mimeType = planta_b64.startsWith("/9j") ? "image/jpeg" : "image/png";
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${planta_b64}`, detail: "high" },
    });
  }

  for (const b64 of (referencias_b64 ?? []).filter(Boolean).slice(0, 3)) {
    const mimeType = b64.startsWith("/9j") ? "image/jpeg" : "image/png";
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${b64}`, detail: "low" },
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `OpenAI Vision: ${err.slice(0, 400)}` });
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    const analise = JSON.parse(data.choices[0].message.content) as AnaliseIA;

    // Auto-calculate orcamento if zeros
    const totalChapas = (analise.moveis ?? []).reduce((s, m) => s + (Number(m.chapas_mdf) || 0), 0);
    const o = analise.orcamento ?? ({} as OrcamentoIA);
    const desperdicio = 1 + (o.desperdicio_pct ?? 15) / 100;

    if (!o.mdf_custo || o.mdf_custo === 0) o.mdf_custo = Math.round(totalChapas * 85 * desperdicio);
    if (!o.ferragens_custo || o.ferragens_custo === 0) o.ferragens_custo = Math.round(o.mdf_custo * 0.28);
    if (!o.puxadores_custo || o.puxadores_custo === 0) o.puxadores_custo = Math.round(o.mdf_custo * 0.07);
    if (!o.fita_borda_custo || o.fita_borda_custo === 0) o.fita_borda_custo = Math.round(totalChapas * 15);
    if (!o.mao_de_obra || o.mao_de_obra === 0) o.mao_de_obra = Math.round(o.mdf_custo * 0.4);
    o.subtotal = o.mdf_custo + o.ferragens_custo + o.puxadores_custo + o.fita_borda_custo + o.mao_de_obra;
    o.total = Math.round(o.subtotal / (1 - (o.margem_pct ?? 35) / 100));
    analise.orcamento = o;

    return res.json({ analise, usage: data.usage });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
