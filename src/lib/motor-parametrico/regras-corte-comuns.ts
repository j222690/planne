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

const ESP: EspessuraMDF = 15;
const FUNDO: EspessuraMDF = 6;

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
      calcular_largura_mm: (_L, _A, P) => P - FUNDO,
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
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: fitaTotal,
    usa_material: "porta",
  };
}

/** Porta de correr (roupeiros). */
export function regraPortaCorrer(): RegraCorte {
  return {
    nome: "porta_correr",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && (cfg.tipo_porta === "correr" || cfg.tipo_porta === "espelho"),
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round((L / Math.max(cfg.num_portas, 1)) + 20), // sobreposição
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: 18,
    direcao_fio: "paralelo_comprimento",
    fita_borda: fitaTotal,
    usa_material: "porta",
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
      calcular_comprimento_mm: (_L, A, _P, cfg) => Math.round((A - 2 * ESP) / Math.max(cfg.num_gavetas, 1)) - 4,
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
 * Rodapé clipado (frente recuada, encaixado nos pés reguláveis).
 * Só existe onde há pés — módulos de parede (aéreos, painéis, nichos) não têm
 * pés, logo não têm rodapé, mesmo com tem_rodape default true.
 */
export function regraRodape(): RegraCorte {
  return {
    nome: "rodape",
    grupo: "detalhe",
    ativa_quando: (cfg) => cfg.tem_rodape && cfg.tem_pes_regulaveis,
    calcular_largura_mm: (L) => L,
    calcular_comprimento_mm: (_L, _A, _P, cfg) => (cfg.altura_rodape_cm ?? 10) * 10 || ALTURA_RODAPE_PADRAO_MM,
    calcular_quantidade: () => 1,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: fitaFrente,
    usa_material: "corpo",
    observacao: "Rodapé clipado (encaixe nos pés reguláveis)",
  };
}

/** Moldura de roda-teto (acabamento decorativo no topo, até o teto). */
export function regraMolduraRodaTeto(): RegraCorte {
  return {
    nome: "moldura_roda_teto",
    grupo: "detalhe",
    ativa_quando: (cfg) => cfg.tem_roda_teto,
    calcular_largura_mm: (L) => L,
    calcular_comprimento_mm: (_L, _A, _P, cfg) => (cfg.altura_roda_teto_cm ?? 5) * 10 || ALTURA_RODA_TETO_PADRAO_MM,
    calcular_quantidade: () => 1,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: true }),
    usa_material: "porta",
    observacao: "Moldura de roda-teto (arremate decorativo até o teto)",
  };
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
      ativa_quando: (cfg) => cfg.tem_engrosso_tampo === true,
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
      ativa_quando: (cfg) => cfg.tem_engrosso_frentes === true && cfg.num_portas > 0,
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
      calcular_comprimento_mm: (_L, A, _P, cfg) => Math.round((A - 2 * ESP) / Math.max(cfg.num_gavetas, 1)) - 4,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
      espessura_mm: ESP,
      direcao_fio: "paralelo_largura",
      fita_borda: semFita,
      usa_material: "porta",
      observacao: "2ª chapa da frente de gaveta (30mm)",
    },
  ];
}

/** Conjunto completo de acabamentos (rodapé + roda-teto + engrossos). */
export function regrasAcabamento(): RegraCorte[] {
  return [regraRodape(), regraMolduraRodaTeto(), ...regrasEngrosso()];
}

// ─── FERRAGENS COMUNS ─────────────────────────────────────────────────────────

/** Dobradiças: 2 por porta até 150cm, 3 até 200cm, 4 acima. */
export function regraDobradicas(): RegraFerragem {
  return {
    tipo: "dobradica_35mm_110grau",
    ativa_quando: (cfg) => cfg.tipo_porta === "dobradica" && cfg.num_portas > 0,
    calcular_quantidade: (_L, A, _P, cfg) => {
      const porPorta = A > 2000 ? 4 : A > 1500 ? 3 : 2;
      return cfg.num_portas * porPorta;
    },
    descricao_tecnica: "2 dobradiças (≤150cm), 3 (≤200cm) ou 4 (>200cm) por porta",
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
