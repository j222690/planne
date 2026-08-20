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

/**
 * Croqui técnico 2D de UM módulo isolado — ficha técnica com cotas internas
 * (largura/altura total + posição de portas/gavetas/prateleiras). Diferente
 * de `WallElevationSection` (mostra a composição de TODOS os módulos numa
 * parede, sem cota interna nenhuma).
 *
 * Geometria vem de `calcularVistaExplodida()` — mesma fonte já usada pelo
 * visualizador 3D e pelo manual de montagem — projetando (X,Y) e ignorando Z
 * (profundidade), o que dá exatamente a vista frontal montada (não
 * explodida) do módulo. Zero cálculo geométrico novo.
 */
export function CroquiTecnicoModulo({ modulo }: { modulo: ModuloParaCroqui }) {
  const cfg = modulo.configuracao ?? {};
  const pecas = useMemo(
    () => calcularVistaExplodida({ ...modulo, configuracao: cfg }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modulo],
  );
  const L = modulo.largura_cm / 100;
  const A = modulo.altura_cm / 100;

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

  const portas = pecas.filter((p) => p.tipo === "porta");
  const gavetas = pecas.filter((p) => p.tipo === "gaveta");
  const prateleiras = pecas.filter((p) => p.tipo === "prateleira");

  const espCorpo = cfg.espessura_corpo_mm ?? 15;
  const espPorta = cfg.espessura_porta_mm ?? espCorpo;

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
          const xBorda = telaX(p.posicao[0] - p.tamanho[0] / 2);
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
          const yTopo = telaY(g.posicao[1] + g.tamanho[1] / 2);
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
          const y = telaY(pr.posicao[1]);
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
                {Math.round(pr.posicao[1] * 100)}cm
              </text>
            </g>
          );
        })}

        {/* Cotas de altura de cada gaveta, à direita */}
        {gavetas.map((g, i) => {
          const syBase = telaY(g.posicao[1] - g.tamanho[1] / 2);
          const syTopo = telaY(g.posicao[1] + g.tamanho[1] / 2);
          return (
            <text
              key={`cota-gav-${i}`}
              x={offX + L * escala + 6}
              y={(syBase + syTopo) / 2 + 3}
              fontSize="8.5"
              fill="#6b7280"
            >
              {Math.round(g.tamanho[1] * 100)}cm
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
          {modulo.largura_cm}cm
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
          {modulo.altura_cm}cm
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground px-1">
        <div>
          {cfg.num_portas ?? 0} porta(s) · {cfg.num_gavetas ?? 0} gaveta(s) ·{" "}
          {cfg.num_prateleiras ?? 0} prateleira(s)
        </div>
        <div>
          Corpo {espCorpo}mm · Porta {espPorta}mm
        </div>
        {cfg.ferragem && (
          <div>Ferragem: {FERRAGEM_LABEL[cfg.ferragem] ?? cfg.ferragem}</div>
        )}
        {cfg.tipo_puxador && <div>Puxador: {labelPuxador(cfg.tipo_puxador)}</div>}
      </div>
    </div>
  );
}
