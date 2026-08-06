/**
 * PLANNE — Motor Paramétrico
 * Fase 6: Regras de Corte Reutilizáveis
 *
 * Fábricas de RegraCorte e RegraFerragem genéricas, usadas pelas bibliotecas
 * de quarto, banheiro e lavanderia. Mantém a lógica de corte consistente em
 * todos os ambientes sem duplicação.
 *
 * (A biblioteca de cozinha mantém suas próprias regras inline por estabilidade;
 * estas fábricas são a evolução genérica para os novos ambientes.)
 */

import type {
  RegraCorte,
  RegraFerragem,
  FitaBorda,
  EspessuraMDF,
} from "./tipos";
// Base de Conhecimento (Camada 3): nº de dobradiças por altura, rastreável à fonte.
import { dobradicasPorAlturaMm } from "../base-conhecimento/parametros";

const ESP: EspessuraMDF = 15;
const FUNDO: EspessuraMDF = 6;

/**
 * Recuo (mm) de cada lado da divisória vertical, quando ativado — mesma
 * ordem de grandeza usada pelo Promob (não há valor padrão de mercado
 * documentado; é configurável projeto a projeto na ferramenta de referência).
 */
const RECUO_DIVISORIA_MM = 40;

const ALTURA_GAVETA_PADRAO_CM = 16;
/** Altura (mm) de cada frente de gaveta, configurável por módulo. */
const alturaGavetaMm = (cfg: { altura_gaveta_cm?: number }) =>
  (cfg.altura_gaveta_cm ?? ALTURA_GAVETA_PADRAO_CM) * 10;
/** Altura (mm) da pilha de gavetas — descontada da porta quando há ambos. */
const zonaGavetasMm = (cfg: { num_gavetas: number; altura_gaveta_cm?: number }) =>
  cfg.num_gavetas > 0 ? cfg.num_gavetas * alturaGavetaMm(cfg) : 0;

const semFita = (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: false });
const fitaFrente = (): FitaBorda => ({ esquerda: false, direita: false, topo: true, base: false });
const fitaTotal = (): FitaBorda => ({ esquerda: true, direita: true, topo: true, base: true });

// ─── REGRAS DE CORPO ──────────────────────────────────────────────────────────

export interface OpcoesCorpo {
  /** Espessura do corpo (default 15mm). */
  espessura_corpo?: EspessuraMDF;
  /** Inclui divisória vertical interna? (roupeiros) */
  com_divisoria?: boolean;
}

/**
 * Gera o conjunto padrão de regras de corte do corpo de um móvel-caixa:
 * 2 laterais, teto, base, prateleiras, fundo. Base de qualquer armário.
 */
export function regrasCorpo(opts: OpcoesCorpo = {}): RegraCorte[] {
  const esp = opts.espessura_corpo ?? ESP;

  const regras: RegraCorte[] = [
    {
      nome: "lateral",
      grupo: "corpo",
      ativa_quando: () => true,
      calcular_largura_mm: (_L, _A, P) => P,
      calcular_comprimento_mm: (_L, A) => A,
      calcular_quantidade: () => 2,
      espessura_mm: esp,
      direcao_fio: "paralelo_comprimento",
      fita_borda: fitaFrente,
      usa_material: "corpo",
    },
    {
      nome: "teto",
      grupo: "corpo",
      ativa_quando: () => true,
      calcular_largura_mm: (L) => L - 2 * esp,
      calcular_comprimento_mm: (_L, _A, P) => P,
      calcular_quantidade: () => 1,
      espessura_mm: esp,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaFrente,
      usa_material: "corpo",
    },
    {
      nome: "base",
      grupo: "corpo",
      ativa_quando: () => true,
      calcular_largura_mm: (L) => L - 2 * esp,
      calcular_comprimento_mm: (_L, _A, P) => P,
      calcular_quantidade: () => 1,
      espessura_mm: esp,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaFrente,
      usa_material: "corpo",
    },
    {
      nome: "prateleira",
      grupo: "corpo",
      ativa_quando: (cfg) => cfg.num_prateleiras > 0,
      calcular_largura_mm: (L, _A, _P, cfg) =>
        cfg.num_divisorias > 0 ? Math.round((L - 2 * esp - esp) / 2) : L - 2 * esp,
      calcular_comprimento_mm: (_L, _A, P) => P - FUNDO,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_prateleiras,
      espessura_mm: esp,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaFrente,
      usa_material: "corpo",
    },
    {
      nome: "fundo",
      grupo: "fundo",
      ativa_quando: (cfg) => cfg.tem_fundo,
      calcular_largura_mm: (L) => L - 2 * esp,
      calcular_comprimento_mm: (_L, A) => A - 2 * esp,
      calcular_quantidade: () => 1,
      espessura_mm: FUNDO,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "fundo",
    },
  ];

  if (opts.com_divisoria) {
    regras.push({
      nome: "divisoria_vertical",
      grupo: "corpo",
      ativa_quando: (cfg) => cfg.num_divisorias > 0,
      calcular_largura_mm: (_L, _A, P, cfg) =>
        P - FUNDO
        - (cfg.divisoria_recuo_frontal ? RECUO_DIVISORIA_MM : 0)
        - (cfg.divisoria_recuo_traseiro ? RECUO_DIVISORIA_MM : 0),
      calcular_comprimento_mm: (_L, A) => A - 2 * esp,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_divisorias,
      espessura_mm: esp,
      direcao_fio: "paralelo_comprimento",
      fita_borda: fitaFrente,
      usa_material: "corpo",
    });
  }

  // Acabamentos (rodapé, roda-teto, engrosso) — gerados conforme os flags de
  // config, então todo módulo construído com regrasCorpo já os conhece.
  return [...regras, ...regrasAcabamento()];
}

// ─── REGRA DE PORTA ───────────────────────────────────────────────────────────

/** Porta de abrir (dobradiça). Largura dividida pelo nº de portas. */
export function regraPortaDobradica(): RegraCorte {
  return {
    nome: "porta",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && (cfg.tipo_porta === "dobradica" || cfg.tipo_porta === "basculante"),
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
    // altura desconta a zona de gavetas (gaveta em baixo → porta menor)
    calcular_comprimento_mm: (_L, A, _P, cfg) => Math.max(150, A - zonaGavetasMm(cfg)),
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: fitaTotal,
    usa_material: "porta",
  };
}

/** Porta de correr (roupeiros). Padrão 15mm (marcenaria BR usa pouco 18mm). */
export function regraPortaCorrer(): RegraCorte {
  return {
    nome: "porta_correr",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && (cfg.tipo_porta === "correr" || cfg.tipo_porta === "espelho"),
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round((L / Math.max(cfg.num_portas, 1)) + 20), // sobreposição
    calcular_comprimento_mm: (_L, A, _P, cfg) => Math.max(150, A - zonaGavetasMm(cfg)),
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: 15,
    direcao_fio: "paralelo_comprimento",
    fita_borda: fitaTotal,
    usa_material: "porta",
  };
}

// ─── VARIANTES DE PORTA DE ARMÁRIO ─────────────────────────────────────────────
// Provençal e veneziana ainda são 1 painel MDF (mesma geometria da dobradiça,
// só muda o acabamento/corte); alumínio-vidro e palha são construção real de
// moldura + miolo (usa_material: "insert" — ver materialInsertDe em
// layout-shared.ts). Todas abrem por dobradiça — regraDobradicas() já cobre.

/**
 * Porta usinada (provençal): mesmo painel da dobradiça, mas com regra_nome
 * próprio pra aparecer identificada no plano de corte/CSV (o operador de CNC
 * precisa saber que essa peça vai pro centro de usinagem antes da fita de
 * borda). Custo do serviço de usinagem entra como ferragem (ver
 * regraUsinagemProvencal) — não modelamos o desenho exato do rebaixo.
 */
export function regraPortaProvencal(): RegraCorte {
  return {
    nome: "porta_provencal",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "provencal",
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
    calcular_comprimento_mm: (_L, A, _P, cfg) => Math.max(150, A - zonaGavetasMm(cfg)),
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: fitaTotal,
    usa_material: "porta",
    observacao: "Painel usinado (provençal) — enviar pro centro de usinagem antes da fita de borda",
  };
}

const VENEZIANA_LAMINA_MM = 30;
const VENEZIANA_GAP_MM = 15;

/** Porta veneziana: lâminas horizontais preenchendo cada folha (mesma técnica de regraRipa, orientada por porta). */
export function regraPortaVeneziana(): RegraCorte {
  return {
    nome: "porta_veneziana",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "veneziana",
    // comprimento da lâmina = largura da folha; "largura" da peça é a altura de cada lâmina
    calcular_largura_mm: () => VENEZIANA_LAMINA_MM,
    calcular_comprimento_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
    calcular_quantidade: (_L, A, _P, cfg) => {
      const alturaUtil = Math.max(150, A - zonaGavetasMm(cfg));
      const passo = VENEZIANA_LAMINA_MM + VENEZIANA_GAP_MM;
      const porFolha = Math.max(1, Math.floor((alturaUtil + VENEZIANA_GAP_MM) / passo));
      return porFolha * cfg.num_portas;
    },
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: (): FitaBorda => ({ esquerda: true, direita: true, topo: false, base: false }),
    usa_material: "porta",
    observacao: "Lâminas horizontais — quantidade = (altura útil ÷ (lâmina+vão)) × nº de portas",
  };
}

const ALUMINIO_MOLDURA_MM = 30;

/** Miolo de vidro (porta alumínio-vidro) — 1 peça por folha, dimensionada pro vão dentro da moldura de alumínio. */
export function regraPortaAluminioVidro(): RegraCorte {
  return {
    nome: "vidro_porta",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "aluminio_vidro",
    calcular_largura_mm: (L, _A, _P, cfg) =>
      Math.max(50, Math.round(L / Math.max(cfg.num_portas, 1)) - 2 * ALUMINIO_MOLDURA_MM),
    calcular_comprimento_mm: (_L, A, _P, cfg) =>
      Math.max(50, Math.max(150, A - zonaGavetasMm(cfg)) - 2 * ALUMINIO_MOLDURA_MM),
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: 6,
    direcao_fio: "indiferente",
    fita_borda: semFita,
    usa_material: "insert",
    observacao: "Vidro temperado — corte e lapidação por conta do vidraceiro, não entra no nesting de MDF",
  };
}

/** Moldura de alumínio (ferragem, não peça de MDF) — perímetro da folha em metros lineares. */
export function regraMolduraAluminioVidro(): RegraFerragem {
  return {
    tipo: "perfil_aluminio_porta_1m",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "aluminio_vidro",
    calcular_quantidade: (L, A, _P, cfg) => {
      const larguraFolha = L / Math.max(cfg.num_portas, 1);
      const alturaFolha = Math.max(150, A - zonaGavetasMm(cfg));
      const perimetroM = (2 * (larguraFolha + alturaFolha)) / 1000;
      return Math.round(perimetroM * cfg.num_portas * 10) / 10;
    },
    descricao_tecnica: "Perímetro da moldura de alumínio (metros lineares) × nº de folhas",
  };
}

const PALHA_MOLDURA_MM = 50;

/** Moldura de MDF da porta de palha (2 travessas horizontais + 2 montantes verticais, por folha) + miolo de palha. */
export function regraPortaPalha(): RegraCorte[] {
  const larguraFolha = (L: number, cfg: { num_portas: number }) => L / Math.max(cfg.num_portas, 1);
  const alturaFolha = (A: number, cfg: { num_gavetas: number; altura_gaveta_cm?: number }) =>
    Math.max(150, A - zonaGavetasMm(cfg));
  const ativa = (cfg: { num_portas: number; tipo_porta: string }) => cfg.num_portas > 0 && cfg.tipo_porta === "palha";

  return [
    {
      nome: "moldura_palha_travessa",
      grupo: "porta",
      ativa_quando: ativa,
      calcular_largura_mm: (L, _A, _P, cfg) => Math.round(larguraFolha(L, cfg)),
      calcular_comprimento_mm: () => PALHA_MOLDURA_MM,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas * 2, // topo + base, por folha
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaFrente,
      usa_material: "corpo",
      observacao: "Travessas (topo/base) da moldura da porta de palha",
    },
    {
      nome: "moldura_palha_montante",
      grupo: "porta",
      ativa_quando: ativa,
      calcular_largura_mm: () => PALHA_MOLDURA_MM,
      calcular_comprimento_mm: (_L, A, _P, cfg) => Math.round(alturaFolha(A, cfg) - 2 * PALHA_MOLDURA_MM),
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas * 2, // esquerda + direita, por folha
      espessura_mm: ESP,
      direcao_fio: "paralelo_comprimento",
      fita_borda: fitaFrente,
      usa_material: "corpo",
      observacao: "Montantes (esquerda/direita) da moldura da porta de palha",
    },
    {
      nome: "palha_insert",
      grupo: "porta",
      ativa_quando: ativa,
      calcular_largura_mm: (L, _A, _P, cfg) => Math.max(50, Math.round(larguraFolha(L, cfg)) - 2 * PALHA_MOLDURA_MM),
      calcular_comprimento_mm: (_L, A, _P, cfg) => Math.max(50, Math.round(alturaFolha(A, cfg)) - 2 * PALHA_MOLDURA_MM),
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
      espessura_mm: 3,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "insert",
      observacao: "Tela de palha/rattan — fixada por dentro da moldura de MDF",
    },
  ];
}

/** Serviço de usinagem CNC da porta provençal (custo, não peça física). */
export function regraUsinagemProvencal(): RegraFerragem {
  return {
    tipo: "usinagem_provencal",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "provencal",
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    descricao_tecnica: "Serviço de usinagem/rebaixo CNC — 1 por folha de porta provençal",
  };
}

// ─── REGRA DE RIPADO ──────────────────────────────────────────────────────────

/** Largura padrão de cada ripa (mm) quando o projeto não especifica. */
const RIPA_LARGURA_PADRAO_MM = 40;
/** Vão (mm) entre ripas consecutivas — visual "ripado" com respiro. */
const RIPA_GAP_MM = 20;
const ESPESSURAS_MDF_VALIDAS: readonly EspessuraMDF[] = [3, 6, 9, 12, 15, 18, 25];

function espessuraRipaValida(mm?: number): EspessuraMDF {
  return mm && (ESPESSURAS_MDF_VALIDAS as readonly number[]).includes(mm) ? (mm as EspessuraMDF) : 15;
}

/**
 * Peças individuais de ripa (sarrafo) — usado em painéis ripados decorativos.
 * Gera N peças estreitas cobrindo a largura do painel (largura da ripa + vão
 * entre elas), cada uma com o comprimento total da altura do painel.
 * `cfg.ripa_largura_mm`/`ripa_espessura_mm` sobrescrevem os defaults.
 */
export function regraRipa(): RegraCorte {
  return {
    nome: "ripa",
    grupo: "detalhe",
    ativa_quando: (cfg) => cfg.tem_ripado,
    calcular_largura_mm: (_L, _A, _P, cfg) => cfg.ripa_largura_mm ?? RIPA_LARGURA_PADRAO_MM,
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (L, _A, _P, cfg) => {
      const largura = cfg.ripa_largura_mm ?? RIPA_LARGURA_PADRAO_MM;
      const passo = largura + RIPA_GAP_MM;
      // +RIPA_GAP_MM no numerador: a última ripa não precisa de vão depois dela.
      return Math.max(1, Math.floor((L + RIPA_GAP_MM) / passo));
    },
    espessura_mm: (cfg) => espessuraRipaValida(cfg.ripa_espessura_mm),
    direcao_fio: "paralelo_comprimento",
    fita_borda: (): FitaBorda => ({ esquerda: true, direita: true, topo: false, base: false }),
    usa_material: "corpo",
    observacao: "Ripas individuais — quantidade = largura do painel ÷ (largura da ripa + vão entre ripas)",
  };
}

// ─── REGRAS DE GAVETA ─────────────────────────────────────────────────────────

/** Conjunto de peças de gaveta: frente, 2 laterais, traseira, fundo. */
export function regrasGaveta(): RegraCorte[] {
  return [
    {
      nome: "frente_gaveta",
      grupo: "gaveta",
      ativa_quando: (cfg) => cfg.num_gavetas > 0,
      calcular_largura_mm: (L) => L - 4,
      // altura configurável por gaveta; se não houver porta, gavetas preenchem o
      // corpo (divide a altura útil); com porta, usa a altura definida da gaveta.
      calcular_comprimento_mm: (_L, A, _P, cfg) => cfg.num_portas > 0
        ? alturaGavetaMm(cfg) - 4
        : Math.round((A - 2 * ESP) / Math.max(cfg.num_gavetas, 1)) - 4,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaTotal,
      usa_material: "porta",
    },
    {
      nome: "lateral_gaveta",
      grupo: "gaveta",
      ativa_quando: (cfg) => cfg.num_gavetas > 0,
      calcular_largura_mm: (_L, _A, P) => P - 2 * ESP,
      calcular_comprimento_mm: () => 110,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas * 2,
      espessura_mm: ESP,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "corpo",
    },
    {
      nome: "traseira_gaveta",
      grupo: "gaveta",
      ativa_quando: (cfg) => cfg.num_gavetas > 0,
      calcular_largura_mm: (L) => L - 2 * ESP - 26,
      calcular_comprimento_mm: () => 110,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
      espessura_mm: ESP,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "corpo",
    },
    {
      nome: "fundo_gaveta",
      grupo: "gaveta",
      ativa_quando: (cfg) => cfg.num_gavetas > 0,
      calcular_largura_mm: (L) => L - 2 * ESP - 26,
      calcular_comprimento_mm: (_L, _A, P) => P - 2 * ESP,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
      espessura_mm: FUNDO,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "fundo",
    },
  ];
}

// ─── ACABAMENTOS: RODAPÉ, RODA-TETO, ENGROSSO (dupla chapa) ───────────────────
// Regras de marcenaria centralizadas — geram peças reais no plano de corte e
// no orçamento. Ativadas por flags de config, então a marcenaria pode ligar/
// desligar por projeto no orçamento/desenho.

const ALTURA_RODAPE_PADRAO_MM = 100;      // rodapé clipado 10cm
const ALTURA_RODA_TETO_PADRAO_MM = 50;    // moldura de roda-teto 5cm

/**
 * Rodapé (frame em U): sempre 3 ripas — 1 frente (largura = largura do móvel) +
 * 2 laterais (largura = profundidade do móvel), todas com a altura do rodapé
 * (10cm padrão). Só onde há pés — aéreos/painéis/nichos não têm.
 */
export function regrasRodape(): RegraCorte[] {
  const altura = (cfg: { altura_rodape_cm?: number }) => (cfg.altura_rodape_cm ?? 10) * 10 || ALTURA_RODAPE_PADRAO_MM;
  const ativa = (cfg: { tem_rodape: boolean; tem_pes_regulaveis: boolean }) => cfg.tem_rodape && cfg.tem_pes_regulaveis;
  return [
    {
      nome: "rodape_frente",
      grupo: "detalhe",
      ativa_quando: ativa,
      calcular_largura_mm: (L) => L,
      calcular_comprimento_mm: (_L, _A, _P, cfg) => altura(cfg),
      calcular_quantidade: () => 1,
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaFrente,
      usa_material: "corpo",
      observacao: "Rodapé — frente (largura do móvel)",
    },
    {
      nome: "rodape_lateral",
      grupo: "detalhe",
      ativa_quando: ativa,
      calcular_largura_mm: (_L, _A, P) => P,
      calcular_comprimento_mm: (_L, _A, _P, cfg) => altura(cfg),
      calcular_quantidade: () => 2,
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaFrente,
      usa_material: "corpo",
      observacao: "Rodapé — 2 laterais (profundidade do móvel)",
    },
  ];
}

/**
 * Roda-teto (frame em U): 3 ripas — 1 frente (largura do móvel) + 2 laterais
 * (profundidade do móvel), com a altura do roda-teto (10cm padrão).
 */
export function regrasRodaTeto(): RegraCorte[] {
  const altura = (cfg: { altura_roda_teto_cm?: number }) => (cfg.altura_roda_teto_cm ?? 10) * 10 || ALTURA_RODA_TETO_PADRAO_MM;
  const fitaBase = (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: true });
  return [
    {
      nome: "roda_teto_frente",
      grupo: "detalhe",
      ativa_quando: (cfg) => cfg.tem_roda_teto,
      calcular_largura_mm: (L) => L,
      calcular_comprimento_mm: (_L, _A, _P, cfg) => altura(cfg),
      calcular_quantidade: () => 1,
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaBase,
      usa_material: "porta",
      observacao: "Roda-teto — frente (largura do móvel)",
    },
    {
      nome: "roda_teto_lateral",
      grupo: "detalhe",
      ativa_quando: (cfg) => cfg.tem_roda_teto,
      calcular_largura_mm: (_L, _A, P) => P,
      calcular_comprimento_mm: (_L, _A, _P, cfg) => altura(cfg),
      calcular_quantidade: () => 2,
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaBase,
      usa_material: "porta",
      observacao: "Roda-teto — 2 laterais (profundidade do móvel)",
    },
  ];
}

/**
 * Engrosso de dupla chapa (15+15 = 30mm): 2ª chapa no tampo e/ou nas frentes
 * aparentes. Cada peça duplicada adiciona sua área de material ao corte.
 */
export function regrasEngrosso(): RegraCorte[] {
  return [
    {
      nome: "engrosso_tampo",
      grupo: "detalhe",
      // desligado quando o tampo é de pedra (granito/quartzo) — não há chapa MDF
      ativa_quando: (cfg) => cfg.tem_engrosso_tampo === true && cfg.tampo_pedra !== true,
      calcular_largura_mm: (L) => L - 2 * ESP,
      calcular_comprimento_mm: (_L, _A, P) => P,
      calcular_quantidade: () => 1,
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaFrente,
      usa_material: "corpo",
      observacao: "2ª chapa do tampo (engrosso 30mm)",
    },
    {
      nome: "engrosso_porta",
      grupo: "detalhe",
      // Só em portas de abrir/basculante lisas. Correr/espelho já são 18mm e
      // deslizam em trilho — não recebem engrosso.
      ativa_quando: (cfg) =>
        cfg.tem_engrosso_frentes === true &&
        cfg.num_portas > 0 &&
        (cfg.tipo_porta === "dobradica" || cfg.tipo_porta === "basculante"),
      calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
      calcular_comprimento_mm: (_L, A) => A,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
      espessura_mm: ESP,
      direcao_fio: "paralelo_comprimento",
      fita_borda: semFita,
      usa_material: "porta",
      observacao: "2ª chapa da porta (frente 30mm)",
    },
    {
      nome: "engrosso_frente_gaveta",
      grupo: "detalhe",
      ativa_quando: (cfg) => cfg.tem_engrosso_frentes === true && cfg.num_gavetas > 0,
      calcular_largura_mm: (L) => L - 4,
      calcular_comprimento_mm: (_L, A, _P, cfg) => (cfg.num_portas > 0
        ? alturaGavetaMm(cfg)
        : Math.round((A - 2 * ESP) / Math.max(cfg.num_gavetas, 1))) - 4,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: semFita,
      usa_material: "porta",
      observacao: "2ª chapa da frente de gaveta (30mm)",
    },
    // Engrosso das laterais APARENTES (2ª chapa de 15mm = 30mm). Só nas pontas
    // expostas do corrido; laterais internas (com módulo ao lado) ficam 15mm.
    {
      nome: "engrosso_lateral_esq",
      grupo: "detalhe",
      ativa_quando: (cfg) => cfg.engrosso_lat_esq === true,
      calcular_largura_mm: (_L, _A, P) => P,
      calcular_comprimento_mm: (_L, A) => A,
      calcular_quantidade: () => 1,
      espessura_mm: ESP,
      direcao_fio: "paralelo_comprimento",
      fita_borda: fitaFrente,
      usa_material: "corpo",
      observacao: "2ª chapa da lateral esquerda aparente (30mm)",
    },
    {
      nome: "engrosso_lateral_dir",
      grupo: "detalhe",
      ativa_quando: (cfg) => cfg.engrosso_lat_dir === true,
      calcular_largura_mm: (_L, _A, P) => P,
      calcular_comprimento_mm: (_L, A) => A,
      calcular_quantidade: () => 1,
      espessura_mm: ESP,
      direcao_fio: "paralelo_comprimento",
      fita_borda: fitaFrente,
      usa_material: "corpo",
      observacao: "2ª chapa da lateral direita aparente (30mm)",
    },
  ];
}

/**
 * Apoio central (testeira frontal) para prateleira com vão livre > 80cm.
 * Como o padrão é sempre 15mm (não subimos para 18mm), reforçamos a prateleira
 * longa com uma testeira colada na frente — resiste ao empeno sem chapa grossa.
 */
export function regraApoioCentralPrateleira(): RegraCorte {
  return {
    nome: "reforco_prateleira",
    grupo: "detalhe",
    ativa_quando: (cfg) => cfg.num_prateleiras > 0,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: () => 60,   // testeira de 6cm
    // só quando o vão interno passa de 80cm (senão quantidade 0 = sem peça)
    calcular_quantidade: (L, _A, _P, cfg) => (L - 2 * ESP > 800 ? cfg.num_prateleiras : 0),
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: fitaFrente,
    usa_material: "corpo",
    observacao: "Testeira de reforço (prateleira com vão > 80cm)",
  };
}

/**
 * Reforço em volta de recorte de cuba/pia ou cooktop no tampo: 2 travessas
 * (frente e fundo do recorte). Também sinaliza a usinagem do recorte.
 */
export function regraReforcoRecorte(): RegraCorte {
  return {
    nome: "reforco_recorte",
    grupo: "detalhe",
    ativa_quando: (cfg) => cfg.tem_recorte_cuba === true || cfg.tem_recorte_cooktop === true,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: () => 100,  // travessa de 10cm
    calcular_quantidade: () => 2,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: semFita,
    usa_material: "corpo",
    observacao: "Travessa de reforço do recorte (cuba/cooktop)",
  };
}

/** Conjunto completo de acabamentos (rodapé + roda-teto + engrossos + reforços). */
export function regrasAcabamento(): RegraCorte[] {
  return [
    ...regrasRodape(),
    ...regrasRodaTeto(),
    ...regrasEngrosso(),
    regraApoioCentralPrateleira(),
    regraReforcoRecorte(),
  ];
}

// ─── FERRAGENS COMUNS ─────────────────────────────────────────────────────────

const TIPOS_PORTA_COM_DOBRADICA = new Set([
  "dobradica", "provencal", "veneziana", "aluminio_vidro", "palha",
]);

/** Dobradiças: 2 por porta até 150cm, 3 até 200cm, 4 acima. Cobre toda variante de porta que abre por dobradiça (só muda a construção do painel). */
export function regraDobradicas(): RegraFerragem {
  return {
    tipo: "dobradica_35mm_110grau",
    ativa_quando: (cfg) => TIPOS_PORTA_COM_DOBRADICA.has(cfg.tipo_porta) && cfg.num_portas > 0,
    calcular_quantidade: (_L, A, _P, cfg) => cfg.num_portas * dobradicasPorAlturaMm(A),
    descricao_tecnica: "Nº de dobradiças por altura (base): 2 ≤90cm, 3 ≤200cm, 4 ≤240cm, 5 acima",
  };
}

/** Corrediça telescópica por gaveta. */
export function regraCorredicaGaveta(): RegraFerragem {
  return {
    tipo: "corredicao_tandem_400mm",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    descricao_tecnica: "1 par de corrediças por gaveta",
  };
}

/** Trilho de porta de correr (1 par por módulo com portas de correr). */
export function regraTrilhoCorrer(): RegraFerragem {
  return {
    tipo: "corredicao_lateral_porta",
    ativa_quando: (cfg) => cfg.tipo_porta === "correr" || cfg.tipo_porta === "espelho",
    calcular_quantidade: () => 1,
    descricao_tecnica: "1 kit de trilho superior + inferior por módulo de correr",
  };
}

/** Cabideiro (barra) — quando o módulo tem cabideiro. */
export function regraCabideiro(): RegraFerragem {
  return {
    tipo: "cabideiro_simples",
    ativa_quando: (cfg) => cfg.tem_cabideiro,
    calcular_quantidade: () => 1,
    descricao_tecnica: "1 barra cabideiro + 2 suportes por módulo",
  };
}

/** Puxadores: 1 por porta + 1 por gaveta. */
export function regraPuxadores(): RegraFerragem {
  return {
    tipo: "puxador_alu_128mm",
    ativa_quando: (cfg) => cfg.tipo_puxador !== "sem" && (cfg.num_portas > 0 || cfg.num_gavetas > 0),
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas + cfg.num_gavetas,
    descricao_tecnica: "1 puxador por porta + 1 por gaveta",
  };
}

/** Conectores minifix: 8 por corpo + 4 por prateleira + 4 por gaveta. */
export function regraMinifix(): RegraFerragem {
  return {
    tipo: "minifix_15mm",
    ativa_quando: () => true,
    calcular_quantidade: (_L, _A, _P, cfg) => 8 + cfg.num_prateleiras * 4 + cfg.num_gavetas * 4,
    descricao_tecnica: "8 por corpo + 4 por prateleira + 4 por gaveta",
  };
}

/** Pés reguláveis: 4 (≤150cm) ou 6 (>150cm). */
export function regraPes(): RegraFerragem {
  return {
    tipo: "ajustador_pe_100mm",
    ativa_quando: (cfg) => cfg.tem_pes_regulaveis,
    calcular_quantidade: (L) => (L > 1500 ? 6 : 4),
    descricao_tecnica: "4 pés (≤150cm) ou 6 (>150cm)",
  };
}
