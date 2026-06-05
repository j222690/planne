/**
 * PLANNE — Motor Paramétrico V1
 * Fase 2: Endpoint serverless
 *
 * POST /api/motor-parametrico
 *
 * Gera um ProjetoFabricavel de cozinha linear de forma 100% determinística.
 * Tempo de resposta alvo: < 100ms (zero chamadas de IA, zero I/O de banco).
 *
 * Input:
 *   ambiente_geometrico: AmbienteGeometrico (ou medidas manuais como fallback)
 *   preferencias: PreferenciasCozinha
 *
 * Output:
 *   projeto: ProjetoFabricavel
 *   moveis_calc: MovelInput[]  (compatível com /api/calcular-orcamento)
 *   resultado: { parede_usada, largura_disponivel_cm, largura_ocupada_cm, aproveitamento_pct, avisos }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { gerarLayoutCozinhaLinear } from "../src/lib/motor-parametrico/layout-cozinha-linear";
import { projetoToMovelInput } from "../src/lib/motor-parametrico/adapters";
import { criarAmbienteManual } from "../src/lib/motor-parametrico/ambiente";
import { gerarEngenharia } from "../src/lib/motor-parametrico/engenharia";
import { gerarTresVersoes } from "../src/lib/motor-parametrico/orcamento-inteligente";
import type { AmbienteGeometrico, ParedeId } from "../src/lib/motor-parametrico/tipos";
import type { PreferenciasCozinha } from "../src/lib/motor-parametrico/layout-cozinha-linear";

interface RequestBody {
  // Opção 1: AmbienteGeometrico já processado (vindo de analisar-planta.ts)
  ambiente_geometrico?: AmbienteGeometrico;

  // Opção 2: Medidas manuais como fallback
  medidas?: {
    largura_cm: number;
    profundidade_cm: number;
    altura_cm: number;
    porta_parede?: ParedeId;
    janelas_paredes?: ParedeId[];
  };

  // Preferências do usuário
  preferencias: {
    parede_principal?: ParedeId;
    cor_mdf_hex?: string;
    ferragem?: PreferenciasCozinha["ferragem"];
    tipo_porta_base?: PreferenciasCozinha["tipo_porta_base"];
    tipo_porta_aereo?: PreferenciasCozinha["tipo_porta_aereo"];
    versao_comercial?: PreferenciasCozinha["versao_comercial"];
    nome?: string;
    empresa_id?: string;
    cliente_id?: string;
    criado_por?: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const body = req.body as RequestBody;

  if (!body.ambiente_geometrico && !body.medidas) {
    return res.status(400).json({
      error: "Informe ambiente_geometrico ou medidas (largura_cm, profundidade_cm, altura_cm).",
    });
  }

  try {
    const inicio = Date.now();

    // 1. Obter o AmbienteGeometrico
    let ambiente: AmbienteGeometrico;

    if (body.ambiente_geometrico) {
      ambiente = body.ambiente_geometrico;
    } else {
      const m = body.medidas!;
      if (!m.largura_cm || !m.profundidade_cm) {
        return res.status(400).json({ error: "medidas.largura_cm e medidas.profundidade_cm são obrigatórios." });
      }
      ambiente = criarAmbienteManual({
        largura_cm: m.largura_cm,
        profundidade_cm: m.profundidade_cm,
        altura_cm: m.altura_cm || 270,
        porta_parede: m.porta_parede,
        janelas_paredes: m.janelas_paredes,
      });
    }

    // 2. Resolver preferências com defaults
    const prefs = body.preferencias ?? {};
    const preferencias: PreferenciasCozinha = {
      parede_principal: prefs.parede_principal,
      cor_mdf_hex: prefs.cor_mdf_hex ?? "#f5f3f0",
      ferragem: prefs.ferragem ?? "nacional",
      tipo_porta_base: prefs.tipo_porta_base ?? "dobradica",
      tipo_porta_aereo: prefs.tipo_porta_aereo ?? "dobradica",
      versao_comercial: prefs.versao_comercial ?? "intermediaria",
      nome: prefs.nome,
      empresa_id: prefs.empresa_id,
      cliente_id: prefs.cliente_id,
      criado_por: prefs.criado_por ?? "motor_parametrico",
    };

    // 3. Gerar layout (100% determinístico, sem IA)
    const resultado = gerarLayoutCozinhaLinear(ambiente, preferencias);

    // 4. Gerar MovelInput[] para compatibilidade com calcular-orcamento
    const moveis_calc = projetoToMovelInput(resultado.projeto);

    // 5. Gerar pacote de engenharia (Fase 4): peças, ferragens, materiais, compras
    const engenharia = gerarEngenharia(resultado.projeto);

    // 6. Gerar 3 versões de orçamento (Fase 5): econômica / intermediária / premium
    const orcamentos = gerarTresVersoes(resultado.projeto);

    const ms = Date.now() - inicio;

    return res.json({
      projeto: resultado.projeto,
      moveis_calc,
      // Veredicto do Rule Engine (Fase 3)
      validacao: resultado.validacao,
      // Pacote de engenharia para produção (Fase 4)
      engenharia,
      // 3 versões comerciais com custos completos (Fase 5)
      orcamentos,
      resultado: {
        parede_usada: resultado.parede_usada,
        largura_disponivel_cm: resultado.largura_disponivel_cm,
        largura_ocupada_cm: resultado.largura_ocupada_cm,
        aproveitamento_pct: resultado.aproveitamento_pct,
        avisos: resultado.avisos,
        status_validacao: resultado.validacao.status,
        score_validacao: resultado.validacao.score,
        num_modulos_base: resultado.projeto.modulos.filter(m => m.modulo_template_codigo.startsWith("base_")).length,
        num_modulos_aereo: resultado.projeto.modulos.filter(m => m.modulo_template_codigo.startsWith("aereo_")).length,
        num_pecas_total: resultado.projeto.metricas.num_pecas_total,
        chapas_estimadas: resultado.projeto.metricas.chapas_15mm + resultado.projeto.metricas.chapas_6mm,
        metros_fita: resultado.projeto.metricas.metros_fita_borda,
        tempo_ms: ms,
      },
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Erro interno no motor paramétrico",
    });
  }
}
