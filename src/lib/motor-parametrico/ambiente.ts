/**
 * PLANNE — Motor Paramétrico
 * Fase 1: Fundação — Funções de AmbienteGeometrico
 *
 * plantaToAmbiente: bridge entre PlantaAnalisada (sistema atual) e AmbienteGeometrico (núcleo)
 * calcularSegmentosLivres: derivação pura dos espaços disponíveis em uma parede
 */

import type {
  AmbienteGeometrico,
  Parede,
  ParedeId,
  Porta,
  Janela,
  Abertura,
  SegmentoLivre,
  Centimetros,
} from "./tipos";
/** Subconjunto compatível com PlantaAnalisada de api/analisar-planta.ts */
interface PlantaAnalisadaCompat {
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  porta_principal?: { parede: string; x_pct: number; largura_cm: number };
  portas_secundarias?: { parede: string; x_pct: number; largura_cm: number; descricao?: string }[];
  janelas?: { parede: string; x_pct: number; largura_cm: number; descricao?: string }[];
}
type PlantaAnalisada = PlantaAnalisadaCompat;

// ─── calcularSegmentosLivres ──────────────────────────────────────────────────

/**
 * Calcula os segmentos livres de uma parede descontando as aberturas.
 * Função pura — sem side effects.
 *
 * Regras:
 *   - Portas do tipo "para_dentro" excluem também a zona_exclusao_cm do giro
 *   - Janelas com peitoril < 90cm marcam o segmento como bloqueado_por_janela_baixa
 *   - Segmentos com comprimento_cm < 1 são descartados
 */
export function calcularSegmentosLivres(parede: Parede): SegmentoLivre[] {
  if (parede.aberturas.length === 0) {
    return [{
      inicio_cm: 0,
      fim_cm: parede.comprimento_cm,
      comprimento_cm: parede.comprimento_cm,
      altura_util_cm: parede.altura_cm,
      bloqueado_por_janela_baixa: false,
    }];
  }

  // Zonas excluídas por aberturas (pares [inicio, fim])
  const zonas = parede.aberturas.map((ab): [number, number] => {
    if (ab._tipo === "porta") {
      const p = ab as Porta;
      if (p.sentido_abertura === "para_dentro") {
        const extra = p.zona_exclusao_cm;
        const inicio = Math.max(0, p.posicao_cm - (p.lado_dobradica === "esquerda" ? extra : 0));
        const fim = Math.min(parede.comprimento_cm, p.posicao_cm + p.largura_cm + (p.lado_dobradica === "direita" ? extra : 0));
        return [inicio, fim];
      }
      return [p.posicao_cm, p.posicao_cm + p.largura_cm];
    }
    return [ab.posicao_cm, ab.posicao_cm + ab.largura_cm];
  }).sort((a, b) => a[0] - b[0]);

  // Janelas com peitoril baixo
  const janelasLow = parede.aberturas.filter(
    (ab): ab is Janela => ab._tipo === "janela" && ab.bloqueia_base,
  );

  const segmentos: SegmentoLivre[] = [];
  let cursor = 0;

  for (const [inicio, fim] of zonas) {
    if (inicio > cursor) {
      const seg: SegmentoLivre = {
        inicio_cm: cursor,
        fim_cm: inicio,
        comprimento_cm: inicio - cursor,
        altura_util_cm: parede.altura_cm,
        bloqueado_por_janela_baixa: false,
      };
      // Verificar sobreposição com janela baixa
      seg.bloqueado_por_janela_baixa = janelasLow.some(
        (j) => j.posicao_cm < seg.fim_cm && j.posicao_cm + j.largura_cm > seg.inicio_cm,
      );
      if (seg.comprimento_cm >= 1) segmentos.push(seg);
    }
    cursor = Math.max(cursor, fim);
  }

  if (cursor < parede.comprimento_cm) {
    const seg: SegmentoLivre = {
      inicio_cm: cursor,
      fim_cm: parede.comprimento_cm,
      comprimento_cm: parede.comprimento_cm - cursor,
      altura_util_cm: parede.altura_cm,
      bloqueado_por_janela_baixa: false,
    };
    seg.bloqueado_por_janela_baixa = janelasLow.some(
      (j) => j.posicao_cm < seg.fim_cm && j.posicao_cm + j.largura_cm > seg.inicio_cm,
    );
    if (seg.comprimento_cm >= 1) segmentos.push(seg);
  }

  return segmentos;
}

// ─── plantaToAmbiente ─────────────────────────────────────────────────────────

/**
 * Converte PlantaAnalisada (formato atual do sistema) para AmbienteGeometrico
 * (entidade do núcleo do motor paramétrico).
 *
 * Bridge entre o sistema legado e as novas entidades.
 * Compatibilidade preservada: PlantaAnalisada não é alterada.
 */
export function plantaToAmbiente(
  planta: PlantaAnalisada,
  id = `amb_${Date.now()}`,
): AmbienteGeometrico {
  const largura = planta.largura_cm;
  const profundidade = planta.profundidade_cm;
  const altura = planta.altura_cm || 270;

  const toParede = (s: string): ParedeId =>
    (["top", "bottom", "left", "right"] as ParedeId[]).includes(s as ParedeId)
      ? (s as ParedeId)
      : "bottom";

  // Construir aberturas por parede
  const aberturasPorParede: Record<ParedeId, Abertura[]> = {
    top: [], bottom: [], left: [], right: [],
  };

  // Porta principal
  if (planta.porta_principal) {
    const p = planta.porta_principal;
    const parede = toParede(p.parede);
    const compParede = parede === "top" || parede === "bottom" ? largura : profundidade;
    const porta: Porta = {
      id: "porta_principal",
      _tipo: "porta",
      parede,
      posicao_cm: Math.round(p.x_pct * compParede),
      largura_cm: p.largura_cm,
      subtipo: "simples",
      altura_cm: 210,
      zona_exclusao_cm: 90,
      lado_dobradica: "esquerda",
      sentido_abertura: "para_dentro",
    };
    aberturasPorParede[parede].push(porta);
  }

  // Portas secundárias
  (planta.portas_secundarias || []).forEach((p: { parede: string; x_pct: number; largura_cm: number }, i: number) => {
    const parede = toParede(p.parede);
    const compParede = parede === "top" || parede === "bottom" ? largura : profundidade;
    const porta: Porta = {
      id: `porta_sec_${i}`,
      _tipo: "porta",
      parede,
      posicao_cm: Math.round(p.x_pct * compParede),
      largura_cm: p.largura_cm,
      subtipo: "simples",
      altura_cm: 210,
      zona_exclusao_cm: 0,
      lado_dobradica: "esquerda",
      sentido_abertura: "para_dentro",
    };
    aberturasPorParede[parede].push(porta);
  });

  // Janelas
  (planta.janelas || []).forEach((j: { parede: string; x_pct: number; largura_cm: number }, i: number) => {
    const parede = toParede(j.parede);
    const compParede = parede === "top" || parede === "bottom" ? largura : profundidade;
    const peitoril = 100; // default conservador
    const verga = altura - 30;
    const janela: Janela = {
      id: `janela_${i}`,
      _tipo: "janela",
      parede,
      posicao_cm: Math.round(j.x_pct * compParede),
      largura_cm: j.largura_cm,
      subtipo: "abrir",
      altura_peitoril_cm: peitoril,
      altura_verga_cm: verga,
      bloqueia_base: peitoril < 90,
      bloqueia_aereo: verga > altura - 40,
    };
    aberturasPorParede[parede].push(janela);
  });

  // Montar as 4 paredes com segmentos calculados
  const buildParede = (id: ParedeId): Parede => {
    const comprimento: Centimetros = id === "top" || id === "bottom" ? largura : profundidade;
    const aberturas = aberturasPorParede[id];
    const parede: Parede = {
      id,
      comprimento_cm: comprimento,
      espessura_cm: 15,
      altura_cm: altura,
      aberturas,
      segmentos_livres: [],
      obstaculos_adjacentes: [],
    };
    parede.segmentos_livres = calcularSegmentosLivres(parede);
    return parede;
  };

  const ambiente: AmbienteGeometrico = {
    id,
    dimensoes: {
      largura_cm: largura,
      profundidade_cm: profundidade,
      altura_cm: altura,
      area_m2: Math.round((largura * profundidade) / 10000 * 100) / 100,
    },
    paredes: {
      top: buildParede("top"),
      bottom: buildParede("bottom"),
      left: buildParede("left"),
      right: buildParede("right"),
    },
    obstaculos: [],
    pontos_eletricos: [],
    pontos_hidraulicos: [],
    fonte: "imagem",
    escala_detectada: null,
    confianca_extracao: 0.7,
    extraido_em: new Date().toISOString(),
  };

  return ambiente;
}

/**
 * Cria um AmbienteGeometrico simples a partir de medidas manuais.
 * Usado quando o usuário não tem planta para enviar.
 */
export function criarAmbienteManual(params: {
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  porta_parede?: ParedeId;
  porta_largura_cm?: number;
  janelas_paredes?: ParedeId[];
}): AmbienteGeometrico {
  const {
    largura_cm,
    profundidade_cm,
    altura_cm,
    porta_parede,
    porta_largura_cm = 90,
    janelas_paredes = [],
  } = params;

  const aberturasPorParede: Record<ParedeId, Abertura[]> = {
    top: [], bottom: [], left: [], right: [],
  };

  if (porta_parede) {
    const compParede = porta_parede === "top" || porta_parede === "bottom" ? largura_cm : profundidade_cm;
    const porta: Porta = {
      id: "porta_principal",
      _tipo: "porta",
      parede: porta_parede,
      posicao_cm: Math.round((compParede - porta_largura_cm) / 2),
      largura_cm: porta_largura_cm,
      subtipo: "simples",
      altura_cm: 210,
      zona_exclusao_cm: 90,
      lado_dobradica: "esquerda",
      sentido_abertura: "para_dentro",
    };
    aberturasPorParede[porta_parede].push(porta);
  }

  janelas_paredes.forEach((pId, i) => {
    const compParede = pId === "top" || pId === "bottom" ? largura_cm : profundidade_cm;
    const janela: Janela = {
      id: `janela_${i}`,
      _tipo: "janela",
      parede: pId,
      posicao_cm: Math.round(compParede * 0.2),
      largura_cm: Math.round(compParede * 0.4),
      subtipo: "abrir",
      altura_peitoril_cm: 100,
      altura_verga_cm: altura_cm - 30,
      bloqueia_base: false,
      bloqueia_aereo: false,
    };
    aberturasPorParede[pId].push(janela);
  });

  const buildParede = (id: ParedeId): Parede => {
    const comprimento = id === "top" || id === "bottom" ? largura_cm : profundidade_cm;
    const aberturas = aberturasPorParede[id];
    const parede: Parede = {
      id,
      comprimento_cm: comprimento,
      espessura_cm: 15,
      altura_cm,
      aberturas,
      segmentos_livres: [],
      obstaculos_adjacentes: [],
    };
    parede.segmentos_livres = calcularSegmentosLivres(parede);
    return parede;
  };

  return {
    id: `amb_manual_${Date.now()}`,
    dimensoes: {
      largura_cm,
      profundidade_cm,
      altura_cm,
      area_m2: Math.round((largura_cm * profundidade_cm) / 10000 * 100) / 100,
    },
    paredes: {
      top: buildParede("top"),
      bottom: buildParede("bottom"),
      left: buildParede("left"),
      right: buildParede("right"),
    },
    obstaculos: [],
    pontos_eletricos: [],
    pontos_hidraulicos: [],
    fonte: "manual",
    escala_detectada: null,
    confianca_extracao: 1.0,
    extraido_em: new Date().toISOString(),
  };
}
