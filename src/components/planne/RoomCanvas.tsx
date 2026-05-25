import { useEffect, useRef, useState } from "react";

export interface MovelCanvas {
  id: string;
  nome: string;
  categoria: string;
  largura_cm: number;
  profundidade_cm: number;
  x_pct: number;
  y_pct: number;
  cor_hex: string;
  nota?: string;
}

interface Props {
  moveis: MovelCanvas[];
  medidas: { largura: number; profundidade: number };
  onChange?: (moveis: MovelCanvas[]) => void;
  readOnly?: boolean;
}

const CANVAS_W = 760;
const CANVAS_H = 520;
const WALL_THICKNESS = 16;
const INNER_W = CANVAS_W - WALL_THICKNESS * 2;
const INNER_H = CANVAS_H - WALL_THICKNESS * 2;

const CATEGORIA_COLORS: Record<string, string> = {
  armario: "#b5c8e2",
  cama: "#c8b5e2",
  mesa: "#b5e2c8",
  sofa: "#e2d4b5",
  rack: "#b5d4e2",
  estante: "#c8e2b5",
  bancada: "#e2c8b5",
  escritório: "#d4b5e2",
  outro: "#d0d0d0",
};

export function RoomCanvas({ moveis, medidas, onChange, readOnly = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [items, setItems] = useState<MovelCanvas[]>(moveis);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; ox: number; oy: number } | null>(null);

  useEffect(() => { setItems(moveis); }, [moveis]);

  const cmToX = (cm: number) => (cm / (medidas.largura * 100)) * INNER_W;
  const cmToY = (cm: number) => (cm / (medidas.profundidade * 100)) * INNER_H;
  const pctToX = (pct: number) => WALL_THICKNESS + pct * INNER_W;
  const pctToY = (pct: number) => WALL_THICKNESS + pct * INNER_H;

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    if (readOnly) return;
    e.preventDefault();
    const svgRect = svgRef.current!.getBoundingClientRect();
    const item = items.find((m) => m.id === id)!;
    setSelected(id);
    setDragging({
      id,
      startX: e.clientX,
      startY: e.clientY,
      ox: pctToX(item.x_pct),
      oy: pctToY(item.y_pct),
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const svgRect = svgRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / svgRect.width;
    const scaleY = CANVAS_H / svgRect.height;
    const dx = (e.clientX - dragging.startX) * scaleX;
    const dy = (e.clientY - dragging.startY) * scaleY;

    setItems((prev) =>
      prev.map((m) => {
        if (m.id !== dragging.id) return m;
        const newOx = Math.max(WALL_THICKNESS, Math.min(CANVAS_W - WALL_THICKNESS - cmToX(m.largura_cm), dragging.ox + dx));
        const newOy = Math.max(WALL_THICKNESS, Math.min(CANVAS_H - WALL_THICKNESS - cmToY(m.profundidade_cm), dragging.oy + dy));
        return {
          ...m,
          x_pct: (newOx - WALL_THICKNESS) / INNER_W,
          y_pct: (newOy - WALL_THICKNESS) / INNER_H,
        };
      })
    );
  };

  const onMouseUp = () => {
    if (dragging) {
      onChange?.(items);
      setDragging(null);
    }
  };

  const gridLines = () => {
    const lines = [];
    const step = 50;
    for (let x = WALL_THICKNESS; x < CANVAS_W - WALL_THICKNESS; x += step) {
      lines.push(<line key={`v${x}`} x1={x} y1={WALL_THICKNESS} x2={x} y2={CANVAS_H - WALL_THICKNESS} stroke="#e5e7eb" strokeWidth="0.5" />);
    }
    for (let y = WALL_THICKNESS; y < CANVAS_H - WALL_THICKNESS; y += step) {
      lines.push(<line key={`h${y}`} x1={WALL_THICKNESS} y1={y} x2={CANVAS_W - WALL_THICKNESS} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />);
    }
    return lines;
  };

  const scaleLabel = `${medidas.largura}m × ${medidas.profundidade}m`;

  return (
    <div className="relative rounded-lg border border-border overflow-hidden bg-[#f9f7f5] select-none">
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="block"
        style={{ cursor: dragging ? "grabbing" : "default" }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Room background */}
        <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#e8e4de" />
        <rect x={WALL_THICKNESS} y={WALL_THICKNESS} width={INNER_W} height={INNER_H} fill="#f5f3f0" />

        {/* Grid */}
        {gridLines()}

        {/* Walls */}
        <rect x={0} y={0} width={CANVAS_W} height={WALL_THICKNESS} fill="#8b7355" />
        <rect x={0} y={CANVAS_H - WALL_THICKNESS} width={CANVAS_W} height={WALL_THICKNESS} fill="#8b7355" />
        <rect x={0} y={0} width={WALL_THICKNESS} height={CANVAS_H} fill="#8b7355" />
        <rect x={CANVAS_W - WALL_THICKNESS} y={0} width={WALL_THICKNESS} height={CANVAS_H} fill="#8b7355" />

        {/* Door indicator */}
        <path
          d={`M ${WALL_THICKNESS + 60} ${CANVAS_H - WALL_THICKNESS}
             A 60 60 0 0 0 ${WALL_THICKNESS + 120} ${CANVAS_H - WALL_THICKNESS - 60}`}
          fill="none"
          stroke="#8b7355"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <rect x={WALL_THICKNESS + 60} y={CANVAS_H - WALL_THICKNESS - 2} width={60} height={4} fill="#f5f3f0" />

        {/* Furniture */}
        {items.map((m) => {
          const x = pctToX(m.x_pct);
          const y = pctToY(m.y_pct);
          const w = cmToX(m.largura_cm);
          const h = cmToY(m.profundidade_cm);
          const isSelected = selected === m.id;
          const color = m.cor_hex || CATEGORIA_COLORS[m.categoria] || "#d0d0d0";

          return (
            <g
              key={m.id}
              style={{ cursor: readOnly ? "default" : "grab" }}
              onMouseDown={(e) => onMouseDown(e, m.id)}
              onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}
            >
              {/* Shadow */}
              <rect x={x + 3} y={y + 3} width={w} height={h} rx={2} fill="rgba(0,0,0,0.12)" />
              {/* Body */}
              <rect
                x={x} y={y} width={w} height={h}
                rx={2}
                fill={color}
                stroke={isSelected ? "#6366f1" : "#a0957a"}
                strokeWidth={isSelected ? 2 : 0.8}
              />
              {/* Inner detail */}
              <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={1} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
              {/* Label */}
              {w > 40 && h > 24 && (
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(10, w / 6)}
                  fill="#3d3228"
                  fontFamily="system-ui"
                  fontWeight="500"
                  pointerEvents="none"
                >
                  {m.nome.length > 14 ? m.nome.slice(0, 12) + "…" : m.nome}
                </text>
              )}
              {/* Size label */}
              {w > 60 && h > 36 && (
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 11}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={7}
                  fill="#7a6a55"
                  fontFamily="system-ui"
                  pointerEvents="none"
                >
                  {m.largura_cm}×{m.profundidade_cm}cm
                </text>
              )}
            </g>
          );
        })}

        {/* Scale label */}
        <rect x={CANVAS_W - 100} y={CANVAS_H - 24} width={96} height={16} rx={3} fill="rgba(0,0,0,0.4)" />
        <text x={CANVAS_W - 52} y={CANVAS_H - 12} textAnchor="middle" fontSize={9} fill="white" fontFamily="system-ui">
          {scaleLabel}
        </text>

        {/* Compass */}
        <text x={CANVAS_W - 14} y={24} textAnchor="middle" fontSize={10} fill="#8b7355" fontFamily="system-ui" fontWeight="bold">N</text>
        <path d={`M ${CANVAS_W - 14} 28 L ${CANVAS_W - 14} 36`} stroke="#8b7355" strokeWidth="1" markerEnd="url(#arrow)" />
      </svg>

      {/* Selected info */}
      {selected && !readOnly && (() => {
        const m = items.find((i) => i.id === selected);
        if (!m) return null;
        return (
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 text-[11.5px]">
            <span className="font-medium">{m.nome}</span>
            <span className="text-muted-foreground ml-2">{m.largura_cm}×{m.profundidade_cm}cm</span>
            {m.nota && <span className="text-muted-foreground ml-2">· {m.nota}</span>}
          </div>
        );
      })()}
    </div>
  );
}
