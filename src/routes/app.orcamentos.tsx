import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import {
  Plus, Filter, Loader2, AlertCircle, X, Trash2, Sparkles,
  ChevronRight, FileUp, Printer, Pencil, ImageUp, FolderPlus,
  ChevronDown, ChevronUp, Info, Search, FileText, Receipt, QrCode, Copy, CheckCheck,
  MessageCircle, MessageSquare, Download, Bot, LayoutGrid, Scissors, Lock,
  ChevronsUpDown, ChevronsDownUp,
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
import { analisarMovel, resumirProjeto } from "@/lib/base-conhecimento/analise-movel";
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
  // Altura de cada frente de gaveta (cm). undefined = automática (16cm com porta,
  // ou divide a altura útil quando é só gaveta). Com porta, a porta desconta isso.
  altura_gaveta_cm?: number;
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
  // Posição na parede (cm). x = a partir da esquerda; y = altura a partir do chão
  // (base do móvel). Se ausente, usa o auto-layout. Definida ao arrastar no preview.
  pos_x_cm?: number;
  pos_y_cm?: number;
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
    { tipo: "cabeceira-nichos", nome: "Cabeceira c/ Nichos", largura_cm: 200, profundidade_cm: 15, altura_cm: 120, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 2 },
    { tipo: "roupeiro", nome: "Roupeiro", largura_cm: 200, profundidade_cm: 60, altura_cm: 230, portas: 4, tipo_porta: "abrir", gavetas: 2, prateleiras: 3 },
    { tipo: "roupeiro-correr", nome: "Roupeiro de Correr", largura_cm: 250, profundidade_cm: 60, altura_cm: 250, portas: 3, tipo_porta: "correr", gavetas: 3, prateleiras: 4 },
    { tipo: "guarda-roupa-canto", nome: "Guarda-roupa de Canto", largura_cm: 180, profundidade_cm: 60, altura_cm: 250, portas: 3, tipo_porta: "abrir", gavetas: 2, prateleiras: 4, formato: "L" },
    { tipo: "comoda", nome: "Cômoda", largura_cm: 120, profundidade_cm: 50, altura_cm: 80, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "criado-mudo", nome: "Criado-mudo", largura_cm: 45, profundidade_cm: 40, altura_cm: 60, portas: 1, tipo_porta: "abrir", gavetas: 1, prateleiras: 0 },
    { tipo: "escrivaninha", nome: "Escrivaninha", largura_cm: 140, profundidade_cm: 65, altura_cm: 75, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 1 },
    { tipo: "bancada-estudo", nome: "Bancada de Estudo", largura_cm: 120, profundidade_cm: 50, altura_cm: 75, portas: 0, tipo_porta: "sem", gavetas: 1, prateleiras: 2 },
    { tipo: "estante", nome: "Estante", largura_cm: 100, profundidade_cm: 35, altura_cm: 200, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "prateleiras-quarto", nome: "Prateleiras", largura_cm: 120, profundidade_cm: 30, altura_cm: 40, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 2 },
    { tipo: "ripado", nome: "Painel Ripado", largura_cm: 160, profundidade_cm: 5, altura_cm: 240, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0, tem_ripado: true, ripa_espessura_mm: 15, ripa_largura_mm: 30 },
  ],
  "Cozinha": [
    { tipo: "arm-sup", nome: "Armários Superiores", largura_cm: 300, profundidade_cm: 35, altura_cm: 70, portas: 6, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "arm-inf", nome: "Armários Inferiores", largura_cm: 300, profundidade_cm: 60, altura_cm: 85, portas: 4, tipo_porta: "abrir", gavetas: 3, prateleiras: 0 },
    { tipo: "balcao-gaveteiro", nome: "Balcão Gaveteiro", largura_cm: 80, profundidade_cm: 60, altura_cm: 85, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "balcao-pia", nome: "Balcão de Pia", largura_cm: 120, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 0 },
    { tipo: "balcao-cooktop", nome: "Balcão p/ Cooktop", largura_cm: 80, profundidade_cm: 60, altura_cm: 85, portas: 1, tipo_porta: "abrir", gavetas: 1, prateleiras: 0 },
    { tipo: "bancada", nome: "Bancada / Tampo", largura_cm: 300, profundidade_cm: 60, altura_cm: 5, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
    { tipo: "ilha", nome: "Ilha", largura_cm: 180, profundidade_cm: 90, altura_cm: 85, portas: 4, tipo_porta: "abrir", gavetas: 2, prateleiras: 0 },
    { tipo: "torre", nome: "Torre Forno / Micro", largura_cm: 70, profundidade_cm: 60, altura_cm: 230, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "torre-quente", nome: "Torre Quente (forno+micro)", largura_cm: 70, profundidade_cm: 60, altura_cm: 230, portas: 3, tipo_porta: "abrir", gavetas: 1, prateleiras: 1 },
    { tipo: "despenseiro", nome: "Despenseiro", largura_cm: 40, profundidade_cm: 60, altura_cm: 230, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 5 },
    { tipo: "paneleiro", nome: "Paneleiro", largura_cm: 60, profundidade_cm: 60, altura_cm: 230, portas: 2, tipo_porta: "abrir", gavetas: 3, prateleiras: 2 },
    { tipo: "adega-cozinha", nome: "Nicho Adega / Garrafas", largura_cm: 40, profundidade_cm: 35, altura_cm: 70, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 3 },
  ],
  "Sala": [
    { tipo: "rack", nome: "Rack", largura_cm: 200, profundidade_cm: 45, altura_cm: 50, portas: 2, tipo_porta: "correr", gavetas: 0, prateleiras: 2 },
    { tipo: "rack-suspenso", nome: "Rack Suspenso", largura_cm: 180, profundidade_cm: 40, altura_cm: 40, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 1 },
    { tipo: "estante-sala", nome: "Estante", largura_cm: 150, profundidade_cm: 35, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "home-completo", nome: "Home Theater Completo", largura_cm: 300, profundidade_cm: 45, altura_cm: 240, portas: 4, tipo_porta: "abrir", gavetas: 2, prateleiras: 4 },
    { tipo: "buffet", nome: "Buffet / Aparador", largura_cm: 150, profundidade_cm: 45, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 1 },
    { tipo: "cristaleira", nome: "Cristaleira", largura_cm: 120, profundidade_cm: 40, altura_cm: 200, portas: 2, tipo_porta: "abrir_vidro", gavetas: 1, prateleiras: 4 },
    { tipo: "estante-livros", nome: "Estante de Livros", largura_cm: 180, profundidade_cm: 30, altura_cm: 240, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 6 },
    { tipo: "painel-tv", nome: "Painel TV", largura_cm: 200, profundidade_cm: 5, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0, tem_ripado: true, ripa_espessura_mm: 15, ripa_largura_mm: 30 },
  ],
  "Escritório": [
    { tipo: "mesa-trab", nome: "Mesa de Trabalho", largura_cm: 160, profundidade_cm: 75, altura_cm: 75, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 0 },
    { tipo: "mesa-l", nome: "Mesa em L", largura_cm: 180, profundidade_cm: 75, altura_cm: 75, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 0, formato: "L" },
    { tipo: "estante-escr", nome: "Estante / Prateleiras", largura_cm: 150, profundidade_cm: 35, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "armario-escr", nome: "Armário", largura_cm: 100, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "armario-arquivo", nome: "Armário de Arquivo", largura_cm: 90, profundidade_cm: 50, altura_cm: 130, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "gaveteiro", nome: "Gaveteiro", largura_cm: 40, profundidade_cm: 50, altura_cm: 70, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "credenza", nome: "Credenza / Balcão", largura_cm: 160, profundidade_cm: 45, altura_cm: 75, portas: 3, tipo_porta: "abrir", gavetas: 1, prateleiras: 1 },
    { tipo: "painel-escr", nome: "Painel Ripado", largura_cm: 160, profundidade_cm: 5, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0, tem_ripado: true, ripa_espessura_mm: 15, ripa_largura_mm: 30 },
  ],
  "Closet": [
    { tipo: "prateleiras-cl", nome: "Prateleiras", largura_cm: 100, profundidade_cm: 45, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 6 },
    { tipo: "cabideiro", nome: "Cabideiro", largura_cm: 100, profundidade_cm: 55, altura_cm: 120, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 1 },
    { tipo: "cabideiro-duplo", nome: "Cabideiro Duplo", largura_cm: 100, profundidade_cm: 55, altura_cm: 200, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 2 },
    { tipo: "gavetas-cl", nome: "Gaveteiro", largura_cm: 80, profundidade_cm: 55, altura_cm: 100, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "modulo-calcas", nome: "Módulo de Calças", largura_cm: 60, profundidade_cm: 55, altura_cm: 100, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "nicho-bolsas", nome: "Nichos p/ Bolsas", largura_cm: 90, profundidade_cm: 40, altura_cm: 120, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 4 },
    { tipo: "ilha-closet", nome: "Ilha Central", largura_cm: 120, profundidade_cm: 60, altura_cm: 90, portas: 0, tipo_porta: "sem", gavetas: 6, prateleiras: 0 },
    { tipo: "sapateira", nome: "Sapateira", largura_cm: 100, profundidade_cm: 35, altura_cm: 60, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
  ],
  "Banheiro": [
    { tipo: "gabinete", nome: "Gabinete", largura_cm: 80, profundidade_cm: 45, altura_cm: 55, portas: 2, tipo_porta: "abrir", gavetas: 1, prateleiras: 0 },
    { tipo: "gabinete-suspenso", nome: "Gabinete Suspenso", largura_cm: 100, profundidade_cm: 45, altura_cm: 40, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 0 },
    { tipo: "espelheira", nome: "Espelheira / Nicho", largura_cm: 80, profundidade_cm: 15, altura_cm: 60, portas: 1, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "armario-alto-ban", nome: "Armário Alto", largura_cm: 40, profundidade_cm: 30, altura_cm: 180, portas: 1, tipo_porta: "abrir", gavetas: 0, prateleiras: 4 },
    { tipo: "nicho-ban", nome: "Nicho Decorativo", largura_cm: 60, profundidade_cm: 15, altura_cm: 30, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 1 },
  ],
  "Área gourmet": [
    { tipo: "bancada-gourmet", nome: "Bancada", largura_cm: 200, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 0 },
    { tipo: "armario-gourmet", nome: "Armário", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "arm-sup-gourmet", nome: "Armários Superiores", largura_cm: 200, profundidade_cm: 35, altura_cm: 70, portas: 4, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "churrasqueira-mod", nome: "Módulo Churrasqueira", largura_cm: 100, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 1 },
    { tipo: "adega-gourmet", nome: "Adega / Cave", largura_cm: 60, profundidade_cm: 50, altura_cm: 120, portas: 1, tipo_porta: "abrir_vidro", gavetas: 0, prateleiras: 5 },
  ],
  "Lavanderia": [
    { tipo: "arm-lav", nome: "Armário", largura_cm: 100, profundidade_cm: 45, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "bancada-lav", nome: "Bancada", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
    { tipo: "arm-sup-lav", nome: "Armário Superior", largura_cm: 120, profundidade_cm: 35, altura_cm: 70, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "torre-maquinas", nome: "Torre p/ Lava e Seca", largura_cm: 70, profundidade_cm: 65, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 1 },
    { tipo: "tanque-gab", nome: "Gabinete de Tanque", largura_cm: 60, profundidade_cm: 55, altura_cm: 85, portas: 1, tipo_porta: "abrir", gavetas: 0, prateleiras: 0 },
  ],
  "Garagem": [
    { tipo: "arm-gar", nome: "Armário de Garagem", largura_cm: 120, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 4 },
    { tipo: "bancada-gar", nome: "Bancada de Trabalho", largura_cm: 180, profundidade_cm: 70, altura_cm: 85, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 0 },
    { tipo: "arm-ferramentas", nome: "Armário de Ferramentas", largura_cm: 100, profundidade_cm: 40, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 3, prateleiras: 3 },
    { tipo: "prateleiras-gar", nome: "Prateleiras Abertas", largura_cm: 150, profundidade_cm: 45, altura_cm: 200, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
  ],
  "Outro": [
    { tipo: "armario-gen", nome: "Armário", largura_cm: 120, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "bancada-gen", nome: "Bancada / Balcão", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 0 },
    { tipo: "estante-gen", nome: "Estante", largura_cm: 120, profundidade_cm: 35, altura_cm: 200, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "prateleiras-gen", nome: "Prateleiras", largura_cm: 100, profundidade_cm: 30, altura_cm: 40, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 2 },
    { tipo: "gaveteiro-gen", nome: "Gaveteiro", largura_cm: 50, profundidade_cm: 50, altura_cm: 80, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "painel-gen", nome: "Painel Ripado", largura_cm: 150, profundidade_cm: 5, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0, tem_ripado: true, ripa_espessura_mm: 15, ripa_largura_mm: 30 },
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
  moveis, plantaInfo, manualWalls, medW, medH, onSelectMovel, selectedId, onMoveMovel,
  activeWallProp, onSetWall, travadas, onTravar, onDestravar,
}: {
  moveis: MovelConfig[];
  plantaInfo: PlantaInfo | null;
  manualWalls?: { id: string; comprimento_cm: number; porta?: boolean; janela?: boolean }[];
  medW: number; medH: number;
  onSelectMovel?: (id: string) => void;
  selectedId?: string | null;
  onMoveMovel?: (id: string, x_cm: number, y_cm: number) => void;
  activeWallProp?: string;
  onSetWall?: (id: string) => void;
  travadas?: string[];
  onTravar?: () => void;
  onDestravar?: (id: string) => void;
}) {
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [selWall, setSelWall] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; startClientX: number; startClientY: number; startXcm: number; startYcm: number; moved: boolean } | null>(null);

  // Paredes: da planta baixa, ou as paredes manuais A–D do cômodo.
  // Ignora paredes muito pequenas (< 100cm) — valor provavelmente errado, não
  // deixa a parede sumir no preview.
  const walls: Parede[] = plantaInfo?.paredes
    ?? (manualWalls ?? []).filter((p) => p.comprimento_cm >= 100).map((p) => ({
      id: p.id, descricao: "", largura_cm: p.comprimento_cm, espaco_util_cm: p.comprimento_cm,
    }));
  // Parede ativa vem do pai (fluxo de travar parede); senão usa a seleção local.
  const activeWall = activeWallProp ?? selWall ?? walls[0]?.id ?? null;
  const setWall = onSetWall ?? setSelWall;

  // Móveis em edição (sem parede) pertencem à parede ATIVA (WIP); os já
  // atribuídos ficam só na sua. Ao travar, viram atribuídos e somem da edição.
  const visible = activeWall
    ? moveis.filter((m) => (m.parede_id ?? activeWall) === activeWall)
    : moveis;

  // Aberturas (porta/janela) da parede ativa — desenhadas no preview
  const activeManual = (manualWalls ?? []).find((p) => p.id === activeWall);

  // Cozinha: as corridas (inferior/superior/bancada) ficam EMPILHADAS na mesma
  // faixa horizontal (não enfileiradas lado a lado); as torres ocupam largura
  // própria ao lado. Assim a "largura da parede" não vira a soma de tudo.
  const RUN_TIPOS = new Set(["arm-inf", "arm-sup", "bancada"]);
  const TOWER_TIPOS = new Set(["torre", "despenseiro"]);
  const runMaxW = visible.filter((m) => RUN_TIPOS.has(m.tipo)).reduce((mx, m) => Math.max(mx, m.largura_cm), 0);
  const towersW = visible.filter((m) => TOWER_TIPOS.has(m.tipo)).reduce((s, m) => s + m.largura_cm, 0);
  const seqTotal = visible.filter((m) => !RUN_TIPOS.has(m.tipo) && !TOWER_TIPOS.has(m.tipo)).reduce((s, m) => s + m.largura_cm + 2, 0);
  const contentW = Math.max(runMaxW + towersW, seqTotal);

  const parede = walls.find((w) => w.id === activeWall);
  // Largura REAL da parede (não cresce com os móveis). Piso de 200cm só para o
  // caso de nenhuma medida informada — evita a parede sumir. Se o móvel passar
  // da parede, ele aparece como excesso (não empurra a parede).
  const larguraReal = parede?.espaco_util_cm ?? (medW > 0 ? Math.round(medW * 100) : 0);
  const wallW = larguraReal > 0 ? larguraReal : Math.max(200, contentW);
  const wallH = plantaInfo?.altura_cm ?? (medH > 0 ? Math.round(medH * 100) : 270);

  const SVG_W = 680, SVG_H = 360;
  const ML = 34, MT = 30, MR = 14, MB = 34;
  const availW = SVG_W - ML - MR, availH = SVG_H - MT - MB;
  const scale = Math.min(availW / wallW, availH / wallH);
  const wallPxW = wallW * scale, wallPxH = wallH * scale;
  const ox = ML + (availW - wallPxW) / 2;
  const oy = MT + (availH - wallPxH);

  // Layout posicional: corridas na faixa esquerda (empilhadas por altura —
  // inferior no chão, bancada sobre ela, superior no teto); torres ao lado
  // direito das corridas; demais itens em sequência.
  const armInfAltura = visible.find((m) => m.tipo === "arm-inf")?.altura_cm ?? 85;
  let towerX = runMaxW;
  let seqX = 0;
  const laid = visible.map((m) => {
    let x: number;
    let yFloor: number;
    if (TOWER_TIPOS.has(m.tipo)) {
      x = towerX; towerX += m.largura_cm; yFloor = 0;
    } else if (RUN_TIPOS.has(m.tipo)) {
      x = 0;
      yFloor = m.tipo === "arm-sup"
        ? Math.max(0, wallH - m.altura_cm)   // superior encosta no teto
        : m.tipo === "bancada"
          ? armInfAltura                     // bancada em cima do inferior
          : 0;                               // inferior no chão
    } else {
      x = seqX; seqX += m.largura_cm + 2; yFloor = WALL_MOUNTED_Y[m.tipo] ?? 0;
    }
    // Posição manual (arrastada) sobrescreve o auto-layout
    if (m.pos_x_cm != null) x = m.pos_x_cm;
    if (m.pos_y_cm != null) yFloor = m.pos_y_cm;
    // Preso ao quadro: nada sai da parede (horizontal E vertical)
    x = Math.max(0, Math.min(Math.max(0, wallW - m.largura_cm), x));
    yFloor = Math.max(0, Math.min(Math.max(0, wallH - m.altura_cm), yFloor));
    return { m, x, yFloor };
  });

  // 3D oblique helpers
  const ANG = 28 * Math.PI / 180, DR = 0.38;
  const ddx = (d: number) => d * DR * Math.cos(ANG) * scale;
  const ddy = (d: number) => -d * DR * Math.sin(ANG) * scale;

  const LABEL_PORTA: Record<string, string> = {
    abrir:"◁", abrir_vidro:"◁⬜", abrir_espelho:"◁▣",
    correr:"↔", correr_vidro:"↔⬜", correr_espelho:"↔▣", sem:"",
  };

  // ── Arrastar móvel dentro da parede (preso aos limites) ──
  const cmFromClientDelta = (dxClient: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    const ratio = rect && rect.width ? SVG_W / rect.width : 1;
    return (dxClient * ratio) / scale;
  };
  const onMovelDown = (e: React.PointerEvent, m: MovelConfig, curXcm: number, curYcm: number) => {
    if (!onMoveMovel) return;
    dragRef.current = { id: m.id, startClientX: e.clientX, startClientY: e.clientY, startXcm: curXcm, startYcm: curYcm, moved: false };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  // Verifica se um retângulo (x,yFloor,w,h em cm) invade outro móvel visível
  const invade = (id: string, nx: number, ny: number, w: number, h: number) =>
    laid.some(({ m: om, x: ox2, yFloor: oy2 }) =>
      om.id !== id &&
      nx < ox2 + om.largura_cm && nx + w > ox2 &&
      ny < oy2 + om.altura_cm && ny + h > oy2);

  const onSvgMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !onMoveMovel) return;
    const dx = cmFromClientDelta(e.clientX - d.startClientX);
    const dyScreen = cmFromClientDelta(e.clientY - d.startClientY); // tela: baixo = +
    if (Math.abs(dx) > 1.5 || Math.abs(dyScreen) > 1.5) d.moved = true;
    const mv = moveis.find((x) => x.id === d.id);
    const w = mv?.largura_cm ?? 0, h = mv?.altura_cm ?? 0;
    const cur = laid.find((l) => l.m.id === d.id);
    const curX = cur?.x ?? d.startXcm, curY = cur?.yFloor ?? d.startYcm;
    const newX = Math.max(0, Math.min(wallW - w, Math.round(d.startXcm + dx)));
    // yFloor sobe quando a tela desce → subtrai o delta de tela
    const newY = Math.max(0, Math.min(wallH - h, Math.round(d.startYcm - dyScreen)));
    // Não deixa um móvel subir por cima do outro: bloqueia o eixo que colide.
    const ax = invade(d.id, newX, curY, w, h) ? curX : newX;
    const ay = invade(d.id, ax, newY, w, h) ? curY : newY;
    onMoveMovel(d.id, ax, ay);
  };
  const onSvgUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) onSelectMovel?.(d.id); // clique sem arrastar = selecionar
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
        {walls.length > 1 && walls.map((w) => {
          const travada = travadas?.includes(w.id);
          return (
            <button key={w.id} type="button"
              onClick={() => (travada && onDestravar) ? onDestravar(w.id) : setWall(w.id)}
              title={travada ? "Parede travada — clique para editar de novo" : undefined}
              className={`h-6 px-2 rounded text-[11px] border transition-colors inline-flex items-center gap-1 ${activeWall===w.id?"bg-accent/20 border-accent text-accent":travada?"border-emerald-500/40 text-emerald-500":"border-border text-muted-foreground hover:bg-secondary"}`}>
              {travada && <Lock className="size-2.5" />}
              Parede {w.id} — {w.espaco_util_cm}cm
            </button>
          );
        })}
        {onTravar && (
          <button type="button" onClick={onTravar}
            className="h-6 px-2.5 rounded text-[11px] border border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 transition-colors inline-flex items-center gap-1"
            title="Travar esta parede: fixa os móveis nela e limpa para a próxima">
            <Lock className="size-3" /> Travar parede {activeWall}
          </button>
        )}
        <span className="ml-auto text-[11.5px] text-muted-foreground">{wallW}cm L × {wallH}cm H</span>
      </div>

      {onMoveMovel && view === "2d" && (
        <div className="text-[11.5px] text-muted-foreground">Arraste os móveis para posicionar · clique para editar</div>
      )}
      <div className="rounded-lg border border-border overflow-hidden" style={{ background: "var(--color-surface-2, #f8fafc)" }}>
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ maxHeight: 690, display:"block", touchAction: onMoveMovel ? "none" : undefined }}
          onPointerMove={onSvgMove} onPointerUp={onSvgUp} onPointerLeave={onSvgUp}>
          {/* Wall bg */}
          <rect x={ox} y={oy} width={wallPxW} height={wallPxH} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} />
          {/* Grid 50cm */}
          {Array.from({length: Math.floor(wallH/50)}).map((_,i) => (
            <line key={i} x1={ox} y1={oy + wallPxH - (i+1)*50*scale} x2={ox+wallPxW} y2={oy+wallPxH-(i+1)*50*scale}
              stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="3,2" />
          ))}
          {/* Floor */}
          <line x1={ox-8} y1={oy+wallPxH} x2={ox+wallPxW+8} y2={oy+wallPxH} stroke="#475569" strokeWidth={2.5} />

          {/* Aberturas: porta (marrom, no chão) e janela (azul, meia altura) */}
          {activeManual?.porta && (() => {
            const dw = Math.min(90, wallW * 0.25) * scale, dh = Math.min(210, wallH * 0.85) * scale;
            const dx = ox + wallPxW - dw - 6;
            return (
              <g>
                <rect x={dx} y={oy + wallPxH - dh} width={dw} height={dh} fill="rgba(180,120,70,0.18)" stroke="#b47846" strokeWidth={1.2} strokeDasharray="4,2" rx={1} />
                <text x={dx + dw / 2} y={oy + wallPxH - dh / 2} textAnchor="middle" dominantBaseline="middle" fontSize={15} fill="#b47846">🚪</text>
              </g>
            );
          })()}
          {activeManual?.janela && (() => {
            const ww = Math.min(120, wallW * 0.3) * scale, wh = Math.min(110, wallH * 0.4) * scale;
            const wx = ox + 8, wy = oy + wallPxH - (100 + 110) * scale;
            return (
              <g>
                <rect x={wx} y={wy} width={ww} height={wh} fill="rgba(56,160,220,0.15)" stroke="#38a0dc" strokeWidth={1.2} strokeDasharray="4,2" rx={1} />
                <text x={wx + ww / 2} y={wy + wh / 2} textAnchor="middle" dominantBaseline="middle" fontSize={15} fill="#38a0dc">🪟</text>
              </g>
            );
          })()}

          {view==="2d" ? laid.map(({ m, x, yFloor }) => {
            const fw = m.largura_cm * scale;
            const fh = m.altura_cm * scale;
            const fx = ox + x * scale;
            const fy = oy + wallPxH - (yFloor + m.altura_cm) * scale;
            const [fill, stroke] = getMC(m.tipo);
            const portas = m.portas || 0;
            const isGlass = m.tipo_porta?.includes("vidro");
            const isMirror = m.tipo_porta?.includes("espelho");
            const isSel = selectedId === m.id;
            // Zona das gavetas (embaixo). Fixa = nº × altura; auto c/ porta = 16cm;
            // auto só-gaveta = preenche o móvel. A porta ocupa só o que sobra em cima.
            const g = m.gavetas || 0;
            const altGavCm = m.altura_gaveta_cm ?? 16;
            const gavZoneCm = g === 0 ? 0
              : (portas > 0 || m.altura_gaveta_cm != null) ? Math.min(m.altura_cm, g * altGavCm)
              : m.altura_cm;
            const gavZoneH = gavZoneCm * scale;
            const doorBottom = fy + fh - gavZoneH; // base da zona de portas
            return (
              <g key={m.id}
                onPointerDown={(e) => onMovelDown(e, m, x, yFloor)}
                onClick={() => { if (!onMoveMovel) onSelectMovel?.(m.id); }}
                style={{ cursor: onMoveMovel ? "move" : onSelectMovel ? "pointer" : "default" }}>
                <rect x={fx} y={fy} width={fw} height={fh} fill={fill} stroke={isSel ? "#2563eb" : stroke} strokeWidth={isSel ? 2.2 : 1} rx={1} />
                {/* Rodapé (faixa embaixo) e roda-teto (faixa em cima) — 10cm */}
                {m.tem_rodape && (
                  <rect x={fx} y={fy + fh - Math.min(10 * scale, fh * 0.15)} width={fw} height={Math.min(10 * scale, fh * 0.15)}
                    fill="rgba(71,85,105,0.28)" stroke={stroke} strokeWidth={0.5} />
                )}
                {m.tem_roda_teto && (
                  <rect x={fx} y={fy} width={fw} height={Math.min(10 * scale, fh * 0.15)}
                    fill="rgba(71,85,105,0.28)" stroke={stroke} strokeWidth={0.5} />
                )}
                {/* Door splits — só na zona das portas (acima das gavetas) */}
                {portas > 1 && Array.from({length: portas-1}).map((_,i) => (
                  <line key={i} x1={fx+fw/portas*(i+1)} y1={fy} x2={fx+fw/portas*(i+1)} y2={doorBottom}
                    stroke={stroke} strokeWidth={0.7} strokeDasharray="3,1.5" />
                ))}
                {/* Linha separando portas das gavetas */}
                {portas > 0 && g > 0 && (
                  <line x1={fx} y1={doorBottom} x2={fx+fw} y2={doorBottom} stroke={stroke} strokeWidth={1} />
                )}
                {/* Gavetas — faixas na base, com a altura definida, com puxador */}
                {g > 0 && (() => {
                  const zoneY = fy + fh - gavZoneH;
                  const dh = gavZoneH / g;
                  return (
                    <g>
                      {Array.from({ length: g }).map((_, i) => {
                        const gy = zoneY + i * dh;
                        return (
                          <g key={i}>
                            <rect x={fx + 1} y={gy + 0.5} width={fw - 2} height={dh - 1}
                              fill="rgba(99,102,241,0.18)" stroke={stroke} strokeWidth={0.7} />
                            <line x1={fx + fw / 2 - 9} y1={gy + dh / 2} x2={fx + fw / 2 + 9} y2={gy + dh / 2}
                              stroke={stroke} strokeWidth={1.2} strokeLinecap="round" />
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
                {/* Glass/mirror overlay */}
                {isGlass && <rect x={fx+2} y={fy+2} width={fw-4} height={fh-4} fill="rgba(186,230,253,0.35)" stroke="#0284c7" strokeWidth={0.8} rx={1} />}
                {isMirror && <rect x={fx+2} y={fy+2} width={fw-4} height={fh-4} fill="rgba(203,213,225,0.5)" stroke="#64748b" strokeWidth={0.8} rx={1} />}
                {/* Label — vertical (girado) quando o móvel é estreito e alto */}
                {(() => {
                  const cx = fx + fw / 2, cy = fy + fh / 2;
                  const vertical = fh > fw * 1.25 && fw < 90;
                  if (vertical) {
                    if (fh < 24) return null;
                    // texto sobe na vertical; tamanho pela LARGURA disponível
                    const fs = Math.max(12, Math.min(22, fw / 3.2));
                    const maxCh = Math.floor(fh / (fs * 0.62));
                    const txt = m.nome.length > maxCh ? m.nome.slice(0, Math.max(1, maxCh - 1)) + "…" : m.nome;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                        transform={`rotate(-90 ${cx} ${cy})`}
                        fontSize={fs} fill="#1e293b" fontWeight="700">{txt}</text>
                    );
                  }
                  if (fw <= 16 || fh <= 10) return null;
                  const fs = Math.max(12, Math.min(18, fw / 5));
                  const maxCh = Math.floor(fw / (fs * 0.6));
                  const txt = m.nome.length > maxCh ? m.nome.slice(0, Math.max(1, maxCh - 1)) + "…" : m.nome;
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                      fontSize={fs} fill="#1e293b" fontWeight="700">{txt}</text>
                  );
                })()}
                {/* Width below */}
                <text x={fx+fw/2} y={oy+wallPxH+20} textAnchor="middle" fontSize={13} fontWeight="700" fill="#334155">{m.largura_cm}</text>
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
          <text x={ox+wallPxW/2} y={oy-11} textAnchor="middle" fontSize={16} fontWeight="700" fill="#334155">{wallW}cm</text>
          <text x={ox-18} y={oy+wallPxH/2} textAnchor="middle" fontSize={16} fontWeight="700" fill="#334155"
            transform={`rotate(-90 ${ox-18} ${oy+wallPxH/2})`}>{wallH}cm</text>
        </svg>
      </div>

      {/* Legend */}
      {visible.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visible.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 text-[13px] text-foreground/80">
              <div className="size-3 rounded-sm border" style={{ background: getMC(m.tipo)[0], borderColor: getMC(m.tipo)[1] }} />
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
  // Paredes com marcenaria (A, B, C, D) — comprimentos independentes. Opcional:
  // se vazio, usa largura×profundidade como parede única (retângulo).
  // porta/janela: aberturas na parede (o motor evita colocar armário em cima).
  paredes?: { id: string; comprimento_cm: number; porta?: boolean; janela?: boolean }[];
  // Medir as paredes por foto (com folha A4) em vez de digitar.
  usarFoto?: boolean;
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

// Traduz mensagens de erro (fetch/Supabase/API) para português amigável.
function msgErro(e: unknown, fallback = "Ocorreu um erro. Tente novamente."): string {
  const raw = e instanceof Error ? e.message : typeof e === "string" ? e : (e as { message?: string })?.message ?? "";
  const m = raw.toLowerCase();
  if (!raw) return fallback;
  if (/failed to fetch|networkerror|network error|load failed|err_|fetch failed/.test(m)) return "Não foi possível conectar ao servidor. Tente novamente em alguns instantes.";
  if (/timeout|timed out|deadline/.test(m)) return "O servidor demorou para responder. Tente de novo.";
  if (/duplicate key|already exists|unique constraint/.test(m)) return "Esse registro já existe.";
  if (/permission denied|row-level security|not authoriz|unauthorized|forbidden|403/.test(m)) return "Você não tem permissão para esta ação.";
  if (/violates|constraint|invalid input|null value/.test(m)) return "Dados inválidos para salvar. Confira os campos e tente de novo.";
  if (/rate limit|quota|insufficient|429/.test(m)) return "Limite de uso atingido. Tente novamente mais tarde.";
  if (/not found|404/.test(m)) return "Recurso não encontrado.";
  // Crash da função serverless (Vercel) — a função caiu sem responder.
  if (/function_invocation_failed|function_invocation_timeout|invocation failed|body_not_a_string|no_response_from_function|502|503|504/.test(m))
    return "O servidor falhou ao processar (a função caiu ou demorou demais). Tente novamente; se persistir, reduza o nº de móveis/cômodos por vez.";
  // Resposta HTML (página de erro) em vez de JSON — normalmente crash/deploy.
  if (/<!doctype|<html|a server error has occurred/.test(m))
    return "O servidor retornou um erro inesperado. Tente novamente em alguns instantes.";
  if (/500|internal server/.test(m)) return "Erro interno do servidor. Tente novamente.";
  // Mensagens do motor e validações já vêm em português — mostra como estão.
  return raw;
}

// Lê o corpo de uma resposta não-ok e extrai a melhor mensagem possível:
// campo `error` de JSON, senão o status. Nunca devolve HTML gigante.
async function erroDaResposta(res: Response): Promise<string> {
  const txt = await res.text().catch(() => "");
  try {
    const j = JSON.parse(txt) as { error?: string; message?: string };
    if (j.error || j.message) return j.error ?? j.message ?? "";
  } catch { /* não é JSON */ }
  if (/<!doctype|<html|function_invocation/i.test(txt)) return `HTTP ${res.status} FUNCTION_INVOCATION_FAILED`;
  return txt.slice(0, 200) || `HTTP ${res.status}`;
}

// Plano de corte visualizável (chapa + peças encaixadas)
type PecaAloc = { x_mm: number; y_mm: number; largura_mm: number; comprimento_mm: number; rotacionada?: boolean; etiqueta?: string; peca_id?: string };
type ChapaCorte = {
  numero_sequencial: number; largura_mm: number; comprimento_mm: number;
  pecas_alocadas: PecaAloc[]; comodo?: string;
  // Material da chapa — todas as peças dela têm a MESMA espessura (o nesting
  // agrupa por espessura, então fundo 6mm nunca cai numa chapa de 15mm).
  material?: { espessura_mm?: number; nome_display?: string };
};

// Apelido de marceneiro para o tipo de móvel (fala como na oficina).
function apelidoMovel(movel: string): string {
  const m = movel.toLowerCase();
  if (/superior|a[eé]reo/.test(m)) return "aéreo";
  if (/inferior|balc[aã]o de pia|balc[aã]o/.test(m)) return "balcão";
  if (/torre/.test(m)) return "torre";
  if (/paneleir/.test(m)) return "paneleiro";
  if (/despens/.test(m)) return "despenseiro";
  if (/bancada|tampo/.test(m)) return "bancada";
  if (/gavete/.test(m)) return "gaveteiro";
  if (/roupeir|guarda/.test(m)) return "roupeiro";
  return movel;
}

// Constrói o nome descritivo da peça a partir da etiqueta + posição.
// Ex.: "LATERAL — Armários Superiores" (cópia #1) -> "Lateral dir. do aéreo".
function nomePeca(p: PecaAloc): { nome: string; movel: string } {
  const et = p.etiqueta ?? "";
  const [rawTipo0, movelRaw = ""] = et.split("—").map((s) => s.trim());
  const rawTipo = rawTipo0 ?? "";
  const seg = rawTipo.match(/seg\s*(\d+)\s*\/\s*(\d+)/i);
  let tipo = rawTipo.replace(/\(seg[^)]*\)/i, "").replace(/_/g, " ").trim().toLowerCase();
  if (!tipo) return { nome: "Peça", movel: "" };
  const idx = parseInt((p.peca_id ?? "").split("#")[1] ?? "-1", 10);
  // lado esq./dir. para peças que vêm em par (laterais); nº para múltiplas.
  let sufixo = "";
  if (/lateral/.test(tipo) && !/esq|dir/.test(tipo)) sufixo = idx === 0 ? " esq." : idx === 1 ? " dir." : "";
  else if (/porta|gaveta|prateleira|frente/.test(tipo) && idx >= 0) sufixo = ` ${idx + 1}`;
  tipo = tipo.replace(/\besq\b/, "esq.").replace(/\bdir\b/, "dir.");
  const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1);
  const movel = movelRaw ? apelidoMovel(movelRaw) : "";
  const segTxt = seg ? ` (parte ${seg[1]}/${seg[2]})` : "";
  const nome = movel ? `${tipoCap}${sufixo} do ${movel}${segTxt}` : `${tipoCap}${sufixo}${segTxt}`;
  return { nome, movel };
}

// ─── Visualização do plano de corte (mesmo sistema do preview 2D) ────────────
function CutPlanVisualization({ chapas }: { chapas: ChapaCorte[] }) {
  const [idx, setIdx] = useState(0);
  if (!chapas.length) return null;
  const ch = chapas[Math.min(idx, chapas.length - 1)];
  const W = ch.largura_mm || 2750, H = ch.comprimento_mm || 1830;
  const SVG_W = 640, pad = 8;
  const scale = (SVG_W - pad * 2) / W;
  const svgH = H * scale + pad * 2;
  const cores = ["#c7d2fe", "#bbf7d0", "#fde68a", "#fbcfe8", "#a5f3fc", "#fed7aa", "#ddd6fe", "#bef264"];
  const espCh = (c: ChapaCorte) => c.material?.espessura_mm;
  const espessuraAtual = espCh(ch);
  const materialAtual = ch.material?.nome_display;
  // Chapas de 6mm (fundos) são um MUNDO à parte — cor de destaque no seletor.
  const corEsp = (e?: number) => e && e <= 6 ? "amber" : "accent";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {chapas.map((c, i) => {
          const e = espCh(c);
          const sel = i === idx;
          const amber = corEsp(e) === "amber";
          return (
            <button key={i} type="button" onClick={() => setIdx(i)}
              className={`h-6 px-2 rounded text-[11px] border transition-colors ${sel
                ? (amber ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400" : "bg-accent/10 border-accent text-accent")
                : "border-border text-muted-foreground hover:bg-secondary"}`}>
              {c.comodo ? `${c.comodo} · ` : ""}Chapa {c.numero_sequencial}{e ? ` · ${e}mm` : ""}
            </button>
          );
        })}
        <span className="ml-auto text-[11.5px] text-muted-foreground">
          {materialAtual ? `${materialAtual} · ` : ""}{W}×{H}mm · {ch.pecas_alocadas.length} peças
        </span>
      </div>
      {espessuraAtual != null && (
        <div className="text-[11px] text-muted-foreground">
          Cada chapa corta uma só espessura — <strong>{espessuraAtual}mm</strong> nesta.
          {espessuraAtual <= 6 ? " (fundos de armário e de gaveta)" : " (corpo, portas, frentes, laterais)"}
        </div>
      )}
      <div className="rounded-lg border border-border overflow-hidden" style={{ background: "var(--color-surface-2, #f8fafc)" }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${svgH}`} style={{ maxHeight: 420, display: "block" }}>
          <rect x={pad} y={pad} width={W * scale} height={H * scale} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5} />
          {ch.pecas_alocadas.map((p, i) => {
            const x = pad + (p.x_mm ?? 0) * scale, y = pad + (p.y_mm ?? 0) * scale;
            const w = p.largura_mm * scale, h = p.comprimento_mm * scale;
            const { nome } = nomePeca(p);
            const cx = x + w / 2, cy = y + h / 2;
            const dims = `${Math.round(p.largura_mm)}×${Math.round(p.comprimento_mm)}${p.rotacionada ? " ↻" : ""}`;
            // Quebra o nome em linhas que cabem na largura; reduz a fonte até o
            // nome inteiro + as medidas caberem na altura da peça (nada cortado).
            const wrap = (fs: number) => {
              const maxCh = Math.max(5, Math.floor(w / (fs * 0.56)));
              const linhas: string[] = [];
              let cur = "";
              for (const wd of nome.split(" ")) {
                const t = cur ? `${cur} ${wd}` : wd;
                if (t.length <= maxCh) cur = t;
                else { if (cur) linhas.push(cur); cur = wd.length > maxCh ? wd.slice(0, maxCh) : wd; }
              }
              if (cur) linhas.push(cur);
              return linhas;
            };
            let fs = Math.min(9, w / 9);
            let linhas = wrap(fs);
            while (fs > 4.5 && (linhas.length + 1) * (fs * 1.18) > h - 3) { fs -= 0.5; linhas = wrap(fs); }
            const lh = fs * 1.18;
            const totalH = (linhas.length + 1) * lh;
            const startY = cy - totalH / 2 + lh / 2;
            const cabe = w > 22 && h > 14 && (linhas.length + 1) * (fs * 1.18) <= h;
            return (
              <g key={i}>
                <rect x={x} y={y} width={w} height={h} fill={cores[i % cores.length]} stroke="#475569" strokeWidth={0.6} />
                {cabe ? (
                  <>
                    {linhas.map((ln, k) => (
                      <text key={k} x={cx} y={startY + k * lh} textAnchor="middle" dominantBaseline="middle"
                        fontSize={fs} fontWeight="600" fill="#0f172a">{ln}</text>
                    ))}
                    <text x={cx} y={startY + linhas.length * lh} textAnchor="middle" dominantBaseline="middle"
                      fontSize={fs * 0.85} fill="#475569">{dims}</text>
                  </>
                ) : w > 18 && h > 9 ? (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(5, Math.min(7.5, w / 12))} fill="#1e293b">{dims}</text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function OrcamentoModal({ onClose, onSaved, editOrc }: {
  onClose: () => void; onSaved: () => void; editOrc?: Orc & { itens?: OrcItem[] };
}) {
  const isEdit = !!editOrc;
  const [fase, setFase] = useState<"configurar" | "moveis" | "revisar">(isEdit ? "revisar" : "configurar");
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [catalogo, setCatalogo] = useState<MatCatalog[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  // Padrões da empresa (herdados de Configurações) — o motor usa estes
  const [empresaParams, setEmpresaParams] = useState({
    mdf_custo_chapa: 85, mao_obra_hora: 45, chapa_largura_mm: 2750, chapa_comprimento_mm: 1830,
    acab_rodape: true, acab_roda_teto: true, acab_engrosso: true,
    ferragem_padrao: "nacional" as "nacional" | "blum" | "hafele",
  });

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
  // Cômodos recolhidos (só o cabeçalho) — deixa a tela menos populada.
  const [comodosRecolhidos, setComodosRecolhidos] = useState<Set<string>>(new Set());
  const toggleRecolher = (id: string) => setComodosRecolhidos((prev) => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const addComodo = (tipo: string) => {
    if (!tipo) return;
    let nomeNovo = tipo;
    setComodos((prev) => {
      const mesmoTipo = prev.filter((c) => c.tipo === tipo).length;
      nomeNovo = mesmoTipo > 0 ? `${tipo} ${mesmoTipo + 1}` : tipo;
      return [...prev, {
        id: Math.random().toString(36).slice(2),
        nome: nomeNovo, tipo, largura: 0, profundidade: 0, altura: 2.7,
        paredes: [{ id: "A", comprimento_cm: 0 }],
        plantaB64: null, plantaNome: null, plantaInfo: null, analisando: false,
      }];
    });
    // Cômodo novo começa com a lista de móveis aberta.
    setOpenAmbientes((prev) => new Set([...prev, nomeNovo]));
    setNovoComodoTipo("");
  };

  const updateComodo = (id: string, patch: Partial<ComodoOrc>) =>
    setComodos((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));

  // Paredes A–D do cômodo (comprimentos independentes)
  // largura/profundidade do cômodo derivadas das paredes (a mais longa = largura,
  // a 2ª = profundidade). Mantém o resto do sistema funcionando com o modelo antigo.
  type ParedeC = { id: string; comprimento_cm: number; porta?: boolean; janela?: boolean };
  const derivarDims = (paredes: ParedeC[]) => {
    const s = [...paredes].filter((p) => p.comprimento_cm > 0).sort((a, b) => b.comprimento_cm - a.comprimento_cm);
    return {
      largura: s[0] ? +(s[0].comprimento_cm / 100).toFixed(2) : 0,
      profundidade: s[1] ? +(s[1].comprimento_cm / 100).toFixed(2) : (s[0] ? 3 : 0),
    };
  };
  const setParedes = (comodoId: string, updater: (ps: ParedeC[]) => ParedeC[]) =>
    setComodos((prev) => prev.map((c) => {
      if (c.id !== comodoId) return c;
      const paredes = updater(c.paredes ?? []);
      return { ...c, paredes, ...derivarDims(paredes) };
    }));

  const addParede = (comodoId: string) =>
    setParedes(comodoId, (ps) => ps.length >= 4 ? ps : [...ps, { id: String.fromCharCode(65 + ps.length), comprimento_cm: 0 }]);
  const updateParede = (comodoId: string, paredeId: string, comprimento_cm: number) =>
    setParedes(comodoId, (ps) => ps.map((p) => p.id === paredeId ? { ...p, comprimento_cm } : p));
  const removeParede = (comodoId: string, paredeId: string) =>
    setParedes(comodoId, (ps) => ps.filter((p) => p.id !== paredeId));
  const toggleAbertura = (comodoId: string, paredeId: string, tipo: "porta" | "janela") =>
    setParedes(comodoId, (ps) => ps.map((p) => p.id === paredeId ? { ...p, [tipo]: !p[tipo] } : p));

  // Foto da parede (com folha A4 de referência) → estima medida + porta/janela
  const [fotoAnalisando, setFotoAnalisando] = useState<string | null>(null);
  const analisarFotoParede = async (comodoId: string, paredeId: string, file: File) => {
    const b64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const key = `${comodoId}|${paredeId}`;
    setFotoAnalisando(key);
    try {
      const res = await fetch("/api/analisar-planta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem_b64: b64, modo: "foto", referencia: "a4" }),
      });
      const r = await res.json() as { largura_cm: number; altura_cm: number; porta: boolean; janela: boolean; confianca: string; error?: string };
      if (!res.ok) { toast.error(r.error ?? "Erro ao analisar a foto"); return; }
      setComodos((prev) => prev.map((c) => {
        if (c.id !== comodoId) return c;
        const ps = c.paredes ?? [];
        const dados = { comprimento_cm: r.largura_cm, porta: !!r.porta, janela: !!r.janela };
        const existe = ps.some((p) => p.id === paredeId);
        const paredes = existe
          ? ps.map((p) => p.id === paredeId ? { ...p, ...dados } : p)
          : [...ps, { id: paredeId, ...dados }];
        return {
          ...c,
          altura: c.altura || (r.altura_cm ? r.altura_cm / 100 : c.altura),
          paredes,
          ...derivarDims(paredes),
        };
      }));
      toast.success(`Parede ${paredeId} ~${r.largura_cm}cm · confiança ${r.confianca}. Confira com trena.`);
    } catch (e) {
      toast.error(msgErro(e, "Erro ao analisar a foto"));
    } finally {
      setFotoAnalisando(null);
    }
  };

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
  const comodoValido = (c: ComodoOrc) => !!c.plantaB64 || (c.largura > 0 && c.altura > 0);

  // Planta analisada
  const [plantaInfo, setPlantaInfo] = useState<PlantaInfo | null>(null);
  const [analisandoPlanta, setAnalisandoPlanta] = useState(false);

  // Móveis
  const [moveis, setMoveis] = useState<MovelConfig[]>([]);
  const [expandedMovel, setExpandedMovel] = useState<string | null>(null);
  // Fluxo por parede: parede em edição + paredes já travadas (finalizadas)
  const [paredeAtiva, setParedeAtiva] = useState<string>("A");
  const [paredesTravadas, setParedesTravadas] = useState<string[]>([]);

  // Trava a parede atual: fixa os móveis em edição nela e avança para a próxima.
  const travarParede = () => {
    const emEdicao = moveis.filter((m) => !m.parede_id);
    if (emEdicao.length === 0) { toast.error("Adicione móveis a esta parede antes de travar."); return; }
    setMoveis((prev) => prev.map((m) => m.parede_id ? m : { ...m, parede_id: paredeAtiva }));
    const novasTravadas = [...new Set([...paredesTravadas, paredeAtiva])];
    setParedesTravadas(novasTravadas);
    const paredesComodo = (comodos.find((c) => c.nome === moveis[0]?.comodo_nome)?.paredes ?? [{ id: "A" }, { id: "B" }]).map((p) => p.id);
    const prox = paredesComodo.find((w) => !novasTravadas.includes(w));
    setParedeAtiva(prox ?? paredeAtiva);
    setExpandedMovel(null);
    toast.success(`Parede ${paredeAtiva} travada${prox ? ` · agora a parede ${prox}` : " · todas as paredes prontas"}.`);
  };
  // Destrava a parede: reabre para edição e volta os móveis dela para o estado
  // "em edição" (sem parede_id), para poder ajustar e travar de novo.
  const destravarParede = (id: string) => {
    setParedesTravadas((t) => t.filter((w) => w !== id));
    setMoveis((prev) => prev.map((m) => m.parede_id === id ? { ...m, parede_id: undefined } : m));
    setParedeAtiva(id);
    toast(`Parede ${id} destravada — pode ajustar os móveis.`);
  };

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
  const [motorChapas, setMotorChapas] = useState<ChapaCorte[]>([]);
  const [verCorte, setVerCorte] = useState(false);
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
      const chapasAcc: ChapaCorte[] = [];
      for (const c of suportados) {
        const res = await fetch("/api/motor?action=gerar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "gerar",
            // Nº de paredes A–D define o formato da cozinha: 2 → L, 3+ → U
            tipo_layout: (() => {
              const base = COMODO_TO_LAYOUT[c.tipo];
              if (base !== "cozinha_linear") return base;
              const n = (c.paredes ?? []).filter((p) => p.comprimento_cm > 0).length;
              return n >= 3 ? "cozinha_u" : n === 2 ? "cozinha_l" : "cozinha_linear";
            })(),
            // Custos e chapa reais da empresa (herdados de Configurações)
            config_custo: (() => {
              const f = (empresaParams.mao_obra_hora || 45) / 45;
              return {
                ...(Math.abs(f - 1) >= 0.01 ? {
                  valor_hora_corte: 45 * f, valor_hora_bordagem: 40 * f, valor_hora_usinagem: 50 * f,
                  valor_hora_montagem: 55 * f, valor_hora_acabamento: 60 * f, valor_hora_instalacao: 65 * f,
                } : {}),
                preco_chapa_mdf_15: empresaParams.mdf_custo_chapa,
                preco_chapa_mdf_18: Math.round(empresaParams.mdf_custo_chapa * 1.235),
                chapa_largura_mm: empresaParams.chapa_largura_mm,
                chapa_comprimento_mm: empresaParams.chapa_comprimento_mm,
              };
            })(),
            // Paredes A–D (se definidas): a mais longa vira a largura da parede
            // principal, a segunda a profundidade (alimenta layouts em L/U). As
            // aberturas (porta/janela) são mapeadas para os lados do ambiente —
            // o motor bloqueia o segmento e NÃO coloca armário em cima.
            medidas: (() => {
              const lados = ["top", "left", "right", "bottom"] as const;
              const pm = (c.paredes ?? []).filter((p) => p.comprimento_cm > 0).sort((a, b) => b.comprimento_cm - a.comprimento_cm);
              const portaIdx = pm.findIndex((p) => p.porta);
              const janelas = pm.map((p, i) => (p.janela ? lados[Math.min(i, 3)] : null)).filter((x): x is typeof lados[number] => !!x);
              return {
                largura_cm: pm[0]?.comprimento_cm ?? Math.round((c.largura || 4) * 100),
                profundidade_cm: pm[1]?.comprimento_cm ?? Math.round((c.profundidade || 3) * 100),
                altura_cm: Math.round((c.altura || 2.7) * 100),
                ...(portaIdx >= 0 ? { porta_parede: lados[Math.min(portaIdx, 3)] } : {}),
                ...(janelas.length ? { janelas_paredes: janelas } : {}),
              };
            })(),
            preferencias: {
              // sem forçar a parede — o motor escolhe a de maior espaço livre,
              // evitando naturalmente a parede que tem porta.
              cor_mdf_hex: "#D9C7A8",
              ferragem: empresaParams.ferragem_padrao,
              tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica", versao_comercial: "intermediaria",
              // Acabamentos padrão da empresa (rodapé, roda-teto, engrosso)
              acabamentos: { rodape: empresaParams.acab_rodape, roda_teto: empresaParams.acab_roda_teto, engrosso: empresaParams.acab_engrosso },
            },
          }),
        });
        if (!res.ok) throw new Error(`${c.nome}: ${await erroDaResposta(res)}`);
        const data = await res.json() as {
          orcamentos: Record<string, { itens: ItemMotorOrc[]; analise_financeira: { custo_total: number; preco_venda: number; margem_desejada_pct: number } }>;
          plano_corte?: { chapas?: ChapaCorte[] };
        };
        (["economica", "intermediaria", "premium"] as const).forEach((k) => {
          const ov = data.orcamentos[k];
          acc[k].itens.push(...ov.itens.map((it) => ({ ...it, descricao: `${c.nome} — ${it.descricao}` })));
          acc[k].total += ov.analise_financeira.preco_venda;
          acc[k].custo += ov.analise_financeira.custo_total;
          acc[k].margem = ov.analise_financeira.margem_desejada_pct;
        });
        for (const ch of data.plano_corte?.chapas ?? []) chapasAcc.push({ ...ch, comodo: c.nome });
      }
      setMotorVersoes(acc);
      setMotorChapas(chapasAcc);
      toast.success(`${suportados.length} cômodo(s) calculados pelo motor — 3 versões prontas.`);
    } catch (e) {
      toast.error(msgErro(e, "Erro no motor paramétrico"));
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
    // BUG 7: margem_pct é MULTIPLICADOR (venda/custo × 100), não o markup interno
    // do motor. Converte para o multiplicador real (compatível com o input min=100).
    const mult = Math.round((v.total / Math.max(1, v.custo)) * 100);
    setValue("margem_pct", mult);
    setMargemPct(mult);
    setFase("revisar");
    toast.success(`Versão ${k} aplicada (${v.itens.length} itens).`);
  };

  useEffect(() => {
    async function load() {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const eid = (empresa as { id: string }).id;
      setEmpresaId(eid);
      const p = (empresa as { parametros?: Record<string, unknown> }).parametros ?? {};
      setEmpresaParams({
        mdf_custo_chapa: Number(p.mdf_custo_chapa ?? 85),
        mao_obra_hora: Number(p.mao_obra_hora ?? 45),
        chapa_largura_mm: Number(p.chapa_largura_mm ?? 2750),
        chapa_comprimento_mm: Number(p.chapa_comprimento_mm ?? 1830),
        acab_rodape: p.acab_rodape !== false,
        acab_roda_teto: p.acab_roda_teto !== false,
        acab_engrosso: p.acab_engrosso !== false,
        ferragem_padrao: (p.ferragem_padrao as "nacional" | "blum" | "hafele") ?? "nacional",
      });
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

  // Cria um móvel personalizado (do zero) no cômodo — abre já expandido p/ editar.
  const criarMovelCustom = (comodo_nome?: string) => {
    const id = Math.random().toString(36).slice(2);
    const novo: MovelConfig = {
      id, tipo: `custom-${id}`, nome: "Móvel personalizado",
      largura_cm: 100, profundidade_cm: 50, altura_cm: 200,
      portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3,
      tem_fundo: true, comodo_nome,
    };
    setMoveis((prev) => [...prev, novo]);
    setExpandedMovel(id);
    toast.success("Móvel personalizado criado — ajuste as medidas abaixo.");
  };

  // Redimensiona as corridas (inferior/superior/bancada) para PREENCHER a largura
  // real da parede do cômodo, descontando as torres — encaixa sem furos.
  const ajustarAParede = () => {
    const RUN = new Set(["arm-inf", "arm-sup", "bancada"]);
    const TOWER = new Set(["torre", "despenseiro"]);
    let ajustou = 0;
    setMoveis((prev) => {
      // agrupa por cômodo + parede (para respeitar comprimentos A–D diferentes)
      const grupos: Record<string, MovelConfig[]> = {};
      for (const m of prev) (grupos[`${m.comodo_nome ?? "__"}|${m.parede_id ?? ""}`] ??= []).push(m);
      const out: MovelConfig[] = [];
      for (const [key, ms] of Object.entries(grupos)) {
        const [comodoNome, paredeId] = key.split("|");
        const comodo = comodos.find((c) => c.nome === comodoNome);
        const paredeManual = comodo?.paredes?.find((p) => p.id === paredeId && p.comprimento_cm > 0);
        const dim = (comodoNome !== "__" && comodosMedidas[comodoNome]) ? comodosMedidas[comodoNome] : medidas;
        const paredeCm = paredeManual ? paredeManual.comprimento_cm : Math.round((dim?.largura ?? 0) * 100);
        const torresW = ms.filter((m) => TOWER.has(m.tipo)).reduce((s, m) => s + m.largura_cm, 0);
        const runW = paredeCm > 0 ? Math.max(60, paredeCm - torresW) : 0;
        for (const m of ms) {
          if (runW > 0 && RUN.has(m.tipo)) { out.push({ ...m, largura_cm: runW }); ajustou++; }
          else out.push(m);
        }
      }
      return out;
    });
    if (ajustou > 0) toast.success("Móveis ajustados à largura da parede");
    else toast.error("Informe a largura do cômodo primeiro");
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
      if (!res.ok) throw new Error(await erroDaResposta(res));
      const data = await res.json();
      if (!data.itens?.length) throw new Error("A IA não retornou itens.");
      replace(data.itens);
      setValue("cliente_id", clienteId);
      setValue("margem_pct", margemPct);
      if (data.resumo) setValue("observacoes", data.resumo);
      setFase("revisar");
      toast.success(`${data.itens.length} itens calculados pela IA!`);
    } catch (e) {
      toast.error(msgErro(e, "Erro ao calcular orçamento"));
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
      toast.error(msgErro(e, "Erro ao salvar"));
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
        className="relative w-full max-w-[1500px] bg-surface border border-border rounded-lg shadow-xl my-4 min-h-[72vh] flex flex-col"
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
          <div className="p-6 space-y-5 flex-1">
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
                <div className="flex items-center gap-2">
                  {comodos.length > 1 && (
                    <button type="button"
                      onClick={() => setComodosRecolhidos((prev) => prev.size === comodos.length ? new Set() : new Set(comodos.map((c) => c.id)))}
                      className="text-[12px] text-accent hover:underline inline-flex items-center gap-1">
                      {comodosRecolhidos.size === comodos.length
                        ? <><ChevronsUpDown className="size-3.5" /> Expandir todos</>
                        : <><ChevronsDownUp className="size-3.5" /> Recolher todos</>}
                    </button>
                  )}
                  <span className="text-[11px] text-muted-foreground">{comodos.length} cômodo(s)</span>
                </div>
              </div>

              {comodos.length === 0 && (
                <div className="text-[12px] text-muted-foreground bg-surface-2 border border-dashed border-border rounded-md px-3 py-4 text-center">
                  Adicione os cômodos que terão móveis. Cada um pode ter sua própria planta ou medida.
                </div>
              )}

              {comodos.map((c) => {
                const recolhido = comodosRecolhidos.has(c.id);
                return (
                <div key={c.id} className={`rounded-lg border border-border bg-surface-2 ${recolhido ? "p-2" : "p-3 space-y-2.5"}`}>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleRecolher(c.id)}
                      title={recolhido ? "Expandir cômodo" : "Recolher cômodo"}
                      className="shrink-0 size-9 rounded-md border border-border bg-background hover:bg-secondary hover:border-border-strong flex items-center justify-center text-foreground transition-colors">
                      {recolhido ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
                    </button>
                    <input value={c.nome} onChange={(e) => updateComodo(c.id, { nome: e.target.value })}
                      className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-[14px] font-medium outline-none"
                      placeholder="Nome do cômodo" />
                    {recolhido && (
                      <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:inline">
                        {c.plantaB64 ? "planta" : (c.paredes ?? []).filter((p) => p.comprimento_cm > 0).length > 0 ? `${(c.paredes ?? []).filter((p) => p.comprimento_cm > 0).length} parede(s)` : "sem medidas"}
                      </span>
                    )}
                    <span className="text-[12px] px-2 py-1 rounded bg-accent/10 text-accent font-medium shrink-0">{c.tipo}</span>
                    <button type="button" onClick={() => removeComodo(c.id)} title="Remover cômodo"
                      className="shrink-0 size-9 rounded-md border border-transparent hover:border-destructive/40 hover:bg-destructive/5 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"><Trash2 className="size-5" /></button>
                  </div>
                  {!recolhido && (<>

                  {/* Planta do cômodo */}
                  {c.plantaNome ? (
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 text-[13px] text-emerald-700 dark:text-emerald-400">
                      <ImageUp className="size-5 shrink-0" /> <span className="truncate">{c.plantaNome}</span>
                      {c.analisando
                        ? <span className="text-[12px] ml-auto flex items-center gap-1 shrink-0"><Loader2 className="size-4 animate-spin" /> Analisando...</span>
                        : c.plantaInfo
                          ? <span className="text-[12px] ml-auto shrink-0">✓ {(c.plantaInfo.largura_cm / 100).toFixed(1)}×{(c.plantaInfo.profundidade_cm / 100).toFixed(1)}m</span>
                          : null}
                      <button type="button" onClick={() => updateComodo(c.id, { plantaB64: null, plantaNome: null, plantaInfo: null })}
                        className="text-[12px] text-destructive hover:opacity-70 shrink-0 ml-1">remover</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-dashed border-border text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
                      <ImageUp className="size-5 shrink-0" /> Planta deste cômodo <span className="text-muted-foreground/70">(IA extrai as medidas)</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) analisarPlantaComodo(c.id, f); e.target.value = ""; }} />
                    </label>
                  )}

                  {/* Medidas por parede — só se não tiver planta */}
                  {!c.plantaB64 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-medium text-muted-foreground">Tamanho de cada parede (metros)</div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground">Altura (pé-direito)</span>
                            <div className="relative">
                              <input type="number" step="0.01" min="0.1"
                                value={c.altura || ""}
                                onChange={(e) => updateComodo(c.id, { altura: Number(e.target.value) })}
                                className="w-20 h-8 rounded-md border border-border bg-background pl-2.5 pr-6 text-[13px] outline-none" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">m</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => updateComodo(c.id, { usarFoto: !c.usarFoto })}
                            className={`h-9 px-3 rounded-md border text-[13px] inline-flex items-center gap-1.5 transition-colors ${c.usarFoto ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                            <ImageUp className="size-4" /> Medir por foto
                          </button>
                        </div>
                      </div>

                      {!c.usarFoto ? (
                        /* Digitar o tamanho de cada parede (m) */
                        <div className="flex items-center gap-2 flex-wrap">
                          {(c.paredes ?? []).map((p) => (
                            <span key={p.id} className="inline-flex items-center gap-2 h-10 pl-3 pr-2 rounded-md border border-border bg-background text-[13px]">
                              <span className="font-semibold text-foreground">Parede {p.id}</span>
                              <div className="relative">
                                <input type="number" step="0.01" min="0" placeholder="0,00"
                                  value={p.comprimento_cm ? p.comprimento_cm / 100 : ""}
                                  onChange={(e) => updateParede(c.id, p.id, Math.round(Number(e.target.value) * 100))}
                                  className="w-24 h-8 rounded bg-surface-2 border border-border pl-2.5 pr-7 text-[14px] outline-none" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground pointer-events-none">m</span>
                              </div>
                              {(c.paredes?.length ?? 0) > 1 && (
                                <button type="button" onClick={() => removeParede(c.id, p.id)} title="Remover parede"
                                  className="text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
                              )}
                            </span>
                          ))}
                          {(c.paredes?.length ?? 0) < 4 && (
                            <button type="button" onClick={() => addParede(c.id)}
                              className="h-10 px-3.5 rounded-md border border-dashed border-accent/50 text-[13px] text-accent hover:bg-accent/10 inline-flex items-center gap-1.5">
                              <Plus className="size-4" /> Parede {String.fromCharCode(65 + (c.paredes?.length ?? 0))}
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Slots de foto por parede (com folha A4) */
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(["A", "B", "C", "D"] as const).map((pid) => {
                              const parede = (c.paredes ?? []).find((p) => p.id === pid);
                              const analisando = fotoAnalisando === `${c.id}|${pid}`;
                              return (
                                <label key={pid} title="Subir ou tirar foto da parede (com folha A4)"
                                  className={`h-8 px-2.5 rounded-md border text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors ${parede?.comprimento_cm ? "border-accent bg-accent/10 text-accent" : "border-dashed border-border text-muted-foreground hover:bg-secondary"} ${analisando ? "animate-pulse" : ""}`}>
                                  {analisando ? <Loader2 className="size-3.5 animate-spin" /> : <ImageUp className="size-3.5" />}
                                  Parede {pid}{parede?.comprimento_cm ? ` · ${parede.comprimento_cm}cm` : ""}
                                  <input type="file" accept="image/*" capture="environment" className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) analisarFotoParede(c.id, pid, f); e.target.value = ""; }} />
                                </label>
                              );
                            })}
                          </div>
                          <div className="text-[11px] text-muted-foreground">Cole uma folha A4 na parede como referência. É estimativa — confira com trena.</div>
                        </div>
                      )}
                    </div>
                  )}
                  </>)}
                </div>
                );
              })}

              {/* Adicionar cômodo */}
              <div className="flex items-center gap-2">
                <select value={novoComodoTipo} onChange={(e) => setNovoComodoTipo(e.target.value)}
                  className="flex-1 h-11 rounded-md border border-border bg-surface-2 px-3 text-[14px] outline-none text-foreground">
                  <option value="">Escolher tipo de cômodo...</option>
                  {Object.keys(MOVEIS_POR_AMBIENTE).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" onClick={() => addComodo(novoComodoTipo)} disabled={!novoComodoTipo}
                  className="h-11 px-4 rounded-md border border-accent/50 bg-accent/10 text-accent text-[14px] font-medium hover:bg-accent/20 disabled:opacity-40 disabled:bg-transparent disabled:border-border disabled:text-muted-foreground inline-flex items-center gap-1.5">
                  <Plus className="size-4" /> Adicionar
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
                      <Sparkles className="size-4 text-accent" /> Gerar projeto e orçamento (recomendado)
                    </div>
                    <div className="text-[11.5px] text-muted-foreground mt-0.5">
                      Monta a marcenaria sob medida com o padrão da sua empresa e já calcula 3 versões — sem escolher móvel por móvel. Ajuste depois se precisar.
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
                          <div className="text-[11.5px] text-muted-foreground mt-0.5">custo R$ {v.custo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} · {v.itens.length} itens</div>
                          <button type="button" onClick={() => usarVersaoMotor(k)}
                            className={`mt-2 h-7 rounded-md text-[11.5px] font-medium ${k === "intermediaria" ? "bg-accent text-white" : "border border-border hover:bg-secondary"}`}>
                            Usar esta versão
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Plano de corte visualizado — chapa + cada peça */}
                {motorChapas.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-accent/20">
                    <button type="button" onClick={() => setVerCorte((v) => !v)}
                      className="text-[12px] font-medium text-accent inline-flex items-center gap-1.5">
                      <Scissors className="size-3.5" />
                      {verCorte ? "Ocultar" : "Ver"} plano de corte ({motorChapas.length} chapa{motorChapas.length > 1 ? "s" : ""})
                    </button>
                    {verCorte && <div className="mt-2"><CutPlanVisualization chapas={motorChapas} /></div>}
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
                <button type="button" onClick={() => {
                  if (!clienteId) { toast.error("Selecione um cliente antes de preencher manualmente."); return; }
                  setValue("cliente_id", clienteId);
                  setFase("revisar");
                }}
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
          <div className="p-6 space-y-5 flex-1">
            <button type="button" onClick={() => setFase("configurar")}
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              ← Voltar
            </button>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_810px] gap-5 items-start">
              <div className="space-y-4 min-w-0">
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
                  // Aberto se: buscando (mostra resultados) ou o usuário deixou aberto.
                  // NÃO força abrir por ter seleção — senão não dá para recolher.
                  const isOpen = searchMoveis.trim().length > 0 || openAmbientes.has(c.nome);
                  return (
                    <div key={c.id} className="rounded-lg border border-border overflow-hidden">
                      <button type="button" onClick={() => toggleAmbiente(c.nome)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left">
                        <span className="text-[12.5px] font-medium flex items-center gap-2">
                          {c.nome}
                          {c.plantaB64 && <span className="text-[11px] text-emerald-600 dark:text-emerald-400">planta</span>}
                          <span className="text-[11.5px] text-muted-foreground">{c.largura > 0 ? `${c.largura}×${c.profundidade}m` : ""}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {selCount > 0 && (
                            <span className="text-[11.5px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">{selCount} sel.</span>
                          )}
                          {isOpen ? <ChevronUp className="size-4 text-foreground" /> : <ChevronDown className="size-4 text-foreground" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-2.5 py-2">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {filtered.map((template) => {
                              const sel = moveis.find((m) => m.tipo === template.tipo && m.comodo_nome === c.nome);
                              return (
                                <button key={template.tipo} type="button" onClick={() => toggleMovel(template, c.nome)}
                                  className={`flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-md border text-left transition-colors ${sel ? "border-accent bg-accent/10 text-accent font-medium" : "border-border text-foreground hover:bg-secondary"}`}>
                                  <span className={`shrink-0 size-4 rounded border flex items-center justify-center ${sel ? "bg-accent border-accent text-white" : "border-input"}`}>
                                    {sel && <span className="text-[11px] leading-none">✓</span>}
                                  </span>
                                  <span className="truncate">{template.nome}</span>
                                </button>
                              );
                            })}
                            <button type="button" onClick={() => criarMovelCustom(c.nome)}
                              className="flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-md border border-dashed border-accent/50 text-accent hover:bg-accent/10 text-left transition-colors">
                              <Plus className="size-4 shrink-0" />
                              <span className="truncate">Criar móvel</span>
                            </button>
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
                <Label>Configure cada móvel — Parede {paredeAtiva}:</Label>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 -mt-1 mb-1">
                  <Info className="size-3" />
                  Corrediças e dobradiças são calculadas automaticamente com base nas portas
                </div>
                {moveis.filter((m) => (m.parede_id ?? paredeAtiva) === paredeAtiva).map((m) => {
                  const analise = analisarMovel({
                    largura_cm: m.largura_cm, profundidade_cm: m.profundidade_cm, altura_cm: m.altura_cm,
                    portas: m.portas, tipo_porta: m.tipo_porta, gavetas: m.gavetas, prateleiras: m.prateleiras,
                    ambiente: comodos.find((c) => c.nome === m.comodo_nome)?.tipo ?? m.comodo_nome,
                    tem_fundo: m.tem_fundo,
                  });
                  const temAlerta = analise.nivel === "atencao" || analise.nivel === "critico";
                  return (
                  <div key={m.id} className="border border-border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedMovel(expandedMovel === m.id ? null : m.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-2 hover:bg-secondary text-[13px] font-medium text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {temAlerta && (
                          <span className={`size-2 rounded-full shrink-0 ${analise.nivel === "critico" ? "bg-destructive" : "bg-amber-500"}`}
                            title="A análise encontrou pontos de atenção" />
                        )}
                        <span>{m.nome}</span>
                        {m.comodo_nome && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-normal shrink-0">{m.comodo_nome}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground font-normal">
                        <span title="Peso estimado">⚖ {analise.peso_kg}kg</span>
                        <span>{m.largura_cm}×{m.profundidade_cm}×{m.altura_cm}cm</span>
                        {m.portas > 0 && <span>{m.portas} porta{m.portas > 1 ? "s" : ""} ({m.tipo_porta})</span>}
                        {m.gavetas > 0 && <span>{m.gavetas} gav.</span>}
                        {expandedMovel === m.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </div>
                    </button>

                    {expandedMovel === m.id && (() => {
                      // Paredes: da planta (se houver) ou manuais (A–D) do cômodo
                      const movelComodo = comodos.find((cc) => cc.nome === m.comodo_nome);
                      const paredesManuais = (movelComodo?.paredes ?? []).filter((p) => p.comprimento_cm > 0);
                      const wallOptions = (plantaInfo && plantaInfo.paredes.length > 0)
                        ? plantaInfo.paredes.map((p) => ({ id: p.id, label: `Parede ${p.id} — ${p.espaco_util_cm}cm${p.obstaculos ? ` (${p.obstaculos})` : ""}`, espaco: p.espaco_util_cm }))
                        : paredesManuais.map((p) => ({ id: p.id, label: `Parede ${p.id} — ${p.comprimento_cm}cm`, espaco: p.comprimento_cm }));
                      const paredeSel = wallOptions.find((w) => w.id === m.parede_id);
                      const dimSrc = (m.comodo_nome && comodosMedidas[m.comodo_nome]) ? comodosMedidas[m.comodo_nome] : medidas;
                      // Permite o móvel até o tamanho EXATO da parede (sem folga).
                      const limLargura = paredeSel ? paredeSel.espaco
                        : plantaInfo ? Math.max(...plantaInfo.paredes.map((p) => p.espaco_util_cm))
                        : dimSrc.largura > 0 ? Math.round(dimSrc.largura * 100) : null;
                      const limAltura = plantaInfo ? plantaInfo.altura_cm : dimSrc.altura > 0 ? Math.round(dimSrc.altura * 100) : null;
                      const limProfundidade = plantaInfo ? plantaInfo.profundidade_cm : dimSrc.profundidade > 0 ? Math.round(dimSrc.profundidade * 100) : null;

                      const avisos: string[] = [];
                      if (limLargura && m.largura_cm > limLargura) avisos.push(`Largura excede o espaço disponível (${limLargura}cm)`);
                      if (limAltura && m.altura_cm > limAltura) avisos.push(`Altura excede o pé-direito (${limAltura}cm)`);
                      if (limProfundidade && m.profundidade_cm > limProfundidade) avisos.push(`Profundidade excede o ambiente (${limProfundidade}cm)`);
                      if (m.largura_cm > 269) avisos.push(`Largura > 269cm — painéis serão divididos em módulos`);
                      if (m.altura_cm > 269) avisos.push(`Altura > 269cm — laterais serão divididas em módulos`);

                      // `analise` (peso + avisos da base) vem do closure do map.
                      const temMatsEscolhidos = m.mdf_caixa_id || m.mdf_externo_id || m.fundo_id || m.dobradica_id || m.corrediça_porta_id || m.corrediça_gaveta_id || m.puxador_id;
                      const temAvancado = m.formato === "L" || m.pe_madeira || m.tem_roda_teto;

                      return (
                      <div className="px-3 py-3 space-y-3 bg-surface">
                        {/* Nome + parede numa linha */}
                        <div className={`grid gap-2 ${wallOptions.length ? "grid-cols-2" : "grid-cols-1"}`}>
                          <div>
                            <div className="text-[11.5px] text-muted-foreground mb-0.5">Nome no orçamento</div>
                            <input value={m.nome} onChange={(e) => updateMovel(m.id, { nome: e.target.value })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                          {wallOptions.length > 0 && (
                            <div>
                              <div className="text-[11.5px] text-muted-foreground mb-0.5">Parede</div>
                              <select value={m.parede_id ?? ""} onChange={(e) => {
                                const pid = e.target.value;
                                const w = wallOptions.find((x) => x.id === pid);
                                updateMovel(m.id, { parede_id: pid || undefined, ...(w ? { largura_cm: Math.max(10, w.espaco - 15) } : {}) });
                              }} className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none text-foreground">
                                <option value="">— Parede —</option>
                                {wallOptions.map((w) => (
                                  <option key={w.id} value={w.id}>{w.label}</option>
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

                        {/* Análise inteligente (Base de Conhecimento da marcenaria) */}
                        <div className="rounded-md border border-border bg-surface-2/60 p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11.5px] font-medium text-muted-foreground inline-flex items-center gap-1.5">
                              <Sparkles className="size-3.5 text-accent" /> Análise do móvel
                            </span>
                            <span className="text-[11.5px] font-medium text-foreground/80" title="Peso estimado (MDF)">
                              ⚖ ~{analise.peso_kg}kg
                            </span>
                          </div>
                          {analise.achados.map((a, i) => {
                            const cor = a.severidade === "critico" ? "text-destructive" : a.severidade === "atencao" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
                            const dot = a.severidade === "critico" ? "bg-destructive" : a.severidade === "atencao" ? "bg-amber-500" : "bg-sky-500";
                            return (
                              <div key={i} className="flex items-start gap-1.5 text-[11.5px]">
                                <span className={`mt-1 size-1.5 rounded-full shrink-0 ${dot}`} />
                                <span className={cor}><span className="font-medium">{a.titulo}:</span> {a.detalhe}</span>
                              </div>
                            );
                          })}
                          <div className="text-[10px] text-muted-foreground/70 pt-0.5">Regras da base de conhecimento · estimativa auditável</div>
                        </div>

                        {/* Dimensões */}
                        <div>
                          <div className="text-[11.5px] text-muted-foreground mb-0.5">Dimensões (cm)</div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["largura_cm", "profundidade_cm", "altura_cm"] as const).map((dim) => {
                              const lim = dim === "largura_cm" ? limLargura : dim === "altura_cm" ? limAltura : limProfundidade;
                              const excede = lim !== null && m[dim] > lim;
                              const vazio = !m[dim] || m[dim] === 0;
                              return (
                                <div key={dim}>
                                  <div className={`text-[11px] mb-0.5 truncate ${vazio ? "text-destructive" : "text-muted-foreground"}`}>
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
                        {(() => { const soGaveta = m.gavetas > 0 && m.portas === 0; return (
                        <div className="space-y-1.5">
                        <div className="grid grid-cols-4 gap-1.5">
                          <div>
                            <div className="text-[11.5px] text-muted-foreground mb-0.5">Portas</div>
                            <input type="number" min={0} max={20} value={m.portas}
                              onChange={(e) => { const portas = Number(e.target.value); updateMovel(m.id, { portas, ...(portas === 0 && m.gavetas > 0 ? { prateleiras: 0 } : {}) }); }}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                          <div className="col-span-1">
                            <div className="text-[11.5px] text-muted-foreground mb-0.5">Tipo</div>
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
                            <div className="text-[11.5px] text-muted-foreground mb-0.5">Gavetas</div>
                            <input type="number" min={0} max={20} value={m.gavetas}
                              onChange={(e) => { const gavetas = Number(e.target.value); updateMovel(m.id, { gavetas, ...(gavetas > 0 && m.portas === 0 ? { prateleiras: 0 } : {}) }); }}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                          <div>
                            <div className={`text-[11.5px] mb-0.5 ${soGaveta ? "text-muted-foreground/50" : "text-muted-foreground"}`}>Prat.</div>
                            <input type="number" min={0} max={20} value={soGaveta ? 0 : m.prateleiras} disabled={soGaveta}
                              title={soGaveta ? "Gaveteiro (só gavetas) não tem prateleiras" : undefined}
                              onChange={(e) => updateMovel(m.id, { prateleiras: Number(e.target.value) })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none disabled:opacity-40" />
                          </div>
                        </div>
                        {/* Altura da gaveta: fixa (cm) ou automática (divide a altura) */}
                        {m.gavetas > 0 && (
                          <div className="flex items-center gap-2 text-[11.5px]">
                            <span className="text-muted-foreground">Altura da gaveta:</span>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input type="radio" name={`altgav-${m.id}`} checked={m.altura_gaveta_cm == null}
                                onChange={() => updateMovel(m.id, { altura_gaveta_cm: undefined })} />
                              <span>Automática {m.portas === 0 ? "(divide a altura)" : "(16cm)"}</span>
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input type="radio" name={`altgav-${m.id}`} checked={m.altura_gaveta_cm != null}
                                onChange={() => updateMovel(m.id, { altura_gaveta_cm: m.altura_gaveta_cm ?? 16 })} />
                              <span>Fixa</span>
                            </label>
                            {m.altura_gaveta_cm != null && (
                              <div className="relative">
                                <input type="number" min={5} max={60} value={m.altura_gaveta_cm}
                                  onChange={(e) => updateMovel(m.id, { altura_gaveta_cm: Number(e.target.value) })}
                                  className="w-16 h-7 rounded border border-border bg-surface-2 pl-2 pr-6 text-[12px] outline-none" />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">cm</span>
                              </div>
                            )}
                            {m.portas > 0 && <span className="text-muted-foreground/70">· a porta desconta essa altura</span>}
                          </div>
                        )}
                        </div>
                        ); })()}

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
                          // Começa e termina com ripa: W = n·ripa + (n-1)·espaço.
                          // Alvo do espaço ≈ largura da ripa; ajusta n até o espaço
                          // ficar >= 3mm e calcula o espaçamento EXATO para caber.
                          const W = m.largura_cm * 10; // mm
                          let numRipas = Math.max(2, Math.round((W + ripaLarg) / (2 * ripaLarg)));
                          let espacoRipa = numRipas > 1 ? (W - numRipas * ripaLarg) / (numRipas - 1) : 0;
                          while (espacoRipa < 3 && numRipas > 2) { numRipas -= 1; espacoRipa = (W - numRipas * ripaLarg) / (numRipas - 1); }
                          espacoRipa = Math.max(0, Math.round(espacoRipa));
                          return (
                            <div className="pl-1 p-2 rounded-md border border-border bg-secondary/20 space-y-2">
                              <div className="text-[11.5px] text-muted-foreground font-medium">Configuração do ripado</div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <div className="text-[11px] text-muted-foreground mb-0.5">Espessura</div>
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
                                  <div className="text-[11px] text-muted-foreground mb-0.5">Largura da ripa (mm)</div>
                                  <input type="number" min={10} max={200} value={m.ripa_largura_mm ?? 30}
                                    onChange={(e) => updateMovel(m.id, { ripa_largura_mm: Number(e.target.value) })}
                                    className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none" />
                                </div>
                                <div className="flex flex-col justify-end">
                                  <div className="text-[11px] text-muted-foreground mb-0.5">Quantidade</div>
                                  <div className="h-7 flex items-center text-[12px] font-medium text-accent">{numRipas} ripas</div>
                                </div>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Começa e termina com ripa · espaçamento de <span className="text-foreground font-medium">{espacoRipa}mm</span> entre as ripas (calculado para caber exato)
                              </div>
                            </div>
                          );
                        })()}

                        {/* Avançado (formato L, pés madeira, roda-teto) — colapsável */}
                        <details open={temAvancado}>
                          <summary className="text-[11px] text-muted-foreground cursor-pointer select-none hover:text-foreground list-none flex items-center gap-1">
                            <ChevronDown className="size-3" /> Opções avançadas
                            {temAvancado && <span className="text-accent text-[11px]"> • ativo</span>}
                          </summary>
                          <div className="mt-2 space-y-2.5 pl-1">
                            {/* Formato */}
                            <div>
                              <div className="text-[11.5px] text-muted-foreground mb-1">Formato</div>
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
                                  <div className="text-[11px] text-muted-foreground">Braço A (principal): {m.largura_cm}×{m.profundidade_cm}cm — configurado acima</div>
                                  <div className="text-[11px] font-medium text-muted-foreground">Braço B:</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="text-[11px] text-muted-foreground mb-0.5">Largura (cm)</div>
                                      <input type="number" min={10} value={m.arm2_largura_cm ?? 80}
                                        onChange={(e) => updateMovel(m.id, { arm2_largura_cm: Number(e.target.value) })}
                                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none" />
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-muted-foreground mb-0.5">Profundidade (cm)</div>
                                      <input type="number" min={10} value={m.arm2_profundidade_cm ?? m.profundidade_cm}
                                        onChange={(e) => updateMovel(m.id, { arm2_profundidade_cm: Number(e.target.value) })}
                                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Pés de madeira maciça — somam a altura ao móvel e ligam rodapé */}
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input type="checkbox" checked={m.pe_madeira ?? false}
                                onChange={(e) => {
                                  const peAlt = m.pe_altura_cm ?? 15;
                                  if (e.target.checked) {
                                    updateMovel(m.id, { pe_madeira: true, pe_altura_cm: peAlt, tem_rodape: true, altura_cm: m.altura_cm + peAlt });
                                  } else {
                                    updateMovel(m.id, { pe_madeira: false, altura_cm: Math.max(10, m.altura_cm - peAlt) });
                                  }
                                }}
                                className="rounded" />
                              <span className="text-[11.5px]">Pés de madeira maciça <span className="text-muted-foreground/70">(+ altura no móvel)</span></span>
                            </label>
                            {m.pe_madeira && (
                              <div className="w-44 pl-5">
                                <div className="text-[11px] text-muted-foreground mb-0.5">Altura dos pés (cm) · soma na altura</div>
                                <input type="number" min={5} max={100} value={m.pe_altura_cm ?? 15}
                                  onChange={(e) => {
                                    const novo = Number(e.target.value);
                                    const delta = novo - (m.pe_altura_cm ?? 15);
                                    updateMovel(m.id, { pe_altura_cm: novo, altura_cm: Math.max(10, m.altura_cm + delta) });
                                  }}
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
                                <div className="text-[11px] text-muted-foreground mb-0.5">Altura do teto (cm) · móvel = teto−10cm</div>
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
                              ? <span className="text-accent text-[11px]"> • personalizados</span>
                              : <span className="text-[11px] opacity-60"> — IA escolhe automaticamente</span>}
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
                          <div className="text-[11.5px] text-muted-foreground mb-0.5">Detalhes / Extras <span className="opacity-60">(opcional)</span></div>
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
                  );
                })}
              </div>
            )}

              </div>{/* /coluna esquerda */}

              {/* Coluna direita: preview ao lado do card */}
              <div className="lg:sticky lg:top-4">
                {moveis.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wider">Visualização</div>
                      <button type="button" onClick={ajustarAParede}
                        className="h-6 px-2.5 rounded text-[11px] border border-accent/40 text-accent hover:bg-accent/10 transition-colors inline-flex items-center gap-1">
                        <LayoutGrid className="size-3" /> Encaixar na parede
                      </button>
                    </div>
                    <WallVisualization
                      moveis={moveis}
                      plantaInfo={plantaInfo}
                      manualWalls={comodos.find((cc) => cc.nome === moveis[0]?.comodo_nome)?.paredes}
                      medW={(moveis[0]?.comodo_nome && comodosMedidas[moveis[0].comodo_nome]?.largura) || medidas.largura}
                      medH={(moveis[0]?.comodo_nome && comodosMedidas[moveis[0].comodo_nome]?.altura) || medidas.altura}
                      selectedId={expandedMovel}
                      onSelectMovel={(id) => setExpandedMovel(id)}
                      onMoveMovel={(id, x, y) => updateMovel(id, { pos_x_cm: x, pos_y_cm: y })}
                      activeWallProp={paredeAtiva}
                      onSetWall={setParedeAtiva}
                      travadas={paredesTravadas}
                      onTravar={travarParede}
                      onDestravar={destravarParede}
                    />
                  </div>
                ) : (
                  <div className="text-[12px] text-muted-foreground border border-dashed border-border rounded-lg p-10 text-center">
                    Selecione móveis para ver a parede
                  </div>
                )}
              </div>
            </div>{/* /grid duas colunas */}

            {/* Resumo técnico do projeto (Base de Conhecimento) */}
            {moveis.length > 0 && (() => {
              const resumo = resumirProjeto(moveis.map((m) => ({
                largura_cm: m.largura_cm, profundidade_cm: m.profundidade_cm, altura_cm: m.altura_cm,
                portas: m.portas, tipo_porta: m.tipo_porta, gavetas: m.gavetas, prateleiras: m.prateleiras,
                ambiente: comodos.find((c) => c.nome === m.comodo_nome)?.tipo ?? m.comodo_nome,
                tem_fundo: m.tem_fundo,
              })));
              return (
                <div className="rounded-lg border border-border bg-surface-2/50 p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                    <span className="font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Resumo técnico</span>
                    <span title="Peso estimado total (MDF)">⚖ <strong>{resumo.peso_total_kg}kg</strong></span>
                    <span>📦 {resumo.num_moveis} móvel(is)</span>
                    <span title="Maior dimensão de peça">📏 até {resumo.maior_dimensao_cm}cm</span>
                    <span className={resumo.alertas > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {resumo.alertas > 0 ? `⚠ ${resumo.alertas} ponto(s) de atenção` : "✓ sem alertas"}
                    </span>
                  </div>
                  {resumo.notas.map((n, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11.5px] text-muted-foreground">
                      <span className="mt-1 size-1.5 rounded-full shrink-0 bg-sky-500" />
                      <span><span className="font-medium">{n.titulo}:</span> {n.detalhe}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 mt-2 flex items-center justify-between bg-surface/95 backdrop-blur border-t border-border rounded-b-lg z-10">
              <div className="text-[12px] text-muted-foreground">
                {moveis.length === 0 ? "Nenhum móvel selecionado" : `${moveis.length} móvel(is) configurado(s)`}
              </div>
              <button type="button" onClick={handleGerarIA} disabled={aiLoading || moveis.length === 0}
                className="h-10 px-5 rounded-md bg-accent text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2 shadow-lg">
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
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">Cobrado separadamente — não entra na margem</div>
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
                        <div className="text-[11px] text-muted-foreground mt-0.5 px-1 flex items-start gap-0.5">
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
            <div key={n} className="flex items-center gap-1 text-[11px] text-foreground">
              <div className="size-2.5 rounded-sm shrink-0" style={{ backgroundColor: colorMap.get(n) }} />
              {n}
            </div>
          ))}
        </div>
      )}
      {chapas.filter(c => c.layouts?.length).map((c) => (
        <div key={c.material}>
          <div className="text-[11.5px] text-muted-foreground mb-1.5 font-medium">{c.material}</div>
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
      toast.error(msgErro(e, "Erro ao gerar plano de corte"));
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
                                <div className="text-[11.5px] text-muted-foreground mt-0.5 flex items-start gap-0.5">
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
                    {room && <div className="text-[11.5px] text-accent font-medium mb-0.5">{room}</div>}
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
                      <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
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
                            <td className="py-1 px-1 text-muted-foreground text-[11.5px]">{p.material}</td>
                            <td className="py-1 px-1 text-right tabular-nums">{p.largura_mm}</td>
                            <td className="py-1 px-1 text-right tabular-nums">{p.comprimento_mm}</td>
                            <td className="py-1 px-1 text-center">{p.quantidade}</td>
                            <td className="py-1 px-1 text-center text-[11px] font-mono text-muted-foreground">
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
                      <div className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate">{fiscalDados.nfe_chave}</div>
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
                // Ficha técnica (Base de Conhecimento): peso e acesso/transporte.
                const resumoTec = (moveisCfg && moveisCfg.length)
                  ? resumirProjeto(moveisCfg.map((m) => ({
                      largura_cm: m.largura_cm, profundidade_cm: m.profundidade_cm, altura_cm: m.altura_cm,
                      portas: m.portas, tipo_porta: m.tipo_porta, gavetas: m.gavetas, prateleiras: m.prateleiras,
                      tem_fundo: m.tem_fundo,
                    })))
                  : null;
                const fichaHtml = resumoTec ? `
                  <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:28px 0 8px">Ficha técnica</h2>
                  <div style="font-size:12px;color:#333;display:flex;flex-wrap:wrap;gap:18px">
                    <span>Peso estimado: <strong>~${resumoTec.peso_total_kg}kg</strong></span>
                    <span>Móveis: <strong>${resumoTec.num_moveis}</strong></span>
                    <span>Maior peça: <strong>${resumoTec.maior_dimensao_cm}cm</strong></span>
                  </div>
                  ${resumoTec.notas.map((n) => `<div style="font-size:11px;color:#777;margin-top:6px">• ${n.titulo}: ${n.detalhe}</div>`).join("")}
                ` : "";
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
                  ${fichaHtml}
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
      <div className="text-[11.5px] text-muted-foreground mb-0.5">{label}</div>
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
