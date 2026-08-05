/**
 * PLANNE — Vista explodida (3D interativo)
 *
 * Gera uma caixa esquemática do módulo (laterais, base, teto, fundo, portas,
 * gavetas) para o visualizador 3D no navegador — MESMA lógica de
 * posicionamento do render-worker (render-worker/blender/scene_from_job.py,
 * função montar_modulo), portada aqui de propósito: essa é uma representação
 * ESQUEMÁTICA (pra explodir/inspecionar), não a lista real de corte —
 * `Peca[]` do motor vem consolidada por corrido e segmentada por tamanho de
 * chapa, não mapeada 1:1 pro módulo. Ver decisão em memória do projeto.
 *
 * Convenção de eixos (Three.js, Y para cima): X = largura, Y = altura,
 * Z = profundidade (Z+ = frente, de onde as portas/gavetas "saem").
 */

export type TipoPecaVisual =
  | "lateral_esquerda"
  | "lateral_direita"
  | "base"
  | "teto"
  | "fundo"
  | "porta"
  | "gaveta"
  | "prateleira";

export interface PecaVisual3D {
  id: string;
  tipo: TipoPecaVisual;
  nome: string;
  /** Centro da peça montada (m). */
  posicao: [number, number, number];
  /** Largura × altura × profundidade da peça (m). */
  tamanho: [number, number, number];
  /** Direção unitária pra onde a peça se afasta na explosão. */
  direcaoExplosao: [number, number, number];
  /** Distância máxima de explosão (m), na explosão 100%. */
  distanciaExplosao: number;
  larguraMm: number;
  comprimentoMm: number;
}

export interface ModuloParaVista3D {
  largura_cm: number;
  altura_cm: number;
  profundidade_cm: number;
  configuracao: { num_portas?: number; num_gavetas?: number; num_prateleiras?: number };
}

export type ParedeId = "top" | "bottom" | "left" | "right";

/** Módulo posicionado na parede — pra compor a cena inteira (calcularCenaCompleta). */
export interface ModuloComPosicao extends ModuloParaVista3D {
  posicao_x_cm: number;
  /** ≥100 = aéreo (o motor usa esse limiar pra distinguir aéreo de base/piso). */
  posicao_y_cm: number;
  /** Default "top" — cozinha linear (parede única). */
  parede?: ParedeId;
  nome_display?: string;
}

export interface ModuloNaCena {
  moduloIndex: number;
  nome: string;
  /** Peças em coordenadas LOCAIS do módulo (não rotacionadas/transladadas) —
   * aplicar grupoPosicao/grupoRotacaoY (ex.: <group position rotation>) pra
   * chegar na posição final na cena. Deixa o Three.js fazer a rotação. */
  pecas: PecaVisual3D[];
  grupoPosicao: [number, number, number];
  /** Rotação em Y (radianos) — 0 pra parede "top", conforme a parede do módulo. */
  grupoRotacaoY: number;
}

const T = 0.018; // espessura do painel (m) — mesma constante do render-worker
const PISO_AEREO = 1.5; // altura do aéreo (m) — mesma constante do render-worker
const RODAPE = 0.1; // recuo do rodapé nos móveis de piso — idem

export function calcularVistaExplodida(modulo: ModuloParaVista3D): PecaVisual3D[] {
  const L = modulo.largura_cm / 100;
  const A = modulo.altura_cm / 100;
  const P = modulo.profundidade_cm / 100;
  const portas = modulo.configuracao.num_portas ?? 0;
  const gavetas = modulo.configuracao.num_gavetas ?? 0;
  const distBase = Math.max(L, A, P) * 0.9;

  const pecas: PecaVisual3D[] = [
    {
      id: "lat_e",
      tipo: "lateral_esquerda",
      nome: "Lateral esquerda",
      posicao: [-L / 2 + T / 2, A / 2, 0],
      tamanho: [T, A, P],
      direcaoExplosao: [-1, 0, 0],
      distanciaExplosao: distBase,
      larguraMm: Math.round(P * 1000),
      comprimentoMm: Math.round(A * 1000),
    },
    {
      id: "lat_d",
      tipo: "lateral_direita",
      nome: "Lateral direita",
      posicao: [L / 2 - T / 2, A / 2, 0],
      tamanho: [T, A, P],
      direcaoExplosao: [1, 0, 0],
      distanciaExplosao: distBase,
      larguraMm: Math.round(P * 1000),
      comprimentoMm: Math.round(A * 1000),
    },
    {
      id: "base",
      tipo: "base",
      nome: "Base",
      posicao: [0, T / 2, 0],
      tamanho: [L, T, P],
      direcaoExplosao: [0, -1, 0],
      distanciaExplosao: distBase,
      larguraMm: Math.round(L * 1000),
      comprimentoMm: Math.round(P * 1000),
    },
    {
      id: "teto",
      tipo: "teto",
      nome: "Teto",
      posicao: [0, A - T / 2, 0],
      tamanho: [L, T, P],
      direcaoExplosao: [0, 1, 0],
      distanciaExplosao: distBase,
      larguraMm: Math.round(L * 1000),
      comprimentoMm: Math.round(P * 1000),
    },
    {
      id: "fundo",
      tipo: "fundo",
      nome: "Fundo",
      posicao: [0, A / 2, -P / 2 + T / 2],
      tamanho: [Math.max(0.01, L - 2 * T), Math.max(0.01, A - 2 * T), T],
      direcaoExplosao: [0, 0, -1],
      distanciaExplosao: distBase,
      larguraMm: Math.round((L - 2 * T) * 1000),
      comprimentoMm: Math.round((A - 2 * T) * 1000),
    },
  ];

  // Gavetas ocupam uma faixa embaixo; portas ficam acima (mesma regra do
  // render-worker: só reserva faixa de gaveta quando o módulo tem os dois).
  const zonaGav = gavetas && portas ? Math.min(A, gavetas * 0.16) : gavetas ? A : 0;
  if (gavetas) {
    const gh = zonaGav / gavetas;
    for (let i = 0; i < gavetas; i++) {
      const gz = i * gh + gh / 2;
      pecas.push({
        id: `gav${i}`,
        tipo: "gaveta",
        nome: `Gaveta ${i + 1}`,
        posicao: [0, gz, P / 2 - T / 2],
        tamanho: [Math.max(0.01, L - 0.006), Math.max(0.01, gh - 0.006), T],
        direcaoExplosao: [0, 0, 1],
        distanciaExplosao: distBase * 1.3,
        larguraMm: Math.round(L * 1000),
        comprimentoMm: Math.round(gh * 1000),
      });
    }
  }
  if (portas) {
    const pz0 = zonaGav,
      ph = A - zonaGav,
      pw = L / portas;
    for (let d = 0; d < portas; d++) {
      const px = -L / 2 + (d + 0.5) * pw;
      pecas.push({
        id: `porta${d}`,
        tipo: "porta",
        nome: `Porta ${d + 1}`,
        posicao: [px, pz0 + ph / 2, P / 2 - T / 2],
        tamanho: [Math.max(0.01, pw - 0.006), Math.max(0.01, ph - 0.006), T],
        direcaoExplosao: [0, 0, 1],
        distanciaExplosao: distBase * 1.3,
        larguraMm: Math.round(pw * 1000),
        comprimentoMm: Math.round(ph * 1000),
      });
    }

    // Prateleiras internas — só fazem sentido atrás de porta (atrás de gaveta
    // não existe prateleira). Distribuídas em partes iguais na zona da porta,
    // reveladas no modo Raio-X ou com as portas escondidas.
    const prateleiras = modulo.configuracao.num_prateleiras ?? 0;
    for (let i = 0; i < prateleiras; i++) {
      const pz = pz0 + ((i + 1) / (prateleiras + 1)) * ph;
      pecas.push({
        id: `prat${i}`,
        tipo: "prateleira",
        nome: `Prateleira ${i + 1}`,
        posicao: [0, pz, 0],
        tamanho: [Math.max(0.01, L - 2 * T - 0.004), T, Math.max(0.01, P - 2 * T - 0.01)],
        direcaoExplosao: [0, 0, -1],
        distanciaExplosao: distBase * 0.6,
        larguraMm: Math.round(L * 1000),
        comprimentoMm: Math.round(P * 1000),
      });
    }
  }

  return pecas;
}

/**
 * Posiciona vários módulos na(s) parede(s) do ambiente — X = posicao_x_cm
 * (distância do canto inicial da parede), aéreo sobe pra PISO_AEREO, piso
 * sobe pelo RODAPE (mesmas regras do render-worker). Suporta L/U: cada
 * módulo carrega sua `parede`, e a posição/rotação do grupo é calculada pra
 * encostar o fundo do módulo na parede certa, com a frente voltada pro
 * ambiente — a rotação em si fica por conta do Three.js (<group rotation>),
 * as peças continuam em coordenadas locais.
 *
 * `medidas` = dimensões do ambiente (cm) — necessário só quando há módulos
 * nas paredes "bottom" (frente) ou "right" (precisa saber onde é o fim da
 * parede oposta). Módulos só em "top"/"left" funcionam sem isso.
 */
export function calcularCenaCompleta(
  modulos: ModuloComPosicao[],
  medidas?: { largura_cm: number; profundidade_cm: number },
): ModuloNaCena[] {
  const larguraAmb = (medidas?.largura_cm ?? 0) / 100;
  const profundidadeAmb = (medidas?.profundidade_cm ?? 0) / 100;

  return modulos.map((m, moduloIndex) => {
    const px = m.posicao_x_cm / 100;
    const aereo = m.posicao_y_cm >= 100;
    const y0 = aereo ? PISO_AEREO : RODAPE;
    const L = m.largura_cm / 100;
    const P = m.profundidade_cm / 100;
    const parede = m.parede ?? "top";

    let grupoPosicao: [number, number, number];
    let grupoRotacaoY: number;
    switch (parede) {
      case "bottom":
        grupoRotacaoY = Math.PI;
        grupoPosicao = [px + L / 2, y0, profundidadeAmb - P / 2];
        break;
      case "left":
        grupoRotacaoY = Math.PI / 2;
        grupoPosicao = [P / 2, y0, px + L / 2];
        break;
      case "right":
        grupoRotacaoY = -Math.PI / 2;
        grupoPosicao = [larguraAmb - P / 2, y0, px + L / 2];
        break;
      default: // "top"
        grupoRotacaoY = 0;
        grupoPosicao = [px + L / 2, y0, P / 2];
    }

    const pecas = calcularVistaExplodida(m).map((p) => ({ ...p, id: `m${moduloIndex}_${p.id}` }));

    return {
      moduloIndex,
      nome: m.nome_display ?? `Módulo ${moduloIndex + 1}`,
      pecas,
      grupoPosicao,
      grupoRotacaoY,
    };
  });
}
