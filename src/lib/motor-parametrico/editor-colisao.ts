/**
 * PLANNE — Editor 3D de ambiente
 * Lógica pura de posicionamento/colisão do arraste — sem React/Three.js, pra
 * poder testar isoladamente (arrastar módulo é fácil de errar por 1 sinal ou
 * eixo trocado, e um teste unitário pega isso muito mais rápido que testar
 * na mão arrastando na tela).
 *
 * Convenção: "parede" = módulo encostado, arrasto 1 eixo só (ao longo da
 * parede); "ilha" = módulo solto no chão, arrasto livre em X e profundidade
 * (Z). Todas as posições em CENTÍMETROS (não metros — a conversão pra cena
 * 3D em metros fica só no componente de render).
 */

import type { ParedeId } from "./tipos";

export interface RetanguloParede {
  id: string;
  posicao_x_cm: number;
  largura_cm: number;
}

export interface RetanguloChao {
  id: string;
  posicao_x_cm: number;
  /** Profundidade no chão (não altura/aéreo) — só faz sentido pra módulos ilha. */
  posicao_y_cm: number;
  largura_cm: number;
  profundidade_cm: number;
}

/** Comprimento da parede que o módulo pode percorrer (cm). */
export function comprimentoParede(
  parede: ParedeId,
  ambiente: { largura_cm: number; profundidade_cm: number },
): number {
  return parede === "left" || parede === "right" ? ambiente.profundidade_cm : ambiente.largura_cm;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(v, Math.max(min, max)));
}

/** Dois intervalos 1D se sobrepõem (borda encostando não conta como colisão). */
function sobrepoe1D(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

/** Algum outro módulo na MESMA parede colide com o candidato nessa posição X? */
export function colideNaParede(
  candidato: RetanguloParede,
  outrosNaMesmaParede: RetanguloParede[],
): boolean {
  const a0 = candidato.posicao_x_cm;
  const a1 = a0 + candidato.largura_cm;
  return outrosNaMesmaParede.some((o) => {
    if (o.id === candidato.id) return false;
    return sobrepoe1D(a0, a1, o.posicao_x_cm, o.posicao_x_cm + o.largura_cm);
  });
}

/**
 * Move um módulo preso à parede: projeta a posição X desejada (cm), limita
 * aos dois extremos da parede, e rejeita (mantém a posição anterior) se
 * colidir com outro módulo já posicionado na mesma parede.
 */
export function moverModuloNaParede(
  atual: RetanguloParede,
  novaPosicaoXDesejada_cm: number,
  parede: ParedeId,
  ambiente: { largura_cm: number; profundidade_cm: number },
  outrosNaMesmaParede: RetanguloParede[],
): number {
  const comprimento = comprimentoParede(parede, ambiente);
  const x = clamp(novaPosicaoXDesejada_cm, 0, comprimento - atual.largura_cm);
  const candidato: RetanguloParede = { ...atual, posicao_x_cm: x };
  return colideNaParede(candidato, outrosNaMesmaParede) ? atual.posicao_x_cm : x;
}

/** Algum outro módulo no chão (ilha) colide com o candidato nessa posição X/Z (AABB 2D)? */
export function colideNoChao(candidato: RetanguloChao, outrosNoChao: RetanguloChao[]): boolean {
  const ax0 = candidato.posicao_x_cm,
    ax1 = ax0 + candidato.largura_cm;
  const az0 = candidato.posicao_y_cm,
    az1 = az0 + candidato.profundidade_cm;
  return outrosNoChao.some((o) => {
    if (o.id === candidato.id) return false;
    const bx0 = o.posicao_x_cm,
      bx1 = bx0 + o.largura_cm;
    const bz0 = o.posicao_y_cm,
      bz1 = bz0 + o.profundidade_cm;
    return sobrepoe1D(ax0, ax1, bx0, bx1) && sobrepoe1D(az0, az1, bz0, bz1);
  });
}

/**
 * Move um módulo ilha: limita X e profundidade (Z) aos limites do cômodo, e
 * rejeita (mantém a posição anterior) se colidir com outro módulo no chão.
 */
export function moverModuloIlha(
  atual: RetanguloChao,
  novaPosicaoDesejada_cm: { x: number; z: number },
  ambiente: { largura_cm: number; profundidade_cm: number },
  outrosNoChao: RetanguloChao[],
): { posicao_x_cm: number; posicao_y_cm: number } {
  const x = clamp(novaPosicaoDesejada_cm.x, 0, ambiente.largura_cm - atual.largura_cm);
  const z = clamp(novaPosicaoDesejada_cm.z, 0, ambiente.profundidade_cm - atual.profundidade_cm);
  const candidato: RetanguloChao = { ...atual, posicao_x_cm: x, posicao_y_cm: z };
  return colideNoChao(candidato, outrosNoChao)
    ? { posicao_x_cm: atual.posicao_x_cm, posicao_y_cm: atual.posicao_y_cm }
    : { posicao_x_cm: x, posicao_y_cm: z };
}

/** Próxima posição livre (sem colisão) na parede, pra adicionar um módulo novo — encaixa no fim do último módulo da parede. */
export function proximaPosicaoLivreNaParede(
  largura_cm: number,
  parede: ParedeId,
  ambiente: { largura_cm: number; profundidade_cm: number },
  existentesNaMesmaParede: RetanguloParede[],
): number {
  const fimDoUltimo = existentesNaMesmaParede.reduce(
    (max, m) => Math.max(max, m.posicao_x_cm + m.largura_cm),
    0,
  );
  const comprimento = comprimentoParede(parede, ambiente);
  return clamp(fimDoUltimo, 0, Math.max(0, comprimento - largura_cm));
}
