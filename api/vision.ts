import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM = `Você é arquiteto de interiores sênior especialista em marcenaria planejada brasileira (MDF, lacas, madeira). Sua tarefa é criar um projeto completo e realista de marcenaria para o ambiente especificado.

RESPONDA APENAS com JSON válido (sem markdown, sem blocos de código, sem texto fora do JSON).

REGRAS OBRIGATÓRIAS:
1. INCLUA TODOS os móveis essenciais para o tipo de ambiente — NÃO omita nenhum item principal:
   - Quarto casal: cama de casal (L≥180cm), 2 criados-mudos, roupeiro ou closet, painel/cabeceira. Se tiver espaço: cômoda ou penteadeira.
   - Quarto solteiro: cama solteiro (L≥100cm), criado-mudo, roupeiro ou guarda-roupa, escrivaninha ou estante.
   - Cozinha: armários superiores, armários inferiores, bancada/tampo, torre forno/micro (se coube), despenseiro.
   - Sala de estar: rack/painel TV, estante ou buffet/aparador.
   - Home office: mesa de trabalho, estante/prateleiras, armário de arquivos.
   - Closet: prateleiras de sapatos, cabideiros, gaveteiros, prateleiras de acessórios.
   - Banheiro: gabinete, espelheira/nicho.
2. DIMENSIONE os móveis para aproveitar o máximo do espaço, usando as medidas reais do ambiente.
3. POSICIONE os móveis de forma funcional (vista superior), respeitando circulação mínima de 80cm entre móveis.
4. SIGA o estilo das imagens de referência ao escolher cores, acabamentos e detalhes.
5. Use a cor/acabamento mais próximo das imagens de referência para cor_hex.
6. NUNCA retorne menos de 3 móveis para qualquer ambiente.

Formato exato do JSON de resposta:
{
  "resumo": "análise técnica do ambiente em 2-3 frases descrevendo o projeto",
  "descricao_comercial": "texto comercial elegante, 3 parágrafos, destacando exclusividade e qualidade do projeto",
  "estilo_detectado": "nome do estilo identificado nas referências",
  "moveis": [
    {
      "id": "mov_1",
      "nome": "Cama Casal com Cabeceira Ripado",
      "categoria": "cama",
      "largura_cm": 193,
      "profundidade_cm": 213,
      "altura_cm": 35,
      "x_pct": 0.35,
      "y_pct": 0.15,
      "cor_hex": "#c8b49a",
      "preco_estimado": 3800,
      "chapas_mdf": 3,
      "nota": "Cama box queen, cabeceira ripado freijó 240cm"
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
    "observação técnica relevante"
  ]
}

POSICIONAMENTO (x_pct, y_pct = posição do canto superior esquerdo, 0.0 a 0.85, vista de cima):
- Roupeiro/guarda-roupa: encostar na parede de fundo (y_pct próximo de 0.0)
- Cama de casal: centralizada na largura, próxima à parede de cabeceira
- Criados-mudos: flanqueando a cama (um de cada lado)
- Bancadas de cozinha: ao longo das paredes
- Rack/painel TV: parede de frente (y_pct próximo de 0.0)
- Evite sobreposição de móveis. Deixe circulação mínima 80cm.

PREÇOS MERCADO CHAPECÓ/SC 2025: MDF 18mm branco: R$ 85/chapa. MDF BP: R$ 70/chapa. Ferragens: 28% do MDF. Mão de obra: 40% do MDF.
chapas_mdf = área total de peças / 5.0325 m² (chapa 2750×1830mm).
Calcule o orçamento realista somando todos os móveis.`;

function detectMime(b64: string): string {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

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

  const { ambiente, medidas, estilo, descricao, cor_mdf, planta_b64, referencias_b64 } = req.body as {
    ambiente: string;
    medidas: { largura: number; profundidade: number; altura: number };
    estilo: string;
    descricao: string;
    cor_mdf?: string;
    planta_b64?: string;
    referencias_b64?: string[];
  };

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

  const userContent: unknown[] = [
    {
      type: "text",
      text: `AMBIENTE: ${ambiente}
MEDIDAS DO AMBIENTE: largura=${medidas?.largura ?? 4}m, profundidade=${medidas?.profundidade ?? 3}m, pé-direito=${medidas?.altura ?? 2.7}m
ESTILO: ${estilo ?? "Moderno"}
COR/ACABAMENTO MDF preferido do cliente: ${cor_mdf || "#f5f3f0"} — use esta cor como base para cor_hex de todos os móveis de MDF
DESCRIÇÃO DO CLIENTE: ${descricao || "Não informada"}

Crie um projeto COMPLETO de marcenaria planejada para este ambiente. Inclua TODOS os móveis essenciais para o tipo de ambiente. Use as medidas reais para dimensionar os móveis corretamente aproveitando o máximo do espaço. Posicione funcionalmente na vista superior.`,
    },
  ];

  if (planta_b64) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${detectMime(planta_b64)};base64,${planta_b64}`, detail: "high" },
    });
  }

  for (const b64 of (referencias_b64 ?? []).filter(Boolean).slice(0, 3)) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${detectMime(b64)};base64,${b64}`, detail: "low" },
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
        max_tokens: 6000,
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
