import { useEffect, useRef, useState } from "react";

export interface MovelCanvas {
  id: string;
  nome: string;
  categoria: string;
  tipo_elemento?: "movel" | "porta" | "janela" | "existente";
  largura_cm: number;
  profundidade_cm: number;
  x_pct: number; // floor items: left %; wall items: position along wall 0-1
  y_pct: number; // floor items: top %; wall items: unused
  cor_hex: string;
  nota?: string;
  customizado?: boolean; // false = comprado/existente/porta/janela
  parede?: "top" | "bottom" | "left" | "right"; // for porta/janela
}

interface Props {
  moveis: MovelCanvas[];
  medidas: { largura: number; profundidade: number };
  onChange?: (moveis: MovelCanvas[]) => void;
  onExport?: (dataUrl: string) => void;
  readOnly?: boolean;
}

export function exportSvgToPng(svgEl: SVGSVGElement, filename = "planta.png"): Promise<string> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_W * 2;
      canvas.height = CANVAS_H * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
      resolve(dataUrl);
    };
    img.onerror = reject;
    img.src = url;
  });
}

const CANVAS_W = 900;
const CANVAS_H = 640;
const WT = 18; // wall thickness
const INNER_W = CANVAS_W - WT * 2;
const INNER_H = CANVAS_H - WT * 2;
const FLOOR = "#f5f3f0";
const WALL = "#8b7355";

const CATEGORIA_COLORS: Record<string, string> = {
  armario: "#b5c8e2",
  cama: "#c8b5e2",
  mesa: "#b5e2c8",
  sofa: "#e2d4b5",
  rack: "#b5d4e2",
  estante: "#c8e2b5",
  bancada: "#e2c8b5",
  escritorio: "#d4b5e2",
  outro: "#d0d0d0",
};

export function RoomCanvas({ moveis, medidas, onChange, onExport, readOnly = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [items, setItems] = useState<MovelCanvas[]>(moveis);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    id: string; startX: number; startY: number; ox: number; oy: number;
  } | null>(null);

  useEffect(() => { setItems(moveis); }, [moveis]);

  const cmToX = (cm: number) => (cm / (medidas.largura * 100)) * INNER_W;
  const cmToY = (cm: number) => (cm / (medidas.profundidade * 100)) * INNER_H;
  const pctToX = (pct: number) => WT + pct * INNER_W;
  const pctToY = (pct: number) => WT + pct * INNER_H;

  const isWallElement = (m: MovelCanvas) =>
    m.tipo_elemento === "porta" || m.tipo_elemento === "janela";

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    if (readOnly) return;
    e.preventDefault();
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
    if (!dragging || !svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / svgRect.width;
    const scaleY = CANVAS_H / svgRect.height;
    const dx = (e.clientX - dragging.startX) * scaleX;
    const dy = (e.clientY - dragging.startY) * scaleY;

    setItems((prev) =>
      prev.map((m) => {
        if (m.id !== dragging.id) return m;
        if (isWallElement(m)) {
          // Wall elements: constrain to their wall axis
          const parede = m.parede ?? "bottom";
          if (parede === "top" || parede === "bottom") {
            // Move along X
            const doorW = cmToX(m.largura_cm);
            const newOx = Math.max(WT, Math.min(CANVAS_W - WT - doorW, dragging.ox + dx));
            return { ...m, x_pct: (newOx - WT) / INNER_W };
          } else {
            // Move along Y
            const doorH = cmToX(m.largura_cm);
            const newOy = Math.max(WT, Math.min(CANVAS_H - WT - doorH, dragging.oy + dy));
            return { ...m, x_pct: (newOy - WT) / INNER_H };
          }
        }
        const w = cmToX(m.largura_cm);
        const h = cmToY(m.profundidade_cm);
        const newOx = Math.max(WT, Math.min(CANVAS_W - WT - w, dragging.ox + dx));
        const newOy = Math.max(WT, Math.min(CANVAS_H - WT - h, dragging.oy + dy));
        return { ...m, x_pct: (newOx - WT) / INNER_W, y_pct: (newOy - WT) / INNER_H };
      })
    );
  };

  const onMouseUp = () => {
    if (dragging) { onChange?.(items); setDragging(null); }
  };

  const gridLines = () => {
    const lines = [];
    for (let x = WT; x < CANVAS_W - WT; x += 50)
      lines.push(<line key={`v${x}`} x1={x} y1={WT} x2={x} y2={CANVAS_H - WT} stroke="#e5e7eb" strokeWidth="0.5" />);
    for (let y = WT; y < CANVAS_H - WT; y += 50)
      lines.push(<line key={`h${y}`} x1={WT} y1={y} x2={CANVAS_W - WT} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />);
    return lines;
  };

  // ── Door rendering ───────────────────────────────────────────────────────────
  const renderDoor = (m: MovelCanvas, isSelected: boolean) => {
    const parede = m.parede ?? "bottom";
    const dw = cmToX(m.largura_cm) || 80; // door width in SVG units
    const strokeColor = isSelected ? "#6366f1" : WALL;

    if (parede === "bottom") {
      const hx = WT + m.x_pct * INNER_W;
      const hy = CANVAS_H - WT;
      return (
        <g key={m.id} style={{ cursor: readOnly ? "default" : "ew-resize" }}
          onMouseDown={(e) => onMouseDown(e, m.id)} onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}>
          {/* Clear wall gap */}
          <rect x={hx} y={CANVAS_H - WT} width={dw} height={WT + 1} fill={FLOOR} />
          {/* Door panel line (open 90°) */}
          <line x1={hx} y1={hy} x2={hx} y2={hy - dw} stroke={strokeColor} strokeWidth="2.5" />
          {/* Swing arc */}
          <path d={`M ${hx} ${hy - dw} A ${dw} ${dw} 0 0 1 ${hx + dw} ${hy}`}
            fill="none" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="5 3" />
          {/* Label */}
          <text x={hx + dw / 2} y={hy - dw / 2} textAnchor="middle" dominantBaseline="middle"
            fontSize={9} fill={strokeColor} fontFamily="system-ui" fontWeight="600">P</text>
        </g>
      );
    }

    if (parede === "top") {
      const hx = WT + m.x_pct * INNER_W;
      const hy = WT;
      return (
        <g key={m.id} style={{ cursor: readOnly ? "default" : "ew-resize" }}
          onMouseDown={(e) => onMouseDown(e, m.id)} onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}>
          <rect x={hx} y={0} width={dw} height={WT + 1} fill={FLOOR} />
          <line x1={hx} y1={hy} x2={hx} y2={hy + dw} stroke={strokeColor} strokeWidth="2.5" />
          <path d={`M ${hx} ${hy + dw} A ${dw} ${dw} 0 0 0 ${hx + dw} ${hy}`}
            fill="none" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="5 3" />
          <text x={hx + dw / 2} y={hy + dw / 2} textAnchor="middle" dominantBaseline="middle"
            fontSize={9} fill={strokeColor} fontFamily="system-ui" fontWeight="600">P</text>
        </g>
      );
    }

    if (parede === "left") {
      const dh = dw;
      const hx = WT;
      const hy = WT + m.x_pct * INNER_H;
      return (
        <g key={m.id} style={{ cursor: readOnly ? "default" : "ns-resize" }}
          onMouseDown={(e) => onMouseDown(e, m.id)} onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}>
          <rect x={0} y={hy} width={WT + 1} height={dh} fill={FLOOR} />
          <line x1={hx} y1={hy} x2={hx + dh} y2={hy} stroke={strokeColor} strokeWidth="2.5" />
          <path d={`M ${hx + dh} ${hy} A ${dh} ${dh} 0 0 0 ${hx} ${hy + dh}`}
            fill="none" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="5 3" />
          <text x={hx + dh / 2} y={hy + dh / 2} textAnchor="middle" dominantBaseline="middle"
            fontSize={9} fill={strokeColor} fontFamily="system-ui" fontWeight="600">P</text>
        </g>
      );
    }

    // right wall
    const dh = dw;
    const hx = CANVAS_W - WT;
    const hy = WT + m.x_pct * INNER_H;
    return (
      <g key={m.id} style={{ cursor: readOnly ? "default" : "ns-resize" }}
        onMouseDown={(e) => onMouseDown(e, m.id)} onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}>
        <rect x={CANVAS_W - WT} y={hy} width={WT + 1} height={dh} fill={FLOOR} />
        <line x1={hx} y1={hy} x2={hx - dh} y2={hy} stroke={strokeColor} strokeWidth="2.5" />
        <path d={`M ${hx - dh} ${hy} A ${dh} ${dh} 0 0 1 ${hx} ${hy + dh}`}
          fill="none" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="5 3" />
        <text x={hx - dh / 2} y={hy + dh / 2} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fill={strokeColor} fontFamily="system-ui" fontWeight="600">P</text>
      </g>
    );
  };

  // ── Window rendering ─────────────────────────────────────────────────────────
  const renderWindow = (m: MovelCanvas, isSelected: boolean) => {
    const parede = m.parede ?? "top";
    const ww = cmToX(m.largura_cm) || 100;
    const glassColor = "#87ceeb";
    const strokeColor = isSelected ? "#6366f1" : "#4a90b8";

    if (parede === "bottom") {
      const wx = WT + m.x_pct * INNER_W;
      return (
        <g key={m.id} style={{ cursor: readOnly ? "default" : "ew-resize" }}
          onMouseDown={(e) => onMouseDown(e, m.id)} onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}>
          <rect x={wx} y={CANVAS_H - WT} width={ww} height={WT} fill={glassColor} opacity={0.7} />
          <line x1={wx} y1={CANVAS_H - WT} x2={wx + ww} y2={CANVAS_H - WT} stroke={strokeColor} strokeWidth="1.5" />
          <line x1={wx} y1={CANVAS_H - WT / 2} x2={wx + ww} y2={CANVAS_H - WT / 2} stroke={strokeColor} strokeWidth="1" />
          <line x1={wx} y1={CANVAS_H} x2={wx + ww} y2={CANVAS_H} stroke={strokeColor} strokeWidth="1.5" />
        </g>
      );
    }
    if (parede === "top") {
      const wx = WT + m.x_pct * INNER_W;
      return (
        <g key={m.id} style={{ cursor: readOnly ? "default" : "ew-resize" }}
          onMouseDown={(e) => onMouseDown(e, m.id)} onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}>
          <rect x={wx} y={0} width={ww} height={WT} fill={glassColor} opacity={0.7} />
          <line x1={wx} y1={0} x2={wx + ww} y2={0} stroke={strokeColor} strokeWidth="1.5" />
          <line x1={wx} y1={WT / 2} x2={wx + ww} y2={WT / 2} stroke={strokeColor} strokeWidth="1" />
          <line x1={wx} y1={WT} x2={wx + ww} y2={WT} stroke={strokeColor} strokeWidth="1.5" />
        </g>
      );
    }
    if (parede === "left") {
      const wy = WT + m.x_pct * INNER_H;
      return (
        <g key={m.id} style={{ cursor: readOnly ? "default" : "ns-resize" }}
          onMouseDown={(e) => onMouseDown(e, m.id)} onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}>
          <rect x={0} y={wy} width={WT} height={ww} fill={glassColor} opacity={0.7} />
          <line x1={0} y1={wy} x2={0} y2={wy + ww} stroke={strokeColor} strokeWidth="1.5" />
          <line x1={WT / 2} y1={wy} x2={WT / 2} y2={wy + ww} stroke={strokeColor} strokeWidth="1" />
          <line x1={WT} y1={wy} x2={WT} y2={wy + ww} stroke={strokeColor} strokeWidth="1.5" />
        </g>
      );
    }
    // right
    const wy = WT + m.x_pct * INNER_H;
    return (
      <g key={m.id} style={{ cursor: readOnly ? "default" : "ns-resize" }}
        onMouseDown={(e) => onMouseDown(e, m.id)} onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}>
        <rect x={CANVAS_W - WT} y={wy} width={WT} height={ww} fill={glassColor} opacity={0.7} />
        <line x1={CANVAS_W - WT} y1={wy} x2={CANVAS_W - WT} y2={wy + ww} stroke={strokeColor} strokeWidth="1.5" />
        <line x1={CANVAS_W - WT / 2} y1={wy} x2={CANVAS_W - WT / 2} y2={wy + ww} stroke={strokeColor} strokeWidth="1" />
        <line x1={CANVAS_W} y1={wy} x2={CANVAS_W} y2={wy + ww} stroke={strokeColor} strokeWidth="1.5" />
      </g>
    );
  };

  const scaleLabel = `${medidas.largura}m × ${medidas.profundidade}m`;

  // Separate wall and floor elements
  const floorItems = items.filter((m) => m.tipo_elemento !== "porta" && m.tipo_elemento !== "janela");
  const wallItems = items.filter((m) => m.tipo_elemento === "porta" || m.tipo_elemento === "janela");

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
        <rect x={WT} y={WT} width={INNER_W} height={INNER_H} fill={FLOOR} />

        {/* Grid */}
        {gridLines()}

        {/* Walls (drawn before wall elements so gaps can overwrite) */}
        <rect x={0} y={0} width={CANVAS_W} height={WT} fill={WALL} />
        <rect x={0} y={CANVAS_H - WT} width={CANVAS_W} height={WT} fill={WALL} />
        <rect x={0} y={0} width={WT} height={CANVAS_H} fill={WALL} />
        <rect x={CANVAS_W - WT} y={0} width={WT} height={CANVAS_H} fill={WALL} />

        {/* Wall elements (portas e janelas) — draw over walls to cut gaps */}
        {wallItems.map((m) => {
          const isSel = selected === m.id;
          if (m.tipo_elemento === "porta") return renderDoor(m, isSel);
          if (m.tipo_elemento === "janela") return renderWindow(m, isSel);
          return null;
        })}

        {/* Floor furniture */}
        {floorItems.map((m) => {
          const x = pctToX(m.x_pct);
          const y = pctToY(m.y_pct);
          const w = cmToX(m.largura_cm);
          const h = cmToY(m.profundidade_cm);
          const isSelected = selected === m.id;
          const isExistente = m.tipo_elemento === "existente" || m.customizado === false;
          const color = isExistente ? "#e8e3dc" : (m.cor_hex || CATEGORIA_COLORS[m.categoria] || "#d0d0d0");
          const borderColor = isSelected ? "#6366f1" : isExistente ? "#b0a898" : "#a0957a";
          const borderWidth = isSelected ? 2 : 1;

          return (
            <g
              key={m.id}
              style={{ cursor: readOnly ? "default" : "grab" }}
              onMouseDown={(e) => onMouseDown(e, m.id)}
              onClick={() => !readOnly && setSelected(m.id === selected ? null : m.id)}
            >
              {/* Shadow */}
              {!isExistente && <rect x={x + 3} y={y + 3} width={w} height={h} rx={2} fill="rgba(0,0,0,0.12)" />}
              {/* Body */}
              <rect
                x={x} y={y} width={w} height={h} rx={2}
                fill={color}
                stroke={borderColor}
                strokeWidth={borderWidth}
                strokeDasharray={isExistente ? "5 3" : undefined}
                opacity={isExistente ? 0.85 : 1}
              />
              {/* Inner detail — only for custom marcenaria */}
              {!isExistente && <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={1} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />}
              {/* Label */}
              {w > 40 && h > 24 && (
                <text x={x + w / 2} y={y + h / 2 - (isExistente ? 5 : 0)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.min(10, w / 6)} fill={isExistente ? "#7a6a55" : "#3d3228"}
                  fontFamily="system-ui" fontWeight="500" pointerEvents="none">
                  {m.nome.length > 14 ? m.nome.slice(0, 12) + "…" : m.nome}
                </text>
              )}
              {/* Size label */}
              {w > 60 && h > 36 && (
                <text x={x + w / 2} y={y + h / 2 + 11}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fill="#7a6a55" fontFamily="system-ui" pointerEvents="none">
                  {m.largura_cm}×{m.profundidade_cm}cm
                </text>
              )}
              {/* "Existente" badge */}
              {isExistente && w > 50 && (
                <text x={x + w / 2} y={y + h / 2 + 8}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fill="#9a8a75" fontFamily="system-ui" fontStyle="italic" pointerEvents="none">
                  existente
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

        {/* Compass N */}
        <text x={CANVAS_W - 14} y={24} textAnchor="middle" fontSize={10} fill={WALL} fontFamily="system-ui" fontWeight="bold">N</text>
        <line x1={CANVAS_W - 14} y1={28} x2={CANVAS_W - 14} y2={36} stroke={WALL} strokeWidth="1" />
      </svg>

      {/* Legend */}
      <div className="absolute top-2 left-2 flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5 text-[10.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm border border-[#a0957a] bg-[#b5c8e2]" /> Marcenaria
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm border border-dashed border-[#b0a898] bg-[#e8e3dc]" /> Existente
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#87ceeb] opacity-70" /> Janela
        </span>
      </div>

      {/* Export button */}
      {onExport && (
        <button
          onClick={() => svgRef.current && exportSvgToPng(svgRef.current).then(onExport)}
          className="absolute top-2 right-2 h-7 px-2.5 rounded-md bg-background/80 backdrop-blur-sm border border-border text-[11px] font-medium hover:bg-background transition-colors"
        >
          Exportar PNG
        </button>
      )}

      {/* Selected info */}
      {selected && !readOnly && (() => {
        const m = items.find((i) => i.id === selected);
        if (!m) return null;
        return (
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 text-[11.5px]">
            <span className="font-medium">{m.nome}</span>
            {m.tipo_elemento !== "porta" && m.tipo_elemento !== "janela" && (
              <span className="text-muted-foreground ml-2">{m.largura_cm}×{m.profundidade_cm}cm</span>
            )}
            {m.nota && <span className="text-muted-foreground ml-2">· {m.nota}</span>}
          </div>
        );
      })()}
    </div>
  );
}
