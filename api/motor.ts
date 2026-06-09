/**
 * PLANNE — Motor Paramétrico
 * Endpoint unificado do motor (roteia por `action`).
 *
 * Consolida três funcionalidades num único Serverless Function (plano Hobby
 * do Vercel limita a 12 funções). A lógica de cada uma vive em src/server/
 * (fora de api/, para ser bundlada no deploy — arquivos `_` em api/ NÃO são
 * incluídos no runtime serverless).
 *
 * POST /api/motor
 *   body.action = "gerar"      → gera projeto completo (layout → PCP)
 *   body.action = "ler-planta" → interpreta planta (DXF/imagem/manual)
 *   body.action = "chat"       → copiloto conversacional (LLM + ferramentas)
 *
 * Compatível também com query: /api/motor?action=gerar
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { gerarHandler } from "../src/server/motor-gerar";
import { lerPlantaHandler } from "../src/server/motor-leitura";
import { chatHandler } from "../src/server/motor-chat";

type Acao = "gerar" | "ler-planta" | "chat";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const body = (req.body ?? {}) as { action?: string };
  const acao = (req.query.action as string | undefined) ?? body.action;

  switch (acao as Acao) {
    case "gerar":
      return gerarHandler(req, res);
    case "ler-planta":
      return lerPlantaHandler(req, res);
    case "chat":
      return chatHandler(req, res);
    default:
      return res.status(400).json({
        error: "Campo 'action' obrigatório: gerar | ler-planta | chat.",
      });
  }
}
