/**
 * PLANNE — Motor Paramétrico
 * Fase 2: Motor Paramétrico V1 — Layout de Cozinha Linear
 *
 * gerarLayoutCozinhaLinear: função principal que transforma um AmbienteGeometrico
 * em um ProjetoFabricavel com módulos base e aéreos posicionados automaticamente.
 *
 * CRITÉRIO DE ACEITE (roadmap):
 *   Parede 4m → Projeto → Peças → Ferragens
 *
 * Algoritmo:
 *   1. Identificar parede principal (a mais longa com segmento livre ≥ 120cm)
 *   2. Calcular módulos que encaixam no segmento disponível (greedy)
 *   3. Posicionar módulos base da esquerda para a direita
 *   4. Posicionar módulos aéreos alinhados com os base (a 150cm do piso)
 *   5. Calcular peças e ferragens de cada módulo
 *   6. Montar ProjetoFabricavel com métricas
 */

import type {
  AmbienteGeometrico,
  ProjetoFabricavel,
  ModuloInstanciado,
  ConfiguracaoModulo,
  Material,
  ParedeId,
  VersaoComercial,
} from "./tipos";
import { AREA_CHAPA_M2, TOLERANCIA_SERRA_MM } from "./tipos";
import {
  MODULOS_BASE_COZINHA,
  MODULOS_AEREOS_COZINHA,
  LARGURAS_PADRAO,
  getTemplateBase,
  getTemplateAereo,
  BASE_ALTURA_CM,
  BASE_PROFUNDIDADE_CM,
  AEREO_ALTURA_CM,
  AEREO_PROFUNDIDADE_CM,
} from "./biblioteca-cozinha";
import { calcularPecas, calcularFerragens, calcularMetricas } from "./pecas";
import { validarProjeto, type ResultadoValidacao } from "./rule-engine";

// ─── TIPOS DE ENTRADA ─────────────────────────────────────────────────────────

export interface PreferenciasCozinha {
  /** Parede onde ficam os armários. Se omitido, escolhe a mais longa. */
  parede_principal?: ParedeId;

  /** Cor base do MDF (hex). */
  cor_mdf_hex: string;

  /** Qualidade das ferragens. */
  ferragem: ConfiguracaoModulo["ferragem"];

  /** Tipo de porta dos módulos base. */
  tipo_porta_base: "dobradica" | "correr";

  /** Tipo de porta dos módulos aéreos. */
  tipo_porta_aereo: "dobradica" | "basculante";

  /** Versão comercial do projeto. */
  versao_comercial: VersaoComercial;

  /** ID do usuário que gerou o projeto. */
  criado_por?: string;

  /** ID da empresa. */
  empresa_id?: string;

  /** ID do cliente. */
  cliente_id?: string;

  /** Nome do projeto. */
  nome?: string;
}

// ─── RESULTADO DO MOTOR ───────────────────────────────────────────────────────

export interface ResultadoLayout {
  projeto: ProjetoFabricavel;
  /** Parede onde os módulos foram posicionados. */
  parede_usada: ParedeId;
  /** Largura total disponível na parede. */
  largura_disponivel_cm: number;
  /** Soma das larguras dos módulos posicionados. */
  largura_ocupada_cm: number;
  /** % de aproveitamento da parede. */
  aproveitamento_pct: number;
  /** Mensagens de aviso (não erros — projeto é válido mesmo com avisos). */
  avisos: string[];
  /** Veredicto do Rule Engine (Fase 3): aprovado / aprovado_com_alertas / reprovado. */
  validacao: ResultadoValidacao;
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Gera um ProjetoFabricavel de cozinha linear a partir de um AmbienteGeometrico.
 *
 * @param ambiente     - Espaço físico do cômodo
 * @param preferencias - Preferências do usuário (cor, ferragem, tipo de porta)
 * @returns ResultadoLayout com ProjetoFabricavel e métricas de aproveitamento
 */
export function gerarLayoutCozinhaLinear(
  ambiente: AmbienteGeometrico,
  preferencias: PreferenciasCozinha,
): ResultadoLayout {
  const avisos: string[] = [];

  // 1. Identificar parede principal
  const paredeId = escolherParedePrincipal(ambiente, preferencias.parede_principal, avisos);
  const parede = ambiente.paredes[paredeId];

  // 2. Encontrar o maior segmento livre disponível
  const segmentosValidos = parede.segmentos_livres.filter(
    s => !s.bloqueado_por_janela_baixa && s.comprimento_cm >= 30,
  );

  if (segmentosValidos.length === 0) {
    avisos.push(`Nenhum segmento livre suficiente na parede ${paredeId}. Verifique aberturas.`);
    segmentosValidos.push({
      inicio_cm: 0,
      fim_cm: parede.comprimento_cm,
      comprimento_cm: parede.comprimento_cm,
      altura_util_cm: parede.altura_cm,
      bloqueado_por_janela_baixa: false,
    });
  }

  const segmento = segmentosValidos.reduce((maior, s) =>
    s.comprimento_cm > maior.comprimento_cm ? s : maior,
  );

  const larguraDisponivel = segmento.comprimento_cm;

  // 3. Calcular quais larguras encaixam no segmento
  const largurasBases = encaixarModulos(larguraDisponivel);
  const larguraAereos = largurasBases; // aéreos alinhados com bases

  if (largurasBases.length === 0) {
    avisos.push(`Segmento de ${larguraDisponivel}cm é insuficiente para um módulo mínimo (30cm).`);
  }

  // 4. Criar material padrão (placeholder — preços reais vêm do catálogo da empresa)
  const materialCorpo = criarMaterialPadrao(preferencias.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(preferencias.cor_mdf_hex, 6);

  // 5. Configuração baseada nas preferências
  const cfgBase: ConfiguracaoModulo = {
    tipo_porta: preferencias.tipo_porta_base,
    num_portas: 2,
    num_prateleiras: 1,
    num_gavetas: 0,
    num_divisorias: 0,
    tem_cabideiro: false,
    tem_fundo: true,
    espessura_fundo_mm: 6,
    tem_rodape: false,
    altura_rodape_cm: 10,
    tem_pes_regulaveis: true,
    altura_pes_cm: 10,
    tem_roda_teto: false,
    tem_iluminacao_led: false,
    tem_espelho_interno: false,
    tem_ripado: false,
    espessura_corpo_mm: 15,
    espessura_porta_mm: 15,
    ferragem: preferencias.ferragem,
    tipo_puxador: "perfil_aluminio",
  };

  const cfgAereo: ConfiguracaoModulo = {
    ...cfgBase,
    tipo_porta: preferencias.tipo_porta_aereo as ConfiguracaoModulo["tipo_porta"],
    tem_pes_regulaveis: false,
  };

  // 6. Instanciar módulos base
  const modulos: ModuloInstanciado[] = [];
  let posX = segmento.inicio_cm;
  let ordem = 0;

  for (const largura of largurasBases) {
    const template = getTemplateBase(largura) ?? MODULOS_BASE_COZINHA[4]; // fallback: base_60
    const cfg: ConfiguracaoModulo = {
      ...cfgBase,
      num_portas: largura <= 40 ? 1 : 2,
    };

    const instancia: ModuloInstanciado = {
      id: `base_${largura}_${posX}`,
      modulo_template_id: template.id,
      modulo_template_codigo: template.codigo,
      modulo_template_versao: template.versao,
      largura_cm: largura,
      altura_cm: BASE_ALTURA_CM,
      profundidade_cm: BASE_PROFUNDIDADE_CM,
      parede: paredeId,
      posicao_x_cm: posX,
      posicao_y_cm: 0,
      configuracao: cfg,
      material_corpo: materialCorpo,
      material_fundo: materialFundo,
      pecas: [],
      ferragens: [],
      nome_display: `${template.nome} — Parede ${paredeId}`,
      ordem: ordem++,
    };

    // Calcular peças e ferragens (derivados)
    instancia.pecas = calcularPecas(instancia, template);
    instancia.ferragens = calcularFerragens(instancia, template);

    modulos.push(instancia);
    posX += largura;
  }

  // 7. Instanciar módulos aéreos (alinhados com os base)
  posX = segmento.inicio_cm;
  const alturaAereoInicio = 150; // piso → base do aéreo

  for (const largura of larguraAereos) {
    const template = getTemplateAereo(largura) ?? MODULOS_AEREOS_COZINHA[4]; // fallback: aereo_60
    const cfg: ConfiguracaoModulo = {
      ...cfgAereo,
      num_portas: largura <= 40 ? 1 : 2,
    };

    const instancia: ModuloInstanciado = {
      id: `aereo_${largura}_${posX}`,
      modulo_template_id: template.id,
      modulo_template_codigo: template.codigo,
      modulo_template_versao: template.versao,
      largura_cm: largura,
      altura_cm: AEREO_ALTURA_CM,
      profundidade_cm: AEREO_PROFUNDIDADE_CM,
      parede: paredeId,
      posicao_x_cm: posX,
      posicao_y_cm: alturaAereoInicio,
      configuracao: cfg,
      material_corpo: materialCorpo,
      material_fundo: materialFundo,
      pecas: [],
      ferragens: [],
      nome_display: `${template.nome} — Parede ${paredeId}`,
      ordem: ordem++,
    };

    instancia.pecas = calcularPecas(instancia, template);
    instancia.ferragens = calcularFerragens(instancia, template);

    modulos.push(instancia);
    posX += largura;
  }

  // 8. Verificar aproveitamento
  const larguraOcupada = largurasBases.reduce((s, l) => s + l, 0);
  const aproveitamento = Math.round((larguraOcupada / larguraDisponivel) * 100);

  if (aproveitamento < 85) {
    avisos.push(
      `Aproveitamento de ${aproveitamento}% (${larguraOcupada}cm de ${larguraDisponivel}cm disponíveis). ` +
      `Sobra de ${larguraDisponivel - larguraOcupada}cm.`,
    );
  }

  // 9. Calcular métricas do projeto
  const metricas = calcularMetricas(modulos);

  // 10. Montar ProjetoFabricavel
  const agora = new Date().toISOString();
  const projeto: ProjetoFabricavel = {
    id: `proj_cozinha_${Date.now()}`,
    empresa_id: preferencias.empresa_id ?? "",
    cliente_id: preferencias.cliente_id ?? "",
    nome: preferencias.nome ?? `Cozinha Linear — ${ambiente.dimensoes.largura_cm / 100}m`,
    tipo_ambiente: "Cozinha",
    versao_comercial: preferencias.versao_comercial,
    numero_revisao: 1,
    ambiente,          // embedded (não FK)
    modulos,
    metricas,
    estilo: "Moderno Minimalista",
    observacoes_tecnicas: [
      `${largurasBases.length} módulos base (${larguraOcupada}cm linear)`,
      `${larguraAereos.length} módulos aéreos alinhados`,
      `Aproveitamento da parede: ${aproveitamento}%`,
      ...avisos,
    ],
    status: "rascunho",
    criado_por: preferencias.criado_por ?? "motor_parametrico",
    criado_em: agora,
    atualizado_em: agora,
  };

  // 11. Validar o projeto contra o Rule Engine (Fase 3)
  const validacao = validarProjeto(projeto);

  return {
    projeto,
    parede_usada: paredeId,
    largura_disponivel_cm: larguraDisponivel,
    largura_ocupada_cm: larguraOcupada,
    aproveitamento_pct: aproveitamento,
    avisos,
    validacao,
  };
}

// ─── ALGORITMO DE ENCAIXE ─────────────────────────────────────────────────────

/**
 * Calcula as larguras dos módulos que encaixam no espaço disponível.
 * Algoritmo greedy: prefere módulos de 60cm, ajusta com filler no final.
 *
 * Exemplos:
 *   400cm → [60,60,60,60,60,60,40] = 400cm ✓
 *   320cm → [60,60,60,60,80] = 320cm ✓
 *   280cm → [60,60,60,60,40] = 280cm ✓
 *   380cm → [60,60,60,60,60,80] = 380cm ✓
 *   150cm → [60,60,30] = 150cm ✓
 */
export function encaixarModulos(disponivel_cm: number): number[] {
  const resultado: number[] = [];
  let restante = Math.round(disponivel_cm);

  while (restante > 0) {
    if (restante < 30) {
      // Restante muito pequeno — absorver no último módulo se possível
      if (resultado.length > 0) {
        const ultimo = resultado[resultado.length - 1];
        const nova = ultimo + restante;
        if (nova <= 90) {
          resultado[resultado.length - 1] = nova;
        }
        // Se > 90: aceitar a folga pequena (< 30cm é ok em marcenaria)
      }
      break;
    }

    let escolhido: number;
    if (restante >= 60) {
      // Verificar se 60cm deixa um restante válido
      const apos60 = restante - 60;
      if (apos60 === 0 || apos60 >= 30) {
        escolhido = 60;
      } else {
        // apos60 < 30: encontrar módulo maior que 60 que se encaixa perfeitamente
        const perfeito = (LARGURAS_PADRAO as readonly number[]).find(
          l => l > 60 && l <= restante && (restante - l === 0 || restante - l >= 30),
        );
        escolhido = perfeito ?? 60; // fallback para 60 e absorver o restante depois
      }
    } else {
      // restante < 60: maior módulo padrão que cabe
      escolhido = (LARGURAS_PADRAO as readonly number[]).find(l => l <= restante) ?? restante;
    }

    resultado.push(Math.min(escolhido, restante));
    restante -= Math.min(escolhido, restante);
  }

  return resultado;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Escolhe a parede principal para a cozinha.
 * Prioridade: parede indicada pelo usuário → parede mais longa com segmento livre.
 */
function escolherParedePrincipal(
  ambiente: AmbienteGeometrico,
  preferida: ParedeId | undefined,
  avisos: string[],
): ParedeId {
  if (preferida) {
    const parede = ambiente.paredes[preferida];
    const temEspaco = parede.segmentos_livres.some(s => s.comprimento_cm >= 120);
    if (!temEspaco) {
      avisos.push(
        `Parede "${preferida}" tem menos de 120cm disponível. Usando a melhor alternativa.`,
      );
    } else {
      return preferida;
    }
  }

  // Escolher a parede com maior segmento livre
  const paredes: ParedeId[] = ["top", "bottom", "left", "right"];
  let melhor: ParedeId = "top";
  let melhorComp = 0;

  for (const pId of paredes) {
    const p = ambiente.paredes[pId];
    const maxSeg = Math.max(0, ...p.segmentos_livres.map(s => s.comprimento_cm));
    if (maxSeg > melhorComp) {
      melhorComp = maxSeg;
      melhor = pId;
    }
  }

  return melhor;
}

/**
 * Cria um Material placeholder com preços de referência do mercado 2025.
 * Os preços reais são substituídos quando o orçamento formal é criado
 * (usa o catálogo de materiais da empresa).
 */
function criarMaterialPadrao(cor_hex: string, espessura: 6 | 15 | 18): Material {
  const precos: Record<number, number> = { 6: 45, 15: 85, 18: 105 };
  return {
    id: `padrao_${espessura}mm`,
    codigo: `mdf_${espessura}mm_padrao`,
    nome_display: `MDF ${espessura}mm`,
    espessura_mm: espessura,
    largura_chapa_mm: 2750,
    comprimento_chapa_mm: 1830,
    area_chapa_m2: AREA_CHAPA_M2,
    cor_hex,
    acabamento: "melamina",
    preco_custo_chapa: precos[espessura] ?? 85,
    preco_venda_chapa: 0,
  };
}

