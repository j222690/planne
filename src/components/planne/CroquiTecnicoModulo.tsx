import { useMemo } from "react";
import { calcularVistaExplodida } from "@/lib/motor-parametrico/vista-explodida";

/** Shape mínimo aceito — estruturalmente compatível com `ModuloParaVista3D`
 * (calcularVistaExplodida) mais os campos de anotação (ferragem/puxador/
 * espessura) que só esse componente usa, pra não obrigar quem chama a
 * importar o tipo rico `ModuloInstanciado` do motor. */
export interface ModuloParaCroqui {
  nome_display?: string;
  nome?: string;
  largura_cm: number;
  altura_cm: number;
  profundidade_cm: number;
  configuracao?: {
    num_portas?: number;
    num_gavetas?: number;
    num_prateleiras?: number;
    espessura_corpo_mm?: number;
    espessura_porta_mm?: number;
    ferragem?: string;
    tipo_puxador?: string;
  };
}

const FERRAGEM_LABEL: Record<string, string> = {
  nacional: "Nacional",
  blum: "Blum",
  hafele: "Häfele",
  grass: "Grass",
};

function labelPuxador(tipo: string): string {
  return tipo.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Uma peça reduzida ao que o croqui precisa desenhar: posição do CENTRO e
 * tamanho, em metros, em coordenadas locais do módulo (origem no centro da
 * base — mesma convenção de `calcularVistaExplodida`). */
export interface PecaCroqui {
  xCentroM: number;
  yCentroM: number;
  larguraM: number;
  alturaM: number;
}

export interface CroquiGeometria {
  larguraM: number;
  alturaM: number;
  portas: PecaCroqui[];
  gavetas: PecaCroqui[];
  prateleiras: PecaCroqui[];
  anotacoes: {
    numPortas: number;
    numGavetas: number;
    numPrateleiras: number;
    espCorpoMm: number;
    espPortaMm: number;
    ferragemLabel?: string;
    puxadorLabel?: string;
  };
}

/**
 * Geometria pura do croqui técnico — sem JSX, sem jsPDF. Reaproveitada tanto
 * pelo componente React (desenha em SVG, tela) quanto pelo gerador do book
 * técnico (desenha nativo em jsPDF, PDF) — o cálculo é feito uma vez só.
 * Fonte: `calcularVistaExplodida()`, a mesma usada pelo 3D e pelo manual de
 * montagem — zero cálculo geométrico novo.
 */
export function calcularCroquiGeometria(modulo: ModuloParaCroqui): CroquiGeometria {
  const cfg = modulo.configuracao ?? {};
  const pecas = calcularVistaExplodida({ ...modulo, configuracao: cfg });
  const porTipo = (tipo: string): PecaCroqui[] =>
    pecas
      .filter((p) => p.tipo === tipo)
      .map((p) => ({
        xCentroM: p.posicao[0],
        yCentroM: p.posicao[1],
        larguraM: p.tamanho[0],
        alturaM: p.tamanho[1],
      }));

  const espCorpoMm = cfg.espessura_corpo_mm ?? 15;

  return {
    larguraM: modulo.largura_cm / 100,
    alturaM: modulo.altura_cm / 100,
    portas: porTipo("porta"),
    gavetas: porTipo("gaveta"),
    prateleiras: porTipo("prateleira"),
    anotacoes: {
      numPortas: cfg.num_portas ?? 0,
      numGavetas: cfg.num_gavetas ?? 0,
      numPrateleiras: cfg.num_prateleiras ?? 0,
      espCorpoMm,
      espPortaMm: cfg.espessura_porta_mm ?? espCorpoMm,
      ferragemLabel: cfg.ferragem ? (FERRAGEM_LABEL[cfg.ferragem] ?? cfg.ferragem) : undefined,
      puxadorLabel: cfg.tipo_puxador ? labelPuxador(cfg.tipo_puxador) : undefined,
    },
  };
}

/**
 * Croqui técnico 2D de UM módulo isolado — ficha técnica com cotas internas
 * (largura/altura total + posição de portas/gavetas/prateleiras). Diferente
 * de `WallElevationSection` (mostra a composição de TODOS os módulos numa
 * parede, sem cota interna nenhuma).
 */
export function CroquiTecnicoModulo({ modulo }: { modulo: ModuloParaCroqui }) {
  const geo = useMemo(() => calcularCroquiGeometria(modulo), [modulo]);
  const { larguraM: L, alturaM: A, portas, gavetas, prateleiras, anotacoes } = geo;

  const SVG_W = 420;
  const SVG_H = 420;
  const ML = 60;
  const MR = 64;
  const MT = 24;
  const MB = 56;
  const drawW = SVG_W - ML - MR;
  const drawH = SVG_H - MT - MB;
  const escala = Math.min(drawW / L, drawH / A);
  const offX = ML + (drawW - L * escala) / 2;
  const offY = MT + (drawH - A * escala) / 2;

  // Origem local do módulo é o centro da BASE (X=0 centro, Y=0 piso, Y+ = cima).
  // Origem de tela é o canto superior-esquerdo (Y+ = baixo) — inverte Y.
  const telaX = (xLocal: number) => offX + (xLocal + L / 2) * escala;
  const telaY = (yLocal: number) => offY + (A - yLocal) * escala;

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full bg-secondary/10 rounded-lg border border-border"
      >
        <defs>
          <marker
            id="croqui-seta"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="#6b7280" />
          </marker>
        </defs>

        {/* Caixa externa do módulo */}
        <rect
          x={offX}
          y={offY}
          width={L * escala}
          height={A * escala}
          fill="#f5f3f0"
          stroke="#374151"
          strokeWidth="1.4"
        />

        {/* Divisórias entre portas (uma linha por fronteira interna, N-1 pra N portas) */}
        {portas.slice(1).map((p, i) => {
          const xBorda = telaX(p.xCentroM - p.larguraM / 2);
          return (
            <line
              key={`div-porta-${i}`}
              x1={xBorda}
              y1={offY}
              x2={xBorda}
              y2={offY + A * escala}
              stroke="#9ca3af"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Linha no topo de cada gaveta — separa da gaveta/porta acima */}
        {gavetas.map((g, i) => {
          const yTopo = telaY(g.yCentroM + g.alturaM / 2);
          return (
            <line
              key={`div-gav-${i}`}
              x1={offX}
              y1={yTopo}
              x2={offX + L * escala}
              y2={yTopo}
              stroke="#9ca3af"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Prateleiras — linha tracejada + cota da altura a partir do piso do módulo */}
        {prateleiras.map((pr, i) => {
          const y = telaY(pr.yCentroM);
          return (
            <g key={`prat-${i}`}>
              <line
                x1={offX + 4}
                y1={y}
                x2={offX + L * escala - 4}
                y2={y}
                stroke="#b45309"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text x={offX + L * escala + 6} y={y + 3} fontSize="9" fill="#b45309">
                {Math.round(pr.yCentroM * 100)}cm
              </text>
            </g>
          );
        })}

        {/* Cotas de altura de cada gaveta, à direita */}
        {gavetas.map((g, i) => {
          const syBase = telaY(g.yCentroM - g.alturaM / 2);
          const syTopo = telaY(g.yCentroM + g.alturaM / 2);
          return (
            <text
              key={`cota-gav-${i}`}
              x={offX + L * escala + 6}
              y={(syBase + syTopo) / 2 + 3}
              fontSize="8.5"
              fill="#6b7280"
            >
              {Math.round(g.alturaM * 100)}cm
            </text>
          );
        })}

        {/* Cota de largura total (embaixo) */}
        <line
          x1={offX}
          y1={offY + A * escala + 18}
          x2={offX + L * escala}
          y2={offY + A * escala + 18}
          stroke="#6b7280"
          strokeWidth="0.8"
          markerStart="url(#croqui-seta)"
          markerEnd="url(#croqui-seta)"
        />
        <text
          x={offX + (L * escala) / 2}
          y={offY + A * escala + 34}
          textAnchor="middle"
          fontSize="11"
          fill="#374151"
        >
          {Math.round(L * 100)}cm
        </text>

        {/* Cota de altura total (lateral esquerda) */}
        <line
          x1={offX - 18}
          y1={offY}
          x2={offX - 18}
          y2={offY + A * escala}
          stroke="#6b7280"
          strokeWidth="0.8"
          markerStart="url(#croqui-seta)"
          markerEnd="url(#croqui-seta)"
        />
        <text
          x={offX - 28}
          y={offY + (A * escala) / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#374151"
          transform={`rotate(-90, ${offX - 28}, ${offY + (A * escala) / 2})`}
        >
          {Math.round(A * 100)}cm
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground px-1">
        <div>
          {anotacoes.numPortas} porta(s) · {anotacoes.numGavetas} gaveta(s) ·{" "}
          {anotacoes.numPrateleiras} prateleira(s)
        </div>
        <div>
          Corpo {anotacoes.espCorpoMm}mm · Porta {anotacoes.espPortaMm}mm
        </div>
        {anotacoes.ferragemLabel && <div>Ferragem: {anotacoes.ferragemLabel}</div>}
        {anotacoes.puxadorLabel && <div>Puxador: {anotacoes.puxadorLabel}</div>}
      </div>
    </div>
  );
}
