/**
 * PLANNE — Motor Paramétrico
 * Entry point do endpoint unificado (roteia por `action`).
 *
 * Este arquivo é BUNDLADO por scripts/bundle-motor.mjs → api/motor.js
 * (autocontido). Necessário porque o Vercel, com "type": "module", não bundla
 * imports de api/ → src/, e arquivos `_` em api/ não vão para o runtime.
 *
 * POST /api/motor
 *   body.action = "gerar"      → gera projeto completo (layout → PCP)
 *   body.action = "ler-planta" → interpreta planta (DXF/imagem/manual)
 *   body.action = "chat"       → copiloto conversacional (LLM + ferramentas)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { gerarHandler } from "./motor-gerar";
import { lerPlantaHandler } from "./motor-leitura";
import { chatHandler } from "./motor-chat";

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
