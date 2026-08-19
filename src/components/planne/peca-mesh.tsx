import type { ThreeEvent } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import type { PecaVisual3D } from "@/lib/motor-parametrico/vista-explodida";
import { useTexturasMdf } from "./texturas-mdf";

/**
 * Mesh de uma peça esquemática (lateral/base/teto/fundo/porta/gaveta/
 * prateleira) — extraído de VistaExplodida3D pra ser reaproveitado também no
 * Editor de arrastar (EditorAmbiente3D), Fase 2 do plano do motor 3D
 * paramétrico: mesma seleção peça-a-peça nos dois lugares, um só componente.
 */
export function PecaMesh({
  peca,
  explosao = 0,
  corHex,
  selecionada,
  raioX = false,
  destaque = false,
  onSelect,
  onPointerDownPeca,
}: {
  peca: PecaVisual3D;
  explosao?: number;
  corHex: string;
  selecionada: boolean;
  raioX?: boolean;
  destaque?: boolean;
  onSelect: () => void;
  /**
   * Opcional — usado pelo Editor de arrastar pra iniciar o drag do módulo
   * inteiro no pointerdown (sem interferir no click, que seleciona a peça).
   * VistaExplodida3D não passa isso (não tem drag).
   */
  onPointerDownPeca?: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const pos: [number, number, number] = [
    peca.posicao[0] + peca.direcaoExplosao[0] * peca.distanciaExplosao * explosao,
    peca.posicao[1] + peca.direcaoExplosao[1] * peca.distanciaExplosao * explosao,
    peca.posicao[2] + peca.direcaoExplosao[2] * peca.distanciaExplosao * explosao,
  ];
  const corFrente = peca.tipo === "porta" || peca.tipo === "gaveta";
  const cor = selecionada ? "#3b82f6" : destaque ? "#f59e0b" : corFrente ? corHex : "#f2f0eb";
  // Textura de MDF só no estado "normal" — raio-x fica quase transparente
  // (textura seria desperdiçada) e seleção/destaque usam cor chapada de propósito.
  const usaTextura = !selecionada && !destaque && !raioX;
  const { roughnessMap, normalMap } = useTexturasMdf(peca.tamanho[0], peca.tamanho[1]);
  return (
    <mesh
      position={pos}
      onPointerDown={onPointerDownPeca}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <boxGeometry args={peca.tamanho} />
      <meshStandardMaterial
        color={cor}
        roughness={0.6}
        metalness={0.05}
        roughnessMap={usaTextura ? roughnessMap : undefined}
        normalMap={usaTextura ? normalMap : undefined}
        transparent={raioX}
        opacity={raioX ? (corFrente ? 0.06 : 0.12) : 1}
        depthWrite={!raioX}
      />
      <Edges
        color={selecionada ? "#1d4ed8" : destaque ? "#b45309" : raioX ? "#1e293b" : "#64748b"}
      />
    </mesh>
  );
}
