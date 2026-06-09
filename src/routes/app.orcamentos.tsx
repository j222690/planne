import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import {
  Plus, Filter, Loader2, AlertCircle, X, Trash2, Sparkles,
  ChevronRight, FileUp, Printer, Pencil, ImageUp, FolderPlus,
  ChevronDown, ChevronUp, Info, Search, FileText, Receipt, QrCode, Copy, CheckCheck,
  MessageCircle, MessageSquare, Download, Bot,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getOrcamentos, getClientes, getMateriais, getEmpresaAtual,
  upsertOrcamento, getOrcamentoItens, getOrcamentoMoveis, updateOrcamentoStatus,
  deleteOrcamento, updateOrcamento, replaceOrcamentoItens, upsertProjeto,
  upsertOrdemProducao, upsertLancamento,
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/orcamentos")({
  component: Orcamentos,
});

// ─── Types ─────────────────────────────────────────────────────────────────

type FiscalDados = {
  nfe_ref?: string;
  nfe_status?: string;
  nfe_chave?: string;
  nfe_ambiente?: string;
  nfe_emitido_em?: string;
  boleto?: { asaas_id: string; url: string | null; copia_cola: string | null; vencimento: string; status: string };
  pix?: { asaas_id: string; qr_code: string | null; copia_cola: string | null; vencimento: string; status: string };
};

type Orc = {
  id: string; numero: string | null; status: string;
  total: number; created_at: string;
  cliente_id?: string;
  projeto_id?: string;
  fiscal_dados?: FiscalDados | null;
  clientes: { nome: string; telefone?: string | null } | null;
  projetos: { nome: string } | null;
  assinatura_png?: string | null;
  assinado_em?: string | null;
};

type OrcItem = {
  id: string; movel?: string; justificativa?: string;
  descricao: string; quantidade: number; unidade: string;
  preco_custo: number; preco_unitario: number;
};

type Parede = {
  id: string;
  descricao: string;
  largura_cm: number;
  espaco_util_cm: number;
  obstaculos?: string | null;
};

type PlantaInfo = {
  paredes: Parede[];
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  observacoes?: string;
};

type MovelConfig = {
  id: string;
  tipo: string;
  nome: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  portas: number;
  tipo_porta: "abrir" | "abrir_vidro" | "abrir_espelho" | "correr" | "correr_vidro" | "correr_espelho" | "sem";
  gavetas: number;
  prateleiras: number;
  tem_fundo?: boolean;
  tem_rodape?: boolean;
  tem_pes?: boolean;
  tem_roda_teto?: boolean;
  altura_teto_cm?: number;
  tem_ripado?: boolean;
  ripa_espessura_mm?: number;
  ripa_largura_mm?: number;
  parede_id?: string;
  comodo_nome?: string;
  // Formato
  formato?: "retangular" | "L";
  arm2_largura_cm?: number;
  arm2_profundidade_cm?: number;
  // Pés de madeira maciça
  pe_madeira?: boolean;
  pe_altura_cm?: number;
  detalhes?: string; // extras livres: vidro, espelho interno, ripado, nicho LED, etc.
  // Materiais
  mdf_caixa_id?: string;
  mdf_externo_id?: string;
  fundo_id?: string;
  dobradica_id?: string;
  corrediça_porta_id?: string;
  corrediça_gaveta_id?: string;
  puxador_id?: string;
};

type MatCatalog = {
  id: string; nome: string; unidade: string;
  preco_custo: number; preco_venda: number; categoria: string | null;
};

// ─── Móveis por ambiente ────────────────────────────────────────────────────

const MOVEIS_POR_AMBIENTE: Record<string, Omit<MovelConfig, "id">[]> = {
  "Quarto": [
    { tipo: "cabeceira", nome: "Cabeceira", largura_cm: 160, profundidade_cm: 5, altura_cm: 120, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
    { tipo: "roupeiro", nome: "Roupeiro", largura_cm: 200, profundidade_cm: 60, altura_cm: 230, portas: 4, tipo_porta: "abrir", gavetas: 2, prateleiras: 3 },
    { tipo: "comoda", nome: "Cômoda", largura_cm: 120, profundidade_cm: 50, altura_cm: 80, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "criado-mudo", nome: "Criado-mudo", largura_cm: 45, profundidade_cm: 40, altura_cm: 60, portas: 1, tipo_porta: "abrir", gavetas: 1, prateleiras: 0 },
    { tipo: "escrivaninha", nome: "Escrivaninha", largura_cm: 140, profundidade_cm: 65, altura_cm: 75, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 1 },
    { tipo: "estante", nome: "Estante", largura_cm: 100, profundidade_cm: 35, altura_cm: 200, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "ripado", nome: "Painel Ripado", largura_cm: 160, profundidade_cm: 5, altura_cm: 240, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0, tem_ripado: true, ripa_espessura_mm: 15, ripa_largura_mm: 30 },
  ],
  "Cozinha": [
    { tipo: "arm-sup", nome: "Armários Superiores", largura_cm: 300, profundidade_cm: 35, altura_cm: 70, portas: 6, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "arm-inf", nome: "Armários Inferiores", largura_cm: 300, profundidade_cm: 60, altura_cm: 85, portas: 4, tipo_porta: "abrir", gavetas: 3, prateleiras: 0 },
    { tipo: "bancada", nome: "Bancada / Tampo", largura_cm: 300, profundidade_cm: 60, altura_cm: 5, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
    { tipo: "torre", nome: "Torre Forno / Micro", largura_cm: 70, profundidade_cm: 60, altura_cm: 230, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "despenseiro", nome: "Despenseiro", largura_cm: 40, profundidade_cm: 60, altura_cm: 230, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 5 },
  ],
  "Sala": [
    { tipo: "rack", nome: "Rack", largura_cm: 200, profundidade_cm: 45, altura_cm: 50, portas: 2, tipo_porta: "correr", gavetas: 0, prateleiras: 2 },
    { tipo: "estante-sala", nome: "Estante", largura_cm: 150, profundidade_cm: 35, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "buffet", nome: "Buffet / Aparador", largura_cm: 150, profundidade_cm: 45, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 1 },
    { tipo: "painel-tv", nome: "Painel TV", largura_cm: 200, profundidade_cm: 5, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0, tem_ripado: true, ripa_espessura_mm: 15, ripa_largura_mm: 30 },
  ],
  "Escritório": [
    { tipo: "mesa-trab", nome: "Mesa de Trabalho", largura_cm: 160, profundidade_cm: 75, altura_cm: 75, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 0 },
    { tipo: "estante-escr", nome: "Estante / Prateleiras", largura_cm: 150, profundidade_cm: 35, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "armario-escr", nome: "Armário", largura_cm: 100, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "gaveteiro", nome: "Gaveteiro", largura_cm: 40, profundidade_cm: 50, altura_cm: 70, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
  ],
  "Closet": [
    { tipo: "prateleiras-cl", nome: "Prateleiras", largura_cm: 100, profundidade_cm: 45, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 6 },
    { tipo: "cabideiro", nome: "Cabideiro", largura_cm: 100, profundidade_cm: 55, altura_cm: 120, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 1 },
    { tipo: "gavetas-cl", nome: "Gaveteiro", largura_cm: 80, profundidade_cm: 55, altura_cm: 100, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "sapateira", nome: "Sapateira", largura_cm: 100, profundidade_cm: 35, altura_cm: 60, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
  ],
  "Banheiro": [
    { tipo: "gabinete", nome: "Gabinete", largura_cm: 80, profundidade_cm: 45, altura_cm: 55, portas: 2, tipo_porta: "abrir", gavetas: 1, prateleiras: 0 },
    { tipo: "espelheira", nome: "Espelheira / Nicho", largura_cm: 80, profundidade_cm: 15, altura_cm: 60, portas: 1, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "nicho-ban", nome: "Nicho Decorativo", largura_cm: 60, profundidade_cm: 15, altura_cm: 30, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 1 },
  ],
  "Área gourmet": [
    { tipo: "bancada-gourmet", nome: "Bancada", largura_cm: 200, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 0 },
    { tipo: "armario-gourmet", nome: "Armário", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
  ],
  "Lavanderia": [
    { tipo: "arm-lav", nome: "Armário", largura_cm: 100, profundidade_cm: 45, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "bancada-lav", nome: "Bancada", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
  ],
  "Garagem": [
    { tipo: "arm-gar", nome: "Armário de Garagem", largura_cm: 120, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 4 },
    { tipo: "bancada-gar", nome: "Bancada de Trabalho", largura_cm: 180, profundidade_cm: 70, altura_cm: 85, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 0 },
  ],
  "Outro": [
    { tipo: "armario-gen", nome: "Armário", largura_cm: 120, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "bancada-gen", nome: "Bancada / Balcão", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 0 },
  ],
};

const AMBIENTES = Object.keys(MOVEIS_POR_AMBIENTE);

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "amber" | "green" | "blue" | "neutral"> = {
  rascunho: "neutral", analise: "amber", aprovado: "green", recusado: "neutral",
};
const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", analise: "Em análise", aprovado: "Aprovado", recusado: "Recusado",
};

// ─── Schemas ────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  movel: z.string().optional(),
  justificativa: z.string().optional(),
  descricao: z.string().min(1, "Descrição obrigatória"),
  quantidade: z.coerce.number().min(0.001),
  unidade: z.string(),
  preco_custo: z.coerce.number().min(0),
  preco_unitario: z.coerce.number().min(0),
});

const schema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  status: z.string(),
  margem_pct: z.coerce.number().min(0),
  mao_de_obra: z.coerce.number().min(0),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione ao menos um item"),
});
type FormData = z.infer<typeof schema>;

// ─── Wall Visualization ─────────────────────────────────────────────────────

const MOVEL_COLORS: Record<string, [string, string, string, string]> = {
  // [frontFill, stroke, topFill, sideFill]
  roupeiro:     ["#818cf8","#4338ca","#c7d2fe","#6366f1"],
  "arm-sup":    ["#93c5fd","#1d4ed8","#bfdbfe","#60a5fa"],
  "arm-inf":    ["#818cf8","#4338ca","#c7d2fe","#6366f1"],
  bancada:      ["#94a3b8","#334155","#e2e8f0","#64748b"],
  rack:         ["#67e8f9","#0891b2","#a5f3fc","#22d3ee"],
  gabinete:     ["#6ee7b7","#059669","#a7f3d0","#34d399"],
  buffet:       ["#fcd34d","#b45309","#fef9c3","#fbbf24"],
  comoda:       ["#fcd34d","#b45309","#fef9c3","#fbbf24"],
  estante:      ["#6ee7b7","#059669","#a7f3d0","#34d399"],
  torre:        ["#818cf8","#4338ca","#c7d2fe","#6366f1"],
  despenseiro:  ["#818cf8","#4338ca","#c7d2fe","#6366f1"],
  espelheira:   ["#bae6fd","#0284c7","#e0f2fe","#7dd3fc"],
  gaveteiro:    ["#fcd34d","#b45309","#fef9c3","#fbbf24"],
} as Record<string, [string,string,string,string]>;
const WALL_CLRS: [string,string,string,string] = ["#e2e8f0","#64748b","#f1f5f9","#cbd5e1"];
const getMC = (tipo: string) => MOVEL_COLORS[tipo] ?? WALL_CLRS;

const WALL_MOUNTED_Y: Record<string, number> = {
  "arm-sup": 85, espelheira: 90, "nicho-ban": 80, "painel-tv": 100,
};

function WallVisualization({
  moveis, plantaInfo, medW, medH,
}: {
  moveis: MovelConfig[];
  plantaInfo: PlantaInfo | null;
  medW: number; medH: number;
}) {
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [selWall, setSelWall] = useState<string | null>(null);

  const walls = plantaInfo?.paredes ?? [];
  const activeWall = selWall ?? walls[0]?.id ?? null;

  const visible = activeWall
    ? moveis.filter((m) => !m.parede_id || m.parede_id === activeWall)
    : moveis;

  const parede = walls.find((w) => w.id === activeWall);
  const wallW = parede?.espaco_util_cm ?? (medW > 0 ? Math.round(medW * 100) : Math.max(200, visible.reduce((s, m) => s + m.largura_cm + 2, 0)));
  const wallH = plantaInfo?.altura_cm ?? (medH > 0 ? Math.round(medH * 100) : 270);

  const SVG_W = 680, SVG_H = 360;
  const ML = 28, MT = 28, MR = 12, MB = 28;
  const availW = SVG_W - ML - MR, availH = SVG_H - MT - MB;
  const scale = Math.min(availW / wallW, availH / wallH);
  const wallPxW = wallW * scale, wallPxH = wallH * scale;
  const ox = ML + (availW - wallPxW) / 2;
  const oy = MT + (availH - wallPxH);

  // auto-layout left to right
  let xAcc = 0;
  const laid = visible.map((m) => {
    const x = xAcc;
    xAcc += m.largura_cm + 2;
    return { m, x, yFloor: WALL_MOUNTED_Y[m.tipo] ?? 0 };
  });

  // 3D oblique helpers
  const ANG = 28 * Math.PI / 180, DR = 0.38;
  const ddx = (d: number) => d * DR * Math.cos(ANG) * scale;
  const ddy = (d: number) => -d * DR * Math.sin(ANG) * scale;

  const LABEL_PORTA: Record<string, string> = {
    abrir:"◁", abrir_vidro:"◁⬜", abrir_espelho:"◁▣",
    correr:"↔", correr_vidro:"↔⬜", correr_espelho:"↔▣", sem:"",
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {(["2d","3d"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`h-6 px-2.5 rounded text-[11px] border transition-colors ${view===v?"bg-foreground text-background border-foreground":"border-border text-muted-foreground hover:bg-secondary"}`}>
            {v.toUpperCase()}
          </button>
        ))}
        {walls.length > 1 && walls.map((w) => (
          <button key={w.id} type="button" onClick={() => setSelWall(w.id)}
            className={`h-6 px-2 rounded text-[11px] border transition-colors ${activeWall===w.id?"bg-accent/20 border-accent text-accent":"border-border text-muted-foreground hover:bg-secondary"}`}>
            Parede {w.id} — {w.espaco_util_cm}cm
          </button>
        ))}
        <span className="ml-auto text-[10.5px] text-muted-foreground">{wallW}cm L × {wallH}cm H</span>
      </div>

      <div className="rounded-lg border border-border overflow-hidden" style={{ background: "var(--color-surface-2, #f8fafc)" }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ maxHeight: 320, display:"block" }}>
          {/* Wall bg */}
          <rect x={ox} y={oy} width={wallPxW} height={wallPxH} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} />
          {/* Grid 50cm */}
          {Array.from({length: Math.floor(wallH/50)}).map((_,i) => (
            <line key={i} x1={ox} y1={oy + wallPxH - (i+1)*50*scale} x2={ox+wallPxW} y2={oy+wallPxH-(i+1)*50*scale}
              stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="3,2" />
          ))}
          {/* Floor */}
          <line x1={ox-8} y1={oy+wallPxH} x2={ox+wallPxW+8} y2={oy+wallPxH} stroke="#475569" strokeWidth={2.5} />

          {view==="2d" ? laid.map(({ m, x, yFloor }) => {
            const fw = m.largura_cm * scale;
            const fh = m.altura_cm * scale;
            const fx = ox + x * scale;
            const fy = oy + wallPxH - (yFloor + m.altura_cm) * scale;
            const [fill, stroke] = getMC(m.tipo);
            const portas = m.portas || 0;
            const isGlass = m.tipo_porta?.includes("vidro");
            const isMirror = m.tipo_porta?.includes("espelho");
            return (
              <g key={m.id}>
                <rect x={fx} y={fy} width={fw} height={fh} fill={fill} stroke={stroke} strokeWidth={1} rx={1} />
                {/* Door splits */}
                {portas > 1 && Array.from({length: portas-1}).map((_,i) => (
                  <line key={i} x1={fx+fw/portas*(i+1)} y1={fy} x2={fx+fw/portas*(i+1)} y2={fy+fh}
                    stroke={stroke} strokeWidth={0.7} strokeDasharray="3,1.5" />
                ))}
                {/* Glass/mirror overlay */}
                {isGlass && <rect x={fx+2} y={fy+2} width={fw-4} height={fh-4} fill="rgba(186,230,253,0.35)" stroke="#0284c7" strokeWidth={0.8} rx={1} />}
                {isMirror && <rect x={fx+2} y={fy+2} width={fw-4} height={fh-4} fill="rgba(203,213,225,0.5)" stroke="#64748b" strokeWidth={0.8} rx={1} />}
                {/* Label */}
                {fw>16 && fh>10 && (
                  <text x={fx+fw/2} y={fy+fh/2} textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(6.5,Math.min(9.5,fw/8))} fill="#1e293b" fontWeight="500">
                    {m.nome.length>13 ? m.nome.slice(0,12)+"…" : m.nome}
                  </text>
                )}
                {/* Width below */}
                <text x={fx+fw/2} y={oy+wallPxH+15} textAnchor="middle" fontSize={6.5} fill="#64748b">{m.largura_cm}</text>
              </g>
            );
          }) : laid.map(({ m, x, yFloor }) => {
            const fw = m.largura_cm * scale;
            const fh = m.altura_cm * scale;
            const fx = ox + x * scale;
            const fy = oy + wallPxH - (yFloor + m.altura_cm) * scale;
            const dx = ddx(m.profundidade_cm), dy2 = ddy(m.profundidade_cm);
            const [fill, stroke, topFill, sideFill] = getMC(m.tipo);
            const portas = m.portas || 0;
            return (
              <g key={m.id}>
                {/* Top */}
                <path d={`M${fx},${fy} L${fx+fw},${fy} L${fx+fw+dx},${fy+dy2} L${fx+dx},${fy+dy2} Z`}
                  fill={topFill} stroke={stroke} strokeWidth={0.6} />
                {/* Side */}
                <path d={`M${fx+fw},${fy} L${fx+fw+dx},${fy+dy2} L${fx+fw+dx},${fy+fh+dy2} L${fx+fw},${fy+fh} Z`}
                  fill={sideFill} stroke={stroke} strokeWidth={0.6} />
                {/* Front */}
                <rect x={fx} y={fy} width={fw} height={fh} fill={fill} stroke={stroke} strokeWidth={0.6} />
                {portas > 1 && Array.from({length: portas-1}).map((_,i) => (
                  <line key={i} x1={fx+fw/portas*(i+1)} y1={fy} x2={fx+fw/portas*(i+1)} y2={fy+fh}
                    stroke={stroke} strokeWidth={0.5} strokeDasharray="2,1" />
                ))}
                {fw>18 && fh>12 && (
                  <text x={fx+fw/2} y={fy+fh/2} textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(6,Math.min(9,fw/9))} fill="#1e293b" fontWeight="500">
                    {m.nome.length>11 ? m.nome.slice(0,10)+"…" : m.nome}
                  </text>
                )}
              </g>
            );
          })}

          {/* Dimensions */}
          <text x={ox+wallPxW/2} y={oy-8} textAnchor="middle" fontSize={8.5} fill="#64748b">{wallW}cm</text>
          <text x={ox-14} y={oy+wallPxH/2} textAnchor="middle" fontSize={8.5} fill="#64748b"
            transform={`rotate(-90 ${ox-14} ${oy+wallPxH/2})`}>{wallH}cm</text>
        </svg>
      </div>

      {/* Legend */}
      {visible.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visible.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
              <div className="size-2.5 rounded-sm border" style={{ background: getMC(m.tipo)[0], borderColor: getMC(m.tipo)[1] }} />
              {m.nome} {m.largura_cm}×{m.altura_cm}cm
              {m.tipo_porta && m.tipo_porta !== "sem" && <span className="opacity-60">{LABEL_PORTA[m.tipo_porta]}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

// Um cômodo do orçamento — instância nomeada com medida e/ou planta próprias.
interface ComodoOrc {
  id: string;
  nome: string;            // "Cozinha", "Quarto Maria" (editável)
  tipo: string;            // chave de MOVEIS_POR_AMBIENTE
  largura: number;
  profundidade: number;
  altura: number;
  plantaB64: string | null;
  plantaNome: string | null;
  plantaInfo: PlantaInfo | null;
  analisando: boolean;
}

// Tipo de cômodo → layout do motor paramétrico (ambientes fabricáveis pelo motor)
const COMODO_TO_LAYOUT: Record<string, string> = {
  "Cozinha": "cozinha_linear",
  "Área gourmet": "cozinha_linear",
  "Quarto": "dormitorio",
  "Closet": "closet",
  "Banheiro": "banheiro",
  "Lavanderia": "lavanderia",
  "Sala": "sala",
  "Escritório": "escritorio",
};

interface ItemMotorOrc {
  descricao: string; quantidade: number; preco_custo: number; preco_unitario: number; total: number;
}
interface VersaoConsolidada {
  itens: ItemMotorOrc[]; total: number; custo: number; margem: number;
}
type MotorVersoes = Record<"economica" | "intermediaria" | "premium", VersaoConsolidada>;

function OrcamentoModal({ onClose, onSaved, editOrc }: {
  onClose: () => void; onSaved: () => void; editOrc?: Orc & { itens?: OrcItem[] };
}) {
  const isEdit = !!editOrc;
  const [fase, setFase] = useState<"configurar" | "moveis" | "revisar">(isEdit ? "revisar" : "configurar");
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [catalogo, setCatalogo] = useState<MatCatalog[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  // Configurar
  const [clienteId, setClienteId] = useState("");
  const [margemPct, setMargemPct] = useState(300);
  const [openAmbientes, setOpenAmbientes] = useState<Set<string>>(new Set(["Cozinha", "Sala", "Quarto"]));
  const [searchMoveis, setSearchMoveis] = useState("");
  const [plantaB64, setPlantaB64] = useState<string | null>(null);
  const [plantaNome, setPlantaNome] = useState<string | null>(null);
  const [medidas, setMedidas] = useState({ largura: 0, profundidade: 0, altura: 2.7 });
  const [comodosMedidas, setComodosMedidas] = useState<Record<string, { largura: number; profundidade: number; altura: number }>>({});
  const [descricao, setDescricao] = useState("");

  // Cômodos do orçamento (instâncias nomeadas, cada um com medida e/ou planta)
  const [comodos, setComodos] = useState<ComodoOrc[]>([]);
  const [novoComodoTipo, setNovoComodoTipo] = useState("");

  const addComodo = (tipo: string) => {
    if (!tipo) return;
    setComodos((prev) => {
      const mesmoTipo = prev.filter((c) => c.tipo === tipo).length;
      const nome = mesmoTipo > 0 ? `${tipo} ${mesmoTipo + 1}` : tipo;
      return [...prev, {
        id: Math.random().toString(36).slice(2),
        nome, tipo, largura: 0, profundidade: 0, altura: 2.7,
        plantaB64: null, plantaNome: null, plantaInfo: null, analisando: false,
      }];
    });
    setNovoComodoTipo("");
  };

  const updateComodo = (id: string, patch: Partial<ComodoOrc>) =>
    setComodos((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));

  const removeComodo = (id: string) => {
    const c = comodos.find((x) => x.id === id);
    setComodos((prev) => prev.filter((x) => x.id !== id));
    // Remover móveis do cômodo removido
    if (c) setMoveis((prev) => prev.filter((m) => m.comodo_nome !== c.nome));
  };

  const analisarPlantaComodo = async (id: string, file: File) => {
    const b64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    updateComodo(id, { plantaB64: b64, plantaNome: file.name, plantaInfo: null, analisando: true });
    try {
      const res = await fetch("/api/analisar-planta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planta_b64: b64 }),
      });
      if (res.ok) {
        const info = await res.json() as PlantaInfo;
        updateComodo(id, {
          plantaInfo: info, analisando: false,
          largura: info.largura_cm / 100, profundidade: info.profundidade_cm / 100, altura: info.altura_cm / 100,
        });
        toast.success(`Planta analisada: ${(info.largura_cm / 100).toFixed(1)}×${(info.profundidade_cm / 100).toFixed(1)}m`);
      } else {
        updateComodo(id, { analisando: false });
        toast.error("Não foi possível analisar a planta deste cômodo");
      }
    } catch {
      updateComodo(id, { analisando: false });
      toast.error("Erro ao analisar planta");
    }
  };

  /** Cômodo é válido se tem planta OU largura+profundidade. */
  const comodoValido = (c: ComodoOrc) => !!c.plantaB64 || (c.largura > 0 && c.profundidade > 0);

  // Planta analisada
  const [plantaInfo, setPlantaInfo] = useState<PlantaInfo | null>(null);
  const [analisandoPlanta, setAnalisandoPlanta] = useState(false);

  // Móveis
  const [moveis, setMoveis] = useState<MovelConfig[]>([]);
  const [expandedMovel, setExpandedMovel] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const plantaRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "rascunho", margem_pct: 300,
      itens: [{ descricao: "", quantidade: 1, unidade: "un", preco_custo: 0, preco_unitario: 0 }],
    },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "itens" });
  const itens = watch("itens");
  const subtotal = itens.reduce((s, i) => s + (Number(i.preco_unitario) || 0) * (Number(i.quantidade) || 0), 0);

  // ─── Motor paramétrico: 3 versões consolidadas de todos os cômodos fabricáveis ──
  const [motorVersoes, setMotorVersoes] = useState<MotorVersoes | null>(null);
  const [motorGerando, setMotorGerando] = useState(false);

  const gerarPeloMotor = async () => {
    const suportados = comodos.filter((c) => COMODO_TO_LAYOUT[c.tipo] && comodoValido(c));
    if (suportados.length === 0) {
      toast.error("Adicione ao menos um cômodo fabricável (cozinha, quarto, closet, banheiro, lavanderia) com medidas ou planta.");
      return;
    }
    setMotorGerando(true);
    try {
      const acc: MotorVersoes = {
        economica: { itens: [], total: 0, custo: 0, margem: 0 },
        intermediaria: { itens: [], total: 0, custo: 0, margem: 0 },
        premium: { itens: [], total: 0, custo: 0, margem: 0 },
      };
      for (const c of suportados) {
        const res = await fetch("/api/motor?action=gerar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "gerar",
            tipo_layout: COMODO_TO_LAYOUT[c.tipo],
            medidas: {
              largura_cm: Math.round((c.largura || 4) * 100),
              profundidade_cm: Math.round((c.profundidade || 3) * 100),
              altura_cm: Math.round((c.altura || 2.7) * 100),
            },
            preferencias: {
              parede_principal: "top", cor_mdf_hex: "#D9C7A8", ferragem: "nacional",
              tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica", versao_comercial: "intermediaria",
            },
          }),
        });
        if (!res.ok) throw new Error(`${c.nome}: ${(await res.json() as { error: string }).error}`);
        const data = await res.json() as {
          orcamentos: Record<string, { itens: ItemMotorOrc[]; analise_financeira: { custo_total: number; preco_venda: number; margem_desejada_pct: number } }>;
        };
        (["economica", "intermediaria", "premium"] as const).forEach((k) => {
          const ov = data.orcamentos[k];
          acc[k].itens.push(...ov.itens.map((it) => ({ ...it, descricao: `${c.nome} — ${it.descricao}` })));
          acc[k].total += ov.analise_financeira.preco_venda;
          acc[k].custo += ov.analise_financeira.custo_total;
          acc[k].margem = ov.analise_financeira.margem_desejada_pct;
        });
      }
      setMotorVersoes(acc);
      toast.success(`${suportados.length} cômodo(s) calculados pelo motor — 3 versões prontas.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no motor paramétrico");
    } finally {
      setMotorGerando(false);
    }
  };

  const usarVersaoMotor = (k: "economica" | "intermediaria" | "premium") => {
    if (!motorVersoes) return;
    const v = motorVersoes[k];
    replace(v.itens.map((it) => ({
      descricao: it.descricao, quantidade: it.quantidade, unidade: "un",
      preco_custo: it.preco_custo, preco_unitario: it.preco_unitario,
    })));
    if (clienteId) setValue("cliente_id", clienteId);
    setValue("margem_pct", Math.round(v.margem));
    setMargemPct(Math.round(v.margem));
    setFase("revisar");
    toast.success(`Versão ${k} aplicada (${v.itens.length} itens).`);
  };

  useEffect(() => {
    async function load() {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const eid = (empresa as { id: string }).id;
      setEmpresaId(eid);
      const [c, m] = await Promise.all([getClientes(eid), getMateriais(eid)]);
      setClientes(c as { id: string; nome: string }[]);
      const raw = m as { id: string; nome: string; unidade: string; preco_custo: number; preco_venda: number }[];
      setCatalogo(raw.map((r) => ({
        id: r.id, nome: r.nome, unidade: r.unidade,
        preco_custo: r.preco_custo, preco_venda: r.preco_venda,
        categoria: r.nome.split(" ")[0] || "Geral",
      })));

      if (editOrc) {
        setValue("cliente_id", (editOrc as unknown as { cliente_id?: string }).cliente_id ?? "");
        setValue("status", editOrc.status);
        setValue("margem_pct", (editOrc as unknown as { margem_pct?: number }).margem_pct ?? 300);
        const itensExistentes = editOrc.itens ?? await getOrcamentoItens(editOrc.id) as OrcItem[];
        if (itensExistentes.length > 0) {
          replace(itensExistentes.map((it) => ({
            movel: (it as OrcItem).movel ?? "",
            justificativa: (it as OrcItem).justificativa ?? "",
            descricao: it.descricao, quantidade: Number(it.quantidade),
            unidade: it.unidade, preco_custo: Number(it.preco_custo), preco_unitario: Number(it.preco_unitario),
          })));
        }
      }
    }
    load();
  }, []);

  // Filtros do catálogo por tipo de material
  const mdfCatalog = useMemo(() => catalogo.filter((m) => /^MDF|^MDP/i.test(m.nome)), [catalogo]);
  const fundoCatalog = useMemo(() => catalogo.filter((m) => /6mm|fundo/i.test(m.nome)), [catalogo]);
  const dobCatalog = useMemo(() => catalogo.filter((m) => /dobrad/i.test(m.nome)), [catalogo]);
  const corrPortaCatalog = useMemo(() => catalogo.filter((m) => /corredi/i.test(m.nome) && !/gaveta|telesc/i.test(m.nome)), [catalogo]);
  const corrGavCatalog = useMemo(() => catalogo.filter((m) => /corredi/i.test(m.nome) && /gaveta|telesc/i.test(m.nome)), [catalogo]);
  const puxadorCatalog = useMemo(() => catalogo.filter((m) => /^puxador/i.test(m.nome)), [catalogo]);

  // Tipos que normalmente NÃO têm fundo
  const TIPOS_SEM_FUNDO = new Set(["cabeceira", "ripado", "bancada", "painel-tv", "bancada-gourmet", "bancada-lav", "bancada-gar", "bancada-gen"]);

  // Móveis helpers
  const toggleMovel = (template: Omit<MovelConfig, "id">, comodo_nome?: string) => {
    setMoveis((prev) => {
      const exists = prev.find((m) => m.tipo === template.tipo && m.comodo_nome === comodo_nome);
      if (exists) return prev.filter((m) => !(m.tipo === template.tipo && m.comodo_nome === comodo_nome));
      const novo: MovelConfig = {
        ...template,
        id: Math.random().toString(36).slice(2),
        tem_fundo: !TIPOS_SEM_FUNDO.has(template.tipo),
        comodo_nome,
      };
      setExpandedMovel(novo.id);
      return [...prev, novo];
    });
  };

  const updateMovel = (id: string, updates: Partial<MovelConfig>) => {
    setMoveis((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m));
  };

  const handlePlantaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setPlantaB64(b64);
    setPlantaNome(file.name);
    setPlantaInfo(null);
    if (plantaRef.current) plantaRef.current.value = "";

    setAnalisandoPlanta(true);
    try {
      const res = await fetch("/api/analisar-planta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planta_b64: b64 }),
      });
      if (res.ok) {
        const info = await res.json() as PlantaInfo;
        setPlantaInfo(info);
        const dims = `${(info.largura_cm / 100).toFixed(1)}m × ${(info.profundidade_cm / 100).toFixed(1)}m × ${(info.altura_cm / 100).toFixed(1)}m`;
        toast.success(`Planta analisada: ${dims} — ${info.paredes.length} paredes detectadas`);
      } else {
        toast.error("Não foi possível analisar a planta automaticamente");
      }
    } catch {
      toast.error("Erro ao analisar planta");
    } finally {
      setAnalisandoPlanta(false);
    }
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/pdf-orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_b64: b64, tipo_mime: file.type || "image/jpeg" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.itens?.length) {
        replace(data.itens);
        if (data.margem_detectada) setValue("margem_pct", data.margem_detectada);
        setFase("revisar");
        toast.success(`${data.itens.length} itens importados do PDF!`);
      } else {
        toast.error("Nenhum item encontrado no documento.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar PDF");
    } finally {
      if (pdfRef.current) pdfRef.current.value = "";
    }
  };

  const handleGerarIA = async () => {
    if (!clienteId) { toast.error("Selecione um cliente."); return; }
    if (moveis.length === 0) { toast.error("Selecione ao menos um móvel."); return; }
    const semMedidas = moveis.filter((m) => !m.largura_cm || !m.profundidade_cm || !m.altura_cm);
    if (semMedidas.length > 0) {
      toast.error(`${semMedidas.length} móvel(is) sem medidas completas: ${semMedidas.map((m) => m.nome).join(", ")}`);
      return;
    }

    setAiLoading(true);
    try {
      const ambienteContexto = comodos.length > 0
        ? [...new Set(comodos.map((c) => c.nome))].join(" e ")
        : "Residencial";
      const primeiro = comodos[0];
      const body = {
        ambiente: ambienteContexto, descricao, margem_pct: margemPct,
        moveis,
        materiais: catalogo,
        // Medidas por cômodo (cada um com sua planta ou medida já resolvida)
        comodos: comodosMedidas,
        ...(primeiro && primeiro.largura ? { medidas: { largura: primeiro.largura, profundidade: primeiro.profundidade, altura: primeiro.altura } } : {}),
      };
      const res = await fetch("/api/calcular-orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!data.itens?.length) throw new Error("A IA não retornou itens.");
      replace(data.itens);
      setValue("cliente_id", clienteId);
      setValue("margem_pct", margemPct);
      if (data.resumo) setValue("observacoes", data.resumo);
      setFase("revisar");
      toast.success(`${data.itens.length} itens calculados pela IA!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao calcular orçamento");
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!empresaId) return;
    try {
      const itensPayload = (orcId: string) => data.itens.map((it) => ({
        orcamento_id: orcId,
        movel: it.movel || null,
        justificativa: it.justificativa || null,
        descricao: it.descricao,
        quantidade: it.quantidade,
        unidade: it.unidade,
        preco_custo: it.preco_custo,
        preco_unitario: it.preco_unitario,
        total: it.quantidade * it.preco_unitario,
      }));

      if (isEdit && editOrc) {
        await updateOrcamento(editOrc.id, {
          cliente_id: data.cliente_id, status: data.status, margem_pct: data.margem_pct,
          observacoes: data.observacoes, subtotal, total: subtotal,
          ...(moveis.length ? { moveis_config: Object.keys(comodosMedidas).length ? { moveis, comodos: comodosMedidas } : moveis } : {}),
        });
        await replaceOrcamentoItens(editOrc.id, itensPayload(editOrc.id));
        toast.success("Orçamento atualizado!");
      } else {
        const orc = await upsertOrcamento(empresaId, {
          cliente_id: data.cliente_id, status: data.status, margem_pct: data.margem_pct,
          observacoes: data.observacoes, subtotal, total: subtotal,
          ...(moveis.length ? { moveis_config: Object.keys(comodosMedidas).length ? { moveis, comodos: comodosMedidas } : moveis } : {}),
        });
        const { error: insErr } = await supabase.from("orcamento_itens").insert(itensPayload(orc.id));
        if (insErr) throw new Error(insErr.message);
        toast.success(`Orçamento ${orc.numero} criado!`);
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const toggleAmbiente = (amb: string) => setOpenAmbientes((prev) => {
    const next = new Set(prev);
    if (next.has(amb)) next.delete(amb); else next.add(amb);
    return next;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-2xl bg-surface border border-border rounded-lg shadow-xl my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold">
              {isEdit ? `Editar orçamento ${editOrc?.numero ?? ""}` :
                fase === "configurar" ? "Novo orçamento" :
                fase === "moveis" ? "Selecionar Móveis" : "Revisar itens"}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {isEdit ? "Edite os itens e salve" :
                fase === "configurar" ? "Ambiente, cliente e planta baixa" :
                fase === "moveis" ? "Selecione e configure cada móvel" :
                "Confira e ajuste antes de salvar"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            {!isEdit && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {["configurar", "moveis", "revisar"].map((f, i) => (
                  <span key={f} className={`flex items-center gap-1.5 ${fase === f ? "text-foreground font-medium" : ""}`}>
                    {i > 0 && <span className="text-muted-foreground/40">›</span>}
                    {i + 1}
                  </span>
                ))}
              </div>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
        </div>

        {/* ── FASE 1: CONFIGURAR ── */}
        {fase === "configurar" && (
          <div className="p-5 space-y-4">
            {/* Cliente + Margem */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Cliente *</Label>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                  <option value="">Selecione...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Multiplicador (300 = 3× custo)</Label>
                <input type="number" min={100} step={50} value={margemPct}
                  onChange={(e) => setMargemPct(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
              </div>
            </div>

            {/* Cômodos — cada um com sua medida e/ou planta */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label>Cômodos do projeto *</Label>
                <span className="text-[11px] text-muted-foreground">{comodos.length} cômodo(s)</span>
              </div>

              {comodos.length === 0 && (
                <div className="text-[12px] text-muted-foreground bg-surface-2 border border-dashed border-border rounded-md px-3 py-4 text-center">
                  Adicione os cômodos que terão móveis. Cada um pode ter sua própria planta ou medida.
                </div>
              )}

              {comodos.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-surface-2 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input value={c.nome} onChange={(e) => updateComodo(c.id, { nome: e.target.value })}
                      className="flex-1 h-8 rounded-md border border-border bg-background px-2.5 text-[13px] font-medium outline-none"
                      placeholder="Nome do cômodo" />
                    <span className="text-[10px] px-1.5 py-1 rounded bg-accent/10 text-accent font-medium shrink-0">{c.tipo}</span>
                    <button type="button" onClick={() => removeComodo(c.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"><X className="size-4" /></button>
                  </div>

                  {/* Planta do cômodo */}
                  {c.plantaNome ? (
                    <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/5 text-[12px] text-emerald-700 dark:text-emerald-400">
                      <ImageUp className="size-3.5" /> <span className="truncate">{c.plantaNome}</span>
                      {c.analisando
                        ? <span className="text-[10.5px] ml-auto flex items-center gap-1 shrink-0"><Loader2 className="size-3 animate-spin" /> Analisando...</span>
                        : c.plantaInfo
                          ? <span className="text-[10.5px] ml-auto shrink-0">✓ {(c.plantaInfo.largura_cm / 100).toFixed(1)}×{(c.plantaInfo.profundidade_cm / 100).toFixed(1)}m</span>
                          : null}
                      <button type="button" onClick={() => updateComodo(c.id, { plantaB64: null, plantaNome: null, plantaInfo: null })}
                        className="text-[10.5px] text-destructive hover:opacity-70 shrink-0 ml-1">remover</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-dashed border-border text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
                      <ImageUp className="size-3.5" /> Planta deste cômodo (IA extrai as medidas)
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) analisarPlantaComodo(c.id, f); e.target.value = ""; }} />
                    </label>
                  )}

                  {/* Medidas — só se não tiver planta */}
                  {!c.plantaB64 && (
                    <div className="grid grid-cols-3 gap-2">
                      {(["largura", "profundidade", "altura"] as const).map((dim) => {
                        const faltando = dim !== "altura" && !c[dim];
                        return (
                          <input key={dim} type="number" step="0.01" min="0.1"
                            placeholder={dim === "largura" ? "Larg m *" : dim === "profundidade" ? "Prof m *" : "Alt m"}
                            value={c[dim] || ""}
                            onChange={(e) => updateComodo(c.id, { [dim]: Number(e.target.value) })}
                            className={`w-full h-8 rounded-md border bg-background px-2.5 text-[12.5px] outline-none ${faltando ? "border-destructive/60 placeholder:text-destructive/60" : "border-border"}`} />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Adicionar cômodo */}
              <div className="flex items-center gap-2">
                <select value={novoComodoTipo} onChange={(e) => setNovoComodoTipo(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                  <option value="">Escolher tipo de cômodo...</option>
                  {Object.keys(MOVEIS_POR_AMBIENTE).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" onClick={() => addComodo(novoComodoTipo)} disabled={!novoComodoTipo}
                  className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary disabled:opacity-50 inline-flex items-center gap-1.5">
                  <Plus className="size-3.5" /> Adicionar
                </button>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <Label>Observações do projeto (opcional)</Label>
              <input type="text" placeholder="Ex: roupeiro com espelho, cozinha em L, portas sem puxador..."
                value={descricao} onChange={(e) => setDescricao(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
            </div>

            {/* ── Motor paramétrico: orçamento automático em 3 versões ── */}
            {comodos.some((c) => COMODO_TO_LAYOUT[c.tipo]) && (
              <div className="rounded-lg border border-accent/40 bg-accent/5 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold flex items-center gap-1.5">
                      <Sparkles className="size-4 text-accent" /> Orçamento automático (motor paramétrico)
                    </div>
                    <div className="text-[11.5px] text-muted-foreground mt-0.5">
                      Gera o projeto fabricável e 3 versões com custos reais de engenharia, sem selecionar móveis um a um.
                    </div>
                  </div>
                  <button type="button" disabled={motorGerando} onClick={gerarPeloMotor}
                    className="h-9 px-3.5 rounded-md bg-accent text-white text-[12.5px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5 shrink-0">
                    {motorGerando ? <><Loader2 className="size-3.5 animate-spin" /> Gerando…</> : <>Gerar 3 versões</>}
                  </button>
                </div>

                {motorVersoes && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {([["economica", "Econômica"], ["intermediaria", "Intermediária"], ["premium", "Premium"]] as const).map(([k, label]) => {
                      const v = motorVersoes[k];
                      return (
                        <div key={k} className={`rounded-md border p-2.5 flex flex-col ${k === "intermediaria" ? "border-accent bg-accent/10" : "border-border bg-surface-2"}`}>
                          <div className="text-[11px] text-muted-foreground">{label}</div>
                          <div className="text-[15px] font-bold mt-0.5">R$ {v.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-[10.5px] text-muted-foreground mt-0.5">custo R$ {v.custo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} · {v.itens.length} itens</div>
                          <button type="button" onClick={() => usarVersaoMotor(k)}
                            className={`mt-2 h-7 rounded-md text-[11.5px] font-medium ${k === "intermediaria" ? "bg-accent text-white" : "border border-border hover:bg-secondary"}`}>
                            Usar esta versão
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => pdfRef.current?.click()}
                  className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                  <FileUp className="size-3.5" /> Importar PDF existente
                </button>
                <input ref={pdfRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handlePdfImport} />
                <span className="text-muted-foreground text-[11px]">·</span>
                <button type="button" onClick={() => { setValue("cliente_id", clienteId); setFase("revisar"); }}
                  className="text-[12px] text-muted-foreground hover:text-foreground">
                  Preencher manualmente
                </button>
              </div>
              <button type="button" onClick={() => {
                if (!clienteId) { toast.error("Selecione um cliente."); return; }
                if (comodos.length === 0) { toast.error("Adicione ao menos um cômodo."); return; }
                const invalidos = comodos.filter((c) => !comodoValido(c));
                if (invalidos.length > 0) {
                  toast.error(`Informe a planta ou as medidas de: ${invalidos.map((c) => c.nome).join(", ")}`);
                  return;
                }
                // Sincronizar comodosMedidas a partir dos cômodos (para geração/save)
                setComodosMedidas(Object.fromEntries(comodos.map((c) => [c.nome, { largura: c.largura, profundidade: c.profundidade, altura: c.altura }])));
                setFase("moveis");
              }}
                className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
                Selecionar Móveis <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── FASE 2: MÓVEIS ── */}
        {fase === "moveis" && (
          <div className="p-5 space-y-4">
            <button type="button" onClick={() => setFase("configurar")}
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              ← Voltar
            </button>

            {/* Seleção de móveis — todos os ambientes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Móveis do projeto:</Label>
                {moveis.length > 0 && (
                  <span className="text-[11px] text-accent font-medium">{moveis.length} selecionado(s)</span>
                )}
              </div>

              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input type="text" placeholder="Buscar móvel em qualquer ambiente..."
                  value={searchMoveis} onChange={(e) => setSearchMoveis(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-surface-2 pl-8 pr-3 text-[12.5px] outline-none focus:border-border-strong" />
              </div>

              {/* Seções por cômodo escolhido */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {comodos.map((c) => {
                  const templates = MOVEIS_POR_AMBIENTE[c.tipo] ?? [];
                  const filtered = searchMoveis.trim()
                    ? templates.filter((t) => t.nome.toLowerCase().includes(searchMoveis.toLowerCase()))
                    : templates;
                  if (filtered.length === 0) return null;
                  const selCount = templates.filter((t) => moveis.some((m) => m.tipo === t.tipo && m.comodo_nome === c.nome)).length;
                  const isOpen = openAmbientes.has(c.nome) || selCount > 0 || searchMoveis.trim().length > 0;
                  return (
                    <div key={c.id} className="rounded-lg border border-border overflow-hidden">
                      <button type="button" onClick={() => toggleAmbiente(c.nome)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left">
                        <span className="text-[12.5px] font-medium flex items-center gap-2">
                          {c.nome}
                          {c.plantaB64 && <span className="text-[10px] text-emerald-600 dark:text-emerald-400">planta</span>}
                          <span className="text-[10.5px] text-muted-foreground">{c.largura > 0 ? `${c.largura}×${c.profundidade}m` : ""}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {selCount > 0 && (
                            <span className="text-[10.5px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">{selCount} sel.</span>
                          )}
                          {isOpen ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-2.5 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {filtered.map((template) => {
                              const sel = moveis.find((m) => m.tipo === template.tipo && m.comodo_nome === c.nome);
                              return (
                                <button key={template.tipo} type="button" onClick={() => toggleMovel(template, c.nome)}
                                  className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${sel ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                                  {template.nome}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Configuração de cada móvel selecionado */}
            {moveis.length > 0 && (
              <div className="space-y-2">
                <Label>Configure cada móvel:</Label>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 -mt-1 mb-1">
                  <Info className="size-3" />
                  Corrediças e dobradiças são calculadas automaticamente com base nas portas
                </div>
                {moveis.map((m) => (
                  <div key={m.id} className="border border-border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedMovel(expandedMovel === m.id ? null : m.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-2 hover:bg-secondary text-[13px] font-medium text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{m.nome}</span>
                        {m.comodo_nome && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-normal shrink-0">{m.comodo_nome}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground font-normal">
                        <span>{m.largura_cm}×{m.profundidade_cm}×{m.altura_cm}cm</span>
                        {m.portas > 0 && <span>{m.portas} porta{m.portas > 1 ? "s" : ""} ({m.tipo_porta})</span>}
                        {m.gavetas > 0 && <span>{m.gavetas} gav.</span>}
                        {expandedMovel === m.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </div>
                    </button>

                    {expandedMovel === m.id && (() => {
                      const paredeAtual = plantaInfo?.paredes.find((p) => p.id === m.parede_id);
                      const dimSrc = (m.comodo_nome && comodosMedidas[m.comodo_nome]) ? comodosMedidas[m.comodo_nome] : medidas;
                      const limLargura = paredeAtual ? paredeAtual.espaco_util_cm - 15
                        : plantaInfo ? Math.max(...plantaInfo.paredes.map((p) => p.espaco_util_cm)) - 15
                        : dimSrc.largura > 0 ? Math.round(dimSrc.largura * 100) - 15 : null;
                      const limAltura = plantaInfo ? plantaInfo.altura_cm : dimSrc.altura > 0 ? Math.round(dimSrc.altura * 100) : null;
                      const limProfundidade = plantaInfo ? plantaInfo.profundidade_cm : dimSrc.profundidade > 0 ? Math.round(dimSrc.profundidade * 100) : null;

                      const avisos: string[] = [];
                      if (limLargura && m.largura_cm > limLargura) avisos.push(`Largura excede o espaço disponível (${limLargura}cm)`);
                      if (limAltura && m.altura_cm > limAltura) avisos.push(`Altura excede o pé-direito (${limAltura}cm)`);
                      if (limProfundidade && m.profundidade_cm > limProfundidade) avisos.push(`Profundidade excede o ambiente (${limProfundidade}cm)`);
                      if (m.largura_cm > 269) avisos.push(`Largura > 269cm — painéis serão divididos em módulos`);
                      if (m.altura_cm > 269) avisos.push(`Altura > 269cm — laterais serão divididas em módulos`);

                      const temMatsEscolhidos = m.mdf_caixa_id || m.mdf_externo_id || m.fundo_id || m.dobradica_id || m.corrediça_porta_id || m.corrediça_gaveta_id || m.puxador_id;
                      const temAvancado = m.formato === "L" || m.pe_madeira || m.tem_roda_teto;

                      return (
                      <div className="px-3 py-3 space-y-3 bg-surface">
                        {/* Nome + parede numa linha */}
                        <div className={`grid gap-2 ${plantaInfo?.paredes.length ? "grid-cols-2" : "grid-cols-1"}`}>
                          <div>
                            <div className="text-[10.5px] text-muted-foreground mb-0.5">Nome no orçamento</div>
                            <input value={m.nome} onChange={(e) => updateMovel(m.id, { nome: e.target.value })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                          {plantaInfo && plantaInfo.paredes.length > 0 && (
                            <div>
                              <div className="text-[10.5px] text-muted-foreground mb-0.5">Parede</div>
                              <select value={m.parede_id ?? ""} onChange={(e) => {
                                const pid = e.target.value;
                                const parede = plantaInfo.paredes.find((p) => p.id === pid);
                                updateMovel(m.id, { parede_id: pid || undefined, ...(parede ? { largura_cm: Math.max(10, parede.espaco_util_cm - 15) } : {}) });
                              }} className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none text-foreground">
                                <option value="">— Parede —</option>
                                {plantaInfo.paredes.map((p) => (
                                  <option key={p.id} value={p.id}>Parede {p.id} — {p.espaco_util_cm}cm{p.obstaculos ? ` (${p.obstaculos})` : ""}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Avisos */}
                        {avisos.length > 0 && (
                          <div className="space-y-1">
                            {avisos.map((av, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px] text-destructive bg-destructive/10 rounded px-2 py-1">
                                <AlertCircle className="size-3 shrink-0 mt-0.5" /><span>{av}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dimensões */}
                        <div>
                          <div className="text-[10.5px] text-muted-foreground mb-0.5">Dimensões (cm)</div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["largura_cm", "profundidade_cm", "altura_cm"] as const).map((dim) => {
                              const lim = dim === "largura_cm" ? limLargura : dim === "altura_cm" ? limAltura : limProfundidade;
                              const excede = lim !== null && m[dim] > lim;
                              const vazio = !m[dim] || m[dim] === 0;
                              return (
                                <div key={dim}>
                                  <div className={`text-[9.5px] mb-0.5 truncate ${vazio ? "text-destructive" : "text-muted-foreground"}`}>
                                    {dim === "largura_cm" ? "Largura" : dim === "profundidade_cm" ? "Profund." : "Altura"}
                                    {lim ? <span className="opacity-60"> ≤{lim}</span> : ""}
                                    {vazio && " *"}
                                  </div>
                                  <input type="number" min={1} value={m[dim] || ""}
                                    onChange={(e) => updateMovel(m.id, { [dim]: Number(e.target.value) })}
                                    placeholder="0"
                                    className={`w-full h-8 rounded border px-2 text-[12.5px] outline-none bg-surface-2 ${excede || vazio ? "border-destructive" : "border-border"}`} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Portas + Gavetas + Prateleiras numa linha */}
                        <div className="grid grid-cols-4 gap-1.5">
                          <div>
                            <div className="text-[10.5px] text-muted-foreground mb-0.5">Portas</div>
                            <input type="number" min={0} max={20} value={m.portas}
                              onChange={(e) => updateMovel(m.id, { portas: Number(e.target.value) })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                          <div className="col-span-1">
                            <div className="text-[10.5px] text-muted-foreground mb-0.5">Tipo</div>
                            <select value={m.tipo_porta} disabled={m.portas === 0}
                              onChange={(e) => updateMovel(m.id, { tipo_porta: e.target.value as MovelConfig["tipo_porta"] })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-1.5 text-[11px] outline-none text-foreground disabled:opacity-40">
                              <option value="sem">Sem</option>
                              <option value="abrir">Abrir MDF</option>
                              <option value="abrir_vidro">Abrir Vidro</option>
                              <option value="abrir_espelho">Abrir Esp.</option>
                              <option value="correr">Correr MDF</option>
                              <option value="correr_vidro">Correr Vid.</option>
                              <option value="correr_espelho">Correr Esp.</option>
                            </select>
                          </div>
                          <div>
                            <div className="text-[10.5px] text-muted-foreground mb-0.5">Gavetas</div>
                            <input type="number" min={0} max={20} value={m.gavetas}
                              onChange={(e) => updateMovel(m.id, { gavetas: Number(e.target.value) })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                          <div>
                            <div className="text-[10.5px] text-muted-foreground mb-0.5">Prat.</div>
                            <input type="number" min={0} max={20} value={m.prateleiras}
                              onChange={(e) => updateMovel(m.id, { prateleiras: Number(e.target.value) })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                        </div>

                        {/* Opções básicas — checkboxes compactos */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                          {[
                            { key: "tem_fundo", label: "Fundo 6mm", default: true },
                            { key: "tem_rodape", label: "Rodapé", default: false },
                            { key: "tem_pes", label: "Pés reguláveis", default: false },
                          ].map(({ key, label, default: def }) => (
                            <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input type="checkbox" checked={(m as Record<string, unknown>)[key] as boolean ?? def}
                                onChange={(e) => updateMovel(m.id, { [key]: e.target.checked })}
                                className="rounded" />
                              <span className="text-[11.5px]">{label}</span>
                            </label>
                          ))}
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input type="checkbox" checked={m.tem_ripado ?? false}
                              onChange={(e) => updateMovel(m.id, {
                                tem_ripado: e.target.checked,
                                ripa_espessura_mm: m.ripa_espessura_mm ?? 15,
                                ripa_largura_mm: m.ripa_largura_mm ?? 30,
                              })}
                              className="rounded" />
                            <span className="text-[11.5px]">Ripado</span>
                          </label>
                        </div>

                        {/* Configuração do ripado */}
                        {m.tem_ripado && (() => {
                          const ripaLarg = m.ripa_largura_mm ?? 30;
                          const numRipas = Math.floor((m.largura_cm * 10) / (ripaLarg * 2));
                          return (
                            <div className="pl-1 p-2 rounded-md border border-border bg-secondary/20 space-y-2">
                              <div className="text-[10.5px] text-muted-foreground font-medium">Configuração do ripado</div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <div className="text-[9.5px] text-muted-foreground mb-0.5">Espessura</div>
                                  <div className="flex gap-1">
                                    {([6, 15] as const).map((esp) => (
                                      <button key={esp} type="button"
                                        onClick={() => updateMovel(m.id, { ripa_espessura_mm: esp })}
                                        className={`h-7 flex-1 rounded text-[11px] border transition-colors ${(m.ripa_espessura_mm ?? 15) === esp ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"}`}>
                                        {esp}mm
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9.5px] text-muted-foreground mb-0.5">Largura da ripa (mm)</div>
                                  <input type="number" min={10} max={200} value={m.ripa_largura_mm ?? 30}
                                    onChange={(e) => updateMovel(m.id, { ripa_largura_mm: Number(e.target.value) })}
                                    className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none" />
                                </div>
                                <div className="flex flex-col justify-end">
                                  <div className="text-[9.5px] text-muted-foreground mb-0.5">Quantidade</div>
                                  <div className="h-7 flex items-center text-[12px] font-medium text-accent">{numRipas} ripas</div>
                                </div>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Espaçamento = largura da ripa · começa na lateral
                              </div>
                            </div>
                          );
                        })()}

                        {/* Avançado (formato L, pés madeira, roda-teto) — colapsável */}
                        <details open={temAvancado}>
                          <summary className="text-[11px] text-muted-foreground cursor-pointer select-none hover:text-foreground list-none flex items-center gap-1">
                            <ChevronDown className="size-3" /> Opções avançadas
                            {temAvancado && <span className="text-accent text-[10px]"> • ativo</span>}
                          </summary>
                          <div className="mt-2 space-y-2.5 pl-1">
                            {/* Formato */}
                            <div>
                              <div className="text-[10.5px] text-muted-foreground mb-1">Formato</div>
                              <div className="flex gap-1.5">
                                {(["retangular", "L"] as const).map((fmt) => (
                                  <button key={fmt} type="button"
                                    onClick={() => updateMovel(m.id, { formato: fmt, arm2_largura_cm: fmt === "L" ? (m.arm2_largura_cm ?? 80) : undefined, arm2_profundidade_cm: fmt === "L" ? (m.arm2_profundidade_cm ?? m.profundidade_cm) : undefined })}
                                    className={`h-7 px-3 rounded text-[11.5px] border transition-colors ${(m.formato ?? "retangular") === fmt ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"}`}>
                                    {fmt === "retangular" ? "Retangular" : "Em L"}
                                  </button>
                                ))}
                              </div>
                              {(m.formato ?? "retangular") === "L" && (
                                <div className="mt-2 p-2 rounded border border-border bg-secondary/30 space-y-2">
                                  <div className="text-[10px] text-muted-foreground">Braço A (principal): {m.largura_cm}×{m.profundidade_cm}cm — configurado acima</div>
                                  <div className="text-[10px] font-medium text-muted-foreground">Braço B:</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="text-[9.5px] text-muted-foreground mb-0.5">Largura (cm)</div>
                                      <input type="number" min={10} value={m.arm2_largura_cm ?? 80}
                                        onChange={(e) => updateMovel(m.id, { arm2_largura_cm: Number(e.target.value) })}
                                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none" />
                                    </div>
                                    <div>
                                      <div className="text-[9.5px] text-muted-foreground mb-0.5">Profundidade (cm)</div>
                                      <input type="number" min={10} value={m.arm2_profundidade_cm ?? m.profundidade_cm}
                                        onChange={(e) => updateMovel(m.id, { arm2_profundidade_cm: Number(e.target.value) })}
                                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Pés de madeira */}
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input type="checkbox" checked={m.pe_madeira ?? false}
                                onChange={(e) => updateMovel(m.id, { pe_madeira: e.target.checked, pe_altura_cm: m.pe_altura_cm ?? 15 })}
                                className="rounded" />
                              <span className="text-[11.5px]">Pés de madeira maciça</span>
                            </label>
                            {m.pe_madeira && (
                              <div className="w-40 pl-5">
                                <div className="text-[10px] text-muted-foreground mb-0.5">Altura dos pés (cm) · rodapé = +5cm</div>
                                <input type="number" min={5} max={100} value={m.pe_altura_cm ?? 15}
                                  onChange={(e) => updateMovel(m.id, { pe_altura_cm: Number(e.target.value) })}
                                  className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none" />
                              </div>
                            )}
                            {/* Roda-teto */}
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input type="checkbox" checked={m.tem_roda_teto ?? false}
                                onChange={(e) => {
                                  const teto = m.altura_teto_cm ?? 270;
                                  updateMovel(m.id, {
                                    tem_roda_teto: e.target.checked,
                                    altura_teto_cm: teto,
                                    ...(e.target.checked ? { altura_cm: teto - 10 } : {}),
                                  });
                                }}
                                className="rounded" />
                              <span className="text-[11.5px]">Roda-teto</span>
                            </label>
                            {m.tem_roda_teto && (
                              <div className="w-40 pl-5">
                                <div className="text-[10px] text-muted-foreground mb-0.5">Altura do teto (cm) · móvel = teto−10cm</div>
                                <input type="number" min={200} max={400} value={m.altura_teto_cm ?? 270}
                                  onChange={(e) => updateMovel(m.id, {
                                    altura_teto_cm: Number(e.target.value),
                                    altura_cm: Number(e.target.value) - 10,
                                  })}
                                  className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none" />
                              </div>
                            )}
                          </div>
                        </details>

                        {/* Materiais — colapsável, IA escolhe por padrão */}
                        <details open={!!temMatsEscolhidos}>
                          <summary className="text-[11px] text-muted-foreground cursor-pointer select-none hover:text-foreground list-none flex items-center gap-1">
                            <ChevronDown className="size-3" /> Materiais específicos
                            {temMatsEscolhidos
                              ? <span className="text-accent text-[10px]"> • personalizados</span>
                              : <span className="text-[10px] opacity-60"> — IA escolhe automaticamente</span>}
                          </summary>
                          <div className="mt-2 space-y-1.5 pl-1">
                            <MatSelect label="MDF caixa (interior)" value={m.mdf_caixa_id}
                              options={mdfCatalog} onChange={(v) => updateMovel(m.id, { mdf_caixa_id: v })} />
                            <MatSelect label="MDF envelope (faces externas)" value={m.mdf_externo_id}
                              options={mdfCatalog} onChange={(v) => updateMovel(m.id, { mdf_externo_id: v })} />
                            {(m.tem_fundo ?? true) && (
                              <MatSelect label="Chapa fundo (6mm)" value={m.fundo_id}
                                options={fundoCatalog} onChange={(v) => updateMovel(m.id, { fundo_id: v })} />
                            )}
                            {m.portas > 0 && m.tipo_porta === "abrir" && (
                              <MatSelect label={`Dobradiça (${m.portas * (m.altura_cm > 150 ? 3 : 2)} un.)`}
                                value={m.dobradica_id} options={dobCatalog}
                                onChange={(v) => updateMovel(m.id, { dobradica_id: v })} />
                            )}
                            {m.portas > 0 && m.tipo_porta === "correr" && (
                              <MatSelect label={`Corrediça porta (${Math.ceil(m.portas / 2)} par)`}
                                value={m.corrediça_porta_id} options={corrPortaCatalog}
                                onChange={(v) => updateMovel(m.id, { corrediça_porta_id: v })} />
                            )}
                            {m.gavetas > 0 && (
                              <MatSelect label={`Corrediça gaveta (${m.gavetas} par)`}
                                value={m.corrediça_gaveta_id} options={corrGavCatalog}
                                onChange={(v) => updateMovel(m.id, { corrediça_gaveta_id: v })} />
                            )}
                            {(m.portas > 0 || m.gavetas > 0) && (
                              <MatSelect label={`Puxador (${m.portas + m.gavetas} un.)`}
                                value={m.puxador_id} options={puxadorCatalog}
                                onChange={(v) => updateMovel(m.id, { puxador_id: v })} />
                            )}
                          </div>
                        </details>

                        {/* Detalhes livres */}
                        <div>
                          <div className="text-[10.5px] text-muted-foreground mb-0.5">Detalhes / Extras <span className="opacity-60">(opcional)</span></div>
                          <textarea rows={2} value={m.detalhes ?? ""}
                            onChange={(e) => updateMovel(m.id, { detalhes: e.target.value || undefined })}
                            placeholder="Ex: painel ripado, espelho interno, nicho com LED..."
                            className="w-full rounded border border-border bg-surface-2 px-2 py-1.5 text-[12px] outline-none resize-none focus:border-border-strong placeholder:text-muted-foreground/50" />
                        </div>

                        <button type="button" onClick={() => setMoveis((prev) => prev.filter((x) => x.id !== m.id))}
                          className="text-[11px] text-destructive hover:opacity-70 inline-flex items-center gap-1">
                          <Trash2 className="size-3" /> Remover
                        </button>
                      </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* Visualização da parede */}
            {moveis.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wider">Visualização</div>
                <WallVisualization
                  moveis={moveis}
                  plantaInfo={plantaInfo}
                  medW={medidas.largura}
                  medH={medidas.altura}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-[12px] text-muted-foreground">
                {moveis.length === 0 ? "Nenhum móvel selecionado" : `${moveis.length} móvel(is) configurado(s)`}
              </div>
              <button type="button" onClick={handleGerarIA} disabled={aiLoading || moveis.length === 0}
                className="h-9 px-4 rounded-md bg-accent text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2">
                {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {aiLoading ? "Calculando..." : "Gerar Orçamento com IA"}
              </button>
            </div>
          </div>
        )}

        {/* ── FASE 3: REVISAR / EDIÇÃO ── */}
        {(fase === "revisar" || isEdit) && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-5 space-y-4">
              {!isEdit && (
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setFase("moveis")}
                    className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    ← Voltar aos móveis
                  </button>
                  <div className="text-[12px] text-muted-foreground">{fields.length} itens gerados</div>
                </div>
              )}

              {/* Cliente + Margem (modo manual ou edição) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Cliente *</Label>
                  <select {...register("cliente_id")}
                    className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                    <option value="">Selecione...</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  {errors.cliente_id && <div className="text-[11px] text-destructive mt-1">{errors.cliente_id.message}</div>}
                </div>
                <div>
                  <Label>Multiplicador (300 = 3×)</Label>
                  <input {...register("margem_pct")} type="number" min={100} step={50}
                    className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
                </div>
              </div>

              {/* Itens agrupados por móvel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Itens do orçamento</Label>
                  <button type="button"
                    onClick={() => append({ movel: "", justificativa: "", descricao: "", quantidade: 1, unidade: "un", preco_custo: 0, preco_unitario: 0 })}
                    className="text-[12px] text-accent hover:text-accent/80 inline-flex items-center gap-1">
                    <Plus className="size-3" /> Adicionar item
                  </button>
                </div>
                <ItemTable fields={fields} itens={itens} register={register} remove={remove} />
                {errors.itens?.root && <div className="text-[11px] text-destructive mt-1">{errors.itens.root.message}</div>}
              </div>

              {/* Mão de obra + resumo financeiro */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mão de obra / Instalação (R$)</Label>
                  <input {...register("mao_de_obra")} type="number" step="0.01" min="0"
                    placeholder="0,00"
                    className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">Cobrado separadamente — não entra na margem</div>
                </div>
                <div className="text-[12.5px] space-y-1 pt-5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Materiais</span>
                    <span className="num">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {(() => {
                    const custo = itens.reduce((s, i) => s + (Number(i.preco_custo) || 0) * (Number(i.quantidade) || 0), 0);
                    const lucro = subtotal - custo;
                    const margemReal = subtotal > 0 ? (lucro / subtotal * 100) : 0;
                    return (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Lucro (~{margemReal.toFixed(0)}%)</span>
                        <span className="num">R$ {lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })()}
                  <div className="flex justify-between font-semibold border-t border-border pt-1">
                    <span>Total</span>
                    <span className="num">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Justificativa / Observações</Label>
                <textarea {...register("observacoes")} rows={3}
                  placeholder="A IA explica aqui o que foi calculado e por quê cada valor foi aplicado..."
                  className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-border">
              <select {...register("status")}
                className="h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none">
                <option value="rascunho">Salvar como rascunho</option>
                <option value="analise">Enviar para análise</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={onClose}
                  className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
                  {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  {isEdit ? "Salvar alterações" : "Criar orçamento"}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// Tabela de itens separada para manter o código organizado
function ItemTable({ fields, itens, register, remove }: {
  fields: ReturnType<typeof useFieldArray<FormData, "itens">>["fields"];
  itens: FormData["itens"];
  register: ReturnType<typeof useForm<FormData>>["register"];
  remove: (index: number) => void;
}) {
  // Agrupa por móvel para display
  const groups = useMemo(() => {
    const map: Record<string, number[]> = {};
    itens.forEach((it, idx) => {
      const key = it.movel || "Geral";
      if (!map[key]) map[key] = [];
      map[key].push(idx);
    });
    return map;
  }, [itens]);

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-[12px]">
        <thead className="bg-surface-2 border-b border-border">
          <tr>
            <th className="text-left font-medium px-3 py-2 text-muted-foreground w-[28%]">Descrição</th>
            <th className="text-left font-medium px-2 py-2 text-muted-foreground w-[13%]">Móvel</th>
            <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[10%]">Qtd</th>
            <th className="text-left font-medium px-2 py-2 text-muted-foreground w-[6%]">Un</th>
            <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[12%]">Custo R$</th>
            <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[12%]">Preço R$</th>
            <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[13%]">Total R$</th>
            <th className="w-7"></th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([groupName, indices]) => (
            <>
              {Object.keys(groups).length > 1 && (
                <tr key={`g-${groupName}`} className="bg-secondary/30">
                  <td colSpan={8} className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {groupName}
                  </td>
                </tr>
              )}
              {indices.map((idx) => {
                const field = fields[idx];
                const linha = itens[idx];
                const tot = (Number(linha?.preco_unitario) || 0) * (Number(linha?.quantidade) || 0);
                return (
                  <tr key={field.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5">
                      <input {...register(`itens.${idx}.descricao`)} placeholder="Descrição"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none focus:border-border-strong" />
                      {linha?.justificativa && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 px-1 flex items-start gap-0.5">
                          <Info className="size-2.5 mt-0.5 shrink-0" />
                          <span>{linha.justificativa}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.movel`)} placeholder="Móvel"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-1.5 text-[11.5px] outline-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.quantidade`)} type="number" step="0.01" min="0"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.unidade`)}
                        className="w-full h-7 rounded border border-border bg-surface-2 px-1 text-[11.5px] outline-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.preco_custo`)} type="number" step="0.01" min="0"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.preco_unitario`)} type="number" step="0.01" min="0"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none text-right" />
                    </td>
                    <td className="px-2 py-1.5 text-right num text-muted-foreground text-[11.5px]">
                      {tot.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-1.5">
                      <button type="button" onClick={() => remove(idx)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página de orçamentos ───────────────────────────────────────────────────

function Orcamentos() {
  const [orcs, setOrcs] = useState<Orc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [detalhe, setDetalhe] = useState<Orc | null>(null);
  const [editando, setEditando] = useState<Orc | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const data = await getOrcamentos((empresa as { id: string }).id);
      setOrcs(data as unknown as Orc[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statuses = ["todos", "rascunho", "analise", "aprovado", "recusado"];
  const filtered = orcs.filter((o) => {
    const q = search.toLowerCase();
    return (q === "" || (o.numero ?? "").toLowerCase().includes(q) || (o.clientes?.nome ?? "").toLowerCase().includes(q))
      && (statusFilter === "todos" || o.status === statusFilter);
  });

  const totalPipeline = orcs.filter((o) => ["analise", "aprovado"].includes(o.status)).reduce((s, o) => s + (o.total ?? 0), 0);

  return (
    <>
      <AnimatePresence>
        {showModal && <OrcamentoModal onClose={() => setShowModal(false)} onSaved={load} />}
        {editando && <OrcamentoModal onClose={() => setEditando(null)} onSaved={() => { load(); setDetalhe(null); }} editOrc={editando} />}
        {detalhe && !editando && (
          <OrcDetalheModal orc={detalhe} onClose={() => setDetalhe(null)} onChanged={load} onEdit={() => setEditando(detalhe)} />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Comercial"
        title="Orçamentos"
        description="Gere, aprove e acompanhe propostas com cálculo automático de chapas, ferragens e margem."
        actions={
          <>
            <button
              onClick={() => {
                const rows = [["Número", "Cliente", "Status", "Total", "Data"]].concat(
                  filtered.map((o) => [
                    o.numero ?? "",
                    o.clientes?.nome ?? "",
                    STATUS_LABEL[o.status] ?? o.status,
                    String(o.total ?? 0),
                    new Date(o.created_at).toLocaleDateString("pt-BR"),
                  ])
                );
                const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
                a.download = `orcamentos_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
              }}
              className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-1.5"
            >
              <Download className="size-3.5" /> Exportar CSV
            </button>
            <button className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-1.5">
              <Filter className="size-3.5" /> Filtros
            </button>
            <button onClick={() => setShowModal(true)}
              className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
              <Plus className="size-3.5" /> Novo orçamento
            </button>
          </>
        }
      />

      <div className="grid md:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Em análise", v: orcs.filter((o) => o.status === "analise").length },
          { l: "Aprovados", v: orcs.filter((o) => o.status === "aprovado").length },
          { l: "Total", v: orcs.length },
          { l: "Pipeline (R$)", v: "R$ " + totalPipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) },
        ].map((s) => (
          <Surface key={s.l} padded={false} className="p-4">
            <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">{s.l}</div>
            <div className="mt-1.5 text-[20px] font-semibold num">{loading ? "—" : s.v}</div>
          </Surface>
        ))}
      </div>

      <Surface padded={false}>
        <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
            className="h-8 flex-1 min-w-[180px] max-w-sm rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
          <div className="flex gap-1 flex-wrap">
            {statuses.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-[12px] px-2 py-1 rounded-sm border transition-colors ${statusFilter === s ? "border-border-strong bg-secondary text-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                {STATUS_LABEL[s] ?? "Todos"}
              </button>
            ))}
          </div>
          {!loading && <div className="ml-auto text-[12px] text-muted-foreground">{filtered.length} resultados</div>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-[13px]">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 gap-2 text-destructive text-[13px]">
            <AlertCircle className="size-4" /> {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left font-medium px-5 py-2.5">Nº</th>
                  <th className="text-left font-medium px-5 py-2.5">Cliente</th>
                  <th className="text-right font-medium px-5 py-2.5">Total (R$)</th>
                  <th className="text-left font-medium px-5 py-2.5">Status</th>
                  <th className="text-left font-medium px-5 py-2.5">Data</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                      {orcs.length === 0
                        ? <span>Nenhum orçamento. <button onClick={() => setShowModal(true)} className="text-foreground underline">Criar o primeiro →</button></span>
                        : "Nenhum resultado."}
                    </td>
                  </tr>
                ) : filtered.map((o) => (
                  <tr key={o.id} onClick={() => setDetalhe(o)}
                    className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer group">
                    <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">{o.numero ?? "—"}</td>
                    <td className="px-5 py-3 font-medium">{o.clientes?.nome ?? "—"}</td>
                    <td className="px-5 py-3 text-right num">{(o.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3"><Pill tone={STATUS_TONE[o.status] ?? "neutral"}>{STATUS_LABEL[o.status] ?? o.status}</Pill></td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </>
  );
}

// ─── Modal de detalhe ───────────────────────────────────────────────────────

const STATUS_NEXT: Record<string, string[]> = {
  rascunho: ["analise"],
  analise: ["aprovado", "recusado"],
  aprovado: [],
  recusado: ["rascunho"],
};

type PecaCorte = {
  movel: string; peca: string; material: string;
  largura_mm: number; comprimento_mm: number; quantidade: number;
  fita_l: boolean; fita_r: boolean; fita_t: boolean; fita_b: boolean;
  observacao?: string;
};
type PlacedPiece = { x: number; y: number; w: number; h: number; label: string };
type ChapaMaterial = {
  material: string;
  chapas_otimizadas: number;
  chapas_com_folga: number;
  layouts?: { sheet_index: number; placed: PlacedPiece[] }[];
};
type ListaCorteResult = {
  pecas: PecaCorte[];
  resumo: {
    total_pecas: number;
    chapas_estimadas: number;
    metros_fita: number;
    chapas_por_material?: ChapaMaterial[];
  };
};

const SHEET_COLORS = ["#93c5fd","#86efac","#fca5a5","#fcd34d","#c4b5fd","#f9a8d4","#6ee7b7","#a5b4fc","#fdba74","#67e8f9"];

function SheetVisualization({ chapas }: { chapas: ChapaMaterial[] }) {
  // Collect unique furniture names across all materials for consistent coloring
  const allMoveis: string[] = [];
  for (const c of chapas) {
    for (const layout of c.layouts ?? []) {
      for (const p of layout.placed) {
        const m = p.label.match(/\(([^)]+)\)$/)?.[1] ?? p.label;
        if (!allMoveis.includes(m)) allMoveis.push(m);
      }
    }
  }
  const colorMap = new Map(allMoveis.map((n, i) => [n, SHEET_COLORS[i % SHEET_COLORS.length]]));

  const W = 2750, H = 1830;

  return (
    <div className="mt-3 space-y-4">
      {/* Legenda */}
      {allMoveis.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {allMoveis.map((n) => (
            <div key={n} className="flex items-center gap-1 text-[10px] text-foreground">
              <div className="size-2.5 rounded-sm shrink-0" style={{ backgroundColor: colorMap.get(n) }} />
              {n}
            </div>
          ))}
        </div>
      )}
      {chapas.filter(c => c.layouts?.length).map((c) => (
        <div key={c.material}>
          <div className="text-[10.5px] text-muted-foreground mb-1.5 font-medium">{c.material}</div>
          <div className="flex flex-wrap gap-3">
            {(c.layouts ?? []).map(({ sheet_index, placed }) => (
              <div key={sheet_index} className="border border-border rounded overflow-hidden shrink-0">
                <div className="text-[9px] text-muted-foreground px-1.5 py-0.5 bg-secondary/40 border-b border-border">
                  Chapa {sheet_index + 1} — 2750×1830mm
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} width={220} height={Math.round(220 * H / W)} className="block">
                  <rect x={0} y={0} width={W} height={H} fill="#f8f9fa" />
                  {placed.map((p, pi) => {
                    const movelNome = p.label.match(/\(([^)]+)\)$/)?.[1] ?? "";
                    const pecaNome = p.label.replace(/\s*\([^)]*\)$/, "").trim();
                    const fillColor = colorMap.get(movelNome) ?? "#e5e7eb";
                    const minDim = Math.min(p.w, p.h);
                    const fs = Math.max(60, Math.min(130, minDim * 0.12));
                    return (
                      <g key={pi}>
                        <rect x={p.x + 4} y={p.y + 4} width={p.w - 8} height={p.h - 8}
                          fill={fillColor} fillOpacity={0.85} stroke="#ffffff" strokeWidth={8} rx={6} />
                        {p.w > 200 && p.h > 150 && (
                          <text x={p.x + p.w / 2} y={p.y + p.h / 2}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize={fs} fill="#1e293b" fontWeight="600" fontFamily="system-ui">
                            {pecaNome.length > 10 ? pecaNome.slice(0, 10) + "…" : pecaNome}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  <rect x={0} y={0} width={W} height={H} fill="none" stroke="#94a3b8" strokeWidth={16} />
                </svg>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Feature 9: Assinatura Modal ────────────────────────────────────────────

function AssinaturaModal({ orcId, onClose, onSigned }: {
  orcId: string; onClose: () => void; onSigned: (png: string, em: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const handleLimpar = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirmar = async () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const png = canvas.toDataURL("image/png").split(",")[1];
    const em = new Date().toISOString();
    setSaving(true);
    try {
      const { error } = await supabase.from("orcamentos").update({ assinatura_png: png, assinado_em: em }).eq("id", orcId);
      if (error) throw error;
      toast.success("Assinatura salva!");
      onSigned(png, em);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar assinatura"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
        className="relative w-full max-w-sm bg-surface border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold">Assinar orçamento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-[12.5px] text-muted-foreground">Assine abaixo com o mouse ou dedo:</p>
          <canvas ref={canvasRef} width={400} height={180}
            className="w-full border-2 border-dashed border-border rounded-lg bg-white cursor-crosshair touch-none"
            style={{ height: 180 }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          />
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={handleLimpar} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Limpar</button>
            <button onClick={handleConfirmar} disabled={saving}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Confirmar assinatura
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function OrcDetalheModal({ orc, onClose, onChanged, onEdit }: {
  orc: Orc; onClose: () => void; onChanged: () => void; onEdit: () => void;
}) {
  const navigate = useNavigate();
  const [itens, setItens] = useState<OrcItem[]>([]);
  const [loadingItens, setLoadingItens] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [criandoProjeto, setCriandoProjeto] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [listaCorte, setListaCorte] = useState<ListaCorteResult | null>(null);
  const [listaCorteLoading, setListaCorteLoading] = useState(false);
  const [showCorte, setShowCorte] = useState(false);
  const [nfeLoading, setNfeLoading] = useState(false);
  const [boletoLoading, setBoletoLoading] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [fiscalDados, setFiscalDados] = useState<FiscalDados | null>((orc.fiscal_dados as FiscalDados) ?? null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [orcAssinado, setOrcAssinado] = useState<{ png: string | null; em: string | null }>({
    png: orc.assinatura_png ?? null, em: orc.assinado_em ?? null,
  });
  const [similarRange, setSimilarRange] = useState<{ min: number; max: number } | null>(null);
  const parseMoveisCfg = (raw: unknown): MovelConfig[] | null => {
    if (!raw) return null;
    if (Array.isArray(raw)) return raw as MovelConfig[];
    const obj = raw as { moveis?: MovelConfig[] };
    return obj.moveis ?? null;
  };
  const [moveisCfg, setMoveisCfg] = useState<MovelConfig[] | null>(
    parseMoveisCfg((orc as unknown as { moveis_config?: unknown }).moveis_config)
  );

  useEffect(() => {
    getOrcamentoItens(orc.id)
      .then((data) => setItens(data as OrcItem[]))
      .finally(() => setLoadingItens(false));
    getEmpresaAtual().then((e) => {
      if (e) {
        setEmpresaNome((e as unknown as { nome: string }).nome ?? "");
        setLogoUrl((e as { logo_url?: string | null }).logo_url ?? null);
        const eid = (e as { id: string }).id;
        setEmpresaId(eid);
        // Feature 8: load similar price range from last 10 approved orçamentos
        supabase.from("orcamentos").select("total").eq("empresa_id", eid).eq("status", "aprovado")
          .order("created_at", { ascending: false }).limit(10)
          .then(({ data }) => {
            if (data && data.length >= 2) {
              const vals = data.map((r) => Number(r.total)).filter((v) => v > 0);
              if (vals.length >= 2) setSimilarRange({ min: Math.min(...vals), max: Math.max(...vals) });
            }
          });
      }
    });
    // Busca moveis_config diretamente se não veio na prop
    if (!(orc as unknown as { moveis_config?: unknown }).moveis_config) {
      getOrcamentoMoveis(orc.id)
        .then((cfg) => { if (cfg) setMoveisCfg(parseMoveisCfg(cfg)); })
        .catch(() => {});
    }
  }, [orc.id]);

  // Agrupa itens por móvel
  const grupos = useMemo(() => {
    const map: Record<string, OrcItem[]> = {};
    for (const it of itens) {
      const key = it.movel || "Geral";
      if (!map[key]) map[key] = [];
      map[key].push(it);
    }
    return map;
  }, [itens]);

  const handleCriarProjeto = async () => {
    if (!empresaId) { toast.error("Empresa não encontrada"); return; }
    const orcTyped = orc as unknown as { cliente_id?: string };
    setCriandoProjeto(true);
    try {
      const projeto = await upsertProjeto(empresaId, {
        nome: `Projeto — ${orc.clientes?.nome ?? "Cliente"} (${orc.numero ?? ""})`,
        descricao: `Gerado a partir do orçamento ${orc.numero ?? ""}`,
        status: "briefing",
        cliente_id: orcTyped.cliente_id ?? null,
      });
      toast.success("Projeto criado com sucesso!");
      onClose();
      navigate({ to: "/app/projetos", search: { destaque: (projeto as { id: string }).id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar projeto");
    } finally {
      setCriandoProjeto(false);
    }
  };

  const handleStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await updateOrcamentoStatus(orc.id, newStatus);

      if (newStatus === "aprovado" && empresaId) {
        await Promise.all([
          upsertOrdemProducao(empresaId, {
            projeto_id: orc.projeto_id ?? null,
            observacoes: `Gerado do orçamento ${orc.numero ?? ""}`,
          }).catch(() => {}),
          upsertLancamento(empresaId, {
            tipo: "entrada",
            descricao: `Orçamento ${orc.numero ?? ""} — ${orc.clientes?.nome ?? "Cliente"}`,
            valor: orc.total ?? 0,
            categoria: "Orçamento aprovado",
            status: "pendente",
          }).catch(() => {}),
        ]);
        toast.success("Aprovado! Ordem de produção e entrada financeira criadas automaticamente.");
      } else {
        toast.success(`Status atualizado para ${STATUS_LABEL[newStatus]}`);
      }
      onChanged(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar status");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleEmitirNfe = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Sessão expirada"); return; }
    setNfeLoading(true);
    try {
      const res = await fetch("/api/fiscal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "emitir-nfe", orcamento_id: orc.id, user_token: session.access_token }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; ref?: string; status?: string; chave?: string; ambiente?: string };
      if (!res.ok) { toast.error(data.error ?? "Erro ao emitir NF-e"); return; }
      const novoDados: FiscalDados = {
        ...fiscalDados,
        nfe_ref: data.ref,
        nfe_status: data.status ?? "processando",
        nfe_chave: data.chave ?? undefined,
        nfe_ambiente: data.ambiente,
        nfe_emitido_em: new Date().toISOString(),
      };
      setFiscalDados(novoDados);
      const label = data.ambiente === "producao" ? "NF-e emitida!" : "NF-e enviada (homologação)";
      toast.success(label);
    } finally {
      setNfeLoading(false);
    }
  };

  const handleGerarCobranca = async (tipo: "BOLETO" | "PIX") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Sessão expirada"); return; }
    if (tipo === "BOLETO") setBoletoLoading(true);
    else setPixLoading(true);
    try {
      const res = await fetch("/api/fiscal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "gerar-boleto", orcamento_id: orc.id, user_token: session.access_token, tipo }),
      });
      const data = await res.json() as {
        ok?: boolean; error?: string;
        id?: string; url?: string | null; qr_code?: string | null;
        copia_cola?: string | null; vencimento?: string; status?: string;
      };
      if (!res.ok) { toast.error(data.error ?? "Erro ao gerar cobrança"); return; }
      const novoDados: FiscalDados = {
        ...fiscalDados,
        ...(tipo === "BOLETO"
          ? { boleto: { asaas_id: data.id!, url: data.url ?? null, copia_cola: data.copia_cola ?? null, vencimento: data.vencimento!, status: data.status! } }
          : { pix: { asaas_id: data.id!, qr_code: data.qr_code ?? null, copia_cola: data.copia_cola ?? null, vencimento: data.vencimento!, status: data.status! } }),
      };
      setFiscalDados(novoDados);
      toast.success(`${tipo === "BOLETO" ? "Boleto" : "PIX"} gerado com sucesso!`);
    } finally {
      setBoletoLoading(false);
      setPixLoading(false);
    }
  };

  const handleGerarContrato = () => {
    const clienteNome = orc.clientes?.nome ?? "Cliente";
    const numero = orc.numero ?? "";
    const total = (orc.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const metade = ((orc.total ?? 0) / 2).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const dataHoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const listaMoveis = (moveisCfg ?? []).map((m) =>
      `<li>${m.nome} — ${m.largura_cm}×${m.profundidade_cm}×${m.altura_cm} cm${m.portas > 0 ? `, ${m.portas} porta(s) ${m.tipo_porta}` : ""}${m.gavetas > 0 ? `, ${m.gavetas} gaveta(s)` : ""}${m.prateleiras > 0 ? `, ${m.prateleiras} prateleira(s)` : ""}</li>`
    ).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Contrato — Orçamento ${numero}</title>
<style>
  body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:24px;line-height:1.75;color:#1a1a1a;font-size:13.5px}
  h1{font-size:18px;text-align:center;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px}
  .sub{text-align:center;font-size:12px;color:#666;margin-bottom:32px}
  h2{font-size:12.5px;font-weight:bold;text-transform:uppercase;letter-spacing:.8px;margin:24px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}
  ul{margin:6px 0 6px 20px}li{margin:3px 0}
  .total{font-size:16px;font-weight:bold;color:#145a32}
  .assinaturas{margin-top:64px;display:flex;justify-content:space-between;gap:40px}
  .assinatura{flex:1;text-align:center}
  .linha{border-top:1px solid #333;padding-top:6px;font-size:12px}
  @media print{.no-print{display:none}}
</style></head><body>
${logoUrl ? `<div style="text-align:center;margin-bottom:16px"><img src="${logoUrl}" style="max-height:60px;max-width:200px;object-fit:contain"></div>` : ""}
<h1>Contrato de Fornecimento de Móveis Sob Medida</h1>
<div class="sub">Orçamento Nº ${numero} · ${dataHoje}</div>
<h2>1. Partes Contratantes</h2>
<p><strong>Contratada:</strong> ${empresaNome}</p>
<p><strong>Contratante:</strong> ${clienteNome}</p>
<h2>2. Objeto do Contrato</h2>
<p>A Contratada se compromete a fabricar e instalar os seguintes móveis sob medida conforme especificações aprovadas:</p>
${listaMoveis ? `<ul>${listaMoveis}</ul>` : `<p>Conforme detalhamento do orçamento Nº ${numero}.</p>`}
<h2>3. Valor e Forma de Pagamento</h2>
<p>Valor total: <span class="total">R$ ${total}</span></p>
<p>• 50% de entrada na aprovação do projeto: <strong>R$ ${metade}</strong></p>
<p>• 50% na entrega e instalação: <strong>R$ ${metade}</strong></p>
<p>Formas aceitas: Pix, transferência bancária ou dinheiro.</p>
<h2>4. Prazo de Execução</h2>
<p>O prazo estimado para fabricação e instalação é de <strong>____________ dias úteis</strong> após a aprovação do projeto e pagamento da entrada.</p>
<h2>5. Garantia</h2>
<p>Os móveis possuem garantia de <strong>12 (doze) meses</strong> contra defeitos de fabricação, contados a partir da data de instalação.</p>
<h2>6. Disposições Gerais</h2>
<p>Alterações no projeto após assinatura deste contrato poderão implicar em reajuste de prazo e valor, mediante acordo escrito entre as partes. Materiais especificados no projeto são de responsabilidade da Contratada. Instalação elétrica e hidráulica não estão incluídas neste contrato.</p>
<div class="assinaturas">
  <div class="assinatura"><div class="linha">${empresaNome}<br><span style="font-size:11px;color:#666">Contratada</span></div></div>
  <div class="assinatura"><div class="linha">${clienteNome}<br><span style="font-size:11px;color:#666">Contratante</span></div></div>
</div>
<p style="text-align:center;font-size:11px;color:#999;margin-top:40px">Local: ________________________________ · Data: ${dataHoje}</p>
<div class="no-print" style="text-align:center;margin-top:24px">
  <button onclick="window.print()" style="padding:10px 28px;background:#1a1a1a;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-family:inherit">Imprimir / Salvar como PDF</button>
</div>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleDelete = () => {
    toast(`Excluir orçamento ${orc.numero ?? ""}?`, {
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            await deleteOrcamento(orc.id);
            toast.success("Orçamento excluído");
            onChanged(); onClose();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  const handleGerarCorte = async () => {
    if (!moveisCfg?.length) {
      toast.error("Este orçamento não tem configuração de móveis salva. Edite e salve novamente para gerar o plano de corte.");
      return;
    }
    setListaCorteLoading(true);
    setShowCorte(true);
    try {
      const res = await fetch("/api/lista-corte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moveis: moveisCfg }),
      });
      if (!res.ok) throw new Error(await res.text());
      setListaCorte(await res.json() as ListaCorteResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar plano de corte");
      setShowCorte(false);
    } finally {
      setListaCorteLoading(false);
    }
  };

  // Feature 1: WhatsApp
  const handleWhatsApp = () => {
    const raw = orc.clientes?.telefone ?? "";
    let phone = raw.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = phone.slice(1);
    if (phone.length < 12) phone = "55" + phone;
    const total = (orc.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const msg = `Olá ${orc.clientes?.nome ?? ""}! Seu orçamento ${orc.numero ?? ""} no valor de R$ ${total} está pronto. Veja o PDF em breve.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Feature 2: Follow-up AI
  const handleGerarFollowUp = async () => {
    setFollowUpLoading(true);
    try {
      const dias = Math.floor((Date.now() - new Date(orc.created_at).getTime()) / 86400000);
      const total = (orc.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Você é um assistente de vendas para uma marcenaria. Gere mensagens de follow-up amigáveis e profissionais em português brasileiro para WhatsApp.",
          messages: [{ role: "user", content: `Gere uma mensagem curta e amigável de follow-up para WhatsApp para o cliente "${orc.clientes?.nome ?? "Cliente"}" sobre o orçamento número ${orc.numero ?? ""} no valor de R$ ${total}, que está em análise há ${dias} dias. A mensagem deve ser natural, sem ser invasiva, e perguntar se o cliente tem dúvidas ou precisa de mais informações.` }],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });
      const data = await res.json() as { text?: string };
      if (data.text) { setFollowUpMsg(data.text); setShowFollowUp(true); }
    } catch { toast.error("Erro ao gerar mensagem"); }
    finally { setFollowUpLoading(false); }
  };

  // Feature 6: QR codes
  const handleBaixarQRCodes = () => {
    if (!listaCorte?.pecas?.length) { toast.error("Gere o plano de corte primeiro."); return; }
    const pecas = listaCorte.pecas;
    const items = pecas.map((p) => {
      const text = `${p.movel}|${p.peca}|${p.largura_mm}x${p.comprimento_mm}|${p.quantidade}`;
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
      return { text, url, label: `${p.peca} — ${p.largura_mm}×${p.comprimento_mm}mm (${p.movel})`, qty: p.quantidade };
    });
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>QR Codes — ${orc.numero ?? ""}</title>
<style>body{font-family:sans-serif;padding:24px;color:#111}h1{font-size:16px;margin-bottom:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
.item{border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center;break-inside:avoid}
.item img{width:120px;height:120px}
.label{font-size:11px;margin-top:6px;color:#333}
.qty{font-size:10px;color:#666;margin-top:2px}
@media print{.no-print{display:none}}</style></head><body>
<h1>QR Codes — Orçamento ${orc.numero ?? ""} · ${orc.clientes?.nome ?? ""}</h1>
<div class="no-print" style="margin-bottom:16px"><button onclick="window.print()" style="padding:8px 20px;background:#111;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">Imprimir</button></div>
<div class="grid">${items.map((i) => `<div class="item"><img src="${i.url}" alt="${i.label}" /><div class="label">${i.label}</div><div class="qty">Qtd: ${i.qty}</div></div>`).join("")}</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const nextStatuses = STATUS_NEXT[orc.status] ?? [];
  const totalItens = itens.reduce((s, i) => s + Number(i.preco_unitario) * Number(i.quantidade), 0);
  const multiGrupo = Object.keys(grupos).length > 1;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-xl bg-surface border border-border rounded-lg shadow-xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-muted-foreground">{orc.numero ?? "—"}</span>
              <Pill tone={STATUS_TONE[orc.status] ?? "neutral"}>{STATUS_LABEL[orc.status] ?? orc.status}</Pill>
            </div>
            <div className="text-[15px] font-semibold mt-0.5">{orc.clientes?.nome ?? "—"}</div>
            <div className="text-[12px] text-muted-foreground">{new Date(orc.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1"><X className="size-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Itens agrupados por móvel */}
          <div>
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Itens do orçamento</div>
            {loadingItens ? (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-4">
                <Loader2 className="size-4 animate-spin" /> Carregando itens...
              </div>
            ) : itens.length === 0 ? (
              <div className="text-[13px] text-muted-foreground py-4 text-center">Nenhum item registrado.</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(grupos).map(([grupo, gItens]) => (
                  <div key={grupo}>
                    {multiGrupo && (
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-0.5 border-b border-border pb-1">
                        {grupo}
                      </div>
                    )}
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                          <th className="text-left py-1.5">Descrição</th>
                          <th className="text-right py-1.5 pr-2">Qtd</th>
                          <th className="text-right py-1.5">Preço unit.</th>
                          <th className="text-right py-1.5">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gItens.map((it) => (
                          <tr key={it.id} className="border-b border-border last:border-0">
                            <td className="py-1.5 pr-2">
                              <div>{it.descricao}</div>
                              {it.justificativa && (
                                <div className="text-[10.5px] text-muted-foreground mt-0.5 flex items-start gap-0.5">
                                  <Info className="size-2.5 mt-0.5 shrink-0" />
                                  <span>{it.justificativa}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 pr-2 text-right num text-muted-foreground">{it.quantidade} {it.unidade}</td>
                            <td className="py-1.5 text-right num">{Number(it.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-1.5 text-right num font-medium">{(Number(it.preco_unitario) * Number(it.quantidade)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <div className="text-[13px]">
                    <span className="text-muted-foreground mr-3">Total</span>
                    <span className="font-semibold num">R$ {totalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Móveis planejados */}
          {moveisCfg?.length ? (
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Móveis planejados</div>
              {(() => {
                const byRoom: Record<string, MovelConfig[]> = {};
                for (const m of moveisCfg) {
                  const key = m.comodo_nome ?? "";
                  if (!byRoom[key]) byRoom[key] = [];
                  byRoom[key].push(m);
                }
                return Object.entries(byRoom).map(([room, items]) => (
                  <div key={room} className="mb-2 last:mb-0">
                    {room && <div className="text-[10.5px] text-accent font-medium mb-0.5">{room}</div>}
                    <div className="space-y-0.5">
                      {items.map((m) => (
                        <div key={m.id} className="flex items-baseline justify-between text-[12.5px] py-0.5 border-b border-border/50 last:border-0">
                          <span className="font-medium">{m.nome}</span>
                          <span className="text-muted-foreground num text-[11px]">
                            {m.largura_cm} × {m.profundidade_cm} × {m.altura_cm} cm
                            {m.portas > 0 && <span className="ml-2">{m.portas}p {m.tipo_porta}</span>}
                            {m.gavetas > 0 && <span className="ml-1">{m.gavetas}g</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : null}

          {/* Plano de corte */}
          {showCorte && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Plano de corte</div>
                {listaCorte && (
                  <button onClick={handleBaixarQRCodes}
                    className="h-6 px-2 rounded border border-border text-[11px] hover:bg-secondary inline-flex items-center gap-1">
                    <QrCode className="size-3" /> QR Codes
                  </button>
                )}
              </div>
              {listaCorteLoading ? (
                <div className="flex items-center gap-2 py-4 text-[12.5px] text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Calculando plano de corte...
                </div>
              ) : listaCorte ? (
                <div>
                  {/* Resumo geral */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground mb-2">
                    <span>{listaCorte.resumo.total_pecas} peças</span>
                    <span>{listaCorte.resumo.chapas_estimadas} chapas (c/ folga)</span>
                    <span>{listaCorte.resumo.metros_fita}m fita de borda</span>
                  </div>
                  {/* Breakdown por material */}
                  {listaCorte.resumo.chapas_por_material && listaCorte.resumo.chapas_por_material.length > 0 && (
                    <div className="mb-3 grid gap-1">
                      {listaCorte.resumo.chapas_por_material.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] bg-secondary/40 rounded px-2 py-1">
                          <span className="text-foreground truncate mr-2">{c.material}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {c.chapas_otimizadas} otimizadas → <strong className="text-foreground">{c.chapas_com_folga} c/ folga</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Visualização 2D das chapas */}
                  {listaCorte.resumo.chapas_por_material?.some(c => c.layouts?.length) && (
                    <SheetVisualization chapas={listaCorte.resumo.chapas_por_material} />
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11.5px] min-w-[600px]">
                      <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                        <tr>
                          <th className="text-left py-1.5 px-1">Móvel</th>
                          <th className="text-left py-1.5 px-1">Peça</th>
                          <th className="text-left py-1.5 px-1">Material</th>
                          <th className="text-right py-1.5 px-1">L mm</th>
                          <th className="text-right py-1.5 px-1">C mm</th>
                          <th className="text-center py-1.5 px-1">Qtd</th>
                          <th className="text-center py-1.5 px-1">Fita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listaCorte.pecas.map((p, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                            <td className="py-1 px-1 text-muted-foreground truncate max-w-[90px]">{p.movel}</td>
                            <td className="py-1 px-1 font-medium">{p.peca}</td>
                            <td className="py-1 px-1 text-muted-foreground text-[10.5px]">{p.material}</td>
                            <td className="py-1 px-1 text-right tabular-nums">{p.largura_mm}</td>
                            <td className="py-1 px-1 text-right tabular-nums">{p.comprimento_mm}</td>
                            <td className="py-1 px-1 text-center">{p.quantidade}</td>
                            <td className="py-1 px-1 text-center text-[10px] font-mono text-muted-foreground">
                              {[p.fita_t && "T", p.fita_b && "B", p.fita_l && "L", p.fita_r && "R"].filter(Boolean).join("") || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {nextStatuses.length > 0 && (
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Alterar status</div>
              <div className="flex gap-2 flex-wrap">
                {nextStatuses.map((s) => (
                  <button key={s} onClick={() => handleStatus(s)} disabled={changingStatus}
                    className={`h-8 px-3 rounded-md border text-[12.5px] font-medium transition-colors disabled:opacity-60 ${s === "aprovado" ? "border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                      : s === "recusado" ? "border-destructive text-destructive hover:bg-destructive/10"
                      : "border-amber-500 text-amber-600 hover:bg-amber-500/10"}`}>
                    {changingStatus ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Painel fiscal */}
          {orc.status === "aprovado" && fiscalDados && (fiscalDados.nfe_ref || fiscalDados.boleto || fiscalDados.pix) && (
            <div className="border border-border rounded-lg p-3 space-y-2.5">
              <div className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">Fiscal</div>

              {fiscalDados.nfe_ref && (
                <div className="flex items-start gap-2 text-[12px]">
                  <Receipt className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">NF-e</span>
                    <span className="text-muted-foreground ml-2">
                      {fiscalDados.nfe_status === "autorizado" ? "Autorizada ✓" : fiscalDados.nfe_status ?? "Processando..."}
                      {fiscalDados.nfe_ambiente === "homologacao" && <span className="ml-1 text-amber-600">(homologação)</span>}
                    </span>
                    {fiscalDados.nfe_chave && (
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">{fiscalDados.nfe_chave}</div>
                    )}
                  </div>
                </div>
              )}

              {fiscalDados.boleto && (
                <div className="flex items-start gap-2 text-[12px]">
                  <Receipt className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">Boleto</span>
                    <span className="text-muted-foreground ml-2">Venc. {new Date(fiscalDados.boleto.vencimento + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    <div className="flex gap-2 mt-1">
                      {fiscalDados.boleto.url && (
                        <a href={fiscalDados.boleto.url} target="_blank" rel="noopener noreferrer"
                          className="text-[11.5px] underline text-muted-foreground hover:text-foreground">Abrir PDF</a>
                      )}
                      {fiscalDados.boleto.copia_cola && (
                        <button onClick={() => { navigator.clipboard.writeText(fiscalDados!.boleto!.copia_cola!); toast.success("Linha digitável copiada!"); }}
                          className="text-[11.5px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <Copy className="size-3" /> Linha digitável
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {fiscalDados.pix && (
                <div className="flex items-start gap-2 text-[12px]">
                  <QrCode className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">PIX</span>
                    <span className="text-muted-foreground ml-2">Venc. {new Date(fiscalDados.pix.vencimento + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    {fiscalDados.pix.qr_code && (
                      <img src={`data:image/png;base64,${fiscalDados.pix.qr_code}`} alt="QR PIX"
                        className="mt-1.5 w-28 h-28 rounded border border-border" />
                    )}
                    {fiscalDados.pix.copia_cola && (
                      <button onClick={() => {
                        navigator.clipboard.writeText(fiscalDados!.pix!.copia_cola!);
                        setCopiedPix(true);
                        setTimeout(() => setCopiedPix(false), 2000);
                      }} className="mt-1 text-[11.5px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                        {copiedPix ? <><CheckCheck className="size-3 text-emerald-600" /> Copiado!</> : <><Copy className="size-3" /> Copia e cola</>}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature 8: Similar price range */}
        {similarRange && (
          <div className="mx-5 mb-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground bg-secondary/50 rounded px-2.5 py-1.5">
            <Info className="size-3 shrink-0" />
            Projetos similares da empresa: <span className="font-medium text-foreground ml-1">R$ {similarRange.min.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k – R$ {similarRange.max.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k</span>
          </div>
        )}

        {/* Feature 9: signed badge */}
        {orcAssinado.em && (
          <div className="mx-5 mb-2 flex items-center gap-1.5 text-[11.5px] text-emerald-600 bg-emerald-500/10 rounded px-2.5 py-1.5">
            <CheckCheck className="size-3.5" />
            Assinado em {new Date(orcAssinado.em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        )}

        {/* Feature 2: Follow-up message panel */}
        {showFollowUp && followUpMsg && (
          <div className="mx-5 mb-2 p-3 rounded-lg border border-border bg-surface-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11.5px] font-medium flex items-center gap-1.5"><Bot className="size-3.5" /> Mensagem de follow-up gerada</div>
              <button onClick={() => setShowFollowUp(false)} className="text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
            </div>
            <p className="text-[12.5px] text-foreground whitespace-pre-wrap">{followUpMsg}</p>
            <button onClick={() => { navigator.clipboard.writeText(followUpMsg); toast.success("Mensagem copiada!"); }}
              className="h-7 px-2.5 rounded border border-border text-[11.5px] hover:bg-secondary inline-flex items-center gap-1.5">
              <Copy className="size-3" /> Copiar
            </button>
          </div>
        )}

        <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0 flex-wrap gap-2">
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-[12.5px] text-destructive hover:opacity-80">
            <Trash2 className="size-3.5" /> Excluir
          </button>
          <div className="flex gap-2 flex-wrap">
            {/* Feature 1: WhatsApp */}
            {["analise", "aprovado"].includes(orc.status) && orc.clientes?.telefone && (
              <button onClick={handleWhatsApp}
                className="h-8 px-3 rounded-md bg-emerald-600 text-white text-[12.5px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
                <MessageCircle className="size-3.5" /> WhatsApp
              </button>
            )}
            {/* Feature 2: Follow-up */}
            {orc.status === "analise" && (
              <button onClick={handleGerarFollowUp} disabled={followUpLoading}
                className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary disabled:opacity-60 inline-flex items-center gap-1.5">
                {followUpLoading ? <Loader2 className="size-3.5 animate-spin" /> : <MessageSquare className="size-3.5" />}
                Follow-up IA
              </button>
            )}
            {/* Feature 9: Sign */}
            {orc.status === "aprovado" && !orcAssinado.em && (
              <button onClick={() => setShowAssinatura(true)}
                className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5">
                <Pencil className="size-3.5" /> Assinar
              </button>
            )}
            {orc.status === "aprovado" && (
              <button onClick={handleCriarProjeto} disabled={criandoProjeto}
                className="h-8 px-3 rounded-md bg-emerald-600 text-white text-[12.5px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
                {criandoProjeto ? <Loader2 className="size-3.5 animate-spin" /> : <FolderPlus className="size-3.5" />}
                Criar Projeto
              </button>
            )}
            {orc.status === "aprovado" && (
              <button onClick={handleEmitirNfe} disabled={nfeLoading}
                className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary disabled:opacity-60 inline-flex items-center gap-1.5">
                {nfeLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
                NF-e
              </button>
            )}
            {orc.status === "aprovado" && (
              <button onClick={() => handleGerarCobranca("BOLETO")} disabled={boletoLoading}
                className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary disabled:opacity-60 inline-flex items-center gap-1.5">
                {boletoLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
                Boleto
              </button>
            )}
            {orc.status === "aprovado" && (
              <button onClick={() => handleGerarCobranca("PIX")} disabled={pixLoading}
                className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary disabled:opacity-60 inline-flex items-center gap-1.5">
                {pixLoading ? <Loader2 className="size-3.5 animate-spin" /> : <QrCode className="size-3.5" />}
                PIX
              </button>
            )}
            <button onClick={handleGerarContrato}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5">
              <FileText className="size-3.5" /> Contrato
            </button>
            <button onClick={handleGerarCorte} disabled={listaCorteLoading}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary disabled:opacity-60 inline-flex items-center gap-1.5">
              {listaCorteLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}
              Plano de Corte
            </button>
            <button onClick={onEdit}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5">
              <Pencil className="size-3.5" /> Editar
            </button>
            <button
              onClick={() => {
                const printWin = window.open("", "_blank");
                if (!printWin) return;
                const rows = Object.entries(grupos).map(([grupo, gItens]) => {
                  const groupHeader = multiGrupo
                    ? `<tr><td colspan="4" style="padding:8px 8px 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#999;border-top:2px solid #ddd">${grupo}</td></tr>`
                    : "";
                  const itemRows = gItens.map((it) => `
                    <tr>
                      <td>${it.descricao}${it.justificativa ? `<br><span style="font-size:10px;color:#999">${it.justificativa}</span>` : ""}</td>
                      <td style="text-align:center">${it.quantidade} ${it.unidade}</td>
                      <td style="text-align:right">R$ ${Number(it.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="text-align:right">R$ ${(Number(it.preco_unitario) * Number(it.quantidade)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>`).join("");
                  return groupHeader + itemRows;
                }).join("");
                const logoHtml = logoUrl ? `<img src="${logoUrl}" style="height:48px;object-fit:contain;margin-bottom:8px" /><br>` : "";
                printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
                  <title>Orçamento ${orc.numero ?? ""}</title>
                  <style>
                    body{font-family:sans-serif;padding:40px;color:#111;max-width:800px;margin:0 auto}
                    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;border-bottom:2px solid #111;padding-bottom:16px}
                    .cliente-box{background:#f5f5f5;border-radius:6px;padding:12px 16px;margin-bottom:24px;font-size:13px}
                    table{width:100%;border-collapse:collapse;font-size:13px}
                    th{text-align:left;border-bottom:2px solid #ddd;padding:8px;font-size:11px;text-transform:uppercase;color:#666;letter-spacing:.06em}
                    td{padding:8px;border-bottom:1px solid #eee}
                    tfoot td{font-weight:700;border-top:2px solid #111;padding-top:12px}
                    .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}
                    @media print{body{padding:20px}}
                  </style></head><body>
                  <div class="header">
                    <div>${logoHtml}<div style="font-size:16px;font-weight:700">${empresaNome}</div><div style="font-size:11px;color:#666">Proposta comercial</div></div>
                    <div><div style="font-size:12px;color:#666">Orçamento</div><div style="font-size:22px;font-weight:700">${orc.numero ?? "—"}</div><div style="font-size:12px;color:#666">${new Date(orc.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div></div>
                  </div>
                  <div class="cliente-box"><strong>Cliente:</strong> ${orc.clientes?.nome ?? "—"}</div>
                  <table>
                    <thead><tr><th>Descrição</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço unit.</th><th style="text-align:right">Total</th></tr></thead>
                    <tbody>${rows}</tbody>
                    <tfoot><tr><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">R$ ${totalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr></tfoot>
                  </table>
                  <div class="footer">Documento gerado pelo Planne ERP · ${new Date().toLocaleDateString("pt-BR")}</div>
                  <script>window.onload=()=>window.print()</script></body></html>`);
                printWin.document.close();
              }}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5">
              <Printer className="size-3.5" /> Imprimir
            </button>
            <button onClick={onClose} className="h-8 px-4 rounded-md border border-border text-[12.5px] hover:bg-secondary">
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
    {/* Feature 9: Assinatura modal portal */}
    {showAssinatura && createPortal(
      <AssinaturaModal
        orcId={orc.id}
        onClose={() => setShowAssinatura(false)}
        onSigned={(png, em) => { setOrcAssinado({ png, em }); setShowAssinatura(false); }}
      />,
      document.body
    )}
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-muted-foreground mb-1">{children}</div>;
}

function MatSelect({ label, value, options, onChange }: {
  label: string;
  value?: string;
  options: { id: string; nome: string; preco_custo: number; preco_venda: number }[];
  onChange: (id: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (options.length === 0) return null;

  const selected = options.find((o) => o.id === value);
  const filtered = query.trim()
    ? options.filter((o) => o.nome.toLowerCase().includes(query.toLowerCase()))
    : options;

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleOpen = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropH = Math.min(filtered.length * 32 + 56, 260);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= dropH
      ? rect.bottom + 4
      : rect.top - dropH - 4;
    setDropStyle({ position: "fixed", top, left: rect.left, width: rect.width, zIndex: 9999 });
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      <div className="text-[10.5px] text-muted-foreground mb-0.5">{label}</div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none text-foreground flex items-center justify-between gap-1"
      >
        <span className="truncate text-left">
          {selected ? `${selected.nome} — R$ ${fmt(selected.preco_venda)}` : "Deixar IA escolher"}
        </span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </button>

      {open && createPortal(
        <div ref={dropRef} style={dropStyle} className="rounded border border-border bg-popover shadow-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border">
            <Search className="size-3 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="flex-1 bg-transparent text-[11.5px] outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(undefined); setOpen(false); setQuery(""); }}
              className={`w-full text-left px-2.5 py-1.5 text-[11.5px] hover:bg-secondary transition-colors ${!value ? "bg-primary/10 text-primary font-medium" : ""}`}
            >
              Deixar IA escolher
            </button>
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-2.5 py-1.5 text-[11.5px] hover:bg-secondary transition-colors ${value === o.id ? "bg-primary/10 text-primary font-medium" : ""}`}
              >
                {o.nome} — R$ {fmt(o.preco_venda)}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2.5 py-2 text-[11px] text-muted-foreground">Nenhum resultado</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
