// ARQUIVO GERADO por scripts/bundle-motor.mjs — NÃO EDITAR.
// Edite src/server/motor-entry.ts e os módulos do motor; rode npm run build.

// src/lib/motor-parametrico/biblioteca-cozinha.ts
var BASE_PROFUNDIDADE_CM = 55;
var BASE_ALTURA_CM = 72;
var AEREO_PROFUNDIDADE_CM = 33;
var AEREO_ALTURA_CM = 40;
var ESP = 15;
var FUNDO = 6;
var regrasCorpoBase = [
  {
    nome: "lateral",
    grupo: "corpo",
    ativa_quando: () => true,
    calcular_largura_mm: (_L, _A, P) => P,
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: () => 2,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: () => ({ esquerda: false, direita: false, topo: true, base: false }),
    usa_material: "corpo"
  },
  {
    nome: "teto",
    grupo: "corpo",
    ativa_quando: () => true,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: (_L, _A, P) => P,
    calcular_quantidade: () => 1,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: () => ({ esquerda: false, direita: false, topo: true, base: false }),
    usa_material: "corpo"
  },
  {
    nome: "base",
    grupo: "corpo",
    ativa_quando: () => true,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: (_L, _A, P) => P,
    calcular_quantidade: () => 1,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo"
  },
  {
    nome: "prateleira",
    grupo: "corpo",
    ativa_quando: (cfg) => cfg.num_prateleiras > 0,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: (_L, _A, P) => P - FUNDO,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_prateleiras,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: () => ({ esquerda: false, direita: false, topo: true, base: false }),
    usa_material: "corpo"
  },
  {
    nome: "engrosso",
    grupo: "detalhe",
    ativa_quando: () => true,
    calcular_largura_mm: () => 50,
    calcular_comprimento_mm: (_L, A) => A - 2 * ESP,
    calcular_quantidade: () => 4,
    espessura_mm: ESP,
    direcao_fio: "indiferente",
    fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo",
    observacao: "Refor\xE7o frontal para batida das portas"
  },
  {
    nome: "fundo",
    grupo: "fundo",
    ativa_quando: (cfg) => cfg.tem_fundo,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: (_L, A) => A - 2 * ESP,
    calcular_quantidade: () => 1,
    espessura_mm: FUNDO,
    direcao_fio: "indiferente",
    fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "fundo"
  },
  {
    nome: "porta_dobradica",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "dobradica",
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: () => ({ esquerda: true, direita: true, topo: true, base: true }),
    usa_material: "porta"
  },
  {
    nome: "porta_correr",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "correr",
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: () => ({ esquerda: true, direita: true, topo: true, base: true }),
    usa_material: "porta"
  },
  // Gavetas
  {
    nome: "frente_gaveta",
    grupo: "gaveta",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round((L - 2 * ESP) / Math.max(cfg.num_gavetas, 1)),
    calcular_comprimento_mm: () => 160,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    espessura_mm: ESP,
    direcao_fio: "indiferente",
    fita_borda: () => ({ esquerda: true, direita: true, topo: true, base: true }),
    usa_material: "porta"
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
    fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo"
  },
  {
    nome: "traseira_gaveta",
    grupo: "gaveta",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round((L - 2 * ESP) / Math.max(cfg.num_gavetas, 1)) - 2 * ESP,
    calcular_comprimento_mm: () => 110,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    espessura_mm: ESP,
    direcao_fio: "indiferente",
    fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo"
  },
  {
    nome: "fundo_gaveta",
    grupo: "gaveta",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round((L - 2 * ESP) / Math.max(cfg.num_gavetas, 1)) - 2 * ESP,
    calcular_comprimento_mm: (_L, _A, P) => P - 2 * ESP,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    espessura_mm: FUNDO,
    direcao_fio: "indiferente",
    fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "fundo"
  }
];
var regrasDobradica = [
  {
    tipo: "dobradica_35mm_110grau",
    ativa_quando: (cfg) => cfg.tipo_porta === "dobradica" && cfg.num_portas > 0,
    calcular_quantidade: (_L, A, _P, cfg) => cfg.num_portas * (A > 1500 ? 3 : 2),
    descricao_tecnica: "2 dobradi\xE7as por porta (\u2264150cm) ou 3 (>150cm)"
  }
];
var regrasCorredica = [
  {
    tipo: "corredicao_lateral_porta",
    ativa_quando: (cfg) => cfg.tipo_porta === "correr" && cfg.num_portas > 0,
    calcular_quantidade: (_L, _A, _P, cfg) => Math.ceil(cfg.num_portas / 2),
    descricao_tecnica: "1 par de corredi\xE7as por 2 portas de correr"
  }
];
var regrasPuxador = [
  {
    tipo: "puxador_perfil_alu_1200mm",
    ativa_quando: (cfg) => cfg.tipo_puxador === "perfil_aluminio",
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas + cfg.num_gavetas,
    descricao_tecnica: "1 puxador por porta + 1 por gaveta"
  },
  {
    tipo: "puxador_alu_128mm",
    ativa_quando: (cfg) => cfg.tipo_puxador === "puxador_alu",
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas + cfg.num_gavetas,
    descricao_tecnica: "1 puxador 128mm por porta + 1 por gaveta"
  }
];
var regrasCorredicas = [
  {
    tipo: "corredicao_tandem_300mm",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    descricao_tecnica: "1 par de corredi\xE7as por gaveta"
  }
];
var regrasMinifix = [
  {
    tipo: "minifix_15mm",
    ativa_quando: () => true,
    calcular_quantidade: (_L, _A, _P, cfg) => 8 + cfg.num_prateleiras * 4 + cfg.num_gavetas * 4,
    descricao_tecnica: "8 por corpo + 4 por prateleira + 4 por gaveta"
  }
];
var regrasPes = [
  {
    tipo: "ajustador_pe_100mm",
    ativa_quando: (cfg) => cfg.tem_pes_regulaveis,
    calcular_quantidade: (L) => L > 1500 ? 6 : 4,
    descricao_tecnica: "4 p\xE9s (m\xF3dulo \u2264150cm) ou 6 p\xE9s (>150cm)"
  }
];
var cfgBase = {
  tipo_porta: "dobradica",
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
  ferragem: "nacional",
  tipo_puxador: "perfil_aluminio"
};
var cfgAereo = {
  ...cfgBase,
  num_portas: 2,
  num_prateleiras: 1,
  tem_pes_regulaveis: false
};
function criarModuloBase(largura_cm) {
  return {
    id: `base_${largura_cm}`,
    codigo: `base_${largura_cm}`,
    nome: `Gabinete Base ${largura_cm}cm`,
    versao: 1,
    categorias: ["cozinha"],
    tipo: "base",
    largura: { min_cm: largura_cm, max_cm: largura_cm, padrao_cm: largura_cm, passo_cm: 0 },
    altura: { min_cm: BASE_ALTURA_CM, max_cm: BASE_ALTURA_CM, padrao_cm: BASE_ALTURA_CM, passo_cm: 0 },
    profundidade: { min_cm: BASE_PROFUNDIDADE_CM, max_cm: BASE_PROFUNDIDADE_CM, padrao_cm: BASE_PROFUNDIDADE_CM, passo_cm: 0 },
    configuracao_padrao: { ...cfgBase, num_portas: largura_cm <= 40 ? 1 : 2 },
    limites: {
      num_portas: { min: 1, max: 4 },
      num_gavetas: { min: 0, max: 3 },
      num_prateleiras: { min: 0, max: 4 },
      tipos_porta_validos: ["dobradica", "correr"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false
    },
    regras_pecas: regrasCorpoBase,
    regras_ferragens: [
      ...regrasDobradica,
      ...regrasCorredica,
      ...regrasPuxador,
      ...regrasCorredicas,
      ...regrasMinifix,
      ...regrasPes
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    norma_referencia: "Altura padr\xE3o bancada cozinha 90cm (piso + rodap\xE9 + base + tampo)",
    altura_trabalho_cm: 90,
    ativo: true,
    publicado_em: "2026-06-04T00:00:00Z"
  };
}
function criarModuloAereo(largura_cm, altura_cm = AEREO_ALTURA_CM) {
  return {
    id: `aereo_${largura_cm}_${altura_cm}`,
    codigo: `aereo_${largura_cm}`,
    nome: `Arm\xE1rio A\xE9reo ${largura_cm}cm`,
    versao: 1,
    categorias: ["cozinha"],
    tipo: "aereo",
    largura: { min_cm: largura_cm, max_cm: largura_cm, padrao_cm: largura_cm, passo_cm: 0 },
    altura: { min_cm: altura_cm, max_cm: altura_cm, padrao_cm: altura_cm, passo_cm: 0 },
    profundidade: { min_cm: AEREO_PROFUNDIDADE_CM, max_cm: AEREO_PROFUNDIDADE_CM, padrao_cm: AEREO_PROFUNDIDADE_CM, passo_cm: 0 },
    configuracao_padrao: { ...cfgAereo, num_portas: largura_cm <= 40 ? 1 : 2 },
    limites: {
      num_portas: { min: 1, max: 4 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 0, max: 3 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: false
    },
    regras_pecas: regrasCorpoBase,
    regras_ferragens: [
      ...regrasDobradica,
      ...regrasPuxador,
      ...regrasMinifix
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 150,
      // início do aéreo a 150cm do piso
      folga_teto_min_cm: 10,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    ativo: true,
    publicado_em: "2026-06-04T00:00:00Z"
  };
}
var MODULOS_BASE_COZINHA = [
  criarModuloBase(30),
  criarModuloBase(40),
  criarModuloBase(45),
  criarModuloBase(50),
  criarModuloBase(60),
  criarModuloBase(70),
  criarModuloBase(80),
  criarModuloBase(90)
];
var MODULOS_AEREOS_COZINHA = [
  criarModuloAereo(30),
  criarModuloAereo(40),
  criarModuloAereo(45),
  criarModuloAereo(50),
  criarModuloAereo(60),
  criarModuloAereo(70),
  criarModuloAereo(80),
  criarModuloAereo(90)
];
var BIBLIOTECA_COZINHA = {
  ...Object.fromEntries(MODULOS_BASE_COZINHA.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_AEREOS_COZINHA.map((m) => [m.codigo, m]))
};
function getTemplateBase(largura_cm) {
  return MODULOS_BASE_COZINHA.find((m) => m.largura.padrao_cm === largura_cm);
}
function getTemplateAereo(largura_cm) {
  return MODULOS_AEREOS_COZINHA.find((m) => m.largura.padrao_cm === largura_cm);
}

// src/lib/motor-parametrico/rule-engine.ts
var CIRCULACAO_MINIMA_CM = 80;
var CIRCULACAO_CONFORTAVEL_CM = 90;
var LARGURA_MODULO_MIN_CM = 30;
var LARGURA_MODULO_MAX_CM = 90;
var APROVEITAMENTO_MIN_PCT = 85;
var FOLGA_TETO_MIN_CM = 5;
var BASE_PROFUNDIDADE_CM2 = 55;
var PESO_ERRO = 25;
var PESO_ALERTA = 8;
function validarProjeto(projeto) {
  const ambiente = projeto.ambiente;
  const modulos = projeto.modulos;
  const regras = [
    regraCirculacaoMinima,
    regraModuloDentroParede,
    regraModuloInvadePorta,
    regraBaseSobJanelaBaixa,
    regraAereoColideTeto,
    regraLarguraModuloValida,
    regraAproveitamentoParede,
    regraPontoHidraulicoAtendido
  ];
  const violacoes = regras.flatMap((regra) => regra(projeto, ambiente, modulos));
  const erros = violacoes.filter((v) => v.severidade === "erro").length;
  const alertas = violacoes.filter((v) => v.severidade === "alerta").length;
  const infos = violacoes.filter((v) => v.severidade === "info").length;
  const score = Math.max(0, 100 - erros * PESO_ERRO - alertas * PESO_ALERTA);
  const status = erros > 0 ? "reprovado" : alertas > 0 ? "aprovado_com_alertas" : "aprovado";
  return {
    status,
    score,
    violacoes,
    resumo: {
      erros,
      alertas,
      infos,
      total_regras_avaliadas: regras.length
    },
    avaliado_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function comprimentoParede(ambiente, parede) {
  return ambiente.paredes[parede].comprimento_cm;
}
function dimensaoFrente(ambiente, parede) {
  return parede === "top" || parede === "bottom" ? ambiente.dimensoes.profundidade_cm : ambiente.dimensoes.largura_cm;
}
function sobrepoe(a1, a2, b1, b2) {
  return a1 < b2 && b1 < a2;
}
function paredeDosModulos(modulos) {
  const base = modulos.find((m) => isBase(m));
  return base ? base.parede : null;
}
function isBase(m) {
  return m.modulo_template_codigo.startsWith("base_");
}
function isAereo(m) {
  return m.modulo_template_codigo.startsWith("aereo_");
}
function regraCirculacaoMinima(_p, ambiente, modulos) {
  const parede = paredeDosModulos(modulos);
  if (!parede) return [];
  const frente = dimensaoFrente(ambiente, parede);
  const circulacao = frente - BASE_PROFUNDIDADE_CM2;
  if (circulacao < CIRCULACAO_MINIMA_CM) {
    return [{
      regra: "circulacao_minima",
      severidade: "erro",
      mensagem: `Circula\xE7\xE3o de ${circulacao}cm \xE9 menor que o m\xEDnimo de ${CIRCULACAO_MINIMA_CM}cm. O ambiente \xE9 estreito demais para a profundidade dos gabinetes (${BASE_PROFUNDIDADE_CM2}cm).`,
      valor_encontrado: circulacao,
      valor_esperado: CIRCULACAO_MINIMA_CM
    }];
  }
  if (circulacao < CIRCULACAO_CONFORTAVEL_CM) {
    return [{
      regra: "circulacao_minima",
      severidade: "alerta",
      mensagem: `Circula\xE7\xE3o de ${circulacao}cm est\xE1 abaixo do recomendado (${CIRCULACAO_CONFORTAVEL_CM}cm). Funcional, mas apertado para dois usu\xE1rios simult\xE2neos.`,
      valor_encontrado: circulacao,
      valor_esperado: CIRCULACAO_CONFORTAVEL_CM
    }];
  }
  return [];
}
function regraModuloDentroParede(_p, ambiente, modulos) {
  const violacoes = [];
  for (const m of modulos) {
    const comp = comprimentoParede(ambiente, m.parede);
    const fim = m.posicao_x_cm + m.largura_cm;
    if (fim > comp + 0.5) {
      violacoes.push({
        regra: "modulo_dentro_parede",
        severidade: "erro",
        mensagem: `M\xF3dulo "${m.nome_display}" termina em ${fim}cm mas a parede tem s\xF3 ${comp}cm. O m\xF3dulo ultrapassa o limite f\xEDsico.`,
        modulo_id: m.id,
        valor_encontrado: fim,
        valor_esperado: comp
      });
    }
  }
  return violacoes;
}
function regraModuloInvadePorta(_p, ambiente, modulos) {
  const violacoes = [];
  for (const m of modulos) {
    const parede = ambiente.paredes[m.parede];
    const portas = parede.aberturas.filter((ab) => ab._tipo === "porta");
    for (const porta of portas) {
      const portaInicio = porta.posicao_cm;
      const portaFim = porta.posicao_cm + porta.largura_cm;
      if (sobrepoe(m.posicao_x_cm, m.posicao_x_cm + m.largura_cm, portaInicio, portaFim)) {
        violacoes.push({
          regra: "modulo_invade_porta",
          severidade: "erro",
          mensagem: `M\xF3dulo "${m.nome_display}" (${m.posicao_x_cm}\u2013${m.posicao_x_cm + m.largura_cm}cm) sobrep\xF5e a porta em ${portaInicio}\u2013${portaFim}cm. Bloqueia a passagem.`,
          modulo_id: m.id,
          valor_encontrado: m.posicao_x_cm,
          valor_esperado: portaFim
        });
      }
    }
  }
  return violacoes;
}
function regraBaseSobJanelaBaixa(_p, ambiente, modulos) {
  const violacoes = [];
  for (const m of modulos) {
    if (!isBase(m)) continue;
    const parede = ambiente.paredes[m.parede];
    const janelasBaixas = parede.aberturas.filter(
      (ab) => ab._tipo === "janela" && ab.bloqueia_base
    );
    for (const j of janelasBaixas) {
      if (sobrepoe(m.posicao_x_cm, m.posicao_x_cm + m.largura_cm, j.posicao_cm, j.posicao_cm + j.largura_cm)) {
        violacoes.push({
          regra: "base_sob_janela_baixa",
          severidade: "alerta",
          mensagem: `Gabinete base "${m.nome_display}" est\xE1 sob janela de peitoril baixo (${j.altura_peitoril_cm}cm). Verifique se a bancada n\xE3o cobre a janela.`,
          modulo_id: m.id,
          valor_encontrado: j.altura_peitoril_cm,
          valor_esperado: 90
        });
      }
    }
  }
  return violacoes;
}
function regraAereoColideTeto(_p, ambiente, modulos) {
  const violacoes = [];
  const teto = ambiente.dimensoes.altura_cm;
  for (const m of modulos) {
    if (!isAereo(m)) continue;
    const topo = m.posicao_y_cm + m.altura_cm;
    if (topo > teto + 0.5) {
      violacoes.push({
        regra: "aereo_colide_teto",
        severidade: "erro",
        mensagem: `Arm\xE1rio a\xE9reo "${m.nome_display}" chega a ${topo}cm mas o p\xE9-direito \xE9 ${teto}cm. N\xE3o cabe na altura dispon\xEDvel.`,
        modulo_id: m.id,
        valor_encontrado: topo,
        valor_esperado: teto
      });
    } else if (topo > teto - FOLGA_TETO_MIN_CM) {
      violacoes.push({
        regra: "aereo_colide_teto",
        severidade: "alerta",
        mensagem: `Arm\xE1rio a\xE9reo "${m.nome_display}" deixa folga de ${teto - topo}cm at\xE9 o teto (recomendado \u2265 ${FOLGA_TETO_MIN_CM}cm para instala\xE7\xE3o).`,
        modulo_id: m.id,
        valor_encontrado: teto - topo,
        valor_esperado: FOLGA_TETO_MIN_CM
      });
    }
  }
  return violacoes;
}
function regraLarguraModuloValida(_p, _a, modulos) {
  const violacoes = [];
  for (const m of modulos) {
    if (m.largura_cm < LARGURA_MODULO_MIN_CM) {
      violacoes.push({
        regra: "largura_modulo_valida",
        severidade: "alerta",
        mensagem: `M\xF3dulo "${m.nome_display}" tem ${m.largura_cm}cm, abaixo do m\xEDnimo pr\xE1tico de ${LARGURA_MODULO_MIN_CM}cm.`,
        modulo_id: m.id,
        valor_encontrado: m.largura_cm,
        valor_esperado: LARGURA_MODULO_MIN_CM
      });
    } else if (m.largura_cm > LARGURA_MODULO_MAX_CM) {
      violacoes.push({
        regra: "largura_modulo_valida",
        severidade: "alerta",
        mensagem: `M\xF3dulo "${m.nome_display}" tem ${m.largura_cm}cm, acima do m\xE1ximo de ${LARGURA_MODULO_MAX_CM}cm (porta larga demais empena com o tempo).`,
        modulo_id: m.id,
        valor_encontrado: m.largura_cm,
        valor_esperado: LARGURA_MODULO_MAX_CM
      });
    }
  }
  return violacoes;
}
function regraAproveitamentoParede(_p, ambiente, modulos) {
  const parede = paredeDosModulos(modulos);
  if (!parede) return [];
  const bases = modulos.filter(isBase);
  if (bases.length === 0) return [];
  const ocupado = bases.reduce((s, m) => s + m.largura_cm, 0);
  const disponivel = comprimentoParede(ambiente, parede);
  const pct = Math.round(ocupado / disponivel * 100);
  if (pct < APROVEITAMENTO_MIN_PCT) {
    return [{
      regra: "aproveitamento_parede",
      severidade: "alerta",
      mensagem: `Aproveitamento de ${pct}% da parede (${ocupado}cm de ${disponivel}cm). Sobra de ${disponivel - ocupado}cm pode ser otimizada.`,
      valor_encontrado: pct,
      valor_esperado: APROVEITAMENTO_MIN_PCT
    }];
  }
  return [];
}
function regraPontoHidraulicoAtendido(_p, ambiente, modulos) {
  const pontos = ambiente.pontos_hidraulicos.filter((ph) => ph.requer_modulo_adjacente);
  if (pontos.length === 0) return [];
  const bases = modulos.filter(isBase);
  const violacoes = [];
  for (const ph of pontos) {
    if (!ph.parede) continue;
    const tolerancia = ph.distancia_max_cm ?? 60;
    const atendido = bases.some((m) => {
      if (m.parede !== ph.parede) return false;
      const centro = m.posicao_x_cm + m.largura_cm / 2;
      const posPonto = ph.posicao.x_cm;
      return Math.abs(centro - posPonto) <= tolerancia + m.largura_cm / 2;
    });
    if (!atendido) {
      violacoes.push({
        regra: "ponto_hidraulico_atendido",
        severidade: "alerta",
        mensagem: `Ponto hidr\xE1ulico (${ph.tipo}) n\xE3o tem gabinete adjacente para receber cuba/pia. Verifique o posicionamento.`,
        valor_esperado: tolerancia
      });
    }
  }
  return violacoes;
}

// src/lib/motor-parametrico/tipos.ts
var TOLERANCIA_SERRA_MM = 3;
var MAX_PECA_MM = 2690;
var AREA_CHAPA_M2 = 2.75 * 1.83;

// src/lib/motor-parametrico/pecas.ts
function calcularPecas(instancia, template) {
  const L = instancia.largura_cm * 10;
  const A = instancia.altura_cm * 10;
  const P = instancia.profundidade_cm * 10;
  const cfg = instancia.configuracao;
  const pecas = [];
  let seq = 0;
  for (const regra of template.regras_pecas) {
    if (!regra.ativa_quando(cfg)) continue;
    const largura = regra.calcular_largura_mm(L, A, P, cfg);
    const comprimento = regra.calcular_comprimento_mm(L, A, P, cfg);
    const quantidade = regra.calcular_quantidade(L, A, P, cfg);
    const espessura = typeof regra.espessura_mm === "function" ? regra.espessura_mm(cfg) : regra.espessura_mm;
    const material = selecionarMaterial(regra.usa_material, instancia);
    for (let q = 0; q < quantidade; q++) {
      const baseId = `${instancia.id}_${regra.nome}_${q}`;
      if (largura > MAX_PECA_MM || comprimento > MAX_PECA_MM) {
        const segmentos = dividirEmSegmentos(
          baseId,
          instancia.id,
          regra.nome,
          largura,
          comprimento,
          espessura,
          material,
          regra,
          cfg,
          instancia
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
          largura_final_mm: largura - TOLERANCIA_SERRA_MM,
          comprimento_final_mm: comprimento - TOLERANCIA_SERRA_MM,
          material,
          direcao_fio: regra.direcao_fio,
          fita_borda: regra.fita_borda(cfg),
          quantidade: 1,
          etiqueta_producao: `${regra.nome.toUpperCase()} \u2014 ${instancia.nome_display}`,
          status: "pendente"
        });
      }
    }
  }
  return pecas;
}
function calcularFerragens(instancia, template) {
  const L = instancia.largura_cm * 10;
  const A = instancia.altura_cm * 10;
  const P = instancia.profundidade_cm * 10;
  const cfg = instancia.configuracao;
  const marca = cfg.ferragem === "blum" ? "blum" : cfg.ferragem === "hafele" ? "hafele" : cfg.ferragem === "grass" ? "grass" : "nacional";
  return template.regras_ferragens.filter((r) => r.ativa_quando(cfg)).map((r) => ({
    id: `${instancia.id}_${r.tipo}`,
    modulo_instanciado_id: instancia.id,
    tipo: r.tipo,
    marca,
    quantidade: r.calcular_quantidade(L, A, P, cfg),
    descricao: r.descricao_tecnica,
    preco_custo_unit: 0,
    // preenchido pelo motor de custos
    preco_venda_unit: 0,
    etiqueta_producao: `${r.tipo} \u2014 ${instancia.nome_display}`
  }));
}
function calcularMetricas(modulos) {
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
    areaFrontal += m.largura_cm * m.altura_cm / 1e4;
    for (const p of m.pecas) {
      numPecas += p.quantidade;
      const areaM22 = p.largura_mm * p.comprimento_mm / 1e6;
      const chapas = areaM22 / AREA_CHAPA_M2;
      if (p.espessura_mm === 18) chapas18 += chapas;
      else if (p.espessura_mm === 15) chapas15 += chapas;
      else if (p.espessura_mm === 6 || p.espessura_mm === 3) chapas6 += chapas;
      const fb = p.fita_borda;
      const l_m = p.largura_mm / 1e3;
      const c_m = p.comprimento_mm / 1e3;
      if (fb.esquerda) metrosFita += c_m;
      if (fb.direita) metrosFita += c_m;
      if (fb.topo) metrosFita += l_m;
      if (fb.base) metrosFita += l_m;
      custoMaterial += areaM22 / AREA_CHAPA_M2 * p.material.preco_custo_chapa;
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
    calculado_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function selecionarMaterial(tipo, instancia) {
  if (tipo === "porta" && instancia.material_porta) return instancia.material_porta;
  if (tipo === "fundo" && instancia.material_fundo) return instancia.material_fundo;
  return instancia.material_corpo;
}
function dividirEmSegmentos(baseId, moduloId, regraNome, largura, comprimento, espessura, material, regra, cfg, instancia) {
  const dim = comprimento > MAX_PECA_MM ? comprimento : largura;
  const isComprimento = comprimento > MAX_PECA_MM;
  const numSeg = Math.ceil(dim / MAX_PECA_MM);
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
      largura_final_mm: segLarg - TOLERANCIA_SERRA_MM,
      comprimento_final_mm: segComp - TOLERANCIA_SERRA_MM,
      material,
      direcao_fio: regra.direcao_fio,
      fita_borda: regra.fita_borda(cfg),
      quantidade: 1,
      etiqueta_producao: `${regraNome.toUpperCase()} (seg ${i + 1}/${numSeg}) \u2014 ${instancia.nome_display}`,
      segmento_de: baseId,
      numero_segmento: i + 1,
      total_segmentos: numSeg,
      observacao_uniao: "Jun\xE7\xE3o com 2 cavilhas 8\xD730mm + minifix 15mm",
      status: "pendente"
    };
  });
}

// src/lib/motor-parametrico/layout-shared.ts
var PRECOS_CHAPA = { 3: 38, 6: 45, 9: 60, 12: 72, 15: 85, 18: 105, 25: 160 };
function criarMaterialPadrao(cor_hex, espessura) {
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
    preco_custo_chapa: PRECOS_CHAPA[espessura] ?? 85,
    preco_venda_chapa: 0
  };
}
function configPadrao(overrides = {}) {
  return {
    tipo_porta: "dobradica",
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
    ferragem: "nacional",
    tipo_puxador: "perfil_aluminio",
    ...overrides
  };
}
function encaixarLarguras(disponivel_cm, larguras_validas = [90, 80, 70, 60, 50, 45, 40, 30], preferido_cm = 60, min_cm = 30) {
  const resultado = [];
  let restante = Math.round(disponivel_cm);
  const max_cm = Math.max(...larguras_validas);
  while (restante >= min_cm) {
    let escolhido;
    if (restante >= preferido_cm) {
      const aposPreferido = restante - preferido_cm;
      if (aposPreferido === 0 || aposPreferido >= min_cm) {
        escolhido = preferido_cm;
      } else {
        const perfeito = larguras_validas.find(
          (l) => l > preferido_cm && l <= restante && (restante - l === 0 || restante - l >= min_cm)
        );
        escolhido = perfeito ?? preferido_cm;
      }
    } else {
      escolhido = larguras_validas.find((l) => l <= restante) ?? restante;
    }
    escolhido = Math.min(escolhido, restante, max_cm);
    resultado.push(escolhido);
    restante -= escolhido;
  }
  if (restante > 0 && resultado.length > 0) {
    const ultimo = resultado[resultado.length - 1];
    if (ultimo + restante <= max_cm) {
      resultado[resultado.length - 1] = ultimo + restante;
    }
  }
  return resultado;
}
function instanciarModulos(larguras, opcoes) {
  const modulos = [];
  let posX = opcoes.inicio_cm;
  let ordem = opcoes.ordemInicial ?? 0;
  for (const largura of larguras) {
    const template = opcoes.getTemplate(largura) ?? opcoes.templateFallback;
    const cfg = opcoes.configDe(largura);
    const rotulo = opcoes.rotuloParede ?? `Parede ${opcoes.parede}`;
    const instancia = {
      id: `${opcoes.prefixo}_${largura}_${opcoes.parede}_${Math.round(posX)}`,
      modulo_template_id: template.id,
      modulo_template_codigo: template.codigo,
      modulo_template_versao: template.versao,
      largura_cm: largura,
      altura_cm: opcoes.altura_cm,
      profundidade_cm: opcoes.profundidade_cm,
      parede: opcoes.parede,
      posicao_x_cm: posX,
      posicao_y_cm: opcoes.posicao_y_cm,
      configuracao: cfg,
      material_corpo: opcoes.materialCorpo,
      material_fundo: opcoes.materialFundo,
      material_porta: opcoes.materialPorta,
      pecas: [],
      ferragens: [],
      nome_display: `${template.nome} \u2014 ${rotulo}`,
      ordem: ordem++
    };
    instancia.pecas = calcularPecas(instancia, template);
    instancia.ferragens = calcularFerragens(instancia, template);
    modulos.push(instancia);
    posX += largura;
  }
  return modulos;
}
function maiorSegmento(ambiente, parede) {
  const validos = ambiente.paredes[parede].segmentos_livres.filter(
    (s) => !s.bloqueado_por_janela_baixa && s.comprimento_cm >= 30
  );
  if (validos.length === 0) return null;
  return validos.reduce((maior, s) => s.comprimento_cm > maior.comprimento_cm ? s : maior);
}
function comprimentoLivre(ambiente, parede) {
  const seg = maiorSegmento(ambiente, parede);
  return seg?.comprimento_cm ?? 0;
}
function paredesPorComprimento(ambiente) {
  const paredes = ["top", "bottom", "left", "right"];
  return paredes.map((p) => ({ p, comp: comprimentoLivre(ambiente, p) })).sort((a, b) => b.comp - a.comp).map((x) => x.p);
}
var PAREDES_ADJACENTES = {
  top: ["left", "right"],
  bottom: ["left", "right"],
  left: ["top", "bottom"],
  right: ["top", "bottom"]
};
function saoAdjacentes(a, b) {
  return PAREDES_ADJACENTES[a].includes(b);
}
var PAREDE_OPOSTA = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};
function montarProjeto(opcoes) {
  const { ambiente, modulos, paredes_usadas, tipo_ambiente, preferencias, avisos } = opcoes;
  const metricas = calcularMetricas(modulos);
  const linear_total_cm = modulos.filter((m) => m.posicao_y_cm === 0).reduce((s, m) => s + m.largura_cm, 0);
  const agora = (/* @__PURE__ */ new Date()).toISOString();
  const projeto = {
    id: `proj_${tipo_ambiente.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
    empresa_id: preferencias.empresa_id ?? "",
    cliente_id: preferencias.cliente_id ?? "",
    nome: preferencias.nome ?? opcoes.nome_padrao,
    tipo_ambiente,
    versao_comercial: preferencias.versao_comercial,
    numero_revisao: 1,
    ambiente,
    modulos,
    metricas,
    estilo: preferencias.estilo ?? "Moderno Minimalista",
    observacoes_tecnicas: [
      `${modulos.length} m\xF3dulos em ${paredes_usadas.length} parede(s)`,
      `${linear_total_cm}cm lineares de marcenaria`,
      ...opcoes.observacoes_extra ?? [],
      ...avisos
    ],
    status: "rascunho",
    criado_por: preferencias.criado_por ?? "motor_parametrico",
    criado_em: agora,
    atualizado_em: agora
  };
  const validacao = validarProjeto(projeto);
  return {
    projeto,
    paredes_usadas,
    linear_total_cm,
    avisos,
    validacao
  };
}

// src/lib/motor-parametrico/layout-cozinha-linear.ts
var AEREO_INICIO_Y_CM = 150;
function gerarLayoutCozinhaLinear(ambiente, preferencias) {
  const avisos = [];
  const paredeId = escolherParedePrincipal(ambiente, preferencias.parede_principal, avisos);
  const parede = ambiente.paredes[paredeId];
  let segmento = maiorSegmento(ambiente, paredeId);
  if (!segmento) {
    avisos.push(`Nenhum segmento livre suficiente na parede ${paredeId}. Verifique aberturas.`);
    segmento = {
      inicio_cm: 0,
      fim_cm: parede.comprimento_cm,
      comprimento_cm: parede.comprimento_cm,
      altura_util_cm: parede.altura_cm,
      bloqueado_por_janela_baixa: false
    };
  }
  const larguraDisponivel = segmento.comprimento_cm;
  const largurasBases = encaixarModulos(larguraDisponivel);
  if (largurasBases.length === 0) {
    avisos.push(`Segmento de ${larguraDisponivel}cm \xE9 insuficiente para um m\xF3dulo m\xEDnimo (30cm).`);
  }
  const materialCorpo = criarMaterialPadrao(preferencias.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(preferencias.cor_mdf_hex, 6);
  const modulosBase = instanciarModulos(largurasBases, {
    parede: paredeId,
    inicio_cm: segmento.inicio_cm,
    posicao_y_cm: 0,
    altura_cm: BASE_ALTURA_CM,
    profundidade_cm: BASE_PROFUNDIDADE_CM,
    prefixo: "base",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateBase,
    templateFallback: MODULOS_BASE_COZINHA[4],
    configDe: (largura) => configPadrao({
      tipo_porta: preferencias.tipo_porta_base,
      ferragem: preferencias.ferragem,
      num_portas: largura <= 40 ? 1 : 2
    })
  });
  const modulosAereo = instanciarModulos(largurasBases, {
    parede: paredeId,
    inicio_cm: segmento.inicio_cm,
    posicao_y_cm: AEREO_INICIO_Y_CM,
    altura_cm: AEREO_ALTURA_CM,
    profundidade_cm: AEREO_PROFUNDIDADE_CM,
    prefixo: "aereo",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateAereo,
    templateFallback: MODULOS_AEREOS_COZINHA[4],
    configDe: (largura) => configPadrao({
      tipo_porta: preferencias.tipo_porta_aereo,
      ferragem: preferencias.ferragem,
      num_portas: largura <= 40 ? 1 : 2,
      tem_pes_regulaveis: false
    }),
    ordemInicial: modulosBase.length
  });
  const modulos = [...modulosBase, ...modulosAereo];
  const larguraOcupada = largurasBases.reduce((s, l) => s + l, 0);
  const aproveitamento = larguraDisponivel > 0 ? Math.round(larguraOcupada / larguraDisponivel * 100) : 0;
  if (aproveitamento < 85 && largurasBases.length > 0) {
    avisos.push(
      `Aproveitamento de ${aproveitamento}% (${larguraOcupada}cm de ${larguraDisponivel}cm dispon\xEDveis). Sobra de ${larguraDisponivel - larguraOcupada}cm.`
    );
  }
  const metricas = calcularMetricas(modulos);
  const agora = (/* @__PURE__ */ new Date()).toISOString();
  const projeto = {
    id: `proj_cozinha_${Date.now()}`,
    empresa_id: preferencias.empresa_id ?? "",
    cliente_id: preferencias.cliente_id ?? "",
    nome: preferencias.nome ?? `Cozinha Linear \u2014 ${ambiente.dimensoes.largura_cm / 100}m`,
    tipo_ambiente: "Cozinha",
    versao_comercial: preferencias.versao_comercial,
    numero_revisao: 1,
    ambiente,
    modulos,
    metricas,
    estilo: "Moderno Minimalista",
    observacoes_tecnicas: [
      `${largurasBases.length} m\xF3dulos base (${larguraOcupada}cm linear)`,
      `${largurasBases.length} m\xF3dulos a\xE9reos alinhados`,
      `Aproveitamento da parede: ${aproveitamento}%`,
      ...avisos
    ],
    status: "rascunho",
    criado_por: preferencias.criado_por ?? "motor_parametrico",
    criado_em: agora,
    atualizado_em: agora
  };
  const validacao = validarProjeto(projeto);
  return {
    projeto,
    parede_usada: paredeId,
    largura_disponivel_cm: larguraDisponivel,
    largura_ocupada_cm: larguraOcupada,
    aproveitamento_pct: aproveitamento,
    avisos,
    validacao
  };
}
function encaixarModulos(disponivel_cm) {
  return encaixarLarguras(disponivel_cm, [90, 80, 70, 60, 50, 45, 40, 30], 60, 30);
}
function escolherParedePrincipal(ambiente, preferida, avisos) {
  if (preferida) {
    const parede = ambiente.paredes[preferida];
    const temEspaco = parede.segmentos_livres.some((s) => s.comprimento_cm >= 120);
    if (!temEspaco) {
      avisos.push(`Parede "${preferida}" tem menos de 120cm dispon\xEDvel. Usando a melhor alternativa.`);
    } else {
      return preferida;
    }
  }
  const paredes = ["top", "bottom", "left", "right"];
  let melhor = "top";
  let melhorComp = 0;
  for (const pId of paredes) {
    const p = ambiente.paredes[pId];
    const maxSeg = Math.max(0, ...p.segmentos_livres.map((s) => s.comprimento_cm));
    if (maxSeg > melhorComp) {
      melhorComp = maxSeg;
      melhor = pId;
    }
  }
  return melhor;
}

// src/lib/motor-parametrico/layout-cozinha-l-u.ts
var AEREO_INICIO_Y_CM2 = 150;
function comprimentoParede2(ambiente, parede) {
  return ambiente.paredes[parede].comprimento_cm;
}
function montarParede(ambiente, parede, inicioRecuo_cm, prefs, ordemInicial, avisos) {
  const seg = maiorSegmento(ambiente, parede);
  const comp = comprimentoParede2(ambiente, parede);
  const inicio = Math.max(inicioRecuo_cm, seg?.inicio_cm ?? 0);
  const fim = seg ? seg.fim_cm : comp;
  const disponivel = Math.max(0, fim - inicio);
  if (disponivel < 30) {
    avisos.push(`Parede ${parede}: apenas ${Math.round(disponivel)}cm \xFAteis ap\xF3s recuo de canto \u2014 sem gabinetes.`);
    return { modulos: [], ocupado_cm: 0 };
  }
  const larguras = encaixarLarguras(disponivel);
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);
  const bases = instanciarModulos(larguras, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: BASE_ALTURA_CM,
    profundidade_cm: BASE_PROFUNDIDADE_CM,
    prefixo: "base",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateBase,
    templateFallback: MODULOS_BASE_COZINHA[4],
    configDe: (largura) => configPadrao({
      tipo_porta: prefs.tipo_porta_base,
      ferragem: prefs.ferragem,
      num_portas: largura <= 40 ? 1 : 2
    }),
    ordemInicial
  });
  let modulos = bases;
  if (prefs.com_aereos !== false) {
    const aereos = instanciarModulos(larguras, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: AEREO_INICIO_Y_CM2,
      altura_cm: AEREO_ALTURA_CM,
      profundidade_cm: AEREO_PROFUNDIDADE_CM,
      prefixo: "aereo",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateAereo,
      templateFallback: MODULOS_AEREOS_COZINHA[4],
      configDe: (largura) => configPadrao({
        tipo_porta: prefs.tipo_porta_aereo,
        ferragem: prefs.ferragem,
        num_portas: largura <= 40 ? 1 : 2,
        tem_pes_regulaveis: false
      }),
      ordemInicial: ordemInicial + bases.length
    });
    modulos = [...bases, ...aereos];
  }
  const ocupado = larguras.reduce((s, l) => s + l, 0);
  return { modulos, ocupado_cm: ocupado };
}
function gerarLayoutCozinhaL(ambiente, prefs) {
  const avisos = [];
  let [pA, pB] = selecionarParedesL(ambiente, prefs.paredes, avisos);
  if (comprimentoParede2(ambiente, pB) > comprimentoParede2(ambiente, pA)) {
    [pA, pB] = [pB, pA];
  }
  const ladoA = montarParede(ambiente, pA, 0, prefs, 0, avisos);
  const ladoB = montarParede(ambiente, pB, BASE_PROFUNDIDADE_CM, prefs, ladoA.modulos.length, avisos);
  const modulos = [...ladoA.modulos, ...ladoB.modulos];
  if (modulos.length === 0) {
    avisos.push("Nenhum m\xF3dulo p\xF4de ser posicionado. Verifique as dimens\xF5es do ambiente.");
  }
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [pA, pB],
    tipo_ambiente: "Cozinha em L",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Parede ${pA}: ${ladoA.ocupado_cm}cm \xB7 Parede ${pB}: ${ladoB.ocupado_cm}cm (recuo de canto ${BASE_PROFUNDIDADE_CM}cm)`
    ],
    nome_padrao: `Cozinha em L \u2014 ${pA}+${pB}`
  });
}
function gerarLayoutCozinhaU(ambiente, prefs) {
  const avisos = [];
  const { central, laterais } = selecionarParedesU(ambiente, prefs.paredes, avisos);
  const ladoCentral = montarParede(ambiente, central, 0, prefs, 0, avisos);
  let ordem = ladoCentral.modulos.length;
  const ladosLaterais = laterais.map((lat) => {
    const r = montarParede(ambiente, lat, BASE_PROFUNDIDADE_CM, prefs, ordem, avisos);
    ordem += r.modulos.length;
    return r;
  });
  const modulos = [
    ...ladoCentral.modulos,
    ...ladosLaterais.flatMap((l) => l.modulos)
  ];
  if (modulos.length === 0) {
    avisos.push("Nenhum m\xF3dulo p\xF4de ser posicionado. Verifique as dimens\xF5es do ambiente.");
  }
  const paredesUsadas = [central, ...laterais];
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: paredesUsadas,
    tipo_ambiente: "Cozinha em U",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Central ${central}: ${ladoCentral.ocupado_cm}cm \xB7 ` + laterais.map((l, i) => `${l}: ${ladosLaterais[i].ocupado_cm}cm`).join(" \xB7 ") + ` (recuo de canto ${BASE_PROFUNDIDADE_CM}cm)`
    ],
    nome_padrao: `Cozinha em U \u2014 ${paredesUsadas.join("+")}`
  });
}
function selecionarParedesL(ambiente, preferidas, avisos) {
  if (preferidas && preferidas.length >= 2 && saoAdjacentes(preferidas[0], preferidas[1])) {
    return [preferidas[0], preferidas[1]];
  }
  if (preferidas && preferidas.length >= 2) {
    avisos.push(`Paredes ${preferidas[0]}+${preferidas[1]} n\xE3o formam um L (n\xE3o s\xE3o perpendiculares). Escolhendo automaticamente.`);
  }
  const ordenadas = paredesPorComprimento(ambiente);
  const primaria = ordenadas[0];
  const secundaria = ordenadas.find((p) => saoAdjacentes(p, primaria)) ?? "left";
  return [primaria, secundaria];
}
function selecionarParedesU(ambiente, preferidas, avisos) {
  if (preferidas && preferidas.length >= 3) {
    const [c, l12, l22] = preferidas;
    if (saoAdjacentes(c, l12) && saoAdjacentes(c, l22) && PAREDE_OPOSTA[l12] === l22) {
      return { central: c, laterais: [l12, l22] };
    }
    avisos.push(`Paredes ${preferidas.join("+")} n\xE3o formam um U v\xE1lido. Escolhendo automaticamente.`);
  }
  const ordenadas = paredesPorComprimento(ambiente);
  const central = ordenadas[0];
  const laterais = ordenadas.filter((p) => saoAdjacentes(p, central));
  const l1 = laterais[0] ?? "left";
  const l2 = PAREDE_OPOSTA[l1];
  return { central, laterais: [l1, l2] };
}

// src/lib/motor-parametrico/layout-ilha.ts
var CIRCULACAO_ILHA_MIN_CM = 90;
var ILHA_PROFUNDIDADE_CM = 90;
var ILHA_COMPRIMENTO_MAX_CM = 280;
function gerarLayoutIlha(ambiente, prefs) {
  const avisos = [];
  const { largura_cm, profundidade_cm } = ambiente.dimensoes;
  const profIlha = prefs.profundidade_cm ?? ILHA_PROFUNDIDADE_CM;
  const maxComprimentoPorLargura = largura_cm - 2 * CIRCULACAO_ILHA_MIN_CM;
  const espacoProfundidade = profundidade_cm - 2 * CIRCULACAO_ILHA_MIN_CM;
  if (espacoProfundidade < profIlha) {
    avisos.push(
      `Ambiente com ${profundidade_cm}cm de profundidade n\xE3o comporta ilha de ${profIlha}cm com circula\xE7\xE3o de ${CIRCULACAO_ILHA_MIN_CM}cm em volta. Ilha n\xE3o recomendada.`
    );
  }
  let comprimentoIlha = prefs.comprimento_desejado_cm ?? Math.min(maxComprimentoPorLargura, ILHA_COMPRIMENTO_MAX_CM);
  comprimentoIlha = Math.max(0, Math.min(comprimentoIlha, maxComprimentoPorLargura, ILHA_COMPRIMENTO_MAX_CM));
  if (comprimentoIlha < 120) {
    avisos.push(
      `Espa\xE7o para ilha de apenas ${Math.round(comprimentoIlha)}cm (m\xEDnimo pr\xE1tico 120cm). Considere uma bancada encostada na parede.`
    );
  }
  const larguras = comprimentoIlha >= 30 ? encaixarLarguras(comprimentoIlha) : [];
  const ocupado = larguras.reduce((s, l) => s + l, 0);
  const inicioX = Math.round((largura_cm - ocupado) / 2);
  const centroY = Math.round((profundidade_cm - profIlha) / 2);
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);
  const modulos = instanciarModulos(larguras, {
    parede: "bottom",
    // eixo de referência (ilha não encosta em parede)
    inicio_cm: inicioX,
    posicao_y_cm: centroY,
    altura_cm: BASE_ALTURA_CM,
    profundidade_cm: profIlha,
    prefixo: "ilha",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateBase,
    templateFallback: MODULOS_BASE_COZINHA[4],
    configDe: (largura) => configPadrao({
      tipo_porta: prefs.tipo_porta_base ?? "dobradica",
      ferragem: prefs.ferragem,
      num_portas: largura <= 40 ? 1 : 2,
      // ilha dupla-face: sem fundo fechado, acesso pelos dois lados
      tem_fundo: false
    }),
    rotuloParede: "Ilha central"
  });
  if (modulos.length === 0) {
    avisos.push("Ilha n\xE3o p\xF4de ser gerada \u2014 espa\xE7o insuficiente.");
  }
  const circulacaoLateral = Math.round((largura_cm - ocupado) / 2);
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [],
    tipo_ambiente: "Cozinha com Ilha",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Ilha central ${ocupado}\xD7${profIlha}cm`,
      `Circula\xE7\xE3o lateral: ${circulacaoLateral}cm de cada lado`,
      `Circula\xE7\xE3o frontal: ${centroY}cm de cada lado`
    ],
    nome_padrao: `Cozinha com Ilha \u2014 ${ocupado}cm`
  });
}

// src/lib/motor-parametrico/regras-corte-comuns.ts
var ESP2 = 15;
var FUNDO2 = 6;
var semFita = () => ({ esquerda: false, direita: false, topo: false, base: false });
var fitaFrente = () => ({ esquerda: false, direita: false, topo: true, base: false });
var fitaTotal = () => ({ esquerda: true, direita: true, topo: true, base: true });
function regrasCorpo(opts = {}) {
  const esp = opts.espessura_corpo ?? ESP2;
  const regras = [
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
      usa_material: "corpo"
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
      usa_material: "corpo"
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
      usa_material: "corpo"
    },
    {
      nome: "prateleira",
      grupo: "corpo",
      ativa_quando: (cfg) => cfg.num_prateleiras > 0,
      calcular_largura_mm: (L, _A, _P, cfg) => cfg.num_divisorias > 0 ? Math.round((L - 2 * esp - esp) / 2) : L - 2 * esp,
      calcular_comprimento_mm: (_L, _A, P) => P - FUNDO2,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_prateleiras,
      espessura_mm: esp,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaFrente,
      usa_material: "corpo"
    },
    {
      nome: "fundo",
      grupo: "fundo",
      ativa_quando: (cfg) => cfg.tem_fundo,
      calcular_largura_mm: (L) => L - 2 * esp,
      calcular_comprimento_mm: (_L, A) => A - 2 * esp,
      calcular_quantidade: () => 1,
      espessura_mm: FUNDO2,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "fundo"
    }
  ];
  if (opts.com_divisoria) {
    regras.push({
      nome: "divisoria_vertical",
      grupo: "corpo",
      ativa_quando: (cfg) => cfg.num_divisorias > 0,
      calcular_largura_mm: (_L, _A, P) => P - FUNDO2,
      calcular_comprimento_mm: (_L, A) => A - 2 * esp,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_divisorias,
      espessura_mm: esp,
      direcao_fio: "paralelo_comprimento",
      fita_borda: fitaFrente,
      usa_material: "corpo"
    });
  }
  return regras;
}
function regraPortaDobradica() {
  return {
    nome: "porta",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && (cfg.tipo_porta === "dobradica" || cfg.tipo_porta === "basculante"),
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: ESP2,
    direcao_fio: "paralelo_comprimento",
    fita_borda: fitaTotal,
    usa_material: "porta"
  };
}
function regraPortaCorrer() {
  return {
    nome: "porta_correr",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && (cfg.tipo_porta === "correr" || cfg.tipo_porta === "espelho"),
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1) + 20),
    // sobreposição
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: 18,
    direcao_fio: "paralelo_comprimento",
    fita_borda: fitaTotal,
    usa_material: "porta"
  };
}
function regrasGaveta() {
  return [
    {
      nome: "frente_gaveta",
      grupo: "gaveta",
      ativa_quando: (cfg) => cfg.num_gavetas > 0,
      calcular_largura_mm: (L) => L - 4,
      calcular_comprimento_mm: (_L, A, _P, cfg) => Math.round((A - 2 * ESP2) / Math.max(cfg.num_gavetas, 1)) - 4,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
      espessura_mm: ESP2,
      direcao_fio: "paralelo_largura",
      fita_borda: fitaTotal,
      usa_material: "porta"
    },
    {
      nome: "lateral_gaveta",
      grupo: "gaveta",
      ativa_quando: (cfg) => cfg.num_gavetas > 0,
      calcular_largura_mm: (_L, _A, P) => P - 2 * ESP2,
      calcular_comprimento_mm: () => 110,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas * 2,
      espessura_mm: ESP2,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "corpo"
    },
    {
      nome: "traseira_gaveta",
      grupo: "gaveta",
      ativa_quando: (cfg) => cfg.num_gavetas > 0,
      calcular_largura_mm: (L) => L - 2 * ESP2 - 26,
      calcular_comprimento_mm: () => 110,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
      espessura_mm: ESP2,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "corpo"
    },
    {
      nome: "fundo_gaveta",
      grupo: "gaveta",
      ativa_quando: (cfg) => cfg.num_gavetas > 0,
      calcular_largura_mm: (L) => L - 2 * ESP2 - 26,
      calcular_comprimento_mm: (_L, _A, P) => P - 2 * ESP2,
      calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
      espessura_mm: FUNDO2,
      direcao_fio: "indiferente",
      fita_borda: semFita,
      usa_material: "fundo"
    }
  ];
}
function regraDobradicas() {
  return {
    tipo: "dobradica_35mm_110grau",
    ativa_quando: (cfg) => cfg.tipo_porta === "dobradica" && cfg.num_portas > 0,
    calcular_quantidade: (_L, A, _P, cfg) => {
      const porPorta = A > 2e3 ? 4 : A > 1500 ? 3 : 2;
      return cfg.num_portas * porPorta;
    },
    descricao_tecnica: "2 dobradi\xE7as (\u2264150cm), 3 (\u2264200cm) ou 4 (>200cm) por porta"
  };
}
function regraCorredicaGaveta() {
  return {
    tipo: "corredicao_tandem_400mm",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    descricao_tecnica: "1 par de corredi\xE7as por gaveta"
  };
}
function regraTrilhoCorrer() {
  return {
    tipo: "corredicao_lateral_porta",
    ativa_quando: (cfg) => cfg.tipo_porta === "correr" || cfg.tipo_porta === "espelho",
    calcular_quantidade: () => 1,
    descricao_tecnica: "1 kit de trilho superior + inferior por m\xF3dulo de correr"
  };
}
function regraCabideiro() {
  return {
    tipo: "cabideiro_simples",
    ativa_quando: (cfg) => cfg.tem_cabideiro,
    calcular_quantidade: () => 1,
    descricao_tecnica: "1 barra cabideiro + 2 suportes por m\xF3dulo"
  };
}
function regraPuxadores() {
  return {
    tipo: "puxador_alu_128mm",
    ativa_quando: (cfg) => cfg.tipo_puxador !== "sem" && (cfg.num_portas > 0 || cfg.num_gavetas > 0),
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas + cfg.num_gavetas,
    descricao_tecnica: "1 puxador por porta + 1 por gaveta"
  };
}
function regraMinifix() {
  return {
    tipo: "minifix_15mm",
    ativa_quando: () => true,
    calcular_quantidade: (_L, _A, _P, cfg) => 8 + cfg.num_prateleiras * 4 + cfg.num_gavetas * 4,
    descricao_tecnica: "8 por corpo + 4 por prateleira + 4 por gaveta"
  };
}
function regraPes() {
  return {
    tipo: "ajustador_pe_100mm",
    ativa_quando: (cfg) => cfg.tem_pes_regulaveis,
    calcular_quantidade: (L) => L > 1500 ? 6 : 4,
    descricao_tecnica: "4 p\xE9s (\u2264150cm) ou 6 (>150cm)"
  };
}

// src/lib/motor-parametrico/biblioteca-quarto.ts
var ROUPEIRO_ALTURA_CM = 250;
var ROUPEIRO_PROFUNDIDADE_CM = 60;
var GAVETEIRO_ALTURA_CM = 80;
var GAVETEIRO_PROFUNDIDADE_CM = 50;
var CABIDEIRO_ALTURA_CM = 130;
var SAPATEIRA_ALTURA_CM = 100;
var SAPATEIRA_PROFUNDIDADE_CM = 35;
var publicado = "2026-06-05T00:00:00Z";
var cfgRoupeiro = {
  tipo_porta: "dobradica",
  num_portas: 2,
  num_prateleiras: 3,
  num_gavetas: 0,
  num_divisorias: 1,
  tem_cabideiro: true,
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
  ferragem: "nacional",
  tipo_puxador: "puxador_alu"
};
function criarRoupeiro(largura_cm) {
  return {
    id: `roupeiro_${largura_cm}`,
    codigo: `roupeiro_${largura_cm}`,
    nome: `Roupeiro ${largura_cm}cm`,
    versao: 1,
    categorias: ["quarto", "closet"],
    tipo: "roupeiro",
    largura: { min_cm: 40, max_cm: 100, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 220, max_cm: 270, padrao_cm: ROUPEIRO_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 55, max_cm: 65, padrao_cm: ROUPEIRO_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: { ...cfgRoupeiro, num_portas: largura_cm <= 50 ? 1 : 2 },
    limites: {
      num_portas: { min: 1, max: 4 },
      num_gavetas: { min: 0, max: 4 },
      num_prateleiras: { min: 1, max: 8 },
      tipos_porta_validos: ["dobradica", "correr", "espelho"],
      permite_espelho: true,
      permite_iluminacao_led: true,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo({ com_divisoria: true }),
      regraPortaDobradica(),
      regraPortaCorrer(),
      ...regrasGaveta()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraTrilhoCorrer(),
      regraCorredicaGaveta(),
      regraCabideiro(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 5,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    norma_referencia: "Roupeiro: cabideiro a ~150cm, prateleira superior a ~200cm",
    ativo: true,
    publicado_em: publicado
  };
}
function criarGaveteiro(largura_cm) {
  return {
    id: `gaveteiro_${largura_cm}`,
    codigo: `gaveteiro_${largura_cm}`,
    nome: `Gaveteiro ${largura_cm}cm`,
    versao: 1,
    categorias: ["quarto", "closet"],
    tipo: "gaveta_bloco",
    largura: { min_cm: 40, max_cm: 80, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 60, max_cm: 100, padrao_cm: GAVETEIRO_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 45, max_cm: 55, padrao_cm: GAVETEIRO_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgRoupeiro,
      tipo_porta: "aberta",
      num_portas: 0,
      num_prateleiras: 0,
      num_gavetas: 4,
      num_divisorias: 0,
      tem_cabideiro: false
    },
    limites: {
      num_portas: { min: 0, max: 0 },
      num_gavetas: { min: 2, max: 6 },
      num_prateleiras: { min: 0, max: 0 },
      tipos_porta_validos: ["aberta"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      ...regrasGaveta()
    ],
    regras_ferragens: [
      regraCorredicaGaveta(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    ativo: true,
    publicado_em: publicado
  };
}
function criarCabideiro(largura_cm) {
  return {
    id: `cabideiro_${largura_cm}`,
    codigo: `cabideiro_${largura_cm}`,
    nome: `M\xF3dulo Cabideiro ${largura_cm}cm`,
    versao: 1,
    categorias: ["quarto", "closet"],
    tipo: "cabideiro",
    largura: { min_cm: 40, max_cm: 100, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 100, max_cm: 150, padrao_cm: CABIDEIRO_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 55, max_cm: 60, padrao_cm: ROUPEIRO_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgRoupeiro,
      tipo_porta: "aberta",
      num_portas: 0,
      num_prateleiras: 1,
      num_gavetas: 0,
      num_divisorias: 0,
      tem_cabideiro: true
    },
    limites: {
      num_portas: { min: 0, max: 2 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 0, max: 2 },
      tipos_porta_validos: ["aberta", "dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraCabideiro(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    ativo: true,
    publicado_em: publicado
  };
}
function criarSapateira(largura_cm) {
  return {
    id: `sapateira_${largura_cm}`,
    codigo: `sapateira_${largura_cm}`,
    nome: `Sapateira ${largura_cm}cm`,
    versao: 1,
    categorias: ["quarto", "closet"],
    tipo: "sapateira",
    largura: { min_cm: 40, max_cm: 90, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 80, max_cm: 120, padrao_cm: SAPATEIRA_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 30, max_cm: 40, padrao_cm: SAPATEIRA_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgRoupeiro,
      tipo_porta: "dobradica",
      num_portas: 2,
      num_prateleiras: 4,
      num_gavetas: 0,
      num_divisorias: 0,
      tem_cabideiro: false
    },
    limites: {
      num_portas: { min: 1, max: 2 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 2, max: 6 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    norma_referencia: "Sapateira: prateleiras inclinadas a cada ~18cm",
    ativo: true,
    publicado_em: publicado
  };
}
var MODULOS_ROUPEIRO = [
  criarRoupeiro(50),
  criarRoupeiro(60),
  criarRoupeiro(70),
  criarRoupeiro(80),
  criarRoupeiro(90),
  criarRoupeiro(100)
];
var MODULOS_GAVETEIRO = [
  criarGaveteiro(40),
  criarGaveteiro(50),
  criarGaveteiro(60),
  criarGaveteiro(70),
  criarGaveteiro(80)
];
var MODULOS_CABIDEIRO = [
  criarCabideiro(50),
  criarCabideiro(60),
  criarCabideiro(70),
  criarCabideiro(80),
  criarCabideiro(90),
  criarCabideiro(100)
];
var MODULOS_SAPATEIRA = [
  criarSapateira(40),
  criarSapateira(50),
  criarSapateira(60),
  criarSapateira(70),
  criarSapateira(80)
];
var BIBLIOTECA_QUARTO = {
  ...Object.fromEntries(MODULOS_ROUPEIRO.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_GAVETEIRO.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_CABIDEIRO.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_SAPATEIRA.map((m) => [m.codigo, m]))
};
function buscarPorLargura(familia, largura_cm) {
  return familia.find((m) => m.largura.padrao_cm === largura_cm) ?? familia.reduce(
    (maisProx, m) => Math.abs(m.largura.padrao_cm - largura_cm) < Math.abs(maisProx.largura.padrao_cm - largura_cm) ? m : maisProx
  );
}
var getTemplateRoupeiro = (l) => buscarPorLargura(MODULOS_ROUPEIRO, l);
var getTemplateGaveteiro = (l) => buscarPorLargura(MODULOS_GAVETEIRO, l);
var getTemplateCabideiro = (l) => buscarPorLargura(MODULOS_CABIDEIRO, l);
var getTemplateSapateira = (l) => buscarPorLargura(MODULOS_SAPATEIRA, l);

// src/lib/motor-parametrico/layout-quarto.ts
var LARGURAS_QUARTO = [100, 90, 80, 70, 60, 50];
function montarParedeRoupeiros(ambiente, parede, inicioRecuo_cm, prefs, ordemInicial, avisos) {
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = Math.max(inicioRecuo_cm, seg?.inicio_cm ?? 0);
  const fim = seg ? seg.fim_cm : comp;
  const disponivel = Math.max(0, fim - inicio);
  if (disponivel < 50) {
    avisos.push(`Parede ${parede}: ${Math.round(disponivel)}cm \xFAteis \u2014 insuficiente para roupeiro.`);
    return { modulos: [], ocupado_cm: 0 };
  }
  const larguras = encaixarLarguras(disponivel, LARGURAS_QUARTO, 80, 50);
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);
  const modulos = instanciarModulos(larguras, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: ROUPEIRO_ALTURA_CM,
    profundidade_cm: ROUPEIRO_PROFUNDIDADE_CM,
    prefixo: "roupeiro",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateRoupeiro,
    templateFallback: MODULOS_ROUPEIRO[3],
    configDe: (largura) => configPadrao({
      tipo_porta: prefs.tipo_porta ?? "dobradica",
      ferragem: prefs.ferragem,
      num_portas: largura <= 50 ? 1 : 2,
      num_prateleiras: 3,
      num_divisorias: 1,
      tem_cabideiro: true,
      espessura_porta_mm: prefs.tipo_porta === "correr" || prefs.tipo_porta === "espelho" ? 18 : 15
    }),
    ordemInicial
  });
  const ocupado = larguras.reduce((s, l) => s + l, 0);
  return { modulos, ocupado_cm: ocupado };
}
function gerarLayoutDormitorio(ambiente, prefs) {
  const avisos = [];
  const parede = prefs.paredes?.[0] ?? paredesPorComprimento(ambiente)[0];
  const { modulos, ocupado_cm } = montarParedeRoupeiros(ambiente, parede, 0, prefs, 0, avisos);
  if (modulos.length === 0) {
    avisos.push("Nenhum roupeiro p\xF4de ser posicionado. Verifique as dimens\xF5es do quarto.");
  }
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Dormit\xF3rio",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Roupeiro de ${ocupado_cm}cm na parede ${parede}`,
      `Altura ${ROUPEIRO_ALTURA_CM}cm \xB7 profundidade ${ROUPEIRO_PROFUNDIDADE_CM}cm`
    ],
    nome_padrao: `Dormit\xF3rio \u2014 Roupeiro ${ocupado_cm}cm`
  });
}
function gerarLayoutCloset(ambiente, prefs) {
  const avisos = [];
  let [pA, pB] = selecionarParedesL2(ambiente, prefs.paredes, avisos);
  if (ambiente.paredes[pB].comprimento_cm > ambiente.paredes[pA].comprimento_cm) {
    [pA, pB] = [pB, pA];
  }
  const ladoA = montarParedeRoupeiros(ambiente, pA, 0, prefs, 0, avisos);
  const ladoB = montarMixCloset(ambiente, pB, ROUPEIRO_PROFUNDIDADE_CM, prefs, ladoA.modulos.length, avisos);
  const modulos = [...ladoA.modulos, ...ladoB.modulos];
  if (modulos.length === 0) {
    avisos.push("Nenhum m\xF3dulo p\xF4de ser posicionado no closet. Verifique as dimens\xF5es.");
  }
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [pA, pB],
    tipo_ambiente: "Closet",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Parede ${pA}: roupeiros (${ladoA.ocupado_cm}cm) \xB7 Parede ${pB}: mix funcional (${ladoB.ocupado_cm}cm)`,
      `Recuo de canto: ${ROUPEIRO_PROFUNDIDADE_CM}cm`
    ],
    nome_padrao: `Closet em L \u2014 ${pA}+${pB}`
  });
}
function montarMixCloset(ambiente, parede, inicioRecuo_cm, prefs, ordemInicial, avisos) {
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = Math.max(inicioRecuo_cm, seg?.inicio_cm ?? 0);
  const fim = seg ? seg.fim_cm : comp;
  const disponivel = Math.max(0, fim - inicio);
  if (disponivel < 50) {
    avisos.push(`Parede ${parede}: ${Math.round(disponivel)}cm \u2014 sem mix de closet.`);
    return { modulos: [], ocupado_cm: 0 };
  }
  const larguras = encaixarLarguras(disponivel, LARGURAS_QUARTO, 70, 50);
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);
  const modulos = [];
  let posX = inicio;
  let ordem = ordemInicial;
  larguras.forEach((largura, i) => {
    let getTpl;
    let prefixo;
    let alturaSel;
    let cfgExtra;
    if (i === 0) {
      getTpl = getTemplateSapateira;
      prefixo = "sapateira";
      alturaSel = 100;
      cfgExtra = { tipo_porta: "dobradica", num_portas: largura <= 50 ? 1 : 2, num_prateleiras: 4, tem_cabideiro: false };
    } else if (i === larguras.length - 1 && larguras.length > 1) {
      getTpl = getTemplateGaveteiro;
      prefixo = "gaveteiro";
      alturaSel = 80;
      cfgExtra = { tipo_porta: "aberta", num_portas: 0, num_prateleiras: 0, num_gavetas: 4, tem_cabideiro: false };
    } else {
      getTpl = getTemplateCabideiro;
      prefixo = "cabideiro";
      alturaSel = 130;
      cfgExtra = { tipo_porta: "aberta", num_portas: 0, num_prateleiras: 1, tem_cabideiro: true };
    }
    const tpl = getTpl(largura);
    const inst = instanciarModulos([largura], {
      parede,
      inicio_cm: posX,
      posicao_y_cm: 0,
      altura_cm: alturaSel,
      profundidade_cm: ROUPEIRO_PROFUNDIDADE_CM,
      prefixo,
      materialCorpo,
      materialFundo,
      getTemplate: getTpl,
      templateFallback: tpl ?? MODULOS_ROUPEIRO[3],
      configDe: () => configPadrao({ ferragem: prefs.ferragem, ...cfgExtra }),
      ordemInicial: ordem
    });
    modulos.push(...inst);
    posX += largura;
    ordem += inst.length;
  });
  const ocupado = larguras.reduce((s, l) => s + l, 0);
  return { modulos, ocupado_cm: ocupado };
}
function selecionarParedesL2(ambiente, preferidas, avisos) {
  if (preferidas && preferidas.length >= 2 && saoAdjacentes(preferidas[0], preferidas[1])) {
    return [preferidas[0], preferidas[1]];
  }
  if (preferidas && preferidas.length >= 2) {
    avisos.push(`Paredes ${preferidas[0]}+${preferidas[1]} n\xE3o formam um L. Escolhendo automaticamente.`);
  }
  const ordenadas = paredesPorComprimento(ambiente);
  const primaria = ordenadas[0];
  const secundaria = ordenadas.find((p) => saoAdjacentes(p, primaria)) ?? "left";
  return [primaria, secundaria];
}

// src/lib/motor-parametrico/biblioteca-servicos.ts
var GAB_PIA_ALTURA_CM = 55;
var GAB_PIA_PROFUNDIDADE_CM = 46;
var ESPELHEIRA_ALTURA_CM = 70;
var ESPELHEIRA_PROFUNDIDADE_CM = 12;
var GAB_TANQUE_ALTURA_CM = 70;
var GAB_TANQUE_PROFUNDIDADE_CM = 55;
var ARMARIO_SERVICO_ALTURA_CM = 60;
var ARMARIO_SERVICO_PROFUNDIDADE_CM = 33;
var publicado2 = "2026-06-05T00:00:00Z";
var cfgBaseUmido = {
  tipo_porta: "dobradica",
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
  altura_pes_cm: 12,
  tem_roda_teto: false,
  tem_iluminacao_led: false,
  tem_espelho_interno: false,
  tem_ripado: false,
  espessura_corpo_mm: 15,
  espessura_porta_mm: 15,
  ferragem: "nacional",
  tipo_puxador: "puxador_alu"
};
function criarGabinetePia(largura_cm) {
  return {
    id: `gab_pia_${largura_cm}`,
    codigo: `gab_pia_${largura_cm}`,
    nome: `Gabinete de Pia ${largura_cm}cm`,
    versao: 1,
    categorias: ["banheiro"],
    tipo: "base",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 50, max_cm: 60, padrao_cm: GAB_PIA_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 40, max_cm: 50, padrao_cm: GAB_PIA_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseUmido,
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_prateleiras: 1,
      tem_fundo: false
      // zona da cuba: sem fundo
    },
    limites: {
      num_portas: { min: 1, max: 3 },
      num_gavetas: { min: 0, max: 3 },
      num_prateleiras: { min: 0, max: 2 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica(),
      ...regrasGaveta()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraCorredicaGaveta(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
      requer_ponto_hidraulico: true
    },
    norma_referencia: "Gabinete de pia: altura \xFAtil ~80cm com bancada",
    ativo: true,
    publicado_em: publicado2
  };
}
function criarEspelheira(largura_cm) {
  return {
    id: `espelheira_${largura_cm}`,
    codigo: `espelheira_${largura_cm}`,
    nome: `Espelheira ${largura_cm}cm`,
    versao: 1,
    categorias: ["banheiro"],
    tipo: "espelheira",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 60, max_cm: 80, padrao_cm: ESPELHEIRA_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 10, max_cm: 15, padrao_cm: ESPELHEIRA_PROFUNDIDADE_CM, passo_cm: 1 },
    configuracao_padrao: {
      ...cfgBaseUmido,
      tipo_porta: "espelho",
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_prateleiras: 2,
      tem_pes_regulaveis: false,
      tem_espelho_interno: true
    },
    limites: {
      num_portas: { min: 1, max: 3 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 1, max: 3 },
      tipos_porta_validos: ["espelho", "dobradica"],
      permite_espelho: true,
      permite_iluminacao_led: true,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraPuxadores(),
      regraMinifix()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 120,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    ativo: true,
    publicado_em: publicado2
  };
}
function criarGabineteTanque(largura_cm) {
  return {
    id: `gab_tanque_${largura_cm}`,
    codigo: `gab_tanque_${largura_cm}`,
    nome: `Gabinete de Tanque ${largura_cm}cm`,
    versao: 1,
    categorias: ["lavanderia"],
    tipo: "base",
    largura: { min_cm: 40, max_cm: 100, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 65, max_cm: 75, padrao_cm: GAB_TANQUE_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 50, max_cm: 60, padrao_cm: GAB_TANQUE_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgBaseUmido,
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_prateleiras: 1,
      tem_fundo: false
      // zona do tanque
    },
    limites: {
      num_portas: { min: 1, max: 2 },
      num_gavetas: { min: 0, max: 2 },
      num_prateleiras: { min: 0, max: 2 },
      tipos_porta_validos: ["dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica(),
      ...regrasGaveta()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraCorredicaGaveta(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
      requer_ponto_hidraulico: true
    },
    ativo: true,
    publicado_em: publicado2
  };
}
function criarArmarioServico(largura_cm) {
  return {
    id: `armario_servico_${largura_cm}`,
    codigo: `armario_servico_${largura_cm}`,
    nome: `Arm\xE1rio de Servi\xE7o ${largura_cm}cm`,
    versao: 1,
    categorias: ["lavanderia"],
    tipo: "aereo",
    largura: { min_cm: 40, max_cm: 100, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 50, max_cm: 80, padrao_cm: ARMARIO_SERVICO_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 30, max_cm: 35, padrao_cm: ARMARIO_SERVICO_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseUmido,
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_prateleiras: 2,
      tem_pes_regulaveis: false
    },
    limites: {
      num_portas: { min: 1, max: 3 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 1, max: 3 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraPuxadores(),
      regraMinifix()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 150,
      folga_teto_min_cm: 10,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    ativo: true,
    publicado_em: publicado2
  };
}
var MODULOS_GABINETE_PIA = [
  criarGabinetePia(40),
  criarGabinetePia(50),
  criarGabinetePia(60),
  criarGabinetePia(70),
  criarGabinetePia(80)
];
var MODULOS_ESPELHEIRA = [
  criarEspelheira(40),
  criarEspelheira(50),
  criarEspelheira(60),
  criarEspelheira(70),
  criarEspelheira(80)
];
var MODULOS_GABINETE_TANQUE = [
  criarGabineteTanque(40),
  criarGabineteTanque(50),
  criarGabineteTanque(60),
  criarGabineteTanque(70)
];
var MODULOS_ARMARIO_SERVICO = [
  criarArmarioServico(40),
  criarArmarioServico(50),
  criarArmarioServico(60),
  criarArmarioServico(70),
  criarArmarioServico(80)
];
var BIBLIOTECA_SERVICOS = {
  ...Object.fromEntries(MODULOS_GABINETE_PIA.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_ESPELHEIRA.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_GABINETE_TANQUE.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_ARMARIO_SERVICO.map((m) => [m.codigo, m]))
};
function buscarPorLargura2(familia, largura_cm) {
  return familia.find((m) => m.largura.padrao_cm === largura_cm) ?? familia.reduce(
    (maisProx, m) => Math.abs(m.largura.padrao_cm - largura_cm) < Math.abs(maisProx.largura.padrao_cm - largura_cm) ? m : maisProx
  );
}
var getTemplateGabinetePia = (l) => buscarPorLargura2(MODULOS_GABINETE_PIA, l);
var getTemplateEspelheira = (l) => buscarPorLargura2(MODULOS_ESPELHEIRA, l);
var getTemplateGabineteTanque = (l) => buscarPorLargura2(MODULOS_GABINETE_TANQUE, l);
var getTemplateArmarioServico = (l) => buscarPorLargura2(MODULOS_ARMARIO_SERVICO, l);

// src/lib/motor-parametrico/layout-servicos.ts
var ESPELHEIRA_INICIO_Y_CM = 120;
var ARMARIO_SERVICO_INICIO_Y_CM = 150;
var LARGURAS_SERVICO = [80, 70, 60, 50, 40];
function escolherParedeMolhada(ambiente, preferida, avisos) {
  if (preferida) return preferida;
  const ph = ambiente.pontos_hidraulicos.find((p) => p.parede && p.requer_modulo_adjacente);
  if (ph?.parede) return ph.parede;
  if (ambiente.pontos_hidraulicos.length > 0) {
    avisos.push("Ponto hidr\xE1ulico sem parede definida \u2014 usando a parede mais longa.");
  }
  return paredesPorComprimento(ambiente)[0];
}
function gerarLayoutBanheiro(ambiente, prefs) {
  const avisos = [];
  const parede = escolherParedeMolhada(ambiente, prefs.parede_principal, avisos);
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = seg?.inicio_cm ?? 0;
  const disponivel = seg?.comprimento_cm ?? comp;
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);
  const larguras = encaixarLarguras(Math.min(disponivel, 120), LARGURAS_SERVICO, 60, 40);
  const gabinetes = instanciarModulos(larguras, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: GAB_PIA_ALTURA_CM,
    profundidade_cm: GAB_PIA_PROFUNDIDADE_CM,
    prefixo: "gab_pia",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateGabinetePia,
    templateFallback: MODULOS_GABINETE_PIA[2],
    configDe: (largura) => configPadrao({
      ferragem: prefs.ferragem,
      num_portas: largura <= 50 ? 1 : 2,
      tem_fundo: false
    })
  });
  let modulos = [...gabinetes];
  if (prefs.com_superior !== false) {
    const espelheiras = instanciarModulos(larguras, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: ESPELHEIRA_INICIO_Y_CM,
      altura_cm: ESPELHEIRA_ALTURA_CM,
      profundidade_cm: ESPELHEIRA_PROFUNDIDADE_CM,
      prefixo: "espelheira",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateEspelheira,
      templateFallback: MODULOS_ESPELHEIRA[2],
      configDe: (largura) => configPadrao({
        tipo_porta: "espelho",
        ferragem: prefs.ferragem,
        num_portas: largura <= 50 ? 1 : 2,
        num_prateleiras: 2,
        tem_pes_regulaveis: false,
        tem_espelho_interno: true,
        espessura_porta_mm: 18
      }),
      ordemInicial: gabinetes.length
    });
    modulos = [...gabinetes, ...espelheiras];
  }
  if (modulos.length === 0) avisos.push("Banheiro sem espa\xE7o para gabinete. Verifique as dimens\xF5es.");
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Banheiro",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Gabinete de pia na parede ${parede}`,
      prefs.com_superior !== false ? "Espelheira a 120cm do piso" : "Sem espelheira"
    ],
    nome_padrao: `Banheiro \u2014 Gabinete ${larguras.reduce((s, l) => s + l, 0)}cm`
  });
}
function gerarLayoutLavanderia(ambiente, prefs) {
  const avisos = [];
  const parede = escolherParedeMolhada(ambiente, prefs.parede_principal, avisos);
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = seg?.inicio_cm ?? 0;
  const disponivel = seg?.comprimento_cm ?? comp;
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);
  const larguras = encaixarLarguras(disponivel, LARGURAS_SERVICO, 60, 40);
  const gabinetes = instanciarModulos(larguras, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: GAB_TANQUE_ALTURA_CM,
    profundidade_cm: GAB_TANQUE_PROFUNDIDADE_CM,
    prefixo: "gab_tanque",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateGabineteTanque,
    templateFallback: MODULOS_GABINETE_TANQUE[2],
    configDe: (largura) => configPadrao({
      ferragem: prefs.ferragem,
      num_portas: largura <= 50 ? 1 : 2,
      tem_fundo: false
    })
  });
  let modulos = [...gabinetes];
  if (prefs.com_superior !== false) {
    const armarios = instanciarModulos(larguras, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: ARMARIO_SERVICO_INICIO_Y_CM,
      altura_cm: ARMARIO_SERVICO_ALTURA_CM,
      profundidade_cm: ARMARIO_SERVICO_PROFUNDIDADE_CM,
      prefixo: "armario_servico",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateArmarioServico,
      templateFallback: MODULOS_ARMARIO_SERVICO[2],
      configDe: (largura) => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: largura <= 50 ? 1 : 2,
        num_prateleiras: 2,
        tem_pes_regulaveis: false
      }),
      ordemInicial: gabinetes.length
    });
    modulos = [...gabinetes, ...armarios];
  }
  if (modulos.length === 0) avisos.push("Lavanderia sem espa\xE7o para gabinete. Verifique as dimens\xF5es.");
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Lavanderia",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Gabinete de tanque + apoio na parede ${parede}`,
      prefs.com_superior !== false ? "Arm\xE1rios de servi\xE7o a 150cm do piso" : "Sem arm\xE1rios superiores"
    ],
    nome_padrao: `Lavanderia \u2014 ${larguras.reduce((s, l) => s + l, 0)}cm`
  });
}

// src/lib/motor-parametrico/biblioteca-sala.ts
var RACK_TV_ALTURA_CM = 45;
var RACK_TV_PROFUNDIDADE_CM = 48;
var PAINEL_RIPADO_ALTURA_CM = 110;
var PAINEL_RIPADO_PROFUNDIDADE_CM = 4;
var NICHO_SALA_ALTURA_CM = 60;
var NICHO_SALA_PROFUNDIDADE_CM = 30;
var PAINEL_RIPADO_INICIO_Y_CM = 55;
var NICHO_SALA_INICIO_Y_CM = 175;
var publicado3 = "2026-06-09T00:00:00Z";
var cfgBaseSala = {
  tipo_porta: "dobradica",
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
  altura_pes_cm: 8,
  tem_roda_teto: false,
  tem_iluminacao_led: false,
  tem_espelho_interno: false,
  tem_ripado: false,
  espessura_corpo_mm: 15,
  espessura_porta_mm: 15,
  ferragem: "nacional",
  tipo_puxador: "perfil_aluminio"
};
function criarRackTv(largura_cm) {
  return {
    id: `rack_tv_${largura_cm}`,
    codigo: `rack_tv_${largura_cm}`,
    nome: `Rack de TV ${largura_cm}cm`,
    versao: 1,
    categorias: ["sala"],
    tipo: "rack_tv",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 35, max_cm: 55, padrao_cm: RACK_TV_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 40, max_cm: 55, padrao_cm: RACK_TV_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseSala,
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_gavetas: largura_cm >= 80 ? 2 : 1,
      num_prateleiras: 1
    },
    limites: {
      num_portas: { min: 0, max: 3 },
      num_gavetas: { min: 0, max: 3 },
      num_prateleiras: { min: 0, max: 2 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica(),
      ...regrasGaveta()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraCorredicaGaveta(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    norma_referencia: "Rack de TV: centro da tela ~110cm do piso (NBR de ergonomia visual)",
    ativo: true,
    publicado_em: publicado3
  };
}
function criarPainelRipado(largura_cm) {
  return {
    id: `painel_ripado_${largura_cm}`,
    codigo: `painel_ripado_${largura_cm}`,
    nome: `Painel Ripado TV ${largura_cm}cm`,
    versao: 1,
    categorias: ["sala"],
    tipo: "painel_ripado",
    largura: { min_cm: 60, max_cm: 200, padrao_cm: largura_cm, passo_cm: 10 },
    altura: { min_cm: 80, max_cm: 160, padrao_cm: PAINEL_RIPADO_ALTURA_CM, passo_cm: 10 },
    profundidade: { min_cm: 3, max_cm: 6, padrao_cm: PAINEL_RIPADO_PROFUNDIDADE_CM, passo_cm: 1 },
    configuracao_padrao: {
      ...cfgBaseSala,
      tipo_porta: "dobradica",
      num_portas: 0,
      num_prateleiras: 0,
      tem_fundo: false,
      tem_pes_regulaveis: false,
      tem_ripado: true
    },
    limites: {
      num_portas: { min: 0, max: 0 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 0, max: 0 },
      tipos_porta_validos: ["dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: true
    },
    regras_pecas: [
      ...regrasCorpo()
    ],
    regras_ferragens: [
      regraMinifix()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: PAINEL_RIPADO_INICIO_Y_CM,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: false
    },
    norma_referencia: "Painel decorativo ripado: fixa\xE7\xE3o direta na parede atr\xE1s da TV",
    ativo: true,
    publicado_em: publicado3
  };
}
function criarNichoSala(largura_cm) {
  return {
    id: `nicho_sala_${largura_cm}`,
    codigo: `nicho_sala_${largura_cm}`,
    nome: `Estante de Nichos ${largura_cm}cm`,
    versao: 1,
    categorias: ["sala"],
    tipo: "estante",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 40, max_cm: 90, padrao_cm: NICHO_SALA_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 25, max_cm: 35, padrao_cm: NICHO_SALA_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseSala,
      num_portas: 0,
      num_prateleiras: 2,
      num_divisorias: largura_cm >= 80 ? 1 : 0,
      tem_fundo: true,
      tem_pes_regulaveis: false
    },
    limites: {
      num_portas: { min: 0, max: 2 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 1, max: 4 },
      tipos_porta_validos: ["dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo()
    ],
    regras_ferragens: [
      regraMinifix()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: NICHO_SALA_INICIO_Y_CM,
      folga_teto_min_cm: 10,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    ativo: true,
    publicado_em: publicado3
  };
}
var MODULOS_RACK_TV = [
  criarRackTv(50),
  criarRackTv(60),
  criarRackTv(70),
  criarRackTv(80),
  criarRackTv(90)
];
var MODULOS_PAINEL_RIPADO = [
  criarPainelRipado(100),
  criarPainelRipado(120),
  criarPainelRipado(140),
  criarPainelRipado(160),
  criarPainelRipado(180)
];
var MODULOS_NICHO_SALA = [
  criarNichoSala(50),
  criarNichoSala(60),
  criarNichoSala(70),
  criarNichoSala(80),
  criarNichoSala(90)
];
var BIBLIOTECA_SALA = {
  ...Object.fromEntries(MODULOS_RACK_TV.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_PAINEL_RIPADO.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_NICHO_SALA.map((m) => [m.codigo, m]))
};
function buscarPorLargura3(familia, largura_cm) {
  return familia.find((m) => m.largura.padrao_cm === largura_cm) ?? familia.reduce(
    (maisProx, m) => Math.abs(m.largura.padrao_cm - largura_cm) < Math.abs(maisProx.largura.padrao_cm - largura_cm) ? m : maisProx
  );
}
var getTemplateRackTv = (l) => buscarPorLargura3(MODULOS_RACK_TV, l);
var getTemplatePainelRipado = (l) => buscarPorLargura3(MODULOS_PAINEL_RIPADO, l);
var getTemplateNichoSala = (l) => buscarPorLargura3(MODULOS_NICHO_SALA, l);

// src/lib/motor-parametrico/layout-sala.ts
var LARGURAS_RACK = [90, 80, 70, 60, 50];
var LARGURAS_NICHO = [90, 80, 70, 60, 50];
var LARGURAS_PAINEL = [180, 160, 140, 120, 100];
function gerarLayoutSala(ambiente, prefs) {
  const avisos = [];
  const parede = prefs.parede_principal ?? paredesPorComprimento(ambiente)[0];
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = seg?.inicio_cm ?? 0;
  const disponivel = seg?.comprimento_cm ?? comp;
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);
  const largurasRack = encaixarLarguras(disponivel, LARGURAS_RACK, 80, 50);
  const racks = instanciarModulos(largurasRack, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: RACK_TV_ALTURA_CM,
    profundidade_cm: RACK_TV_PROFUNDIDADE_CM,
    prefixo: "rack_tv",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateRackTv,
    templateFallback: MODULOS_RACK_TV[1],
    configDe: (largura) => configPadrao({
      ferragem: prefs.ferragem,
      num_portas: largura <= 50 ? 1 : 2,
      num_gavetas: largura >= 80 ? 2 : 1,
      num_prateleiras: 1
    })
  });
  let modulos = [...racks];
  if (prefs.com_painel !== false && disponivel >= 100) {
    const largPainel = Math.min(disponivel, LARGURAS_PAINEL.find((l) => l <= disponivel) ?? 100);
    const inicioPainel = inicio + Math.max(0, (disponivel - largPainel) / 2);
    const painel = instanciarModulos([largPainel], {
      parede,
      inicio_cm: inicioPainel,
      posicao_y_cm: PAINEL_RIPADO_INICIO_Y_CM,
      altura_cm: PAINEL_RIPADO_ALTURA_CM,
      profundidade_cm: PAINEL_RIPADO_PROFUNDIDADE_CM,
      prefixo: "painel_ripado",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplatePainelRipado,
      templateFallback: MODULOS_PAINEL_RIPADO[1],
      configDe: () => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: 0,
        num_prateleiras: 0,
        tem_fundo: false,
        tem_pes_regulaveis: false,
        tem_ripado: true
      }),
      ordemInicial: modulos.length
    });
    modulos = [...modulos, ...painel];
  }
  if (prefs.com_superior !== false) {
    const largurasNicho = encaixarLarguras(disponivel, LARGURAS_NICHO, 70, 50);
    const nichos = instanciarModulos(largurasNicho, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: NICHO_SALA_INICIO_Y_CM,
      altura_cm: NICHO_SALA_ALTURA_CM,
      profundidade_cm: NICHO_SALA_PROFUNDIDADE_CM,
      prefixo: "nicho_sala",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateNichoSala,
      templateFallback: MODULOS_NICHO_SALA[1],
      configDe: (largura) => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: 0,
        num_prateleiras: 2,
        num_divisorias: largura >= 80 ? 1 : 0,
        tem_pes_regulaveis: false
      }),
      ordemInicial: modulos.length
    });
    modulos = [...modulos, ...nichos];
  }
  if (modulos.length === 0) avisos.push("Sala sem espa\xE7o para rack. Verifique as dimens\xF5es.");
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Sala",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Rack de TV na parede ${parede}`,
      prefs.com_painel !== false ? "Painel ripado decorativo atr\xE1s da TV" : "Sem painel ripado",
      prefs.com_superior !== false ? "Estante de nichos a 175cm do piso" : "Sem estante a\xE9rea"
    ],
    nome_padrao: `Sala \u2014 Home ${largurasRack.reduce((s, l) => s + l, 0)}cm`
  });
}

// src/lib/motor-parametrico/biblioteca-escritorio.ts
var ESCRIVANINHA_ALTURA_CM = 74;
var ESCRIVANINHA_PROFUNDIDADE_CM = 60;
var GAVETEIRO_ESC_ALTURA_CM = 70;
var GAVETEIRO_ESC_PROFUNDIDADE_CM = 50;
var ESTANTE_ESC_ALTURA_CM = 70;
var ESTANTE_ESC_PROFUNDIDADE_CM = 30;
var ESTANTE_ESC_INICIO_Y_CM = 120;
var publicado4 = "2026-06-09T00:00:00Z";
var cfgBaseEsc = {
  tipo_porta: "dobradica",
  num_portas: 0,
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
  ferragem: "nacional",
  tipo_puxador: "perfil_aluminio"
};
function criarEscrivaninha(largura_cm) {
  return {
    id: `escrivaninha_${largura_cm}`,
    codigo: `escrivaninha_${largura_cm}`,
    nome: `Bancada de Trabalho ${largura_cm}cm`,
    versao: 1,
    categorias: ["escritorio"],
    tipo: "escrivaninha",
    largura: { min_cm: 60, max_cm: 200, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 72, max_cm: 78, padrao_cm: ESCRIVANINHA_ALTURA_CM, passo_cm: 2 },
    profundidade: { min_cm: 50, max_cm: 70, padrao_cm: ESCRIVANINHA_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgBaseEsc,
      num_portas: 0,
      num_gavetas: largura_cm >= 100 ? 2 : 1,
      num_prateleiras: 0
    },
    limites: {
      num_portas: { min: 0, max: 2 },
      num_gavetas: { min: 0, max: 3 },
      num_prateleiras: { min: 0, max: 1 },
      tipos_porta_validos: ["dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      ...regrasGaveta()
    ],
    regras_ferragens: [
      regraCorredicaGaveta(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    norma_referencia: "Bancada de trabalho: altura ergon\xF4mica 72\u201375cm (NR-17)",
    ativo: true,
    publicado_em: publicado4
  };
}
function criarGaveteiroEsc(largura_cm) {
  return {
    id: `gaveteiro_esc_${largura_cm}`,
    codigo: `gaveteiro_esc_${largura_cm}`,
    nome: `Gaveteiro ${largura_cm}cm`,
    versao: 1,
    categorias: ["escritorio"],
    tipo: "gaveta_bloco",
    largura: { min_cm: 35, max_cm: 50, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 65, max_cm: 72, padrao_cm: GAVETEIRO_ESC_ALTURA_CM, passo_cm: 2 },
    profundidade: { min_cm: 45, max_cm: 55, padrao_cm: GAVETEIRO_ESC_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgBaseEsc,
      num_portas: 0,
      num_gavetas: 4,
      num_prateleiras: 0
    },
    limites: {
      num_portas: { min: 0, max: 0 },
      num_gavetas: { min: 2, max: 5 },
      num_prateleiras: { min: 0, max: 0 },
      tipos_porta_validos: ["dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      ...regrasGaveta()
    ],
    regras_ferragens: [
      regraCorredicaGaveta(),
      regraPuxadores(),
      regraMinifix(),
      regraPes()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    ativo: true,
    publicado_em: publicado4
  };
}
function criarEstanteEsc(largura_cm) {
  return {
    id: `estante_esc_${largura_cm}`,
    codigo: `estante_esc_${largura_cm}`,
    nome: `Estante de Prateleiras ${largura_cm}cm`,
    versao: 1,
    categorias: ["escritorio"],
    tipo: "estante",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 50, max_cm: 100, padrao_cm: ESTANTE_ESC_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 25, max_cm: 35, padrao_cm: ESTANTE_ESC_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseEsc,
      num_portas: largura_cm >= 80 ? 2 : 0,
      num_prateleiras: 3,
      tem_pes_regulaveis: false
    },
    limites: {
      num_portas: { min: 0, max: 2 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 1, max: 5 },
      tipos_porta_validos: ["dobradica", "correr"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: false
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica()
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraPuxadores(),
      regraMinifix()
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: ESTANTE_ESC_INICIO_Y_CM,
      folga_teto_min_cm: 10,
      afastamento_lateral_cm: 0,
      permite_sequencia: true
    },
    ativo: true,
    publicado_em: publicado4
  };
}
var MODULOS_ESCRIVANINHA = [
  criarEscrivaninha(80),
  criarEscrivaninha(100),
  criarEscrivaninha(120),
  criarEscrivaninha(140),
  criarEscrivaninha(160)
];
var MODULOS_GAVETEIRO_ESC = [
  criarGaveteiroEsc(40),
  criarGaveteiroEsc(45),
  criarGaveteiroEsc(50)
];
var MODULOS_ESTANTE_ESC = [
  criarEstanteEsc(50),
  criarEstanteEsc(60),
  criarEstanteEsc(70),
  criarEstanteEsc(80),
  criarEstanteEsc(90)
];
var BIBLIOTECA_ESCRITORIO = {
  ...Object.fromEntries(MODULOS_ESCRIVANINHA.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_GAVETEIRO_ESC.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_ESTANTE_ESC.map((m) => [m.codigo, m]))
};
function buscarPorLargura4(familia, largura_cm) {
  return familia.find((m) => m.largura.padrao_cm === largura_cm) ?? familia.reduce(
    (maisProx, m) => Math.abs(m.largura.padrao_cm - largura_cm) < Math.abs(maisProx.largura.padrao_cm - largura_cm) ? m : maisProx
  );
}
var getTemplateEscrivaninha = (l) => buscarPorLargura4(MODULOS_ESCRIVANINHA, l);
var getTemplateGaveteiroEsc = (l) => buscarPorLargura4(MODULOS_GAVETEIRO_ESC, l);
var getTemplateEstanteEsc = (l) => buscarPorLargura4(MODULOS_ESTANTE_ESC, l);

// src/lib/motor-parametrico/layout-escritorio.ts
var LARGURAS_BANCADA = [160, 140, 120, 100, 80];
var LARGURAS_ESTANTE = [90, 80, 70, 60, 50];
var GAVETEIRO_LARGURA_CM = 45;
function gerarLayoutEscritorio(ambiente, prefs) {
  const avisos = [];
  const parede = prefs.parede_principal ?? paredesPorComprimento(ambiente)[0];
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = seg?.inicio_cm ?? 0;
  const disponivel = seg?.comprimento_cm ?? comp;
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);
  let modulos = [];
  let cursor = inicio;
  let restante = disponivel;
  const incluiGaveteiro = prefs.com_gaveteiro !== false && restante >= GAVETEIRO_LARGURA_CM + 80;
  if (incluiGaveteiro) {
    const gaveteiros = instanciarModulos([GAVETEIRO_LARGURA_CM], {
      parede,
      inicio_cm: cursor,
      posicao_y_cm: 0,
      altura_cm: GAVETEIRO_ESC_ALTURA_CM,
      profundidade_cm: GAVETEIRO_ESC_PROFUNDIDADE_CM,
      prefixo: "gaveteiro_esc",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateGaveteiroEsc,
      templateFallback: MODULOS_GAVETEIRO_ESC[1],
      configDe: () => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: 0,
        num_gavetas: 4,
        num_prateleiras: 0
      })
    });
    modulos = [...modulos, ...gaveteiros];
    cursor += GAVETEIRO_LARGURA_CM;
    restante -= GAVETEIRO_LARGURA_CM;
  }
  const largurasBancada = encaixarLarguras(restante, LARGURAS_BANCADA, 120, 80);
  const bancadas = instanciarModulos(largurasBancada, {
    parede,
    inicio_cm: cursor,
    posicao_y_cm: 0,
    altura_cm: ESCRIVANINHA_ALTURA_CM,
    profundidade_cm: ESCRIVANINHA_PROFUNDIDADE_CM,
    prefixo: "escrivaninha",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateEscrivaninha,
    templateFallback: MODULOS_ESCRIVANINHA[1],
    configDe: (largura) => configPadrao({
      ferragem: prefs.ferragem,
      num_portas: 0,
      num_gavetas: largura >= 100 ? 2 : 1,
      num_prateleiras: 0
    }),
    ordemInicial: modulos.length
  });
  modulos = [...modulos, ...bancadas];
  if (prefs.com_superior !== false) {
    const largurasEstante = encaixarLarguras(disponivel, LARGURAS_ESTANTE, 80, 50);
    const estantes = instanciarModulos(largurasEstante, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: ESTANTE_ESC_INICIO_Y_CM,
      altura_cm: ESTANTE_ESC_ALTURA_CM,
      profundidade_cm: ESTANTE_ESC_PROFUNDIDADE_CM,
      prefixo: "estante_esc",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateEstanteEsc,
      templateFallback: MODULOS_ESTANTE_ESC[2],
      configDe: (largura) => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: largura >= 80 ? 2 : 0,
        num_prateleiras: 3,
        tem_pes_regulaveis: false
      }),
      ordemInicial: modulos.length
    });
    modulos = [...modulos, ...estantes];
  }
  if (modulos.length === 0) avisos.push("Escrit\xF3rio sem espa\xE7o para bancada. Verifique as dimens\xF5es.");
  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Escrit\xF3rio",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Bancada de trabalho na parede ${parede}`,
      incluiGaveteiro ? "Gaveteiro-bloco de 4 gavetas" : "Sem gaveteiro",
      prefs.com_superior !== false ? "Estante de prateleiras a 120cm do piso" : "Sem estante a\xE9rea"
    ],
    nome_padrao: `Escrit\xF3rio \u2014 Home Office ${disponivel}cm`
  });
}

// src/lib/motor-parametrico/adapters.ts
function projetoToMovelInput(projeto) {
  return projeto.modulos.filter(isModuloMarcenaria).map(moduloToMovelInput);
}
function isModuloMarcenaria(modulo) {
  return modulo.largura_cm > 0 && modulo.altura_cm > 0;
}
function moduloToMovelInput(modulo) {
  const cfg = modulo.configuracao;
  return {
    id: modulo.id,
    nome: modulo.nome_display,
    largura_cm: modulo.largura_cm,
    profundidade_cm: modulo.profundidade_cm,
    altura_cm: modulo.altura_cm,
    portas: cfg.num_portas,
    tipo_porta: adaptarTipoPorta(cfg.tipo_porta),
    gavetas: cfg.num_gavetas,
    prateleiras: cfg.num_prateleiras,
    tem_fundo: cfg.tem_fundo,
    tem_rodape: cfg.tem_rodape,
    tem_pes: cfg.tem_pes_regulaveis,
    pe_altura_cm: cfg.altura_pes_cm,
    tem_roda_teto: cfg.tem_roda_teto,
    altura_teto_cm: cfg.altura_teto_cm,
    mdf_id: modulo.material_corpo.id,
    mdf_caixa_id: modulo.material_corpo.id,
    mdf_externo_id: modulo.material_porta?.id ?? modulo.material_corpo.id,
    fundo_id: modulo.material_fundo?.id ?? modulo.material_corpo.id
  };
}
function adaptarTipoPorta(tipo) {
  const mapa = {
    dobradica: "abrir",
    correr: "correr",
    basculante: "abrir",
    aberta: "sem",
    vidro: "abrir_vidro",
    espelho: "abrir_espelho",
    ripado: "sem"
  };
  return mapa[tipo] ?? "abrir";
}

// src/lib/motor-parametrico/ambiente.ts
function calcularSegmentosLivres(parede) {
  if (parede.aberturas.length === 0) {
    return [{
      inicio_cm: 0,
      fim_cm: parede.comprimento_cm,
      comprimento_cm: parede.comprimento_cm,
      altura_util_cm: parede.altura_cm,
      bloqueado_por_janela_baixa: false
    }];
  }
  const zonas = parede.aberturas.map((ab) => {
    if (ab._tipo === "porta") {
      const p = ab;
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
  const janelasLow = parede.aberturas.filter(
    (ab) => ab._tipo === "janela" && ab.bloqueia_base
  );
  const segmentos = [];
  let cursor = 0;
  for (const [inicio, fim] of zonas) {
    if (inicio > cursor) {
      const seg = {
        inicio_cm: cursor,
        fim_cm: inicio,
        comprimento_cm: inicio - cursor,
        altura_util_cm: parede.altura_cm,
        bloqueado_por_janela_baixa: false
      };
      seg.bloqueado_por_janela_baixa = janelasLow.some(
        (j) => j.posicao_cm < seg.fim_cm && j.posicao_cm + j.largura_cm > seg.inicio_cm
      );
      if (seg.comprimento_cm >= 1) segmentos.push(seg);
    }
    cursor = Math.max(cursor, fim);
  }
  if (cursor < parede.comprimento_cm) {
    const seg = {
      inicio_cm: cursor,
      fim_cm: parede.comprimento_cm,
      comprimento_cm: parede.comprimento_cm - cursor,
      altura_util_cm: parede.altura_cm,
      bloqueado_por_janela_baixa: false
    };
    seg.bloqueado_por_janela_baixa = janelasLow.some(
      (j) => j.posicao_cm < seg.fim_cm && j.posicao_cm + j.largura_cm > seg.inicio_cm
    );
    if (seg.comprimento_cm >= 1) segmentos.push(seg);
  }
  return segmentos;
}
function plantaToAmbiente(planta, id = `amb_${Date.now()}`) {
  const largura = planta.largura_cm;
  const profundidade = planta.profundidade_cm;
  const altura = planta.altura_cm || 270;
  const toParede = (s) => ["top", "bottom", "left", "right"].includes(s) ? s : "bottom";
  const aberturasPorParede = {
    top: [],
    bottom: [],
    left: [],
    right: []
  };
  if (planta.porta_principal) {
    const p = planta.porta_principal;
    const parede = toParede(p.parede);
    const compParede = parede === "top" || parede === "bottom" ? largura : profundidade;
    const porta = {
      id: "porta_principal",
      _tipo: "porta",
      parede,
      posicao_cm: Math.round(p.x_pct * compParede),
      largura_cm: p.largura_cm,
      subtipo: "simples",
      altura_cm: 210,
      zona_exclusao_cm: 90,
      lado_dobradica: "esquerda",
      sentido_abertura: "para_dentro"
    };
    aberturasPorParede[parede].push(porta);
  }
  (planta.portas_secundarias || []).forEach((p, i) => {
    const parede = toParede(p.parede);
    const compParede = parede === "top" || parede === "bottom" ? largura : profundidade;
    const porta = {
      id: `porta_sec_${i}`,
      _tipo: "porta",
      parede,
      posicao_cm: Math.round(p.x_pct * compParede),
      largura_cm: p.largura_cm,
      subtipo: "simples",
      altura_cm: 210,
      zona_exclusao_cm: 0,
      lado_dobradica: "esquerda",
      sentido_abertura: "para_dentro"
    };
    aberturasPorParede[parede].push(porta);
  });
  (planta.janelas || []).forEach((j, i) => {
    const parede = toParede(j.parede);
    const compParede = parede === "top" || parede === "bottom" ? largura : profundidade;
    const peitoril = 100;
    const verga = altura - 30;
    const janela = {
      id: `janela_${i}`,
      _tipo: "janela",
      parede,
      posicao_cm: Math.round(j.x_pct * compParede),
      largura_cm: j.largura_cm,
      subtipo: "abrir",
      altura_peitoril_cm: peitoril,
      altura_verga_cm: verga,
      bloqueia_base: peitoril < 90,
      bloqueia_aereo: verga > altura - 40
    };
    aberturasPorParede[parede].push(janela);
  });
  const buildParede = (id2) => {
    const comprimento = id2 === "top" || id2 === "bottom" ? largura : profundidade;
    const aberturas = aberturasPorParede[id2];
    const parede = {
      id: id2,
      comprimento_cm: comprimento,
      espessura_cm: 15,
      altura_cm: altura,
      aberturas,
      segmentos_livres: [],
      obstaculos_adjacentes: []
    };
    parede.segmentos_livres = calcularSegmentosLivres(parede);
    return parede;
  };
  const ambiente = {
    id,
    dimensoes: {
      largura_cm: largura,
      profundidade_cm: profundidade,
      altura_cm: altura,
      area_m2: Math.round(largura * profundidade / 1e4 * 100) / 100
    },
    paredes: {
      top: buildParede("top"),
      bottom: buildParede("bottom"),
      left: buildParede("left"),
      right: buildParede("right")
    },
    obstaculos: [],
    pontos_eletricos: [],
    pontos_hidraulicos: [],
    fonte: "imagem",
    escala_detectada: null,
    confianca_extracao: 0.7,
    extraido_em: (/* @__PURE__ */ new Date()).toISOString()
  };
  return ambiente;
}
function criarAmbienteManual(params) {
  const {
    largura_cm,
    profundidade_cm,
    altura_cm,
    porta_parede,
    porta_largura_cm = 90,
    janelas_paredes = []
  } = params;
  const aberturasPorParede = {
    top: [],
    bottom: [],
    left: [],
    right: []
  };
  if (porta_parede) {
    const compParede = porta_parede === "top" || porta_parede === "bottom" ? largura_cm : profundidade_cm;
    const porta = {
      id: "porta_principal",
      _tipo: "porta",
      parede: porta_parede,
      posicao_cm: Math.round((compParede - porta_largura_cm) / 2),
      largura_cm: porta_largura_cm,
      subtipo: "simples",
      altura_cm: 210,
      zona_exclusao_cm: 90,
      lado_dobradica: "esquerda",
      sentido_abertura: "para_dentro"
    };
    aberturasPorParede[porta_parede].push(porta);
  }
  janelas_paredes.forEach((pId, i) => {
    const compParede = pId === "top" || pId === "bottom" ? largura_cm : profundidade_cm;
    const janela = {
      id: `janela_${i}`,
      _tipo: "janela",
      parede: pId,
      posicao_cm: Math.round(compParede * 0.2),
      largura_cm: Math.round(compParede * 0.4),
      subtipo: "abrir",
      altura_peitoril_cm: 100,
      altura_verga_cm: altura_cm - 30,
      bloqueia_base: false,
      bloqueia_aereo: false
    };
    aberturasPorParede[pId].push(janela);
  });
  const buildParede = (id) => {
    const comprimento = id === "top" || id === "bottom" ? largura_cm : profundidade_cm;
    const aberturas = aberturasPorParede[id];
    const parede = {
      id,
      comprimento_cm: comprimento,
      espessura_cm: 15,
      altura_cm,
      aberturas,
      segmentos_livres: [],
      obstaculos_adjacentes: []
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
      area_m2: Math.round(largura_cm * profundidade_cm / 1e4 * 100) / 100
    },
    paredes: {
      top: buildParede("top"),
      bottom: buildParede("bottom"),
      left: buildParede("left"),
      right: buildParede("right")
    },
    obstaculos: [],
    pontos_eletricos: [],
    pontos_hidraulicos: [],
    fonte: "manual",
    escala_detectada: null,
    confianca_extracao: 1,
    extraido_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/lib/motor-parametrico/engenharia.ts
var DESPERDICIO_CHAPA_PCT = 15;
var DESPERDICIO_FITA_PCT = 15;
function todasAsPecas(projeto) {
  return projeto.modulos.flatMap((m) => m.pecas);
}
function todasAsFerragens(projeto) {
  return projeto.modulos.flatMap((m) => m.ferragens);
}
function areaM2(largura_mm, comprimento_mm) {
  return largura_mm * comprimento_mm / 1e6;
}
function arredondar(valor, casas = 2) {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}
function metrosFitaPeca(p) {
  const l_m = p.largura_mm / 1e3;
  const c_m = p.comprimento_mm / 1e3;
  let total = 0;
  if (p.fita_borda.esquerda) total += c_m;
  if (p.fita_borda.direita) total += c_m;
  if (p.fita_borda.topo) total += l_m;
  if (p.fita_borda.base) total += l_m;
  return total * p.quantidade;
}
function consolidarPecas(projeto) {
  const mapa = /* @__PURE__ */ new Map();
  for (const p of todasAsPecas(projeto)) {
    const fb = p.fita_borda;
    const chave = `${p.material.id}|${p.espessura_mm}|${p.largura_mm}x${p.comprimento_mm}|${fb.esquerda ? 1 : 0}${fb.direita ? 1 : 0}${fb.topo ? 1 : 0}${fb.base ? 1 : 0}`;
    const existente = mapa.get(chave);
    const areaU = areaM2(p.largura_mm, p.comprimento_mm);
    if (existente) {
      existente.quantidade_total += p.quantidade;
      existente.area_total_m2 = arredondar(existente.area_unitaria_m2 * existente.quantidade_total);
      if (!existente.origens.includes(p.etiqueta_producao)) {
        existente.origens.push(p.etiqueta_producao);
      }
    } else {
      mapa.set(chave, {
        chave,
        material_id: p.material.id,
        material_nome: p.material.nome_display,
        espessura_mm: p.espessura_mm,
        largura_mm: p.largura_mm,
        comprimento_mm: p.comprimento_mm,
        quantidade_total: p.quantidade,
        area_unitaria_m2: arredondar(areaU, 4),
        area_total_m2: arredondar(areaU * p.quantidade),
        fita_borda: { ...p.fita_borda },
        origens: [p.etiqueta_producao]
      });
    }
  }
  return [...mapa.values()].sort((a, b) => b.area_total_m2 - a.area_total_m2);
}
function consolidarFerragens(projeto) {
  const mapa = /* @__PURE__ */ new Map();
  for (const f of todasAsFerragens(projeto)) {
    const chave = `${f.tipo}|${f.marca}`;
    const existente = mapa.get(chave);
    if (existente) {
      existente.quantidade_total += f.quantidade;
      existente.custo_total = arredondar(existente.preco_custo_unit * existente.quantidade_total);
    } else {
      mapa.set(chave, {
        tipo: f.tipo,
        marca: f.marca,
        descricao: f.descricao,
        quantidade_total: f.quantidade,
        preco_custo_unit: f.preco_custo_unit,
        custo_total: arredondar(f.preco_custo_unit * f.quantidade)
      });
    }
  }
  return [...mapa.values()].sort((a, b) => b.quantidade_total - a.quantidade_total);
}
function consolidarMateriais(projeto) {
  const mapa = /* @__PURE__ */ new Map();
  for (const p of todasAsPecas(projeto)) {
    const chave = `${p.material.id}|${p.espessura_mm}`;
    const area = areaM2(p.largura_mm, p.comprimento_mm) * p.quantidade;
    const existente = mapa.get(chave);
    if (existente) {
      existente.area += area;
    } else {
      mapa.set(chave, {
        espessura: p.espessura_mm,
        nome: p.material.nome_display,
        area,
        preco: p.material.preco_custo_chapa
      });
    }
  }
  const fator = 1 + DESPERDICIO_CHAPA_PCT / 100;
  return [...mapa.values()].map((m) => {
    const areaComDesperdicio = m.area * fator;
    const chapas = Math.ceil(areaComDesperdicio / AREA_CHAPA_M2);
    return {
      espessura_mm: m.espessura,
      material_nome: m.nome,
      area_total_m2: arredondar(m.area),
      chapas_necessarias: chapas,
      preco_custo_chapa: m.preco,
      custo_total: arredondar(chapas * m.preco)
    };
  }).sort((a, b) => b.espessura_mm - a.espessura_mm);
}
function consolidarFita(projeto) {
  const liquidos = todasAsPecas(projeto).reduce((s, p) => s + metrosFitaPeca(p), 0);
  const fator = 1 + DESPERDICIO_FITA_PCT / 100;
  return {
    metros_liquidos: arredondar(liquidos, 1),
    metros_com_desperdicio: arredondar(liquidos * fator, 1)
  };
}
function gerarListaCompras(projeto, estoque = {}) {
  const materiais = consolidarMateriais(projeto);
  const itens = materiais.map((m) => {
    const materialId = encontrarMaterialId(projeto, m.espessura_mm);
    const emEstoque = estoque[materialId] ?? 0;
    const necessario = m.chapas_necessarias;
    const comprar = Math.max(0, necessario - emEstoque);
    return {
      material_id: materialId,
      descricao: `${m.material_nome} (${m.espessura_mm}mm)`,
      quantidade_necessaria: necessario,
      quantidade_em_estoque: emEstoque,
      quantidade_a_comprar: comprar,
      unidade: "chapa",
      preco_referencia: m.preco_custo_chapa,
      urgencia: "normal"
    };
  });
  const itensParaComprar = itens.filter((i) => i.quantidade_a_comprar > 0);
  const custoTotal = itensParaComprar.reduce(
    (s, i) => s + i.quantidade_a_comprar * i.preco_referencia,
    0
  );
  return {
    itens,
    resumo: {
      itens_em_estoque: itens.length - itensParaComprar.length,
      itens_para_comprar: itensParaComprar.length,
      custo_total_estimado: arredondar(custoTotal),
      prazo_max_entrega_dias: 0
    },
    pedidos_sugeridos: [],
    gerado_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function encontrarMaterialId(projeto, espessura) {
  for (const m of projeto.modulos) {
    const p = m.pecas.find((pc) => pc.espessura_mm === espessura);
    if (p) return p.material.id;
  }
  return `material_${espessura}mm`;
}
function gerarEngenharia(projeto) {
  const pecas = consolidarPecas(projeto);
  const ferragens = consolidarFerragens(projeto);
  const materiais = consolidarMateriais(projeto);
  const fita_borda = consolidarFita(projeto);
  const num_pecas_total = pecas.reduce((s, p) => s + p.quantidade_total, 0);
  const num_ferragens_total = ferragens.reduce((s, f) => s + f.quantidade_total, 0);
  const num_chapas_total = materiais.reduce((s, m) => s + m.chapas_necessarias, 0);
  const custo_materiais = arredondar(materiais.reduce((s, m) => s + m.custo_total, 0));
  const custo_ferragens = arredondar(ferragens.reduce((s, f) => s + f.custo_total, 0));
  return {
    pecas,
    ferragens,
    materiais,
    fita_borda,
    resumo: {
      num_pecas_total,
      num_pecas_unicas: pecas.length,
      num_ferragens_total,
      num_chapas_total,
      custo_materiais,
      custo_ferragens,
      custo_total: arredondar(custo_materiais + custo_ferragens)
    },
    gerado_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/lib/motor-parametrico/orcamento-inteligente.ts
var PRECO_FERRAGEM_REF = {
  dobradica_35mm_110grau: 4.5,
  dobradica_35mm_165grau: 8,
  dobradica_push_open: 12,
  corredicao_tandem_300mm: 35,
  corredicao_tandem_400mm: 45,
  corredicao_tandem_500mm: 55,
  corredicao_lateral_porta: 80,
  puxador_perfil_alu_1200mm: 45,
  puxador_alu_128mm: 12,
  puxador_push_open: 0,
  ajustador_pe_100mm: 3.5,
  ajustador_pe_150mm: 4.5,
  rodape_pvc_100mm: 18,
  cabideiro_simples: 25,
  perfil_led_1m: 60,
  amortecedor_soft_close: 8,
  minifix_15mm: 0.8,
  cavilha_8x30mm: 0.15
};
var CONFIG_CUSTO_PADRAO = {
  valor_hora_corte: 45,
  valor_hora_bordagem: 40,
  valor_hora_usinagem: 50,
  valor_hora_montagem: 55,
  valor_hora_acabamento: 60,
  min_por_peca_corte: 3,
  min_por_metro_fita: 1.5,
  min_por_modulo_usinagem: 8,
  min_por_modulo_montagem: 25,
  min_por_m2_acabamento: 15,
  valor_hora_instalacao: 65,
  min_por_modulo_instalacao: 20,
  custo_por_km: 2.5,
  distancia_padrao_km: 20,
  overhead_pct: 18,
  regime_tributario: "Simples Nacional",
  aliquota_imposto_pct: 6,
  comissao_pct: 5,
  margem_desejada_pct: 45,
  desperdicio_material_pct: 15
};
var AJUSTES_VERSAO = {
  economica: { mult_ferragem: 1, mult_material: 1, margem_pct: 35, rotulo: "Econ\xF4mica \u2014 ferragem nacional, MDF 15mm" },
  intermediaria: { mult_ferragem: 1.5, mult_material: 1.1, margem_pct: 45, rotulo: "Intermedi\xE1ria \u2014 ferragem refor\xE7ada, acabamento premium" },
  premium: { mult_ferragem: 2.4, mult_material: 1.35, margem_pct: 58, rotulo: "Premium \u2014 ferragem Blum/H\xE4fele, MDF 18mm, soft-close" }
};
function arredondar2(v, casas = 2) {
  const f = 10 ** casas;
  return Math.round(v * f) / f;
}
function linhaProducao(horas, valorHora) {
  const horasArred = arredondar2(horas, 2);
  return {
    horas_estimadas: horasArred,
    valor_hora: valorHora,
    total: arredondar2(horasArred * valorHora)
  };
}
function custoFerragensReferencia(projeto) {
  const consolidadas = consolidarFerragens(projeto);
  return consolidadas.reduce(
    (s, f) => s + f.quantidade_total * (PRECO_FERRAGEM_REF[f.tipo] ?? 0),
    0
  );
}
function calcularCustoMateriais(projeto, cfg, ajuste) {
  const eng = gerarEngenharia(projeto);
  const linhas = eng.materiais.map((m) => ({
    descricao: `${m.material_nome} (${m.espessura_mm}mm)`,
    material_id: `mat_${m.espessura_mm}mm`,
    quantidade: m.chapas_necessarias,
    unidade: "chapa",
    preco_custo_unit: arredondar2(m.preco_custo_chapa * ajuste.mult_material),
    total: arredondar2(m.chapas_necessarias * m.preco_custo_chapa * ajuste.mult_material)
  }));
  const custoFitaMetro = 3.5;
  linhas.push({
    descricao: "Fita de borda",
    material_id: "fita_borda",
    quantidade: eng.fita_borda.metros_com_desperdicio,
    unidade: "m",
    preco_custo_unit: custoFitaMetro,
    total: arredondar2(eng.fita_borda.metros_com_desperdicio * custoFitaMetro)
  });
  const subtotal_chapas = arredondar2(linhas.reduce((s, l) => s + l.total, 0));
  const subtotal_ferragens = arredondar2(custoFerragensReferencia(projeto) * ajuste.mult_ferragem);
  return {
    linhas,
    subtotal_chapas,
    subtotal_ferragens,
    desperdicio_pct: cfg.desperdicio_material_pct,
    total: arredondar2(subtotal_chapas + subtotal_ferragens)
  };
}
function calcularCustoProducao(projeto, cfg) {
  const eng = gerarEngenharia(projeto);
  const numModulos = projeto.modulos.length;
  const numPecas = eng.resumo.num_pecas_total;
  const metrosFita = eng.fita_borda.metros_com_desperdicio;
  const areaFrontal = projeto.metricas.area_frontal_m2;
  const h = (min) => min / 60;
  const corte_cnc = linhaProducao(h(numPecas * cfg.min_por_peca_corte), cfg.valor_hora_corte);
  const bordagem = linhaProducao(h(metrosFita * cfg.min_por_metro_fita), cfg.valor_hora_bordagem);
  const usinagem = linhaProducao(h(numModulos * cfg.min_por_modulo_usinagem), cfg.valor_hora_usinagem);
  const montagem = linhaProducao(h(numModulos * cfg.min_por_modulo_montagem), cfg.valor_hora_montagem);
  const acabamento = linhaProducao(h(areaFrontal * cfg.min_por_m2_acabamento), cfg.valor_hora_acabamento);
  const subtotal = arredondar2(
    corte_cnc.total + bordagem.total + usinagem.total + montagem.total + acabamento.total
  );
  return { corte_cnc, bordagem, usinagem, montagem, acabamento, subtotal };
}
function calcularCustoInstalacao(projeto, cfg) {
  const numModulos = projeto.modulos.length;
  const horas = numModulos * cfg.min_por_modulo_instalacao / 60;
  const custoMaoObra = horas * cfg.valor_hora_instalacao;
  const custoDeslocamento = cfg.distancia_padrao_km * 2 * cfg.custo_por_km;
  return {
    horas_equipe: arredondar2(horas, 2),
    valor_hora: cfg.valor_hora_instalacao,
    distancia_km: cfg.distancia_padrao_km,
    custo_por_km: cfg.custo_por_km,
    subtotal: arredondar2(custoMaoObra + custoDeslocamento)
  };
}
function calcularCustosIndiretos(baseDirecta, precoVendaEstimado, cfg) {
  const overheadTotal = arredondar2(baseDirecta * (cfg.overhead_pct / 100));
  const impostoTotal = arredondar2(precoVendaEstimado * (cfg.aliquota_imposto_pct / 100));
  const comissaoTotal = arredondar2(precoVendaEstimado * (cfg.comissao_pct / 100));
  return {
    overhead: { pct: cfg.overhead_pct, base: baseDirecta, total: overheadTotal },
    impostos: {
      regime: cfg.regime_tributario,
      aliquota_pct: cfg.aliquota_imposto_pct,
      base: precoVendaEstimado,
      total: impostoTotal
    },
    comissao: { pct: cfg.comissao_pct, base: precoVendaEstimado, total: comissaoTotal },
    subtotal: arredondar2(overheadTotal + impostoTotal + comissaoTotal)
  };
}
function gerarItensComerciais(projeto, custoTotal, precoVenda) {
  const fatorVenda = custoTotal > 0 ? precoVenda / custoTotal : 1;
  const areaTotal = projeto.modulos.reduce((s, m) => s + m.largura_cm * m.altura_cm, 0) || 1;
  return projeto.modulos.map((m, i) => {
    const peso = m.largura_cm * m.altura_cm / areaTotal;
    const custoModulo = arredondar2(custoTotal * peso);
    const precoModulo = arredondar2(custoModulo * fatorVenda);
    return {
      id: `item_${m.id}`,
      modulo_instanciado_id: m.id,
      ordem: i,
      descricao: m.nome_display,
      quantidade: 1,
      unidade: "un",
      preco_custo: custoModulo,
      preco_unitario: precoModulo,
      total: precoModulo,
      observacao: `${m.largura_cm}\xD7${m.altura_cm}\xD7${m.profundidade_cm}cm`
    };
  });
}
function calcularOrcamentoCompleto(projeto, versao = "intermediaria", config = CONFIG_CUSTO_PADRAO) {
  const ajuste = AJUSTES_VERSAO[versao];
  const custo_materiais = calcularCustoMateriais(projeto, config, ajuste);
  const custo_producao = calcularCustoProducao(projeto, config);
  const custo_instalacao = calcularCustoInstalacao(projeto, config);
  const baseDirecta = arredondar2(
    custo_materiais.total + custo_producao.subtotal + custo_instalacao.subtotal
  );
  const margemPct = ajuste.margem_pct;
  const overheadPreliminar = baseDirecta * (config.overhead_pct / 100);
  const custoComOverhead = baseDirecta + overheadPreliminar;
  const precoVendaPreliminar = custoComOverhead / (1 - margemPct / 100);
  const custos_indiretos = calcularCustosIndiretos(baseDirecta, precoVendaPreliminar, config);
  const custo_total = arredondar2(baseDirecta + custos_indiretos.subtotal);
  const preco_venda = arredondar2(custo_total / (1 - margemPct / 100));
  const preco_minimo = arredondar2(custo_total * 1.05);
  const lucro_bruto = arredondar2(preco_venda - custo_total);
  const lucro_pct = preco_venda > 0 ? arredondar2(lucro_bruto / preco_venda * 100, 1) : 0;
  const analise_financeira = {
    custo_total,
    margem_desejada_pct: margemPct,
    preco_venda,
    preco_minimo,
    lucro_bruto,
    lucro_pct,
    roi_estimado_dias: 0
  };
  const itens = gerarItensComerciais(projeto, custo_total, preco_venda);
  const horasProducao = custo_producao.corte_cnc.horas_estimadas + custo_producao.bordagem.horas_estimadas + custo_producao.usinagem.horas_estimadas + custo_producao.montagem.horas_estimadas + custo_producao.acabamento.horas_estimadas;
  const prazo_producao_dias = Math.max(3, Math.ceil(horasProducao / 8));
  const prazo_instalacao_dias = Math.max(1, Math.ceil(custo_instalacao.horas_equipe / 8));
  return {
    versao,
    custo_materiais,
    custo_producao,
    custo_instalacao,
    custos_indiretos,
    analise_financeira,
    itens,
    prazo_producao_dias,
    prazo_instalacao_dias,
    gerado_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function gerarTresVersoes(projeto, config = CONFIG_CUSTO_PADRAO) {
  const economica = calcularOrcamentoCompleto(projeto, "economica", config);
  const intermediaria = calcularOrcamentoCompleto(projeto, "intermediaria", config);
  const premium = calcularOrcamentoCompleto(projeto, "premium", config);
  return {
    economica,
    intermediaria,
    premium,
    comparativo: {
      preco_economica: economica.analise_financeira.preco_venda,
      preco_intermediaria: intermediaria.analise_financeira.preco_venda,
      preco_premium: premium.analise_financeira.preco_venda
    }
  };
}

// src/lib/motor-parametrico/nesting.ts
var KERF_MM = 4;
var MARGEM_CHAPA_MM = 10;
var MaxRectsBin = class {
  largura;
  altura;
  livres;
  colocacoes = [];
  constructor(largura, altura) {
    this.largura = largura;
    this.altura = altura;
    this.livres = [{
      x: MARGEM_CHAPA_MM,
      y: MARGEM_CHAPA_MM,
      w: largura - 2 * MARGEM_CHAPA_MM,
      h: altura - 2 * MARGEM_CHAPA_MM
    }];
  }
  /** Tenta inserir uma peça. Retorna true se coube. */
  inserir(peca) {
    const escolha = this.melhorPosicao(peca);
    if (!escolha) return false;
    this.colocar(escolha);
    return true;
  }
  /** Best Short Side Fit: minimiza a menor sobra do retângulo livre. */
  melhorPosicao(peca) {
    let melhor = null;
    let melhorCurto = Infinity;
    let melhorLongo = Infinity;
    for (const livre of this.livres) {
      if (peca.w <= livre.w && peca.h <= livre.h) {
        const sobraH = livre.w - peca.w;
        const sobraV = livre.h - peca.h;
        const curto = Math.min(sobraH, sobraV);
        const longo = Math.max(sobraH, sobraV);
        if (curto < melhorCurto || curto === melhorCurto && longo < melhorLongo) {
          melhorCurto = curto;
          melhorLongo = longo;
          melhor = { peca, x: livre.x, y: livre.y, w: peca.w, h: peca.h, rotacionada: false };
        }
      }
      if (peca.pode_rotacionar && peca.h <= livre.w && peca.w <= livre.h) {
        const sobraH = livre.w - peca.h;
        const sobraV = livre.h - peca.w;
        const curto = Math.min(sobraH, sobraV);
        const longo = Math.max(sobraH, sobraV);
        if (curto < melhorCurto || curto === melhorCurto && longo < melhorLongo) {
          melhorCurto = curto;
          melhorLongo = longo;
          melhor = { peca, x: livre.x, y: livre.y, w: peca.h, h: peca.w, rotacionada: true };
        }
      }
    }
    return melhor;
  }
  /** Coloca a peça e atualiza a lista de retângulos livres. */
  colocar(c) {
    const usado = { x: c.x, y: c.y, w: c.w, h: c.h };
    const novos = [];
    for (const livre of this.livres) {
      if (this.intersecta(usado, livre)) {
        novos.push(...this.dividir(livre, usado));
      } else {
        novos.push(livre);
      }
    }
    this.livres = this.podar(novos);
    this.colocacoes.push(c);
  }
  intersecta(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  /** Divide um retângulo livre subtraindo o usado (gera até 4 sub-retângulos). */
  dividir(livre, usado) {
    const res = [];
    if (usado.x > livre.x) {
      res.push({ x: livre.x, y: livre.y, w: usado.x - livre.x, h: livre.h });
    }
    if (usado.x + usado.w < livre.x + livre.w) {
      res.push({ x: usado.x + usado.w, y: livre.y, w: livre.x + livre.w - (usado.x + usado.w), h: livre.h });
    }
    if (usado.y > livre.y) {
      res.push({ x: livre.x, y: livre.y, w: livre.w, h: usado.y - livre.y });
    }
    if (usado.y + usado.h < livre.y + livre.h) {
      res.push({ x: livre.x, y: usado.y + usado.h, w: livre.w, h: livre.y + livre.h - (usado.y + usado.h) });
    }
    return res.filter((r) => r.w > 1 && r.h > 1);
  }
  /** Remove retângulos livres contidos em outros (poda). */
  podar(rects) {
    const result = [];
    for (let i = 0; i < rects.length; i++) {
      let contido = false;
      for (let j = 0; j < rects.length; j++) {
        if (i !== j && this.contido(rects[i], rects[j])) {
          contido = true;
          break;
        }
      }
      if (!contido) result.push(rects[i]);
    }
    return result;
  }
  contido(a, b) {
    return a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
  }
};
var NAO_CHAPA = /vidro|espelho|maci/i;
function prepararPorMaterial(pecas) {
  const grupos = /* @__PURE__ */ new Map();
  for (const p of pecas) {
    if (NAO_CHAPA.test(p.material.nome_display)) continue;
    const chave = `${p.material.id}|${p.espessura_mm}`;
    const grupo = grupos.get(chave) ?? { material: p.material, itens: [] };
    const podeRotacionar = p.direcao_fio === "indiferente";
    for (let i = 0; i < p.quantidade; i++) {
      grupo.itens.push({
        peca_id: `${p.id}#${i}`,
        w: p.largura_mm + KERF_MM,
        h: p.comprimento_mm + KERF_MM,
        w_real: p.largura_mm,
        h_real: p.comprimento_mm,
        pode_rotacionar: podeRotacionar,
        etiqueta: p.etiqueta_producao
      });
    }
    grupos.set(chave, grupo);
  }
  return grupos;
}
function gerarPlanoNesting(pecas, metrosFitaTotal = 0, opcoes = {}) {
  const grupos = prepararPorMaterial(pecas);
  const chapas = [];
  let numeroChapa = 0;
  for (const { material, itens } of grupos.values()) {
    itens.sort((a, b) => b.w * b.h - a.w * a.h);
    const larguraChapa = material.largura_chapa_mm;
    const alturaChapa = material.comprimento_chapa_mm;
    let pendentes = [...itens];
    while (pendentes.length > 0) {
      const bin = new MaxRectsBin(larguraChapa, alturaChapa);
      const naoCabe = [];
      for (const peca of pendentes) {
        if ((peca.w > larguraChapa - 2 * MARGEM_CHAPA_MM || peca.h > alturaChapa - 2 * MARGEM_CHAPA_MM) && (peca.h > larguraChapa - 2 * MARGEM_CHAPA_MM || peca.w > alturaChapa - 2 * MARGEM_CHAPA_MM)) {
          continue;
        }
        if (!bin.inserir(peca)) naoCabe.push(peca);
      }
      if (bin.colocacoes.length === 0) break;
      chapas.push(montarChapa(++numeroChapa, material, bin, opcoes.com_svg !== false));
      pendentes = naoCabe;
    }
  }
  return montarPlano(chapas, metrosFitaTotal);
}
function montarChapa(numero, material, bin, comSvg) {
  const pecas_alocadas = bin.colocacoes.map((c) => ({
    peca_id: c.peca.peca_id,
    x_mm: c.x,
    y_mm: c.y,
    largura_mm: c.rotacionada ? c.peca.h_real : c.peca.w_real,
    comprimento_mm: c.rotacionada ? c.peca.w_real : c.peca.h_real,
    rotacionada: c.rotacionada,
    etiqueta: c.peca.etiqueta
  }));
  const areaChapa = bin.largura * bin.altura;
  const areaUtil = pecas_alocadas.reduce((s, p) => s + p.largura_mm * p.comprimento_mm, 0);
  const eficiencia = Math.round(areaUtil / areaChapa * 1e3) / 10;
  return {
    id: `chapa_${numero}`,
    numero_sequencial: numero,
    material,
    largura_mm: bin.largura,
    comprimento_mm: bin.altura,
    pecas_alocadas,
    area_util_mm2: Math.round(areaUtil),
    area_desperdicada_mm2: Math.round(areaChapa - areaUtil),
    eficiencia_pct: eficiencia,
    svg_layout: comSvg ? gerarSvgChapa(numero, material, bin.largura, bin.altura, pecas_alocadas) : ""
  };
}
function montarPlano(chapas, metrosFitaTotal) {
  const totalPecas = chapas.reduce((s, c) => s + c.pecas_alocadas.length, 0);
  const areaUtil = chapas.reduce((s, c) => s + c.area_util_mm2, 0);
  const areaTotal = chapas.reduce((s, c) => s + c.largura_mm * c.comprimento_mm, 0);
  const areaDesperdicada = areaTotal - areaUtil;
  const desperdicioPct = areaTotal > 0 ? Math.round(areaDesperdicada / areaTotal * 1e3) / 10 : 0;
  return {
    algoritmo: "maxrects",
    chapas,
    resumo: {
      total_pecas: totalPecas,
      total_chapas: chapas.length,
      area_util_total_m2: Math.round(areaUtil / 1e6 * 100) / 100,
      area_desperdicada_m2: Math.round(areaDesperdicada / 1e6 * 100) / 100,
      desperdicio_pct: desperdicioPct,
      metros_fita_total: Math.round(metrosFitaTotal * 10) / 10
    },
    exportacoes: {
      csv_operador: ""
      // preenchido por exportacao-corte
    },
    calculado_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function gerarSvgChapa(numero, material, largura_mm, comprimento_mm, pecas) {
  const escala = 0.1;
  const W = Math.round(largura_mm * escala);
  const H = Math.round(comprimento_mm * escala);
  const cores = ["#cfe8ff", "#ffe6cc", "#d6f5d6", "#f5d6e6", "#fff3bf", "#e0d6ff"];
  const rects = pecas.map((p, i) => {
    const x = Math.round(p.x_mm * escala);
    const y = Math.round(p.y_mm * escala);
    const w = Math.round((p.rotacionada ? p.comprimento_mm : p.largura_mm) * escala);
    const h = Math.round((p.rotacionada ? p.largura_mm : p.comprimento_mm) * escala);
    const cor = cores[i % cores.length];
    const label = `${p.largura_mm}\xD7${p.comprimento_mm}${p.rotacionada ? " \u21BB" : ""}`;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}" stroke="#333" stroke-width="0.5"/><text x="${x + w / 2}" y="${y + h / 2}" font-size="6" text-anchor="middle" dominant-baseline="middle" fill="#222">${label}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect x="0" y="0" width="${W}" height="${H}" fill="#fafafa" stroke="#000" stroke-width="1"/>` + rects + `<text x="4" y="10" font-size="7" fill="#666">Chapa ${numero} \u2014 ${material.nome_display}</text></svg>`;
}

// src/lib/motor-parametrico/exportacao-corte.ts
function gerarCSVCorte(plano) {
  const sep = ";";
  const cabecalho = [
    "chapa",
    "material",
    "peca",
    "largura_mm",
    "comprimento_mm",
    "x_mm",
    "y_mm",
    "rotacionada",
    "etiqueta"
  ].join(sep);
  const linhas = [cabecalho];
  for (const chapa of plano.chapas) {
    for (const p of chapa.pecas_alocadas) {
      linhas.push([
        chapa.numero_sequencial,
        escaparCSV(chapa.material.nome_display),
        escaparCSV(p.peca_id),
        p.largura_mm,
        p.comprimento_mm,
        p.x_mm,
        p.y_mm,
        p.rotacionada ? "SIM" : "NAO",
        escaparCSV(p.etiqueta)
      ].join(sep));
    }
  }
  linhas.push("");
  linhas.push(`# Total de chapas${sep}${plano.resumo.total_chapas}`);
  linhas.push(`# Total de pe\xE7as${sep}${plano.resumo.total_pecas}`);
  linhas.push(`# Desperd\xEDcio${sep}${plano.resumo.desperdicio_pct}%`);
  linhas.push(`# Metros de fita${sep}${plano.resumo.metros_fita_total}`);
  return linhas.join("\n");
}
function escaparCSV(valor) {
  if (/[;"\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}
function gerarDXFCorte(plano) {
  const L = [];
  const push = (codigo, valor) => {
    L.push(String(codigo));
    L.push(String(valor));
  };
  push(0, "SECTION");
  push(2, "HEADER");
  push(9, "$INSUNITS");
  push(70, 4);
  push(0, "ENDSEC");
  push(0, "SECTION");
  push(2, "ENTITIES");
  let offsetX = 0;
  const espacoEntreChapas = 200;
  for (const chapa of plano.chapas) {
    const layer = `CHAPA_${chapa.numero_sequencial}`;
    retangulo(push, layer, offsetX, 0, chapa.largura_mm, chapa.comprimento_mm);
    for (const p of chapa.pecas_alocadas) {
      const w = p.rotacionada ? p.comprimento_mm : p.largura_mm;
      const h = p.rotacionada ? p.largura_mm : p.comprimento_mm;
      retangulo(push, layer, offsetX + p.x_mm, p.y_mm, w, h);
      texto(push, layer, offsetX + p.x_mm + w / 2, p.y_mm + h / 2, p.etiqueta);
    }
    offsetX += chapa.largura_mm + espacoEntreChapas;
  }
  push(0, "ENDSEC");
  push(0, "EOF");
  return L.join("\r\n");
}
function retangulo(push, layer, x, y, w, h) {
  push(0, "LWPOLYLINE");
  push(8, layer);
  push(90, 4);
  push(70, 1);
  push(10, x);
  push(20, y);
  push(10, x + w);
  push(20, y);
  push(10, x + w);
  push(20, y + h);
  push(10, x);
  push(20, y + h);
}
function texto(push, layer, x, y, conteudo) {
  push(0, "TEXT");
  push(8, layer);
  push(10, Math.round(x));
  push(20, Math.round(y));
  push(40, 20);
  push(1, conteudo);
}
function gerarEtiquetas(plano, projetoId = "") {
  const etiquetas = [];
  for (const chapa of plano.chapas) {
    chapa.pecas_alocadas.forEach((p, idx) => {
      const codigo = `C${chapa.numero_sequencial}-P${String(idx + 1).padStart(2, "0")}`;
      const qr = {
        v: 1,
        proj: projetoId,
        cod: codigo,
        ch: chapa.numero_sequencial,
        pid: p.peca_id,
        dim: `${p.largura_mm}x${p.comprimento_mm}`,
        rot: p.rotacionada ? 1 : 0
      };
      etiquetas.push({
        codigo,
        chapa: chapa.numero_sequencial,
        peca_id: p.peca_id,
        descricao: p.etiqueta,
        largura_mm: p.largura_mm,
        comprimento_mm: p.comprimento_mm,
        rotacionada: p.rotacionada,
        qr_payload: JSON.stringify(qr)
      });
    });
  }
  return etiquetas;
}
function gerarExportacoes(plano, projetoId = "") {
  const csv = gerarCSVCorte(plano);
  const dxf = gerarDXFCorte(plano);
  const etiquetas = gerarEtiquetas(plano, projetoId);
  const planoComCsv = {
    ...plano,
    exportacoes: { ...plano.exportacoes, csv_operador: csv }
  };
  return {
    plano: planoComCsv,
    exportacoes: { csv_operador: csv, dxf_corte: dxf, etiquetas }
  };
}

// src/lib/motor-parametrico/pcp.ts
var PARAMETROS_PCP_PADRAO = {
  horas_uteis_por_dia: 8,
  min_separacao_por_chapa: 5,
  min_corte_por_peca: 3,
  min_bordagem_por_metro: 1.5,
  min_usinagem_por_modulo: 8,
  min_montagem_por_modulo: 25,
  min_acabamento_por_m2: 15,
  min_inspecao_por_modulo: 4,
  min_embalagem_por_modulo: 6,
  min_instalacao_por_modulo: 20,
  pular_fim_de_semana: true
};
var FUNCAO_POR_ETAPA = {
  separacao_material: "almoxarife",
  corte_cnc: "operador_cnc",
  corte_manual: "cortador",
  bordagem: "operador_coladeira",
  usinagem: "operador_cnc",
  montagem: "montador",
  pintura_laca: "pintor",
  inspecao_qualidade: "inspetor_qualidade",
  embalagem: "auxiliar",
  instalacao_obra: "instalador"
};
var CHECKLIST_POR_ETAPA = {
  separacao_material: [
    "Conferir chapas por cor e espessura",
    "Conferir ferragens contra a lista",
    "Separar fitas de borda"
  ],
  corte_cnc: [
    "Conferir plano de corte carregado",
    "Validar dimens\xF5es da primeira pe\xE7a",
    "Etiquetar pe\xE7as cortadas"
  ],
  bordagem: [
    "Conferir cor da fita x cor da chapa",
    "Validar temperatura da coladeira",
    "Inspecionar acabamento das bordas"
  ],
  usinagem: [
    "Conferir posi\xE7\xE3o de fura\xE7\xF5es",
    "Validar furos de dobradi\xE7a e minifix"
  ],
  montagem: [
    "Montar corpo e conferir esquadro",
    "Instalar ferragens",
    "Testar abertura de portas e gavetas"
  ],
  inspecao_qualidade: [
    "Conferir dimens\xF5es finais",
    "Inspecionar acabamento e fitas",
    "Validar funcionamento de ferragens",
    "Conferir cor e aus\xEAncia de avarias"
  ],
  embalagem: [
    "Proteger quinas e superf\xEDcies",
    "Etiquetar volumes",
    "Conferir contagem de volumes"
  ],
  instalacao_obra: [
    "Conferir n\xEDvel e prumo",
    "Fixar m\xF3dulos na parede",
    "Ajustar portas e gavetas",
    "Limpeza final e entrega ao cliente"
  ]
};
function criarChecklist(tipo) {
  const itens = CHECKLIST_POR_ETAPA[tipo] ?? [];
  return itens.map((descricao, i) => ({
    id: `chk_${tipo}_${i}`,
    descricao,
    obrigatorio: true,
    concluido: false
  }));
}
function extrairMetricas(projeto, plano) {
  return {
    num_chapas: plano.resumo.total_chapas,
    num_pecas: plano.resumo.total_pecas,
    num_modulos: projeto.modulos.length,
    metros_fita: projeto.metricas.metros_fita_borda,
    area_frontal_m2: projeto.metricas.area_frontal_m2,
    tem_laca: projeto.modulos.some((m) => m.material_porta?.acabamento.includes("laca") ?? false)
  };
}
function estimarDuracoes(m, p) {
  const h = (min) => Math.round(min / 60 * 100) / 100;
  return {
    separacao_material: h(m.num_chapas * p.min_separacao_por_chapa),
    corte_cnc: h(m.num_pecas * p.min_corte_por_peca),
    corte_manual: 0,
    bordagem: h(m.metros_fita * p.min_bordagem_por_metro),
    usinagem: h(m.num_modulos * p.min_usinagem_por_modulo),
    montagem: h(m.num_modulos * p.min_montagem_por_modulo),
    pintura_laca: m.tem_laca ? h(m.area_frontal_m2 * p.min_acabamento_por_m2) : 0,
    inspecao_qualidade: h(m.num_modulos * p.min_inspecao_por_modulo),
    embalagem: h(m.num_modulos * p.min_embalagem_por_modulo),
    instalacao_obra: h(m.num_modulos * p.min_instalacao_por_modulo)
  };
}
function gerarEtapasProducao(projeto, plano, parametros = PARAMETROS_PCP_PADRAO) {
  const metricas = extrairMetricas(projeto, plano);
  const duracoes = estimarDuracoes(metricas, parametros);
  const sequencia = [
    { tipo: "separacao_material", descricao: "Separa\xE7\xE3o de chapas, ferragens e fitas" },
    { tipo: "corte_cnc", descricao: "Corte das pe\xE7as (CNC / seccionadora)" },
    { tipo: "bordagem", descricao: "Aplica\xE7\xE3o de fita de borda" },
    { tipo: "usinagem", descricao: "Fura\xE7\xF5es e usinagem de ferragens" },
    { tipo: "montagem", descricao: "Montagem dos m\xF3dulos" },
    { tipo: "pintura_laca", descricao: "Pintura / laca (acabamento)" },
    { tipo: "inspecao_qualidade", descricao: "Inspe\xE7\xE3o de qualidade" },
    { tipo: "embalagem", descricao: "Embalagem e prote\xE7\xE3o" },
    { tipo: "instalacao_obra", descricao: "Instala\xE7\xE3o na obra" }
  ];
  const sempre = ["separacao_material", "corte_cnc", "montagem", "inspecao_qualidade", "embalagem", "instalacao_obra"];
  const presentes = sequencia.filter(
    (s) => sempre.includes(s.tipo) || duracoes[s.tipo] > 0
  );
  const etapas = [];
  let idAnterior = null;
  presentes.forEach((s, i) => {
    const id = `etapa_${i + 1}_${s.tipo}`;
    etapas.push({
      id,
      tipo: s.tipo,
      ordem: i + 1,
      descricao: s.descricao,
      duracao_estimada_horas: Math.max(0.25, duracoes[s.tipo]),
      depende_de: idAnterior ? [idAnterior] : [],
      funcao_responsavel: FUNCAO_POR_ETAPA[s.tipo],
      status: idAnterior ? "bloqueada" : "pendente",
      checklist: criarChecklist(s.tipo)
    });
    idAnterior = id;
  });
  return etapas;
}
function validarDAG(etapas) {
  const visitado = /* @__PURE__ */ new Map();
  const porId = new Map(etapas.map((e) => [e.id, e]));
  const dfs = (id) => {
    const estado = visitado.get(id) ?? 0;
    if (estado === 1) return false;
    if (estado === 2) return true;
    visitado.set(id, 1);
    const etapa = porId.get(id);
    if (etapa) {
      for (const dep of etapa.depende_de) {
        if (!dfs(dep)) return false;
      }
    }
    visitado.set(id, 2);
    return true;
  };
  return etapas.every((e) => dfs(e.id));
}
function ordenarTopologicamente(etapas) {
  const porId = new Map(etapas.map((e) => [e.id, e]));
  const visitado = /* @__PURE__ */ new Set();
  const ordenado = [];
  const visitar = (e) => {
    if (visitado.has(e.id)) return;
    visitado.add(e.id);
    for (const dep of e.depende_de) {
      const d = porId.get(dep);
      if (d) visitar(d);
    }
    ordenado.push(e);
  };
  for (const e of etapas) visitar(e);
  return ordenado;
}
function avancarHorasUteis(inicio, horas, p) {
  const d = new Date(inicio);
  let restante = horas;
  while (restante > 0) {
    if (p.pular_fim_de_semana && (d.getDay() === 0 || d.getDay() === 6)) {
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      continue;
    }
    const horasNoDia = Math.min(restante, p.horas_uteis_por_dia);
    restante -= horasNoDia;
    if (restante > 0) {
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
    } else {
      d.setHours(d.getHours() + Math.ceil(horasNoDia));
    }
  }
  return d;
}
function calcularCronograma(etapas, dataInicio, parametros = PARAMETROS_PCP_PADRAO) {
  const ordenadas = ordenarTopologicamente(etapas);
  const conclusao = /* @__PURE__ */ new Map();
  const agendadas = [];
  for (const etapa of ordenadas) {
    let inicio = new Date(dataInicio);
    for (const dep of etapa.depende_de) {
      const fimDep = conclusao.get(dep);
      if (fimDep && fimDep > inicio) inicio = new Date(fimDep);
    }
    const fim = avancarHorasUteis(inicio, etapa.duracao_estimada_horas, parametros);
    conclusao.set(etapa.id, fim);
    agendadas.push({
      ...etapa,
      data_inicio_planejada: inicio.toISOString(),
      data_conclusao_planejada: fim.toISOString()
    });
  }
  return agendadas.sort((a, b) => a.ordem - b.ordem);
}
function gerarOrdemProducao(projeto, plano, opcoes = {}) {
  const parametros = opcoes.parametros ?? PARAMETROS_PCP_PADRAO;
  const dataInicio = opcoes.data_inicio ?? proximoDiaUtil(/* @__PURE__ */ new Date());
  const etapas = gerarEtapasProducao(projeto, plano, parametros);
  const dag_valido = validarDAG(etapas);
  const agendadas = calcularCronograma(etapas, dataInicio, parametros);
  const duracaoTotal = etapas.reduce((s, e) => s + e.duracao_estimada_horas, 0);
  const dataEntrega = agendadas.length > 0 ? new Date(agendadas[agendadas.length - 1].data_conclusao_planejada) : dataInicio;
  const prazoDias = Math.max(1, Math.ceil((dataEntrega.getTime() - dataInicio.getTime()) / (1e3 * 60 * 60 * 24)));
  const listaComprasVazia = {
    itens: [],
    resumo: { itens_em_estoque: 0, itens_para_comprar: 0, custo_total_estimado: 0, prazo_max_entrega_dias: 0 },
    pedidos_sugeridos: [],
    gerado_em: (/* @__PURE__ */ new Date()).toISOString()
  };
  const ordem = {
    id: `op_${Date.now()}`,
    numero: opcoes.numero ?? `OP-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-4)}`,
    empresa_id: opcoes.empresa_id ?? projeto.empresa_id,
    orcamento_id: opcoes.orcamento_id ?? "",
    projeto,
    plano_corte: plano,
    lista_compras: opcoes.lista_compras ?? listaComprasVazia,
    etapas: agendadas,
    data_inicio_planejada: dataInicio.toISOString(),
    data_entrega_prometida: dataEntrega.toISOString(),
    status: "aguardando_material",
    historico_status: [{
      de: "aguardando_material",
      para: "aguardando_material",
      em: (/* @__PURE__ */ new Date()).toISOString(),
      por: opcoes.criado_por ?? "motor_parametrico",
      nota: "Ordem de produ\xE7\xE3o gerada pelo PCP."
    }],
    observacoes: `${etapas.length} etapas \xB7 ${Math.round(duracaoTotal)}h de produ\xE7\xE3o \xB7 prazo ${prazoDias} dias`,
    criado_em: (/* @__PURE__ */ new Date()).toISOString(),
    criado_por: opcoes.criado_por ?? "motor_parametrico"
  };
  return {
    ordem,
    etapas_agendadas: agendadas,
    dag_valido,
    duracao_total_horas: Math.round(duracaoTotal * 100) / 100,
    prazo_dias_uteis: prazoDias
  };
}
function proximoDiaUtil(data) {
  const d = new Date(data);
  d.setHours(8, 0, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// src/lib/motor-parametrico/conhecimento-tecnico.ts
var ESPECS_MDF = {
  3: { espessura_mm: 3, usos: ["fundo de gaveta leve", "costas de quadro"], vao_max_prateleira_cm: 0, densidade_kg_m3: 750 },
  6: { espessura_mm: 6, usos: ["fundo de arm\xE1rio", "fundo de gaveta", "costas"], vao_max_prateleira_cm: 0, densidade_kg_m3: 730 },
  9: { espessura_mm: 9, usos: ["fundo refor\xE7ado", "divis\xF3ria leve"], vao_max_prateleira_cm: 40, densidade_kg_m3: 720 },
  12: { espessura_mm: 12, usos: ["prateleira leve", "divis\xF3ria"], vao_max_prateleira_cm: 60, densidade_kg_m3: 710 },
  15: { espessura_mm: 15, usos: ["estrutura padr\xE3o", "corpo", "porta", "prateleira"], vao_max_prateleira_cm: 80, densidade_kg_m3: 700 },
  18: { espessura_mm: 18, usos: ["porta grande", "prateleira longa", "tampo", "estrutura premium"], vao_max_prateleira_cm: 100, densidade_kg_m3: 700 },
  25: { espessura_mm: 25, usos: ["tampo de bancada", "nicho estrutural", "mesa"], vao_max_prateleira_cm: 120, densidade_kg_m3: 690 }
};
function espessuraParaVao(vao_cm) {
  if (vao_cm <= 60) return 15;
  if (vao_cm <= 80) return 15;
  if (vao_cm <= 100) return 18;
  return 25;
}
function pesoPeca(largura_mm, comprimento_mm, espessura_mm) {
  const volume_m3 = largura_mm / 1e3 * (comprimento_mm / 1e3) * (espessura_mm / 1e3);
  const densidade = ESPECS_MDF[espessura_mm]?.densidade_kg_m3 ?? 700;
  return Math.round(volume_m3 * densidade * 100) / 100;
}
var ESPECS_FERRAGEM = {
  dobradica_35mm_110grau: { tipo: "dobradica_35mm_110grau", nome: "Dobradi\xE7a 35mm 110\xB0", aplicacao: "porta de abrir padr\xE3o", capacidade_kg: 8 },
  dobradica_35mm_165grau: { tipo: "dobradica_35mm_165grau", nome: "Dobradi\xE7a 35mm 165\xB0", aplicacao: "porta de canto / abertura ampla", capacidade_kg: 8 },
  dobradica_push_open: { tipo: "dobradica_push_open", nome: "Dobradi\xE7a Push-Open", aplicacao: "porta sem puxador (toque)", capacidade_kg: 7 },
  corredicao_tandem_300mm: { tipo: "corredicao_tandem_300mm", nome: "Corredi\xE7a Tandem 300mm", aplicacao: "gaveta rasa", capacidade_kg: 30 },
  corredicao_tandem_400mm: { tipo: "corredicao_tandem_400mm", nome: "Corredi\xE7a Tandem 400mm", aplicacao: "gaveta m\xE9dia", capacidade_kg: 30 },
  corredicao_tandem_500mm: { tipo: "corredicao_tandem_500mm", nome: "Corredi\xE7a Tandem 500mm", aplicacao: "gaveta profunda", capacidade_kg: 40 },
  corredicao_lateral_porta: { tipo: "corredicao_lateral_porta", nome: "Trilho de Correr", aplicacao: "porta de correr de roupeiro" },
  cabideiro_simples: { tipo: "cabideiro_simples", nome: "Cabideiro", aplicacao: "barra de cabide em roupeiro" },
  amortecedor_soft_close: { tipo: "amortecedor_soft_close", nome: "Soft-Close", aplicacao: "amortecimento de fechamento" }
};
function numDobradicasPorPorta(altura_cm) {
  if (altura_cm <= 90) return 2;
  if (altura_cm <= 150) return 3;
  if (altura_cm <= 200) return 4;
  return 5;
}
function corredicaParaProfundidade(profundidade_cm) {
  if (profundidade_cm <= 35) return "corredicao_tandem_300mm";
  if (profundidade_cm <= 45) return "corredicao_tandem_400mm";
  return "corredicao_tandem_500mm";
}
var NORMAS = {
  altura_bancada_cozinha: { codigo: "ERG-COZ-01", descricao: "Altura de bancada de cozinha", valor: 90, unidade: "cm" },
  altura_bancada_banheiro: { codigo: "ERG-BAN-01", descricao: "Altura de bancada de banheiro", valor: 85, unidade: "cm" },
  circulacao_minima: { codigo: "NBR-CIRC-01", descricao: "Circula\xE7\xE3o m\xEDnima entre m\xF3veis", valor: 80, unidade: "cm" },
  circulacao_ideal: { codigo: "ERG-CIRC-02", descricao: "Circula\xE7\xE3o ideal entre bancadas", valor: 120, unidade: "cm" },
  altura_aereo_piso: { codigo: "ERG-COZ-02", descricao: "Altura do piso \xE0 base do a\xE9reo", valor: 150, unidade: "cm" },
  profundidade_aereo: { codigo: "ERG-COZ-03", descricao: "Profundidade de arm\xE1rio a\xE9reo", valor: 33, unidade: "cm" },
  profundidade_base_cozinha: { codigo: "ERG-COZ-04", descricao: "Profundidade de gabinete base", valor: 55, unidade: "cm" },
  altura_cabideiro_camisa: { codigo: "ERG-ROUP-01", descricao: "Altura de cabideiro (camisas)", valor: 160, unidade: "cm" },
  altura_cabideiro_vestido: { codigo: "ERG-ROUP-02", descricao: "Altura de cabideiro (vestidos longos)", valor: 180, unidade: "cm" },
  profundidade_roupeiro: { codigo: "ERG-ROUP-03", descricao: "Profundidade de roupeiro", valor: 60, unidade: "cm" },
  vao_porta_max: { codigo: "TEC-PORT-01", descricao: "Largura m\xE1xima de porta de abrir", valor: 50, unidade: "cm" },
  peitoril_janela_min: { codigo: "ERG-JAN-01", descricao: "Peitoril m\xEDnimo p/ gabinete base", valor: 90, unidade: "cm" }
};
var BOAS_PRATICAS = [
  { id: "BP-01", categoria: "estrutura", regra: "Fundo 6mm encaixado em rebaixo de 4mm nas laterais." },
  { id: "BP-02", categoria: "estrutura", regra: "Engrosso frontal de 50mm nas laterais para batida de portas." },
  { id: "BP-03", categoria: "estrutura", regra: "Prateleira com v\xE3o > 80cm exige MDF 18mm ou apoio central." },
  { id: "BP-04", categoria: "acabamento", regra: "Fita de borda em todas as bordas aparentes (frontais)." },
  { id: "BP-05", categoria: "ferragem", regra: "M\xEDnimo 2 dobradi\xE7as por porta; +1 a cada 60cm de altura." },
  { id: "BP-06", categoria: "ferragem", regra: "Corredi\xE7a dimensionada para a profundidade real da gaveta." },
  { id: "BP-07", categoria: "montagem", regra: "Jun\xE7\xE3o de pe\xE7as com cavilha 8\xD730mm + minifix." },
  { id: "BP-08", categoria: "estrutura", regra: "Porta de abrir at\xE9 50cm de largura; acima, usar correr ou dupla." },
  { id: "BP-09", categoria: "ferragem", regra: "M\xF3dulos > 150cm de largura: 6 p\xE9s regul\xE1veis em vez de 4." },
  { id: "BP-10", categoria: "acabamento", regra: "Cuba/tanque sem fundo de MDF na zona molhada." }
];
function consultarConhecimento(consulta) {
  const q = consulta.toLowerCase();
  const respostas = [];
  for (const [chave, n] of Object.entries(NORMAS)) {
    if (chave.includes(q) || n.descricao.toLowerCase().includes(q)) {
      respostas.push({ encontrado: true, topico: n.descricao, conteudo: `${n.valor}${n.unidade}`, referencia: n.codigo });
    }
  }
  if (/mdf|espessura|chapa|prateleira/.test(q)) {
    for (const espec of Object.values(ESPECS_MDF)) {
      respostas.push({
        encontrado: true,
        topico: `MDF ${espec.espessura_mm}mm`,
        conteudo: `Usos: ${espec.usos.join(", ")}. V\xE3o m\xE1x prateleira: ${espec.vao_max_prateleira_cm || "n/a"}cm.`
      });
    }
  }
  if (/ferragem|dobrad|corredi|cabideiro|trilho/.test(q)) {
    for (const espec of Object.values(ESPECS_FERRAGEM)) {
      if (espec) respostas.push({ encontrado: true, topico: espec.nome, conteudo: espec.aplicacao });
    }
  }
  for (const bp of BOAS_PRATICAS) {
    if (bp.regra.toLowerCase().includes(q)) {
      respostas.push({ encontrado: true, topico: `Boa pr\xE1tica ${bp.id}`, conteudo: bp.regra, referencia: bp.id });
    }
  }
  if (respostas.length === 0) {
    respostas.push({ encontrado: false, topico: consulta, conteudo: "Sem entrada espec\xEDfica na base de conhecimento." });
  }
  return respostas;
}

// src/lib/motor-parametrico/consultor-tecnico.ts
function recomendarLayout(ambiente, tipoComodo) {
  const { largura_cm, profundidade_cm, area_m2 } = ambiente.dimensoes;
  const ordenadas = paredesPorComprimento(ambiente);
  const maiorParede = ordenadas[0];
  const compMaior = comprimentoLivre(ambiente, maiorParede);
  const segundaParede = ordenadas.find((p) => saoAdjacentes(p, maiorParede));
  const compSegunda = segundaParede ? comprimentoLivre(ambiente, segundaParede) : 0;
  const alternativas = [];
  if (tipoComodo === "cozinha") {
    const cabeIlha = largura_cm - 2 * NORMAS.circulacao_ideal.valor >= 120 && profundidade_cm - 2 * NORMAS.circulacao_ideal.valor >= 90;
    if (segundaParede && compSegunda >= 200 && compMaior >= 200) {
      const terceira = ordenadas.find((p) => p !== maiorParede && p !== segundaParede && saoAdjacentes(p, segundaParede));
      const compTerceira = terceira ? comprimentoLivre(ambiente, terceira) : 0;
      if (compTerceira >= 200 && area_m2 >= 12) {
        alternativas.push({ layout: "cozinha_l", motivo: "Duas paredes seriam suficientes." });
        if (cabeIlha) alternativas.push({ layout: "ilha", motivo: "H\xE1 espa\xE7o para ilha central." });
        return {
          layout: "cozinha_u",
          confianca: 0.85,
          justificativa: `Tr\xEAs paredes \u2265 200cm (${compMaior}/${compSegunda}/${compTerceira}cm) e ${area_m2}m\xB2 favorecem layout em U, maximizando bancada.`,
          paredes_sugeridas: [maiorParede, segundaParede, terceira],
          alternativas
        };
      }
      if (cabeIlha) alternativas.push({ layout: "ilha", motivo: "H\xE1 espa\xE7o para ilha." });
      alternativas.push({ layout: "cozinha_linear", motivo: "Uma parede s\xF3, se preferir simplicidade." });
      return {
        layout: "cozinha_l",
        confianca: 0.85,
        justificativa: `Duas paredes adjacentes longas (${compMaior}cm e ${compSegunda}cm) aproveitam o canto \u2014 layout em L \xE9 o mais eficiente.`,
        paredes_sugeridas: [maiorParede, segundaParede],
        alternativas
      };
    }
    if (cabeIlha && area_m2 >= 15) {
      alternativas.push({ layout: "cozinha_linear", motivo: "Bancada encostada, sem ilha." });
      return {
        layout: "ilha",
        confianca: 0.7,
        justificativa: `Ambiente de ${area_m2}m\xB2 com ${largura_cm}\xD7${profundidade_cm}cm comporta ilha com circula\xE7\xE3o de ${NORMAS.circulacao_ideal.valor}cm.`,
        alternativas
      };
    }
    return {
      layout: "cozinha_linear",
      confianca: 0.8,
      justificativa: `Parede de ${compMaior}cm \xE9 a mais adequada para uma cozinha linear; demais paredes n\xE3o comportam bancada (${compSegunda}cm).`,
      paredes_sugeridas: [maiorParede],
      alternativas
    };
  }
  if (tipoComodo === "quarto") {
    return {
      layout: "dormitorio",
      confianca: 0.85,
      justificativa: `Roupeiro na parede de ${compMaior}cm; o restante do quarto fica para a cama (n\xE3o-marcenaria).`,
      paredes_sugeridas: [maiorParede],
      alternativas: compSegunda >= 200 ? [{ layout: "closet", motivo: "Se for ambiente dedicado (walk-in), usar closet em L." }] : []
    };
  }
  if (tipoComodo === "closet") {
    return {
      layout: "closet",
      confianca: 0.8,
      justificativa: `Closet em L aproveita duas paredes (${compMaior}cm + ${compSegunda}cm) com mix de roupeiro, cabideiro, gaveteiro e sapateira.`,
      paredes_sugeridas: segundaParede ? [maiorParede, segundaParede] : [maiorParede],
      alternativas: [{ layout: "dormitorio", motivo: "Uma parede de roupeiros, se o espa\xE7o for estreito." }]
    };
  }
  if (tipoComodo === "banheiro") {
    const paredeHidro2 = ambiente.pontos_hidraulicos.find((p) => p.parede)?.parede;
    return {
      layout: "banheiro",
      confianca: 0.85,
      justificativa: paredeHidro2 ? `Gabinete na parede ${paredeHidro2} (ponto hidr\xE1ulico) + espelheira a ${NORMAS.altura_aereo_piso.valor - 30}cm.` : `Gabinete de pia + espelheira na parede de ${compMaior}cm.`,
      paredes_sugeridas: paredeHidro2 ? [paredeHidro2] : [maiorParede],
      alternativas: []
    };
  }
  const paredeHidro = ambiente.pontos_hidraulicos.find((p) => p.parede)?.parede;
  return {
    layout: "lavanderia",
    confianca: 0.85,
    justificativa: paredeHidro ? `Gabinete de tanque na parede ${paredeHidro} (ponto hidr\xE1ulico) + arm\xE1rios de servi\xE7o.` : `Gabinete de tanque + arm\xE1rios de servi\xE7o na parede de ${compMaior}cm.`,
    paredes_sugeridas: paredeHidro ? [paredeHidro] : [maiorParede],
    alternativas: []
  };
}
function analisarProjeto(projeto) {
  const recs = [];
  let pesoTotal = 0;
  for (const m of projeto.modulos) {
    recs.push(...analisarModulo(m));
    pesoTotal += pesoModulo(m);
  }
  recs.push(...analisarAmbiente(projeto));
  const atencao = recs.filter((r) => r.severidade === "atencao").length;
  const sugestoes = recs.filter((r) => r.severidade === "sugestao").length;
  return {
    recomendacoes: recs,
    resumo: {
      total: recs.length,
      atencao,
      sugestoes,
      peso_total_kg: Math.round(pesoTotal * 10) / 10
    },
    analisado_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function analisarModulo(m) {
  const recs = [];
  const cfg = m.configuracao;
  if (cfg.num_prateleiras > 0) {
    const vaoInterno = m.largura_cm - 3;
    const espRecomendada = espessuraParaVao(vaoInterno);
    if (espRecomendada > cfg.espessura_corpo_mm) {
      recs.push({
        severidade: "atencao",
        modulo_id: m.id,
        titulo: "Prateleira pode fletir",
        detalhe: `V\xE3o de ${vaoInterno}cm com MDF ${cfg.espessura_corpo_mm}mm. Recomendado ${espRecomendada}mm ou apoio central.`,
        referencia: "BP-03"
      });
    }
  }
  if (cfg.num_portas > 0 && cfg.tipo_porta === "dobradica") {
    const recomendado = numDobradicasPorPorta(m.altura_cm);
    recs.push({
      severidade: "info",
      modulo_id: m.id,
      titulo: "Dobradi\xE7as recomendadas",
      detalhe: `${recomendado} dobradi\xE7as por porta para ${m.altura_cm}cm de altura.`,
      referencia: "BP-05"
    });
  }
  if (cfg.num_portas > 0 && cfg.tipo_porta === "dobradica") {
    const larguraPorta = m.largura_cm / cfg.num_portas;
    if (larguraPorta > NORMAS.vao_porta_max.valor) {
      recs.push({
        severidade: "sugestao",
        modulo_id: m.id,
        titulo: "Porta larga",
        detalhe: `Porta de ${Math.round(larguraPorta)}cm excede ${NORMAS.vao_porta_max.valor}cm. Considere porta de correr ou dividir em mais folhas.`,
        referencia: "BP-08"
      });
    }
  }
  if (cfg.num_gavetas > 0) {
    const corr = corredicaParaProfundidade(m.profundidade_cm);
    recs.push({
      severidade: "info",
      modulo_id: m.id,
      titulo: "Corredi\xE7a recomendada",
      detalhe: `${corr.replace(/_/g, " ")} para profundidade de ${m.profundidade_cm}cm.`,
      referencia: "BP-06"
    });
  }
  if ((m.modulo_template_codigo.startsWith("roupeiro") || m.modulo_template_codigo.startsWith("cabideiro")) && !cfg.tem_iluminacao_led) {
    recs.push({
      severidade: "sugestao",
      modulo_id: m.id,
      titulo: "Considere ilumina\xE7\xE3o LED",
      detalhe: "Roupeiros e closets ganham muito com fita LED interna acionada por sensor."
    });
  }
  return recs;
}
function analisarAmbiente(projeto) {
  const recs = [];
  const { profundidade_cm } = projeto.ambiente.dimensoes;
  if (/cozinha/i.test(projeto.tipo_ambiente)) {
    const circulacao = profundidade_cm - NORMAS.profundidade_base_cozinha.valor;
    if (circulacao < NORMAS.circulacao_ideal.valor) {
      recs.push({
        severidade: circulacao < NORMAS.circulacao_minima.valor ? "atencao" : "sugestao",
        titulo: "Circula\xE7\xE3o",
        detalhe: `Circula\xE7\xE3o de ${circulacao}cm. Ideal \u2265 ${NORMAS.circulacao_ideal.valor}cm (m\xEDnimo ${NORMAS.circulacao_minima.valor}cm).`,
        referencia: NORMAS.circulacao_ideal.codigo
      });
    }
  }
  return recs;
}
function pesoModulo(m) {
  return m.pecas.reduce(
    (s, p) => s + pesoPeca(p.largura_mm, p.comprimento_mm, p.espessura_mm) * p.quantidade,
    0
  );
}

// src/server/motor-gerar.ts
async function gerarHandler(req, res) {
  const body = req.body;
  if (!body.ambiente_geometrico && !body.medidas) {
    return res.status(400).json({
      error: "Informe ambiente_geometrico ou medidas (largura_cm, profundidade_cm, altura_cm)."
    });
  }
  try {
    const inicio = Date.now();
    let ambiente;
    if (body.ambiente_geometrico) {
      ambiente = body.ambiente_geometrico;
      for (const id of ["top", "bottom", "left", "right"]) {
        const parede = ambiente.paredes?.[id];
        if (parede?.aberturas) {
          parede.segmentos_livres = calcularSegmentosLivres(parede);
        }
      }
    } else {
      const m = body.medidas;
      if (!m.largura_cm || !m.profundidade_cm) {
        return res.status(400).json({ error: "medidas.largura_cm e medidas.profundidade_cm s\xE3o obrigat\xF3rios." });
      }
      ambiente = criarAmbienteManual({
        largura_cm: m.largura_cm,
        profundidade_cm: m.profundidade_cm,
        altura_cm: m.altura_cm || 270,
        porta_parede: m.porta_parede,
        janelas_paredes: m.janelas_paredes
      });
    }
    const prefs = body.preferencias ?? {};
    const comum = {
      cor_mdf_hex: prefs.cor_mdf_hex ?? "#f5f3f0",
      ferragem: prefs.ferragem ?? "nacional",
      versao_comercial: prefs.versao_comercial ?? "intermediaria",
      nome: prefs.nome,
      empresa_id: prefs.empresa_id,
      cliente_id: prefs.cliente_id,
      criado_por: prefs.criado_por ?? "motor_parametrico"
    };
    const tipoLayout = body.tipo_layout ?? "cozinha_linear";
    const resultado = gerarLayout(tipoLayout, ambiente, prefs, comum);
    const moveis_calc = projetoToMovelInput(resultado.projeto);
    const engenharia = gerarEngenharia(resultado.projeto);
    const orcamentos = gerarTresVersoes(resultado.projeto);
    const todasPecas = resultado.projeto.modulos.flatMap((m) => m.pecas);
    const planoBruto = gerarPlanoNesting(todasPecas, resultado.projeto.metricas.metros_fita_borda);
    const { plano: plano_corte, exportacoes: exportacoes_corte } = gerarExportacoes(planoBruto, resultado.projeto.id);
    const lista_compras = gerarListaCompras(resultado.projeto);
    const pcpResultado = gerarOrdemProducao(resultado.projeto, plano_corte, { lista_compras });
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
        lista_compras: pcpResultado.ordem.lista_compras
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
        tempo_ms: ms
      }
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Erro interno no motor param\xE9trico"
    });
  }
}
function gerarLayout(tipo, ambiente, prefs, comum) {
  switch (tipo) {
    case "cozinha_l": {
      const r = gerarLayoutCozinhaL(ambiente, {
        ...comum,
        tipo_porta_base: prefs.tipo_porta_base ?? "dobradica",
        tipo_porta_aereo: prefs.tipo_porta_aereo ?? "dobradica",
        paredes: prefs.paredes,
        com_aereos: prefs.com_aereos
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "cozinha_u": {
      const r = gerarLayoutCozinhaU(ambiente, {
        ...comum,
        tipo_porta_base: prefs.tipo_porta_base ?? "dobradica",
        tipo_porta_aereo: prefs.tipo_porta_aereo ?? "dobradica",
        paredes: prefs.paredes,
        com_aereos: prefs.com_aereos
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "ilha": {
      const r = gerarLayoutIlha(ambiente, {
        ...comum,
        tipo_porta_base: prefs.tipo_porta_base ?? "dobradica"
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "dormitorio": {
      const r = gerarLayoutDormitorio(ambiente, {
        ...comum,
        tipo_porta: prefs.tipo_porta,
        paredes: prefs.paredes
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "closet": {
      const r = gerarLayoutCloset(ambiente, {
        ...comum,
        tipo_porta: prefs.tipo_porta,
        paredes: prefs.paredes
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "banheiro": {
      const r = gerarLayoutBanheiro(ambiente, {
        ...comum,
        parede_principal: prefs.parede_principal,
        com_superior: prefs.com_superior
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "lavanderia": {
      const r = gerarLayoutLavanderia(ambiente, {
        ...comum,
        parede_principal: prefs.parede_principal,
        com_superior: prefs.com_superior
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "sala": {
      const r = gerarLayoutSala(ambiente, {
        ...comum,
        parede_principal: prefs.parede_principal,
        com_superior: prefs.com_superior,
        com_painel: prefs.com_painel
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "escritorio": {
      const r = gerarLayoutEscritorio(ambiente, {
        ...comum,
        parede_principal: prefs.parede_principal,
        com_superior: prefs.com_superior,
        com_gaveteiro: prefs.com_gaveteiro
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: r.paredes_usadas };
    }
    case "cozinha_linear":
    default: {
      const r = gerarLayoutCozinhaLinear(ambiente, {
        ...comum,
        parede_principal: prefs.parede_principal,
        tipo_porta_base: prefs.tipo_porta_base ?? "dobradica",
        tipo_porta_aereo: prefs.tipo_porta_aereo ?? "dobradica"
      });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos, paredes_usadas: [r.parede_usada] };
    }
  }
}

// src/lib/motor-parametrico/dxf-parser.ts
function tokenizar(texto2) {
  const linhas = texto2.split(/\r\n|\r|\n/);
  const pares = [];
  for (let i = 0; i + 1 < linhas.length; i += 2) {
    const codigoStr = linhas[i].trim();
    const valor = linhas[i + 1];
    if (codigoStr === "") continue;
    const codigo = Number(codigoStr);
    if (Number.isNaN(codigo)) continue;
    pares.push({ codigo, valor: valor !== void 0 ? valor.trim() : "" });
  }
  return pares;
}
function unidadeDe(insunits) {
  switch (insunits) {
    case 1:
      return "polegada";
    case 2:
      return "pe";
    case 4:
      return "mm";
    case 5:
      return "cm";
    case 6:
      return "m";
    default:
      return "desconhecida";
  }
}
function fatorParaCm(unidade) {
  switch (unidade) {
    case "mm":
      return 0.1;
    case "cm":
      return 1;
    case "m":
      return 100;
    case "polegada":
      return 2.54;
    case "pe":
      return 30.48;
    case "desconhecida":
      return 1;
  }
}
function parseDXF(texto2) {
  const pares = tokenizar(texto2);
  const segmentos = [];
  const arcos = [];
  const insercoes = [];
  const layersSet = /* @__PURE__ */ new Set();
  let unidade = "desconhecida";
  for (let i = 0; i < pares.length - 2; i++) {
    if (pares[i].codigo === 9 && pares[i].valor === "$INSUNITS") {
      for (let j = i + 1; j < Math.min(i + 4, pares.length); j++) {
        if (pares[j].codigo === 70) {
          unidade = unidadeDe(Number(pares[j].valor));
          break;
        }
      }
      break;
    }
  }
  const entidades = [];
  let atual = null;
  for (const par of pares) {
    if (par.codigo === 0) {
      if (atual) entidades.push(atual);
      atual = [par];
    } else if (atual) {
      atual.push(par);
    }
  }
  if (atual) entidades.push(atual);
  for (const ent of entidades) {
    const tipo = ent[0].valor;
    const get = (codigo) => ent.find((p) => p.codigo === codigo)?.valor;
    const getNum = (codigo, fallback = 0) => {
      const v = get(codigo);
      return v !== void 0 ? Number(v) : fallback;
    };
    const layer = get(8) ?? "0";
    if (tipo === "LINE") {
      layersSet.add(layer);
      segmentos.push({
        inicio: { x: getNum(10), y: getNum(20) },
        fim: { x: getNum(11), y: getNum(21) },
        layer
      });
    } else if (tipo === "LWPOLYLINE" || tipo === "POLYLINE") {
      layersSet.add(layer);
      const vertices = [];
      let vx = null;
      for (const p of ent) {
        if (p.codigo === 10) vx = Number(p.valor);
        else if (p.codigo === 20 && vx !== null) {
          vertices.push({ x: vx, y: Number(p.valor) });
          vx = null;
        }
      }
      const flags = getNum(70);
      const fechada = (flags & 1) === 1;
      for (let i = 0; i + 1 < vertices.length; i++) {
        segmentos.push({ inicio: vertices[i], fim: vertices[i + 1], layer });
      }
      if (fechada && vertices.length > 2) {
        segmentos.push({ inicio: vertices[vertices.length - 1], fim: vertices[0], layer });
      }
    } else if (tipo === "ARC") {
      layersSet.add(layer);
      arcos.push({
        centro: { x: getNum(10), y: getNum(20) },
        raio: getNum(40),
        angulo_inicial: getNum(50),
        angulo_final: getNum(51),
        layer
      });
    } else if (tipo === "INSERT") {
      layersSet.add(layer);
      insercoes.push({
        posicao: { x: getNum(10), y: getNum(20) },
        nome_bloco: get(2) ?? "",
        layer
      });
    }
  }
  return {
    segmentos,
    arcos,
    insercoes,
    unidade,
    layers: [...layersSet].sort()
  };
}
function comprimentoSegmento(s) {
  const dx = s.fim.x - s.inicio.x;
  const dy = s.fim.y - s.inicio.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function boundingBox(segmentos) {
  if (segmentos.length === 0) return null;
  let min_x = Infinity, min_y = Infinity, max_x = -Infinity, max_y = -Infinity;
  for (const s of segmentos) {
    for (const p of [s.inicio, s.fim]) {
      if (p.x < min_x) min_x = p.x;
      if (p.y < min_y) min_y = p.y;
      if (p.x > max_x) max_x = p.x;
      if (p.y > max_y) max_y = p.y;
    }
  }
  return { min_x, min_y, max_x, max_y };
}

// src/lib/motor-parametrico/extracao-geometrica.ts
var LAYERS_PAREDE = /pared|wall|muro|alvenaria/i;
var LAYERS_PORTA = /porta|door/i;
var LAYERS_JANELA = /janela|window|esquadria/i;
function selecionarParedes(dxf, diag) {
  const porLayer = dxf.segmentos.filter((s) => LAYERS_PAREDE.test(s.layer));
  if (porLayer.length >= 3) {
    diag.push(`Paredes identificadas pelo layer (${porLayer.length} segmentos).`);
    return porLayer;
  }
  diag.push("Sem layer de parede expl\xEDcito \u2014 usando o contorno geral do desenho.");
  return dxf.segmentos;
}
function paredeDoPonto(x, y, bbox) {
  const dTop = Math.abs(y - bbox.max_y);
  const dBottom = Math.abs(y - bbox.min_y);
  const dLeft = Math.abs(x - bbox.min_x);
  const dRight = Math.abs(x - bbox.max_x);
  const min = Math.min(dTop, dBottom, dLeft, dRight);
  if (min === dTop) return "top";
  if (min === dBottom) return "bottom";
  if (min === dLeft) return "left";
  return "right";
}
function posicaoNaParede(x, y, parede, bbox, fator) {
  if (parede === "top" || parede === "bottom") {
    return Math.round((x - bbox.min_x) * fator);
  }
  return Math.round((y - bbox.min_y) * fator);
}
function extrairPortas(arcos, bbox, fator, diag) {
  const candidatos = arcos.filter((a) => {
    const raioCm = a.raio * fator;
    return LAYERS_PORTA.test(a.layer) || raioCm >= 50 && raioCm <= 110;
  });
  const portas = candidatos.map((a, i) => {
    const parede = paredeDoPonto(a.centro.x, a.centro.y, bbox);
    const larguraCm = Math.round(a.raio * fator);
    return {
      id: `porta_dxf_${i}`,
      _tipo: "porta",
      parede,
      posicao_cm: Math.max(0, posicaoNaParede(a.centro.x, a.centro.y, parede, bbox, fator) - Math.round(larguraCm / 2)),
      largura_cm: larguraCm,
      subtipo: "simples",
      altura_cm: 210,
      zona_exclusao_cm: larguraCm,
      lado_dobradica: "esquerda",
      sentido_abertura: "para_dentro"
    };
  });
  if (portas.length > 0) diag.push(`${portas.length} porta(s) detectada(s) por arco.`);
  return portas;
}
function extrairJanelas(segmentos, bbox, fator, altura_cm, diag) {
  const candidatos = segmentos.filter((s) => LAYERS_JANELA.test(s.layer));
  const janelas = candidatos.map((s, i) => {
    const meioX = (s.inicio.x + s.fim.x) / 2;
    const meioY = (s.inicio.y + s.fim.y) / 2;
    const parede = paredeDoPonto(meioX, meioY, bbox);
    const larguraCm = Math.round(comprimentoSegmento(s) * fator);
    return {
      id: `janela_dxf_${i}`,
      _tipo: "janela",
      parede,
      posicao_cm: Math.max(0, posicaoNaParede(meioX, meioY, parede, bbox, fator) - Math.round(larguraCm / 2)),
      largura_cm: larguraCm,
      subtipo: "abrir",
      altura_peitoril_cm: 100,
      altura_verga_cm: altura_cm - 30,
      bloqueia_base: false,
      bloqueia_aereo: false
    };
  });
  if (janelas.length > 0) diag.push(`${janelas.length} janela(s) detectada(s) por layer.`);
  return janelas;
}
function estimarUnidade(bbox, diag) {
  const largura = bbox.max_x - bbox.min_x;
  if (largura >= 2 && largura <= 20) {
    diag.push("Unidade estimada: metros (pelo tamanho).");
    return "m";
  }
  if (largura >= 150 && largura <= 2e3) {
    diag.push("Unidade estimada: cent\xEDmetros.");
    return "cm";
  }
  if (largura >= 1500 && largura <= 2e4) {
    diag.push("Unidade estimada: mil\xEDmetros.");
    return "mm";
  }
  diag.push("Unidade indeterminada \u2014 assumindo cent\xEDmetros.");
  return "cm";
}
function dxfParaAmbiente(dxf, alturaPadrao_cm = 270) {
  const diag = [];
  const paredesSeg = selecionarParedes(dxf, diag);
  const bbox = boundingBox(paredesSeg);
  if (!bbox || paredesSeg.length === 0) {
    diag.push("Nenhuma geometria de parede encontrada no DXF.");
    return {
      ambiente: ambienteVazio(alturaPadrao_cm),
      confianca: 0,
      diagnosticos: diag
    };
  }
  let unidade = dxf.unidade;
  if (unidade === "desconhecida") {
    unidade = estimarUnidade(bbox, diag);
  } else {
    diag.push(`Unidade declarada no DXF: ${unidade}.`);
  }
  const fator = fatorParaCm(unidade);
  const largura_cm = Math.round((bbox.max_x - bbox.min_x) * fator);
  const profundidade_cm = Math.round((bbox.max_y - bbox.min_y) * fator);
  if (largura_cm < 50 || profundidade_cm < 50 || largura_cm > 5e3 || profundidade_cm > 5e3) {
    diag.push(`Dimens\xF5es suspeitas: ${largura_cm}\xD7${profundidade_cm}cm. Verifique a escala/unidade.`);
  }
  const portas = extrairPortas(dxf.arcos, bbox, fator, diag);
  const janelas = extrairJanelas(dxf.segmentos, bbox, fator, alturaPadrao_cm, diag);
  const aberturasPorParede = { top: [], bottom: [], left: [], right: [] };
  for (const p of portas) aberturasPorParede[p.parede].push(p);
  for (const j of janelas) aberturasPorParede[j.parede].push(j);
  const buildParede = (id) => {
    const comprimento = id === "top" || id === "bottom" ? largura_cm : profundidade_cm;
    const parede = {
      id,
      comprimento_cm: comprimento,
      espessura_cm: 15,
      altura_cm: alturaPadrao_cm,
      aberturas: aberturasPorParede[id],
      segmentos_livres: [],
      obstaculos_adjacentes: []
    };
    parede.segmentos_livres = calcularSegmentosLivres(parede);
    return parede;
  };
  const ambiente = {
    id: `amb_dxf_${Date.now()}`,
    dimensoes: {
      largura_cm,
      profundidade_cm,
      altura_cm: alturaPadrao_cm,
      area_m2: Math.round(largura_cm * profundidade_cm / 1e4 * 100) / 100
    },
    paredes: {
      top: buildParede("top"),
      bottom: buildParede("bottom"),
      left: buildParede("left"),
      right: buildParede("right")
    },
    obstaculos: [],
    pontos_eletricos: [],
    pontos_hidraulicos: [],
    fonte: "dwg",
    escala_detectada: unidade === "desconhecida" ? null : `unidade ${unidade}`,
    confianca_extracao: 0,
    extraido_em: (/* @__PURE__ */ new Date()).toISOString()
  };
  let confianca = 0.5;
  if (dxf.unidade !== "desconhecida") confianca += 0.25;
  if (dxf.segmentos.some((s) => LAYERS_PAREDE.test(s.layer))) confianca += 0.15;
  if (portas.length > 0 || janelas.length > 0) confianca += 0.1;
  confianca = Math.min(1, confianca);
  ambiente.confianca_extracao = confianca;
  diag.push(`Ambiente reconstru\xEDdo: ${largura_cm}\xD7${profundidade_cm}cm (${ambiente.dimensoes.area_m2}m\xB2).`);
  return { ambiente, confianca, diagnosticos: diag };
}
function ambienteVazio(altura_cm) {
  const buildParede = (id, comprimento) => ({
    id,
    comprimento_cm: comprimento,
    espessura_cm: 15,
    altura_cm,
    aberturas: [],
    segmentos_livres: [{
      inicio_cm: 0,
      fim_cm: comprimento,
      comprimento_cm: comprimento,
      altura_util_cm: altura_cm,
      bloqueado_por_janela_baixa: false
    }],
    obstaculos_adjacentes: []
  });
  return {
    id: `amb_vazio_${Date.now()}`,
    dimensoes: { largura_cm: 0, profundidade_cm: 0, altura_cm, area_m2: 0 },
    paredes: {
      top: buildParede("top", 0),
      bottom: buildParede("bottom", 0),
      left: buildParede("left", 0),
      right: buildParede("right", 0)
    },
    obstaculos: [],
    pontos_eletricos: [],
    pontos_hidraulicos: [],
    fonte: "dwg",
    escala_detectada: null,
    confianca_extracao: 0,
    extraido_em: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/lib/motor-parametrico/interpretar-planta.ts
function interpretarPlanta(entrada) {
  const altura = entrada.altura_padrao_cm ?? 270;
  switch (entrada.formato) {
    case "dxf": {
      if (!entrada.dxf_texto) {
        return erro("dxf", "Conte\xFAdo DXF n\xE3o fornecido.");
      }
      const dxf = parseDXF(entrada.dxf_texto);
      const extracao = dxfParaAmbiente(dxf, altura);
      return {
        ambiente: extracao.ambiente,
        formato: "dxf",
        confianca: extracao.confianca,
        diagnosticos: extracao.diagnosticos,
        deterministico: true
      };
    }
    case "imagem":
    case "pdf": {
      if (!entrada.planta_ia) {
        return erro(entrada.formato, "An\xE1lise de IA n\xE3o fornecida para imagem/PDF.");
      }
      const ambiente = plantaToAmbiente(entrada.planta_ia);
      ambiente.fonte = entrada.formato === "pdf" ? "pdf" : "imagem";
      const conf = ambiente.confianca_extracao || 0.7;
      return {
        ambiente,
        formato: entrada.formato,
        confianca: conf,
        diagnosticos: [
          `Planta interpretada por IA Vision (${entrada.formato}).`,
          "Confian\xE7a moderada \u2014 confirme as dimens\xF5es medindo no local."
        ],
        deterministico: false
      };
    }
    case "manual": {
      if (!entrada.medidas) {
        return erro("manual", "Medidas n\xE3o fornecidas.");
      }
      const ambiente = criarAmbienteManual({
        largura_cm: entrada.medidas.largura_cm,
        profundidade_cm: entrada.medidas.profundidade_cm,
        altura_cm: entrada.medidas.altura_cm,
        porta_parede: entrada.medidas.porta_parede,
        janelas_paredes: entrada.medidas.janelas_paredes
      });
      return {
        ambiente,
        formato: "manual",
        confianca: 1,
        diagnosticos: ["Ambiente criado a partir de medidas digitadas (precis\xE3o m\xE1xima)."],
        deterministico: true
      };
    }
    default:
      return erro(entrada.formato, `Formato n\xE3o suportado: ${entrada.formato}`);
  }
}
function erro(formato, mensagem) {
  return {
    ambiente: criarAmbienteManual({ largura_cm: 0, profundidade_cm: 0, altura_cm: 270 }),
    formato,
    confianca: 0,
    diagnosticos: [mensagem],
    deterministico: false
  };
}

// src/server/motor-leitura.ts
function detectMime(b64) {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}
var SYSTEM_VISION = `Voc\xEA \xE9 especialista em leitura de plantas baixas residenciais brasileiras.
Extraia com precis\xE3o as dimens\xF5es do ambiente e a posi\xE7\xE3o de cada porta e janela.
RETORNE APENAS JSON v\xE1lido (sem markdown):
{
  "largura_cm": 400,
  "profundidade_cm": 350,
  "altura_cm": 270,
  "porta_principal": { "parede": "bottom", "x_pct": 0.15, "largura_cm": 90 },
  "portas_secundarias": [],
  "janelas": [{ "parede": "top", "x_pct": 0.3, "largura_cm": 120 }]
}
REGRAS:
- "parede": top (fundo), bottom (entrada), left, right \u2014 vista de cima
- "x_pct": posi\xE7\xE3o do centro do elemento ao longo da parede, 0.0 a 1.0
- "altura_cm": p\xE9-direito; se n\xE3o estiver claro, use 270`;
async function analisarComIA(planta_b64, descricao) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY n\xE3o configurada");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_VISION },
        {
          role: "user",
          content: [
            { type: "text", text: `Analise esta planta baixa${descricao ? ` (${descricao})` : ""}. Extraia dimens\xF5es e posi\xE7\xF5es de portas e janelas.` },
            { type: "image_url", image_url: { url: `data:${detectMime(planta_b64)};base64,${planta_b64}`, detail: "high" } }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });
  if (!r.ok) throw new Error(`OpenAI Vision: ${(await r.text()).slice(0, 300)}`);
  const d = await r.json();
  return JSON.parse(d.choices[0].message.content);
}
async function lerPlantaHandler(req, res) {
  const body = req.body;
  if (!body.formato) {
    return res.status(400).json({ error: "Campo 'formato' obrigat\xF3rio (dxf | imagem | pdf | manual)." });
  }
  try {
    const inicio = Date.now();
    let planta_ia;
    if ((body.formato === "imagem" || body.formato === "pdf") && body.planta_b64) {
      planta_ia = await analisarComIA(body.planta_b64, body.ambiente_descricao);
    }
    const resultado = interpretarPlanta({
      formato: body.formato,
      dxf_texto: body.dxf_texto,
      planta_ia,
      medidas: body.medidas,
      altura_padrao_cm: body.altura_padrao_cm
    });
    const ms = Date.now() - inicio;
    return res.json({
      ambiente: resultado.ambiente,
      formato: resultado.formato,
      confianca: resultado.confianca,
      deterministico: resultado.deterministico,
      diagnosticos: resultado.diagnosticos,
      resumo: {
        largura_cm: resultado.ambiente.dimensoes.largura_cm,
        profundidade_cm: resultado.ambiente.dimensoes.profundidade_cm,
        altura_cm: resultado.ambiente.dimensoes.altura_cm,
        area_m2: resultado.ambiente.dimensoes.area_m2,
        num_portas: Object.values(resultado.ambiente.paredes).reduce(
          (s, p) => s + p.aberturas.filter((a) => a._tipo === "porta").length,
          0
        ),
        num_janelas: Object.values(resultado.ambiente.paredes).reduce(
          (s, p) => s + p.aberturas.filter((a) => a._tipo === "janela").length,
          0
        ),
        tempo_ms: ms
      }
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Erro interno na leitura da planta"
    });
  }
}

// src/lib/motor-parametrico/copiloto.ts
function orquestrarProjeto(ambiente, tipoComodo, prefs = {}) {
  const inicio = Date.now();
  const recomendacao = recomendarLayout(ambiente, tipoComodo);
  const layout = prefs.layout_forcado ?? recomendacao.layout;
  const r = gerarPorTipo(layout, ambiente, prefs, recomendacao.paredes_sugeridas);
  const engenharia = gerarEngenharia(r.projeto);
  const orcamentos = gerarTresVersoes(r.projeto);
  const plano_corte = gerarPlanoNesting(
    r.projeto.modulos.flatMap((m) => m.pecas),
    r.projeto.metricas.metros_fita_borda
  );
  const lista_compras = gerarListaCompras(r.projeto);
  const pcp = gerarOrdemProducao(r.projeto, plano_corte, { lista_compras });
  const analise_tecnica = analisarProjeto(r.projeto);
  const indicadores = calcularIndicadores(r.projeto, orcamentos, plano_corte, pcp, analise_tecnica);
  const viabilidade = analisarViabilidade(r.validacao, indicadores, plano_corte);
  const sugestoes = gerarSugestoes(r.validacao, analise_tecnica, indicadores, orcamentos);
  return {
    recomendacao_layout: recomendacao,
    layout_usado: layout,
    projeto: r.projeto,
    validacao: r.validacao,
    engenharia,
    orcamentos,
    plano_corte,
    pcp,
    analise_tecnica,
    indicadores,
    viabilidade,
    sugestoes,
    tempo_ms: Date.now() - inicio
  };
}
function gerarPorTipo(layout, ambiente, prefs, paredesSugeridas) {
  const base = {
    cor_mdf_hex: prefs.cor_mdf_hex ?? "#f5f3f0",
    ferragem: prefs.ferragem ?? "nacional",
    versao_comercial: prefs.versao_comercial ?? "intermediaria",
    empresa_id: prefs.empresa_id,
    cliente_id: prefs.cliente_id,
    criado_por: prefs.criado_por,
    nome: prefs.nome
  };
  const paredes = prefs.paredes ?? paredesSugeridas;
  switch (layout) {
    case "cozinha_l": {
      const r = gerarLayoutCozinhaL(ambiente, { ...base, tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica", paredes });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "cozinha_u": {
      const r = gerarLayoutCozinhaU(ambiente, { ...base, tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica", paredes });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "ilha": {
      const r = gerarLayoutIlha(ambiente, { ...base });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "dormitorio": {
      const r = gerarLayoutDormitorio(ambiente, { ...base, tipo_porta: prefs.tipo_porta, paredes });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "closet": {
      const r = gerarLayoutCloset(ambiente, { ...base, tipo_porta: prefs.tipo_porta, paredes });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "banheiro": {
      const r = gerarLayoutBanheiro(ambiente, { ...base, parede_principal: paredes?.[0] });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "lavanderia": {
      const r = gerarLayoutLavanderia(ambiente, { ...base, parede_principal: paredes?.[0] });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "cozinha_linear":
    default: {
      const r = gerarLayoutCozinhaLinear(ambiente, { ...base, parede_principal: paredes?.[0], tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica" });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
  }
}
function calcularIndicadores(projeto, orcamentos, plano, pcp, analise) {
  const linearM = projeto.metricas.linear_marcenaria_cm / 100;
  const areaFrontal = projeto.metricas.area_frontal_m2;
  const precoInter = orcamentos.intermediaria.analise_financeira.preco_venda;
  const aproveitamentoMedio = plano.chapas.length > 0 ? Math.round(plano.chapas.reduce((s, c) => s + c.eficiencia_pct, 0) / plano.chapas.length * 10) / 10 : 0;
  return {
    linear_marcenaria_m: Math.round(linearM * 100) / 100,
    area_frontal_m2: areaFrontal,
    peso_total_kg: analise.resumo.peso_total_kg,
    num_modulos: projeto.metricas.num_modulos,
    num_pecas: projeto.metricas.num_pecas_total,
    num_ferragens: projeto.metricas.num_ferragens_total,
    num_chapas: plano.resumo.total_chapas,
    aproveitamento_chapa_pct: aproveitamentoMedio,
    desperdicio_pct: plano.resumo.desperdicio_pct,
    preco_por_metro_linear: linearM > 0 ? Math.round(precoInter / linearM) : 0,
    preco_por_m2_frontal: areaFrontal > 0 ? Math.round(precoInter / areaFrontal) : 0,
    margem_intermediaria_pct: orcamentos.intermediaria.analise_financeira.margem_desejada_pct,
    prazo_producao_dias: pcp.prazo_dias_uteis,
    custo_total_intermediaria: orcamentos.intermediaria.analise_financeira.custo_total,
    preco_venda_intermediaria: precoInter
  };
}
function analisarViabilidade(validacao, indicadores, plano) {
  const fatores = [];
  fatores.push({
    fator: "Valida\xE7\xE3o do projeto",
    status: validacao.status === "reprovado" ? "critico" : validacao.status === "aprovado_com_alertas" ? "atencao" : "ok",
    detalhe: `${validacao.status} (score ${validacao.score})`
  });
  fatores.push({
    fator: "Margem comercial",
    status: indicadores.margem_intermediaria_pct >= 40 ? "ok" : indicadores.margem_intermediaria_pct >= 30 ? "atencao" : "critico",
    detalhe: `${indicadores.margem_intermediaria_pct}% na vers\xE3o intermedi\xE1ria`
  });
  fatores.push({
    fator: "Aproveitamento de chapa",
    status: plano.resumo.desperdicio_pct <= 15 ? "ok" : plano.resumo.desperdicio_pct <= 25 ? "atencao" : "critico",
    detalhe: `${plano.resumo.desperdicio_pct}% de desperd\xEDcio total`
  });
  fatores.push({
    fator: "Prazo de produ\xE7\xE3o",
    status: indicadores.prazo_producao_dias <= 10 ? "ok" : indicadores.prazo_producao_dias <= 20 ? "atencao" : "critico",
    detalhe: `${indicadores.prazo_producao_dias} dias \xFAteis`
  });
  const criticos = fatores.filter((f) => f.status === "critico").length;
  const atencoes = fatores.filter((f) => f.status === "atencao").length;
  const nivel_risco = criticos > 0 ? "alto" : atencoes >= 2 ? "medio" : "baixo";
  const score_geral = Math.max(0, 100 - criticos * 25 - atencoes * 10);
  return { nivel_risco, score_geral, fatores };
}
function gerarSugestoes(validacao, analise, indicadores, orcamentos) {
  const sugestoes = [];
  for (const v of validacao.violacoes.filter((x) => x.severidade === "erro")) {
    sugestoes.push({
      prioridade: "alta",
      categoria: "design",
      titulo: `Corrigir: ${v.regra}`,
      acao: v.mensagem
    });
  }
  for (const r of analise.recomendacoes.filter((x) => x.severidade === "atencao")) {
    sugestoes.push({
      prioridade: "media",
      categoria: "design",
      titulo: r.titulo,
      acao: r.detalhe
    });
  }
  if (indicadores.margem_intermediaria_pct < 35) {
    sugestoes.push({
      prioridade: "alta",
      categoria: "comercial",
      titulo: "Margem abaixo do saud\xE1vel",
      acao: `Margem de ${indicadores.margem_intermediaria_pct}%. Reveja custos ou apresente a vers\xE3o premium (R$ ${orcamentos.premium.analise_financeira.preco_venda.toLocaleString("pt-BR")}).`
    });
  }
  if (indicadores.desperdicio_pct > 25) {
    sugestoes.push({
      prioridade: "media",
      categoria: "producao",
      titulo: "Desperd\xEDcio de chapa elevado",
      acao: `${indicadores.desperdicio_pct}% de desperd\xEDcio. Ajustar larguras de m\xF3dulo pode reduzir o n\xFAmero de chapas (${indicadores.num_chapas}).`
    });
  }
  const ganhoPremium = orcamentos.premium.analise_financeira.preco_venda - orcamentos.intermediaria.analise_financeira.preco_venda;
  if (ganhoPremium > 0) {
    sugestoes.push({
      prioridade: "baixa",
      categoria: "comercial",
      titulo: "Oportunidade de upsell",
      acao: `Vers\xE3o premium agrega R$ ${ganhoPremium.toLocaleString("pt-BR")} (ferragem Blum/H\xE4fele, soft-close).`
    });
  }
  return sugestoes;
}

// src/lib/motor-parametrico/copiloto-tools.ts
var num = (v, fallback = 0) => typeof v === "number" ? v : Number(v) || fallback;
var str = (v, fallback = "") => typeof v === "string" ? v : fallback;
var ferramentaCriarAmbiente = {
  nome: "criar_ambiente",
  descricao: "Cria um ambiente geom\xE9trico a partir de medidas em cent\xEDmetros (largura, profundidade, altura).",
  parametros: {
    type: "object",
    properties: {
      largura_cm: { type: "number", description: "Largura do ambiente em cm" },
      profundidade_cm: { type: "number", description: "Profundidade do ambiente em cm" },
      altura_cm: { type: "number", description: "P\xE9-direito em cm (default 270)" },
      porta_parede: { type: "string", description: "Parede da porta", enum: ["top", "bottom", "left", "right"] }
    },
    required: ["largura_cm", "profundidade_cm"]
  },
  executar: (a) => criarAmbienteManual({
    largura_cm: num(a.largura_cm, 400),
    profundidade_cm: num(a.profundidade_cm, 300),
    altura_cm: num(a.altura_cm, 270),
    porta_parede: a.porta_parede
  })
};
var ferramentaInterpretarPlanta = {
  nome: "interpretar_planta",
  descricao: "Interpreta uma planta DXF (texto) e devolve o ambiente geom\xE9trico com dimens\xF5es reais.",
  parametros: {
    type: "object",
    properties: {
      dxf_texto: { type: "string", description: "Conte\xFAdo de texto de um arquivo DXF" }
    },
    required: ["dxf_texto"]
  },
  executar: (a) => interpretarPlanta({ formato: "dxf", dxf_texto: str(a.dxf_texto) })
};
var ferramentaRecomendarLayout = {
  nome: "recomendar_layout",
  descricao: "Recomenda o melhor tipo de layout para um ambiente e tipo de c\xF4modo, com justificativa t\xE9cnica.",
  parametros: {
    type: "object",
    properties: {
      largura_cm: { type: "number", description: "Largura em cm" },
      profundidade_cm: { type: "number", description: "Profundidade em cm" },
      tipo_comodo: { type: "string", description: "Tipo de c\xF4modo", enum: ["cozinha", "quarto", "closet", "banheiro", "lavanderia"] }
    },
    required: ["largura_cm", "profundidade_cm", "tipo_comodo"]
  },
  executar: (a) => {
    const amb = criarAmbienteManual({
      largura_cm: num(a.largura_cm, 400),
      profundidade_cm: num(a.profundidade_cm, 300),
      altura_cm: num(a.altura_cm, 270)
    });
    return recomendarLayout(amb, str(a.tipo_comodo, "cozinha"));
  }
};
var ferramentaGerarProjeto = {
  nome: "gerar_projeto_completo",
  descricao: "Gera um projeto completo: layout, valida\xE7\xE3o, or\xE7amento (3 vers\xF5es), plano de corte, PCP, indicadores e sugest\xF5es.",
  parametros: {
    type: "object",
    properties: {
      largura_cm: { type: "number", description: "Largura em cm" },
      profundidade_cm: { type: "number", description: "Profundidade em cm" },
      altura_cm: { type: "number", description: "P\xE9-direito em cm" },
      tipo_comodo: { type: "string", description: "Tipo de c\xF4modo", enum: ["cozinha", "quarto", "closet", "banheiro", "lavanderia"] },
      cor_mdf_hex: { type: "string", description: "Cor do MDF em hex" },
      ferragem: { type: "string", description: "Qualidade da ferragem", enum: ["nacional", "blum", "hafele", "grass"] }
    },
    required: ["largura_cm", "profundidade_cm", "tipo_comodo"]
  },
  executar: (a) => {
    const amb = criarAmbienteManual({
      largura_cm: num(a.largura_cm, 400),
      profundidade_cm: num(a.profundidade_cm, 300),
      altura_cm: num(a.altura_cm, 270)
    });
    const prefs = {
      cor_mdf_hex: a.cor_mdf_hex ? str(a.cor_mdf_hex) : void 0,
      ferragem: a.ferragem
    };
    const pacote = orquestrarProjeto(amb, str(a.tipo_comodo, "cozinha"), prefs);
    return {
      layout: pacote.layout_usado,
      justificativa: pacote.recomendacao_layout.justificativa,
      validacao: pacote.validacao.status,
      score: pacote.validacao.score,
      indicadores: pacote.indicadores,
      viabilidade: pacote.viabilidade,
      precos: pacote.orcamentos.comparativo,
      sugestoes: pacote.sugestoes
    };
  }
};
var ferramentaConsultarConhecimento = {
  nome: "consultar_conhecimento",
  descricao: "Consulta a base de conhecimento t\xE9cnico de marcenaria (MDF, ferragens, normas, boas pr\xE1ticas).",
  parametros: {
    type: "object",
    properties: {
      consulta: { type: "string", description: "Termo ou pergunta t\xE9cnica (ex.: 'circula\xE7\xE3o', 'prateleira', 'dobradi\xE7a')" }
    },
    required: ["consulta"]
  },
  executar: (a) => consultarConhecimento(str(a.consulta))
};
var FERRAMENTAS_COPILOTO = [
  ferramentaCriarAmbiente,
  ferramentaInterpretarPlanta,
  ferramentaRecomendarLayout,
  ferramentaGerarProjeto,
  ferramentaConsultarConhecimento
];
var FERRAMENTAS_POR_NOME = Object.fromEntries(FERRAMENTAS_COPILOTO.map((f) => [f.nome, f]));
function ferramentasFormatoOpenAI() {
  return FERRAMENTAS_COPILOTO.map((f) => ({
    type: "function",
    function: {
      name: f.nome,
      description: f.descricao,
      parameters: f.parametros
    }
  }));
}
function executarFerramenta(nome, args) {
  const ferramenta = FERRAMENTAS_POR_NOME[nome];
  if (!ferramenta) throw new Error(`Ferramenta desconhecida: ${nome}`);
  return ferramenta.executar(args);
}

// src/server/motor-chat.ts
var SYSTEM = `Voc\xEA \xE9 o Copiloto da Marcenaria do Planne \u2014 um assistente t\xE9cnico para marceneiros brasileiros.

Voc\xEA ajuda a projetar m\xF3veis planejados, gerar or\xE7amentos e planejar a produ\xE7\xE3o.
Use SEMPRE as ferramentas dispon\xEDveis para obter dados reais \u2014 nunca invente medidas, pre\xE7os ou prazos.

Diretrizes:
- Para recomendar um layout, use "recomendar_layout".
- Para gerar um projeto completo (com or\xE7amento, produ\xE7\xE3o, indicadores), use "gerar_projeto_completo".
- Para d\xFAvidas t\xE9cnicas (MDF, ferragens, normas), use "consultar_conhecimento".
- Para ler uma planta DXF, use "interpretar_planta".
- Apresente os resultados de forma clara e objetiva, em portugu\xEAs brasileiro.
- Valores monet\xE1rios em reais (R$). Sempre cite o que o motor calculou.`;
var MAX_ITERACOES = 5;
async function chatHandler(req, res) {
  const body = req.body;
  if (!body.mensagens || body.mensagens.length === 0) {
    return res.status(400).json({ error: "Campo 'mensagens' obrigat\xF3rio." });
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY n\xE3o configurada" });
  const tools = ferramentasFormatoOpenAI();
  const mensagens = [
    { role: "system", content: SYSTEM },
    ...body.mensagens.map((m) => ({ role: m.role, content: m.content }))
  ];
  const ferramentasUsadas = [];
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
          max_tokens: 1500
        })
      });
      if (!resp.ok) {
        return res.status(502).json({ error: `OpenAI: ${(await resp.text()).slice(0, 300)}` });
      }
      const data = await resp.json();
      const msg = data.choices[0].message;
      mensagens.push(msg);
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return res.json({
          resposta: msg.content ?? "",
          ferramentas_usadas: ferramentasUsadas,
          iteracoes: i + 1
        });
      }
      for (const call of msg.tool_calls) {
        let resultado;
        try {
          const args = JSON.parse(call.function.arguments);
          resultado = executarFerramenta(call.function.name, args);
          ferramentasUsadas.push({ nome: call.function.name, args });
        } catch (e) {
          resultado = { erro: e instanceof Error ? e.message : "Falha ao executar ferramenta" };
        }
        mensagens.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(resultado)
        });
      }
    }
    return res.json({
      resposta: "N\xE3o consegui concluir em tempo. Tente reformular a pergunta.",
      ferramentas_usadas: ferramentasUsadas,
      iteracoes: MAX_ITERACOES
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Erro interno no copiloto"
    });
  }
}

// src/server/motor-entry.ts
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }
  const body = req.body ?? {};
  const acao = req.query.action ?? body.action;
  switch (acao) {
    case "gerar":
      return gerarHandler(req, res);
    case "ler-planta":
      return lerPlantaHandler(req, res);
    case "chat":
      return chatHandler(req, res);
    default:
      return res.status(400).json({
        error: "Campo 'action' obrigat\xF3rio: gerar | ler-planta | chat."
      });
  }
}
export {
  handler as default
};
