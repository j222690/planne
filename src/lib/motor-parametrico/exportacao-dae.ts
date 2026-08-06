/**
 * PLANNE — Motor Paramétrico
 * Exportação DAE (COLLADA 1.4.1) — abre no SketchUp, Blender, etc.
 *
 * Reaproveita a MESMA geometria esquemática do visualizador 3D interativo
 * (calcularCenaCompleta, ver vista-explodida.ts) — caixas por peça (laterais,
 * base, teto, fundo, portas, gavetas, prateleiras), já posicionadas no mundo
 * por módulo/parede. Não é a chapa real de corte (isso é o CSV/DXF/Giben);
 * é um modelo de referência pra visualizar o projeto em 3D fora do Planne.
 *
 * A malha da caixa é definida UMA vez (cubo unitário centrado na origem) e
 * reaproveitada por <instance_geometry> em cada peça — mesmo padrão que
 * qualquer exportador COLLADA real usa pra não duplicar dados de malha.
 * Estrutura verificada contra um .dae de referência real (garykac/3d-cubes)
 * pra garantir vértices/normais/triângulos topologicamente corretos.
 */

import { calcularCenaCompleta } from "./vista-explodida";
import type { ModuloComPosicao } from "./vista-explodida";

export interface ModuloParaDAE extends ModuloComPosicao {
  /** Cor do MDF do corpo (hex) — usada como material de todas as peças do módulo. */
  cor_hex?: string;
}

const COR_PADRAO = "#D9C7A8";

function hexParaRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const h = m ? m[1] : "D9C7A8";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Cubo unitário (aresta 1, centrado na origem) — mesma topologia a-h de um .dae de referência real, só recentrada de [0,1] pra [-0.5,0.5]. */
const CUBO_POSICOES = [
  "-0.5 -0.5 -0.5 -0.5 -0.5 -0.5 -0.5 -0.5 -0.5", // a
  "-0.5 0.5 -0.5 -0.5 0.5 -0.5 -0.5 0.5 -0.5", // b
  "0.5 0.5 -0.5 0.5 0.5 -0.5 0.5 0.5 -0.5", // c
  "0.5 -0.5 -0.5 0.5 -0.5 -0.5 0.5 -0.5 -0.5", // d
  "-0.5 -0.5 0.5 -0.5 -0.5 0.5 -0.5 -0.5 0.5", // e
  "-0.5 0.5 0.5 -0.5 0.5 0.5 -0.5 0.5 0.5", // f
  "0.5 0.5 0.5 0.5 0.5 0.5 0.5 0.5 0.5", // g
  "0.5 -0.5 0.5 0.5 -0.5 0.5 0.5 -0.5 0.5", // h
].join(" ");

const CUBO_NORMAIS = [
  "-1 0 0 0 -1 0 0 0 -1", // a
  "-1 0 0 0 1 0 0 0 -1", // b
  "1 0 0 0 1 0 0 0 -1", // c
  "1 0 0 0 -1 0 0 0 -1", // d
  "-1 0 0 0 -1 0 0 0 1", // e
  "-1 0 0 0 1 0 0 0 1", // f
  "1 0 0 0 1 0 0 0 1", // g
  "1 0 0 0 -1 0 0 0 1", // h
].join(" ");

const CUBO_TRIANGULOS = [
  "6 18 21 6 21 9", // face 1
  "0 12 15 0 15 3", // face 2
  "19 7 4 19 4 16", // face 3
  "10 22 13 10 13 1", // face 4
  "23 20 17 23 17 14", // face 5
  "8 11 2 8 2 5", // face 6
].join(" ");

function blocoGeometriaCubo(): string {
  return `  <library_geometries>
    <geometry id="box" name="Box">
      <mesh>
        <source id="box-positions">
          <float_array id="box-positions-array" count="72">${CUBO_POSICOES}</float_array>
          <technique_common>
            <accessor source="#box-positions-array" count="24" stride="3">
              <param name="X" type="float"/>
              <param name="Y" type="float"/>
              <param name="Z" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <source id="box-normals">
          <float_array id="box-normals-array" count="72">${CUBO_NORMAIS}</float_array>
          <technique_common>
            <accessor source="#box-normals-array" count="24" stride="3">
              <param name="X" type="float"/>
              <param name="Y" type="float"/>
              <param name="Z" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <vertices id="box-vertices">
          <input semantic="POSITION" source="#box-positions"/>
        </vertices>
        <triangles count="12">
          <input semantic="VERTEX" offset="0" source="#box-vertices"/>
          <input semantic="NORMAL" offset="0" source="#box-normals"/>
          <p>${CUBO_TRIANGULOS}</p>
        </triangles>
      </mesh>
    </geometry>
  </library_geometries>`;
}

function idMaterial(hex: string): string {
  return `mat_${hex.replace("#", "").toUpperCase()}`;
}

function blocoMateriais(coresHex: string[]): { effects: string; materials: string } {
  const effects = coresHex
    .map((hex) => {
      const [r, g, b] = hexParaRgb01(hex);
      const id = idMaterial(hex);
      return `    <effect id="${id}-effect">
      <profile_COMMON>
        <technique sid="common">
          <lambert>
            <diffuse><color>${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} 1</color></diffuse>
          </lambert>
        </technique>
      </profile_COMMON>
    </effect>`;
    })
    .join("\n");
  const materials = coresHex
    .map((hex) => {
      const id = idMaterial(hex);
      return `    <material id="${id}" name="${id}"><instance_effect url="#${id}-effect"/></material>`;
    })
    .join("\n");
  return {
    effects: `  <library_effects>\n${effects}\n  </library_effects>`,
    materials: `  <library_materials>\n${materials}\n  </library_materials>`,
  };
}

function grausDe(rad: number): number {
  return Math.round(((rad * 180) / Math.PI) * 1000) / 1000;
}

/**
 * Gera o documento COLLADA (.dae) completo a partir dos módulos posicionados
 * (mesma entrada de calcularCenaCompleta) — 1 nó por módulo (translate+rotate
 * na parede) contendo 1 nó por peça (translate+scale, reaproveitando a
 * geometria compartilhada do cubo unitário).
 */
export function gerarDAE(
  modulos: ModuloParaDAE[],
  medidas?: { largura_cm: number; profundidade_cm: number },
  nomeProjeto = "Projeto Planne",
): string {
  const cena = calcularCenaCompleta(modulos, medidas);
  const coresHex = [...new Set(modulos.map((m) => (m.cor_hex ?? COR_PADRAO).toUpperCase()))];
  if (coresHex.length === 0) coresHex.push(COR_PADRAO);
  const { effects, materials } = blocoMateriais(coresHex);

  const nos = cena
    .map((moduloNaCena, i) => {
      const corModulo = (modulos[i]?.cor_hex ?? COR_PADRAO).toUpperCase();
      const matId = idMaterial(corModulo);
      const [px, py, pz] = moduloNaCena.grupoPosicao;
      const anguloGraus = grausDe(moduloNaCena.grupoRotacaoY);

      const nosPecas = moduloNaCena.pecas
        .map((p) => {
          const [lx, ly, lz] = p.posicao;
          const [sx, sy, sz] = p.tamanho;
          return `      <node id="${p.id}" name="${escaparXml(p.nome)}">
        <translate>${lx.toFixed(5)} ${ly.toFixed(5)} ${lz.toFixed(5)}</translate>
        <scale>${sx.toFixed(5)} ${sy.toFixed(5)} ${sz.toFixed(5)}</scale>
        <instance_geometry url="#box">
          <bind_material>
            <technique_common>
              <instance_material symbol="boxMaterial" target="#${matId}"/>
            </technique_common>
          </bind_material>
        </instance_geometry>
      </node>`;
        })
        .join("\n");

      return `    <node id="modulo_${i}" name="${escaparXml(moduloNaCena.nome)}">
      <translate>${px.toFixed(5)} ${py.toFixed(5)} ${pz.toFixed(5)}</translate>
      <rotate>0 1 0 ${anguloGraus}</rotate>
${nosPecas}
    </node>`;
    })
    .join("\n");

  const agora = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">
  <asset>
    <contributor>
      <authoring_tool>Planne — Motor Paramétrico</authoring_tool>
    </contributor>
    <created>${agora}</created>
    <modified>${agora}</modified>
    <unit name="meter" meter="1"/>
    <up_axis>Y_UP</up_axis>
  </asset>
${effects}
${materials}
${blocoGeometriaCubo()}
  <library_visual_scenes>
    <visual_scene id="cena" name="${escaparXml(nomeProjeto)}">
${nos}
    </visual_scene>
  </library_visual_scenes>
  <scene>
    <instance_visual_scene url="#cena"/>
  </scene>
</COLLADA>
`;
}
