import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM = `Você é arquiteto de interiores sênior especialista em marcenaria planejada brasileira (MDF, lacas, madeira). Sua tarefa é criar um projeto COMPLETO do ambiente — não apenas a marcenaria, mas TODOS os elementos do cômodo: portas, janelas, móveis existentes (cama comprada, sofá, etc.) e a marcenaria planejada.

RESPONDA APENAS com JSON válido (sem markdown, sem blocos de código, sem texto fora do JSON).

REGRAS OBRIGATÓRIAS:
1. SEMPRE inclua a porta principal e qualquer porta secundária — com tipo_elemento: "porta".
2. SEMPRE inclua janelas — com tipo_elemento: "janela".
3. INCLUA móveis existentes que não fazem parte da marcenaria (cama box comprada, sofá, mesa de jantar, etc.) com tipo_elemento: "existente" e customizado: false.
4. INCLUA todos os móveis de marcenaria planejada com tipo_elemento: "movel" e customizado: true.
5. DIMENSIONE tudo usando EXCLUSIVAMENTE as medidas numéricas fornecidas pelo usuário no texto (largura, profundidade, pé-direito). NUNCA tente inferir ou corrigir as dimensões com base na imagem da planta — a imagem serve apenas para entender a disposição espacial (onde ficam elementos no espaço). As medidas do usuário são as medidas reais medidas no local.
6. POSICIONE todos os elementos de forma funcional (vista superior), respeitando circulação mínima de 80cm entre móveis.
7. NUNCA retorne menos de 5 elementos para qualquer ambiente (incluindo porta + janela).
8. O preço e chapas_mdf de porta, janela e existente devem ser ZERO (não fazem parte do orçamento de marcenaria).
9. Os móveis de marcenaria NÃO devem ultrapassar as dimensões do ambiente. Cada móvel deve caber dentro da largura e profundidade declaradas pelo usuário, respeitando a escala real.

TIPOS DE ELEMENTOS:
- "movel" = marcenaria planejada (armário, roupeiro, cozinha, rack, prateleiras, nichos, gaveteiro, etc.) — customizado: true
- "existente" = móvel comprado que o cliente já tem ou vai comprar separado (cama, sofá, mesa, cadeira, geladeira, TV) — customizado: false, preco_estimado: 0
- "porta" = abertura de porta na parede — customizado: false, preco_estimado: 0, chapas_mdf: 0
- "janela" = abertura de janela na parede — customizado: false, preco_estimado: 0, chapas_mdf: 0

CAMPO "parede" (apenas para porta e janela):
- "top" = parede superior do cômodo (parede de fundo)
- "bottom" = parede inferior (onde geralmente fica a entrada)
- "left" = parede esquerda
- "right" = parede direita

CAMPO "x_pct" para porta e janela = posição do elemento ao longo da parede (0.0 = início da parede, 1.0 = final).

EXEMPLOS DE MÓVEIS POR AMBIENTE:
- Quarto casal: roupeiro (movel), painel/cabeceira (movel), cômoda (movel), cama box casal (existente), criados-mudos (movel ou existente), porta (porta), janela (janela)
- Sala de estar: rack/painel TV (movel), estante (movel), aparador (movel), sofá (existente), mesa de centro (existente), porta (porta), janela (janela)
- Cozinha: armários superiores (movel), armários inferiores (movel), bancada (movel), geladeira (existente), fogão (existente), porta (porta), janela (janela)
- Home office: mesa de trabalho (movel), estante (movel), armário de arquivos (movel), cadeira (existente), porta (porta), janela (janela)

POSICIONAMENTO (x_pct, y_pct = posição do canto superior esquerdo, 0.0 a 0.85, vista de cima):
- Roupeiro/guarda-roupa: encostar na parede de fundo (y_pct próximo de 0.0)
- Cama de casal: centralizada na largura, próxima à parede de cabeceira
- Rack/painel TV: parede de frente (y_pct próximo de 0.0)
- Porta: posicionada na parede especificada pelo usuário, x_pct = posição ao longo da parede

PREÇOS MERCADO 2025: MDF 18mm branco: R$ 85/chapa. Ferragens: 28% do MDF. Mão de obra: 40% do MDF.
chapas_mdf = área total de peças / 5.0325 m².

Formato exato do JSON:
{
  "resumo": "análise técnica do ambiente em 2-3 frases",
  "descricao_comercial": "texto comercial elegante, 3 parágrafos",
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
      "nota": "Janela com iluminação natural"
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
      "nota": "Cama existente — não inclusa no orçamento"
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
      "nota": "6 portas de correr, perfil alumínio fosco"
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
  "observacoes_tecnicas": ["observação técnica relevante"]
}`;

function detectMime(b64: string): string {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

const WALL_PT: Record<string, string> = {
  top: "parede de cima/fundo",
  bottom: "parede de baixo/entrada",
  left: "parede esquerda",
  right: "parede direita",
};

interface MovelIA {
  chapas_mdf?: number;
  customizado?: boolean;
  tipo_elemento?: string;
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

  const { ambiente, medidas, estilo, descricao, cor_mdf, porta_parede, janelas, planta_b64, referencias_b64, custo_chapa, mao_obra_hora, margem_padrao } = req.body as {
    ambiente: string;
    medidas: { largura: number; profundidade: number; altura: number };
    estilo: string;
    descricao: string;
    cor_mdf?: string;
    porta_parede?: string;
    janelas?: string[];
    planta_b64?: string;
    referencias_b64?: string[];
    custo_chapa?: number;
    mao_obra_hora?: number;
    margem_padrao?: number;
  };

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

  const portaDesc = porta_parede
    ? `A PORTA PRINCIPAL fica na ${WALL_PT[porta_parede] ?? porta_parede}.`
    : "Posicione a porta principal na parede mais adequada para o ambiente.";

  const janelasDesc = janelas && janelas.length > 0
    ? `As JANELAS ficam nas seguintes paredes: ${janelas.map((w) => WALL_PT[w] ?? w).join(", ")}.`
    : "Posicione janela(s) nas paredes mais adequadas para iluminação natural.";

  const userContent: unknown[] = [
    {
      type: "text",
      text: `AMBIENTE: ${ambiente}
MEDIDAS ABSOLUTAS DO AMBIENTE (fornecidas pelo cliente — USE EXATAMENTE ESTAS, não tente inferir da imagem):
  - largura: ${medidas?.largura ?? 4}m
  - profundidade: ${medidas?.profundidade ?? 3}m
  - pé-direito: ${medidas?.altura ?? 2.7}m

ESTILO: ${estilo ?? "Moderno"}
COR/ACABAMENTO MDF preferido: ${cor_mdf || "#f5f3f0"} — use como base para cor_hex dos móveis de MDF
DESCRIÇÃO DO CLIENTE: ${descricao || "Não informada"}

LAYOUT DO CÔMODO (obrigatório incluir no JSON):
${portaDesc}
${janelasDesc}

INSTRUÇÃO CRÍTICA: Inclua TODOS os elementos do cômodo no array "moveis":
1. Porta (tipo_elemento: "porta") na parede indicada acima
2. Janela(s) (tipo_elemento: "janela") nas paredes indicadas
3. Móveis existentes/comprados: cama, sofá, geladeira, fogão, etc. (tipo_elemento: "existente", customizado: false, preco_estimado: 0)
4. Marcenaria planejada: armários, roupeiros, racks, bancadas, etc. (tipo_elemento: "movel", customizado: true)

O orçamento e os itens devem considerar APENAS os elementos com customizado: true.
LEMBRETE FINAL: As dimensões do ambiente são ${medidas?.largura ?? 4}m × ${medidas?.profundidade ?? 3}m. Nenhum móvel pode ser maior que o ambiente.`,
    },
  ];

  if (planta_b64) {
    userContent.push({
      type: "text",
      text: `PLANTA BAIXA PARA REFERÊNCIA DE LAYOUT APENAS — use para entender a disposição espacial (posição de elementos, circulação). NÃO use a imagem para inferir ou alterar as dimensões declaradas acima.`,
    });
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

    // Auto-calculate orçamento using ONLY custom marcenaria items
    const customMoveis = (analise.moveis ?? []).filter(
      (m) => m.customizado !== false && m.tipo_elemento !== "porta" && m.tipo_elemento !== "janela" && m.tipo_elemento !== "existente"
    );
    const totalChapas = customMoveis.reduce((s, m) => s + (Number(m.chapas_mdf) || 0), 0);
    const o = analise.orcamento ?? ({} as OrcamentoIA);
    const desperdicio = 1 + (o.desperdicio_pct ?? 15) / 100;
    const custoChapa = custo_chapa ?? 85;
    const maoObraFactor = mao_obra_hora ? (mao_obra_hora / 45) * 0.4 : 0.4;
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
