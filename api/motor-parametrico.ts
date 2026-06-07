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
import { gerarLayoutCozinhaL, gerarLayoutCozinhaU } from "../src/lib/motor-parametrico/layout-cozinha-l-u";
import { gerarLayoutIlha } from "../src/lib/motor-parametrico/layout-ilha";
import { gerarLayoutDormitorio, gerarLayoutCloset } from "../src/lib/motor-parametrico/layout-quarto";
import { gerarLayoutBanheiro, gerarLayoutLavanderia } from "../src/lib/motor-parametrico/layout-servicos";
import { projetoToMovelInput } from "../src/lib/motor-parametrico/adapters";
import { criarAmbienteManual } from "../src/lib/motor-parametrico/ambiente";
import { gerarEngenharia } from "../src/lib/motor-parametrico/engenharia";
import { gerarTresVersoes } from "../src/lib/motor-parametrico/orcamento-inteligente";
import { gerarPlanoNesting } from "../src/lib/motor-parametrico/nesting";
import { gerarExportacoes } from "../src/lib/motor-parametrico/exportacao-corte";
import { gerarOrdemProducao } from "../src/lib/motor-parametrico/pcp";
import { gerarListaCompras } from "../src/lib/motor-parametrico/engenharia";
import { analisarProjeto } from "../src/lib/motor-parametrico/consultor-tecnico";
import type { AmbienteGeometrico, ParedeId, ProjetoFabricavel } from "../src/lib/motor-parametrico/tipos";
import type { ResultadoValidacao } from "../src/lib/motor-parametrico/rule-engine";

type TipoLayout =
  | "cozinha_linear" | "cozinha_l" | "cozinha_u" | "ilha"
  | "dormitorio" | "closet" | "banheiro" | "lavanderia";

interface RequestBody {
  // Tipo de ambiente a gerar (default: cozinha_linear)
  tipo_layout?: TipoLayout;

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
    paredes?: ParedeId[];
    cor_mdf_hex?: string;
    ferragem?: "nacional" | "blum" | "hafele" | "grass";
    tipo_porta_base?: "dobradica" | "correr";
    tipo_porta_aereo?: "dobradica" | "basculante";
    tipo_porta?: "dobradica" | "correr" | "espelho";
    versao_comercial?: "economica" | "intermediaria" | "premium";
    com_aereos?: boolean;
    com_superior?: boolean;
    nome?: string;
    empresa_id?: string;
    cliente_id?: string;
    criado_por?: string;
  };
}

/** Resultado normalizado entre todos os geradores. */
interface LayoutNormalizado {
  projeto: ProjetoFabricavel;
  validacao: ResultadoValidacao;
  avisos: string[];
  paredes_usadas: ParedeId[];
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
    const comum = {
      cor_mdf_hex: prefs.cor_mdf_hex ?? "#f5f3f0",
      ferragem: prefs.ferragem ?? "nacional" as const,
      versao_comercial: prefs.versao_comercial ?? "intermediaria" as const,
      nome: prefs.nome,
      empresa_id: prefs.empresa_id,
      cliente_id: prefs.cliente_id,
      criado_por: prefs.criado_por ?? "motor_parametrico",
    };
    const tipoLayout: TipoLayout = body.tipo_layout ?? "cozinha_linear";

    // 3. Despachar para o gerador correto (100% determinístico, sem IA)
    const resultado = gerarLayout(tipoLayout, ambiente, prefs, comum);

    // 4. Gerar MovelInput[] para compatibilidade com calcular-orcamento
    const moveis_calc = projetoToMovelInput(resultado.projeto);

    // 5. Gerar pacote de engenharia (Fase 4): peças, ferragens, materiais, compras
    const engenharia = gerarEngenharia(resultado.projeto);

    // 6. Gerar 3 versões de orçamento (Fase 5): econômica / intermediária / premium
    const orcamentos = gerarTresVersoes(resultado.projeto);

    // 7. Gerar plano de corte (Fase 8): nesting MaxRects + exportações
    const todasPecas = resultado.projeto.modulos.flatMap((m) => m.pecas);
    const planoBruto = gerarPlanoNesting(todasPecas, resultado.projeto.metricas.metros_fita_borda);
    const { plano: plano_corte, exportacoes: exportacoes_corte } = gerarExportacoes(planoBruto, resultado.projeto.id);

    // 8. Gerar PCP (Fase 9): ordem de produção com cronograma + lista de compras
    const lista_compras = gerarListaCompras(resultado.projeto);
    const pcpResultado = gerarOrdemProducao(resultado.projeto, plano_corte, { lista_compras });

    // 9. Análise técnica da IA Marceneira (Fase 10): recomendações auditáveis
    const analise_tecnica = analisarProjeto(resultado.projeto);

    const ms = Date.now() - inicio;

    return res.json({
      tipo_layout: tipoLayout,
      projeto: resultado.projeto,
      moveis_calc,
      // Veredicto do Rule Engine (Fase 3)
      validacao: resultado.validacao,
      // Pacote de engenharia para produção (Fase 4)
      engenharia,
      // 3 versões comerciais com custos completos (Fase 5)
      orcamentos,
      // Plano de corte com nesting MaxRects + exportações (Fase 8)
      plano_corte,
      exportacoes_corte,
      // PCP: cronograma + etapas + lista de compras (Fase 9)
      pcp: {
        numero: pcpResultado.ordem.numero,
        data_inicio_planejada: pcpResultado.ordem.data_inicio_planejada,
        data_entrega_prometida: pcpResultado.ordem.data_entrega_prometida,
        dag_valido: pcpResultado.dag_valido,
        duracao_total_horas: pcpResultado.duracao_total_horas,
        prazo_dias_uteis: pcpResultado.prazo_dias_uteis,
        etapas: pcpResultado.etapas_agendadas,
        lista_compras: pcpResultado.ordem.lista_compras,
      },
      // Análise técnica auditável da IA Marceneira (Fase 10)
      analise_tecnica,
      resultado: {
        paredes_usadas: resultado.paredes_usadas,
        avisos: resultado.avisos,
        status_validacao: resultado.validacao.status,
        score_validacao: resultado.validacao.score,
        num_modulos: resultado.projeto.modulos.length,
        num_pecas_total: resultado.projeto.metricas.num_pecas_total,
        chapas_nesting: plano_corte.resumo.total_chapas,
        desperdicio_pct: plano_corte.resumo.desperdicio_pct,
        metros_fita: resultado.projeto.metricas.metros_fita_borda,
        prazo_producao_dias: pcpResultado.prazo_dias_uteis,
        tempo_ms: ms,
      },
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Erro interno no motor paramétrico",
    });
  }
}

// ─── DISPATCHER DE LAYOUT ─────────────────────────────────────────────────────

type PrefsBody = RequestBody["preferencias"];
interface PrefsComuns {
  cor_mdf_hex: string;
  ferragem: "nacional" | "blum" | "hafele" | "grass";
  versao_comercial: "economica" | "intermediaria" | "premium";
  nome?: string;
  empresa_id?: string;
  cliente_id?: string;
  criado_por: string;
}

/**
 * Roteia para o gerador correto e normaliza a saída para LayoutNormalizado.
 */
function gerarLayout(
  tipo: TipoLayout,
  ambiente: AmbienteGeometrico,
  prefs: PrefsBody,
  comum: PrefsComuns,
): LayoutNormalizado {
  switch (tipo) {
    case "cozinha_l": {
      const r = gerarLayoutCozinhaL(ambiente, {
        ...comum,
        tipo_porta_base: prefs.tipo_porta_base ?? "dobradica",
        tipo_porta_aereo: prefs.tipo_porta_aereo ?? "dobradica",
        paredes: prefs.paredes,
        com_aereos: prefs.com_aereos,
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "cozinha_u": {
      const r = gerarLayoutCozinhaU(ambiente, {
        ...comum,
        tipo_porta_base: prefs.tipo_porta_base ?? "dobradica",
        tipo_porta_aereo: prefs.tipo_porta_aereo ?? "dobradica",
        paredes: prefs.paredes,
        com_aereos: prefs.com_aereos,
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "ilha": {
      const r = gerarLayoutIlha(ambiente, {
        ...comum,
        tipo_porta_base: prefs.tipo_porta_base ?? "dobradica",
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "dormitorio": {
      const r = gerarLayoutDormitorio(ambiente, {
        ...comum,
        tipo_porta: prefs.tipo_porta,
        paredes: prefs.paredes,
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "closet": {
      const r = gerarLayoutCloset(ambiente, {
        ...comum,
        tipo_porta: prefs.tipo_porta,
        paredes: prefs.paredes,
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "banheiro": {
      const r = gerarLayoutBanheiro(ambiente, {
        ...comum,
        parede_principal: prefs.parede_principal,
        com_superior: prefs.com_superior,
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "lavanderia": {
      const r = gerarLayoutLavanderia(ambiente, {
        ...comum,
        parede_principal: prefs.parede_principal,
        com_superior: prefs.com_superior,
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "cozinha_linear":
    default: {
      const r = gerarLayoutCozinhaLinear(ambiente, {
        ...comum,
        parede_principal: prefs.parede_principal,
        tipo_porta_base: prefs.tipo_porta_base ?? "dobradica",
        tipo_porta_aereo: prefs.tipo_porta_aereo ?? "dobradica",
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: [r.parede_usada] };
    }
  }
}
