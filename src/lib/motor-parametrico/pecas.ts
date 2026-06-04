/**
 * PLANNE — Motor Paramétrico
 * Fase 1: Fundação — Funções Puras de Cálculo
 *
 * calcularPecas: deriva Peca[] a partir de ModuloInstanciado + ModuloParametrico
 * calcularFerragens: deriva Ferragem[] a partir de ModuloInstanciado + ModuloParametrico
 * calcularMetricas: deriva MetricasProjeto a partir de ModuloInstanciado[]
 *
 * TODAS as funções são puras (sem side effects, sem I/O).
 * Para os mesmos inputs, sempre retornam os mesmos outputs.
 * Isso garante auditabilidade total dos cálculos (princípio da Vision).
 */

import type {
  ModuloInstanciado,
  ModuloParametrico,
  Peca,
  Ferragem,
  MetricasProjeto,
  Material,
  EspessuraMDF,
  TOLERANCIA_SERRA_MM,
  MAX_PECA_MM,
  AREA_CHAPA_M2,
} from "./tipos";
import {
  TOLERANCIA_SERRA_MM as TOLERANCIA,
  MAX_PECA_MM as MAX_PECA,
  AREA_CHAPA_M2 as AREA_CHAPA,
  ESP_CORPO_MM,
} from "./tipos";

// ─── calcularPecas ────────────────────────────────────────────────────────────

/**
 * Calcula todas as peças de um módulo instanciado.
 *
 * Itera sobre template.regras_pecas, filtra as ativas e aplica as fórmulas.
 * Peças maiores que MAX_PECA_MM são divididas em segmentos automaticamente.
 *
 * @param instancia - Módulo com dimensões e configuração concretos
 * @param template  - ModuloParametrico com as regras de construção
 * @returns Peca[] derivadas — nunca devem ser armazenadas como fonte de verdade
 */
export function calcularPecas(
  instancia: ModuloInstanciado,
  template: ModuloParametrico,
): Peca[] {
  const L = instancia.largura_cm * 10;       // cm → mm
  const A = instancia.altura_cm * 10;
  const P = instancia.profundidade_cm * 10;
  const cfg = instancia.configuracao;
  const pecas: Peca[] = [];
  let seq = 0;

  for (const regra of template.regras_pecas) {
    if (!regra.ativa_quando(cfg)) continue;

    const largura = regra.calcular_largura_mm(L, A, P, cfg);
    const comprimento = regra.calcular_comprimento_mm(L, A, P, cfg);
    const quantidade = regra.calcular_quantidade(L, A, P, cfg);
    const espessura: EspessuraMDF =
      typeof regra.espessura_mm === "function"
        ? regra.espessura_mm(cfg)
        : regra.espessura_mm;

    const material = selecionarMaterial(regra.usa_material, instancia);

    for (let q = 0; q < quantidade; q++) {
      const baseId = `${instancia.id}_${regra.nome}_${q}`;

      if (largura > MAX_PECA || comprimento > MAX_PECA) {
        const segmentos = dividirEmSegmentos(
          baseId, instancia.id, regra.nome, largura, comprimento,
          espessura, material, regra, cfg, instancia,
        );
        pecas.push(...segmentos);
      } else {
        pecas.push({
          id: `${baseId}_${seq++}`,
          modulo_instanciado_id: instancia.id,
          regra_nome: regra.nome,
          largura_mm: largura,
          comprimento_mm: comprimento,
          espessura_mm: espessura,
          largura_final_mm: largura - TOLERANCIA,
          comprimento_final_mm: comprimento - TOLERANCIA,
          material,
          direcao_fio: regra.direcao_fio,
          fita_borda: regra.fita_borda(cfg),
          quantidade: 1,
          etiqueta_producao: `${regra.nome.toUpperCase()} — ${instancia.nome_display}`,
          status: "pendente",
        });
      }
    }
  }

  return pecas;
}

// ─── calcularFerragens ────────────────────────────────────────────────────────

/**
 * Calcula todas as ferragens de um módulo instanciado.
 *
 * @param instancia - Módulo com dimensões e configuração concretos
 * @param template  - ModuloParametrico com as regras de ferragem
 * @returns Ferragem[] derivadas
 */
export function calcularFerragens(
  instancia: ModuloInstanciado,
  template: ModuloParametrico,
): Ferragem[] {
  const L = instancia.largura_cm * 10;
  const A = instancia.altura_cm * 10;
  const P = instancia.profundidade_cm * 10;
  const cfg = instancia.configuracao;

  const marca = cfg.ferragem === "blum" ? "blum"
    : cfg.ferragem === "hafele" ? "hafele"
    : cfg.ferragem === "grass" ? "grass"
    : "nacional";

  return template.regras_ferragens
    .filter((r) => r.ativa_quando(cfg))
    .map((r) => ({
      id: `${instancia.id}_${r.tipo}`,
      modulo_instanciado_id: instancia.id,
      tipo: r.tipo,
      marca,
      quantidade: r.calcular_quantidade(L, A, P, cfg),
      descricao: r.descricao_tecnica,
      preco_custo_unit: 0,   // preenchido pelo motor de custos
      preco_venda_unit: 0,
      etiqueta_producao: `${r.tipo} — ${instancia.nome_display}`,
    }));
}

// ─── calcularMetricas ─────────────────────────────────────────────────────────

/**
 * Calcula MetricasProjeto a partir dos módulos instanciados.
 * Usado para preencher ProjetoFabricavel.metricas (cache).
 * Deve ser chamado sempre que modulos[] muda.
 */
export function calcularMetricas(modulos: ModuloInstanciado[]): MetricasProjeto {
  let chapas18 = 0, chapas15 = 0, chapas6 = 0;
  let metrosFita = 0;
  let linearTotal = 0;
  let areaFrontal = 0;
  let numPecas = 0;
  let numFerragens = 0;
  let custoMaterial = 0;
  let custoFerragens = 0;

  for (const m of modulos) {
    linearTotal += m.largura_cm;
    areaFrontal += (m.largura_cm * m.altura_cm) / 10000;

    for (const p of m.pecas) {
      numPecas += p.quantidade;

      const areaM2 = (p.largura_mm * p.comprimento_mm) / 1_000_000;
      const chapas = areaM2 / AREA_CHAPA;

      if (p.espessura_mm === 18) chapas18 += chapas;
      else if (p.espessura_mm === 15) chapas15 += chapas;
      else if (p.espessura_mm === 6 || p.espessura_mm === 3) chapas6 += chapas;

      // Fita de borda em metros
      const fb = p.fita_borda;
      const l_m = p.largura_mm / 1000;
      const c_m = p.comprimento_mm / 1000;
      if (fb.esquerda) metrosFita += c_m;
      if (fb.direita) metrosFita += c_m;
      if (fb.topo) metrosFita += l_m;
      if (fb.base) metrosFita += l_m;

      custoMaterial += areaM2 / AREA_CHAPA * p.material.preco_custo_chapa;
    }

    for (const f of m.ferragens) {
      numFerragens += f.quantidade;
      custoFerragens += f.quantidade * f.preco_custo_unit;
    }
  }

  return {
    chapas_18mm: Math.ceil(chapas18 * 1.15),
    chapas_15mm: Math.ceil(chapas15 * 1.15),
    chapas_6mm: Math.ceil(chapas6 * 1.15),
    metros_fita_borda: Math.round(metrosFita * 1.15 * 10) / 10,
    linear_marcenaria_cm: linearTotal,
    area_frontal_m2: Math.round(areaFrontal * 100) / 100,
    num_modulos: modulos.length,
    num_pecas_total: numPecas,
    num_ferragens_total: numFerragens,
    custo_material_estimado: Math.round(custoMaterial),
    custo_ferragens_estimado: Math.round(custoFerragens),
    calculado_em: new Date().toISOString(),
  };
}

// ─── HELPERS INTERNOS ─────────────────────────────────────────────────────────

function selecionarMaterial(
  tipo: "corpo" | "porta" | "fundo",
  instancia: ModuloInstanciado,
): Material {
  if (tipo === "porta" && instancia.material_porta) return instancia.material_porta;
  if (tipo === "fundo" && instancia.material_fundo) return instancia.material_fundo;
  return instancia.material_corpo;
}

function dividirEmSegmentos(
  baseId: string,
  moduloId: string,
  regraNome: string,
  largura: number,
  comprimento: number,
  espessura: EspessuraMDF,
  material: Material,
  regra: ModuloParametrico["regras_pecas"][0],
  cfg: ModuloInstanciado["configuracao"],
  instancia: ModuloInstanciado,
): Peca[] {
  const dim = comprimento > MAX_PECA ? comprimento : largura;
  const isComprimento = comprimento > MAX_PECA;
  const numSeg = Math.ceil(dim / MAX_PECA);
  const segSize = Math.ceil(dim / numSeg);

  return Array.from({ length: numSeg }, (_, i) => {
    const segLarg = isComprimento ? largura : Math.min(segSize, largura - i * segSize);
    const segComp = isComprimento ? Math.min(segSize, comprimento - i * segSize) : comprimento;
    return {
      id: `${baseId}_seg${i}`,
      modulo_instanciado_id: moduloId,
      regra_nome: regraNome,
      largura_mm: segLarg,
      comprimento_mm: segComp,
      espessura_mm: espessura,
      largura_final_mm: segLarg - TOLERANCIA,
      comprimento_final_mm: segComp - TOLERANCIA,
      material,
      direcao_fio: regra.direcao_fio,
      fita_borda: regra.fita_borda(cfg),
      quantidade: 1,
      etiqueta_producao: `${regraNome.toUpperCase()} (seg ${i + 1}/${numSeg}) — ${instancia.nome_display}`,
      segmento_de: baseId,
      numero_segmento: i + 1,
      total_segmentos: numSeg,
      observacao_uniao: "Junção com 2 cavilhas 8×30mm + minifix 15mm",
      status: "pendente" as const,
    };
  });
}
