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
  | "gaveta";

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
  configuracao: { num_portas?: number; num_gavetas?: number };
}

const T = 0.018; // espessura do painel (m) — mesma constante do render-worker

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
  }

  return pecas;
}
