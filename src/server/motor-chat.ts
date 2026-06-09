/**
 * PLANNE — Motor Paramétrico V1
 * Fase 11: Copiloto da Marcenaria — Endpoint de Chat
 *
 * POST /api/copiloto
 *
 * Chat operacional que orquestra o motor via tool-calling. O LLM (OpenAI)
 * decide quais ferramentas chamar; a execução é 100% determinística (motor).
 *
 * Princípio da Vision: "A IA decide. O motor paramétrico constrói."
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ferramentasFormatoOpenAI,
  executarFerramenta,
} from "../lib/motor-parametrico/copiloto-tools";

interface Mensagem {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
}

interface RequestBody {
  mensagens: { role: "user" | "assistant"; content: string }[];
}

const SYSTEM = `Você é o Copiloto da Marcenaria do Planne — um assistente técnico para marceneiros brasileiros.

Você ajuda a projetar móveis planejados, gerar orçamentos e planejar a produção.
Use SEMPRE as ferramentas disponíveis para obter dados reais — nunca invente medidas, preços ou prazos.

Diretrizes:
- Para recomendar um layout, use "recomendar_layout".
- Para gerar um projeto completo (com orçamento, produção, indicadores), use "gerar_projeto_completo".
- Para dúvidas técnicas (MDF, ferragens, normas), use "consultar_conhecimento".
- Para ler uma planta DXF, use "interpretar_planta".
- Apresente os resultados de forma clara e objetiva, em português brasileiro.
- Valores monetários em reais (R$). Sempre cite o que o motor calculou.`;

const MAX_ITERACOES = 5;

export async function chatHandler(req: VercelRequest, res: VercelResponse) {
  const body = req.body as RequestBody;
  if (!body.mensagens || body.mensagens.length === 0) {
    return res.status(400).json({ error: "Campo 'mensagens' obrigatório." });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

  const tools = ferramentasFormatoOpenAI();
  const mensagens: Mensagem[] = [
    { role: "system", content: SYSTEM },
    ...body.mensagens.map((m) => ({ role: m.role, content: m.content })),
  ];

  const ferramentasUsadas: { nome: string; args: unknown }[] = [];

  try {
    for (let i = 0; i < MAX_ITERACOES; i++) {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: mensagens,
          tools,
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!resp.ok) {
        return res.status(502).json({ error: `OpenAI: ${(await resp.text()).slice(0, 300)}` });
      }

      const data = (await resp.json()) as {
        choices: { message: Mensagem; finish_reason: string }[];
      };
      const msg = data.choices[0].message;
      mensagens.push(msg);

      // Sem tool calls → resposta final
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return res.json({
          resposta: msg.content ?? "",
          ferramentas_usadas: ferramentasUsadas,
          iteracoes: i + 1,
        });
      }

      // Executar cada ferramenta chamada (determinístico)
      for (const call of msg.tool_calls) {
        let resultado: unknown;
        try {
          const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
          resultado = executarFerramenta(call.function.name, args);
          ferramentasUsadas.push({ nome: call.function.name, args });
        } catch (e) {
          resultado = { erro: e instanceof Error ? e.message : "Falha ao executar ferramenta" };
        }
        mensagens.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(resultado),
        });
      }
    }

    // Excedeu iterações
    return res.json({
      resposta: "Não consegui concluir em tempo. Tente reformular a pergunta.",
      ferramentas_usadas: ferramentasUsadas,
      iteracoes: MAX_ITERACOES,
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Erro interno no copiloto",
    });
  }
}
