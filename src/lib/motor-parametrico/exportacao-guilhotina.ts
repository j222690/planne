/**
 * PLANNE — Motor Paramétrico
 * Exportação da sequência de corte guilhotina (operador / seccionadora manual)
 *
 * Formato genérico, legível por qualquer operador ou seccionadora reta —
 * NÃO é o formato binário/proprietário .AC da Giben (nem XML da INMES, nem
 * SCM Cyflex). Esses formatos de máquina específicos têm especificação
 * difícil de obter com precisão sem um arquivo de exemplo real da máquina
 * (confirmado por relatos de fornecedores de software de corte que também
 * têm dificuldade — ver memória da sessão); gerar um arquivo "no escuro"
 * arriscaria produzir um corte errado numa chapa real. Este exportador cobre
 * o que dá pra garantir sem esse arquivo: a SEQUÊNCIA de cortes retos, que
 * qualquer serra reta (incluindo Giben) consegue executar manualmente.
 */

import type { ChapaAlocada } from "./tipos";
import type { CorteGuilhotina } from "./nesting-guilhotina";

/**
 * Gera um texto (CSV com `;`) descrevendo, chapa por chapa, a sequência de
 * cortes retos a executar — cada linha é UM corte de ponta a ponta.
 */
export function gerarSequenciaCorteTexto(
  chapas: ChapaAlocada[],
  cortesPorChapa: Record<string, CorteGuilhotina[]>,
): string {
  const linhas: string[] = [
    "Chapa;Material;Corte Nº;Eixo;Posição (mm);Retângulo cortado (LxA mm, x,y)",
  ];

  chapas.forEach((chapa) => {
    const cortes = cortesPorChapa[chapa.id] ?? [];
    cortes.forEach((c) => {
      const eixoLabel = c.eixo === "vertical" ? "Vertical (guilhotina)" : "Horizontal (transversal)";
      const retangulo = `${Math.round(c.sobre.w)}x${Math.round(c.sobre.h)} @ (${Math.round(c.sobre.x)},${Math.round(c.sobre.y)})`;
      linhas.push(
        [
          chapa.numero_sequencial,
          chapa.material.nome_display,
          c.ordem + 1,
          eixoLabel,
          Math.round(c.posicao_mm),
          retangulo,
        ].join(";"),
      );
    });
  });

  return linhas.join("\n");
}

/**
 * Checklist legível por humano, uma chapa por bloco — pra imprimir e levar
 * até a serra (não precisa de leitor de arquivo).
 */
export function gerarSequenciaCorteChecklist(
  chapas: ChapaAlocada[],
  cortesPorChapa: Record<string, CorteGuilhotina[]>,
): string {
  const blocos: string[] = [];

  chapas.forEach((chapa) => {
    const cortes = cortesPorChapa[chapa.id] ?? [];
    const linhas = [
      `CHAPA ${chapa.numero_sequencial} — ${chapa.material.nome_display} (${chapa.largura_mm}×${chapa.comprimento_mm}mm)`,
      `${cortes.length} corte(s) reto(s) em sequência:`,
      ...cortes.map((c, i) => {
        const dir = c.eixo === "vertical" ? "corte VERTICAL (de cima a baixo)" : "corte HORIZONTAL (de lado a lado)";
        return `  ${i + 1}. ${dir} a ${Math.round(c.posicao_mm)}mm, no pedaço de ${Math.round(c.sobre.w)}×${Math.round(c.sobre.h)}mm`;
      }),
    ];
    blocos.push(linhas.join("\n"));
  });

  return blocos.join("\n\n");
}
