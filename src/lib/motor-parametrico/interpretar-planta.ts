/**
 * PLANNE — Motor Paramétrico
 * Fase 7: Leitura de Plantas — Pipeline Unificado
 *
 * interpretarPlanta: ponto de entrada único que aceita diferentes formatos de
 * planta e sempre produz um AmbienteGeometrico do núcleo.
 *
 * Roteamento por formato:
 *   - "dxf":     parser determinístico (geometria CAD exata) — sem IA
 *   - "imagem":  delega à IA Vision (já existente) via PlantaAnalisada
 *   - "pdf":     PDF vetorial pode conter DXF-like; PDF imagem cai na IA
 *   - "manual":  medidas digitadas → criarAmbienteManual
 *
 * A parte determinística (DXF) vive aqui; a parte de IA (imagem) é injetada
 * pelo chamador (endpoint), mantendo este módulo puro e testável.
 */

import type { AmbienteGeometrico, ParedeId } from "./tipos";
import { parseDXF } from "./dxf-parser";
import { dxfParaAmbiente, type ResultadoExtracao } from "./extracao-geometrica";
import { plantaToAmbiente, criarAmbienteManual } from "./ambiente";

// ─── ENTRADA ──────────────────────────────────────────────────────────────────

export type FormatoPlanta = "dxf" | "imagem" | "pdf" | "manual";

/** Saída da IA Vision (compatível com PlantaAnalisada de analisar-planta.ts). */
export interface PlantaAnalisadaIA {
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  porta_principal?: { parede: string; x_pct: number; largura_cm: number };
  portas_secundarias?: { parede: string; x_pct: number; largura_cm: number; descricao?: string }[];
  janelas?: { parede: string; x_pct: number; largura_cm: number; descricao?: string }[];
}

export interface EntradaInterpretacao {
  formato: FormatoPlanta;
  /** Para DXF: o conteúdo de texto do arquivo. */
  dxf_texto?: string;
  /** Para imagem/PDF: a análise já produzida pela IA Vision (injetada pelo endpoint). */
  planta_ia?: PlantaAnalisadaIA;
  /** Para manual: medidas digitadas. */
  medidas?: {
    largura_cm: number;
    profundidade_cm: number;
    altura_cm: number;
    porta_parede?: ParedeId;
    janelas_paredes?: ParedeId[];
  };
  /** Pé-direito a usar quando o formato não informa altura (DXF 2D). */
  altura_padrao_cm?: number;
}

// ─── SAÍDA ────────────────────────────────────────────────────────────────────

export interface ResultadoInterpretacao {
  ambiente: AmbienteGeometrico;
  formato: FormatoPlanta;
  /** 0–1: quão confiável é a reconstrução. */
  confianca: number;
  /** Mensagens de diagnóstico do processo. */
  diagnosticos: string[];
  /** true se a interpretação foi 100% determinística (sem IA). */
  deterministico: boolean;
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Interpreta uma planta em qualquer formato suportado e devolve o
 * AmbienteGeometrico do núcleo, pronto para o motor de layout.
 */
export function interpretarPlanta(entrada: EntradaInterpretacao): ResultadoInterpretacao {
  const altura = entrada.altura_padrao_cm ?? 270;

  switch (entrada.formato) {
    case "dxf": {
      if (!entrada.dxf_texto) {
        return erro("dxf", "Conteúdo DXF não fornecido.");
      }
      const dxf = parseDXF(entrada.dxf_texto);
      const extracao: ResultadoExtracao = dxfParaAmbiente(dxf, altura);
      return {
        ambiente: extracao.ambiente,
        formato: "dxf",
        confianca: extracao.confianca,
        diagnosticos: extracao.diagnosticos,
        deterministico: true,
      };
    }

    case "imagem":
    case "pdf": {
      if (!entrada.planta_ia) {
        return erro(entrada.formato, "Análise de IA não fornecida para imagem/PDF.");
      }
      const ambiente = plantaToAmbiente(entrada.planta_ia);
      // A IA fornece confiança moderada — geometria interpretada, não medida.
      ambiente.fonte = entrada.formato === "pdf" ? "pdf" : "imagem";
      const conf = ambiente.confianca_extracao || 0.7;
      return {
        ambiente,
        formato: entrada.formato,
        confianca: conf,
        diagnosticos: [
          `Planta interpretada por IA Vision (${entrada.formato}).`,
          "Confiança moderada — confirme as dimensões medindo no local.",
        ],
        deterministico: false,
      };
    }

    case "manual": {
      if (!entrada.medidas) {
        return erro("manual", "Medidas não fornecidas.");
      }
      const ambiente = criarAmbienteManual({
        largura_cm: entrada.medidas.largura_cm,
        profundidade_cm: entrada.medidas.profundidade_cm,
        altura_cm: entrada.medidas.altura_cm,
        porta_parede: entrada.medidas.porta_parede,
        janelas_paredes: entrada.medidas.janelas_paredes,
      });
      return {
        ambiente,
        formato: "manual",
        confianca: 1,
        diagnosticos: ["Ambiente criado a partir de medidas digitadas (precisão máxima)."],
        deterministico: true,
      };
    }

    default:
      return erro(entrada.formato, `Formato não suportado: ${entrada.formato}`);
  }
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function erro(formato: FormatoPlanta, mensagem: string): ResultadoInterpretacao {
  return {
    ambiente: criarAmbienteManual({ largura_cm: 0, profundidade_cm: 0, altura_cm: 270 }),
    formato,
    confianca: 0,
    diagnosticos: [mensagem],
    deterministico: false,
  };
}
