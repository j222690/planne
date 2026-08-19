import { useEffect, useRef } from "react";
import { PerspectiveCamera, OrthographicCamera, OrbitControls } from "@react-three/drei";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- three-stdlib não exporta o tipo do ref do jeito que o drei espera; mesmo padrão de escape hatch já usado no projeto pra libs externas.
type OrbitControlsImpl = any;

/**
 * Câmera + controles compartilhados pelos dois visualizadores 3D — ângulos
 * nomeados (front/back/left/right/top) e ortográfica/perspectiva. Fase 4 do
 * plano do motor 3D paramétrico: mesmo mecanismo em EditorAmbiente3D e
 * VistaExplodida3D, sem duplicar a lógica de enquadramento.
 */
export type VistaCamera = "livre" | "frente" | "fundo" | "esquerda" | "direita" | "topo";

export const VISTAS_NOMEADAS: { valor: VistaCamera; label: string }[] = [
  { valor: "livre", label: "3/4" },
  { valor: "frente", label: "Frente" },
  { valor: "fundo", label: "Fundo" },
  { valor: "esquerda", label: "Esquerda" },
  { valor: "direita", label: "Direita" },
  { valor: "topo", label: "Topo" },
];

export interface BBoxCena {
  centroX: number;
  centroZ: number;
  larguraM: number;
  profundidadeM: number;
  alturaM: number;
}

/** Posição de câmera + alvo pra um ângulo nomeado, a partir do bounding box da cena. */
export function calcularAnguloCamera(
  vista: VistaCamera,
  bbox: BBoxCena,
): { position: [number, number, number]; target: [number, number, number] } {
  const { centroX, centroZ, larguraM, profundidadeM, alturaM } = bbox;
  const alcance = Math.max(larguraM, profundidadeM, alturaM, 1);
  const target: [number, number, number] = [centroX, alturaM / 2, centroZ];
  const dist = alcance * 1.8 + 1;
  switch (vista) {
    case "frente":
      return { position: [centroX, alturaM / 2, centroZ + dist], target };
    case "fundo":
      return { position: [centroX, alturaM / 2, centroZ - dist], target };
    case "esquerda":
      return { position: [centroX - dist, alturaM / 2, centroZ], target };
    case "direita":
      return { position: [centroX + dist, alturaM / 2, centroZ], target };
    case "topo":
      // pequeno offset em Z pra OrbitControls não perder a referência de "up" quando a câmera fica exatamente no zênite.
      return { position: [centroX, dist * 1.3, centroZ + 0.01], target };
    default:
      return {
        position: [centroX + alcance * 0.9, alturaM * 1.1, centroZ + alcance * 1.3],
        target,
      };
  }
}

/**
 * Monta a câmera (ortho ou perspectiva) + OrbitControls, reposicionando
 * imperativamente quando `vista` muda (o prop `camera` do <Canvas> só vale
 * pra montagem inicial — trocar de ângulo depois exige mexer direto no
 * objeto three.js via o ref do OrbitControls).
 */
export function CameraControlada({
  vista,
  ortho,
  bbox,
  enabled = true,
}: {
  vista: VistaCamera;
  ortho: boolean;
  bbox: BBoxCena;
  enabled?: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { position, target } = calcularAnguloCamera(vista, bbox);
  const alcance = Math.max(bbox.larguraM, bbox.profundidadeM, bbox.alturaM, 1);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...position);
    controls.target.set(...target);
    controls.update();
    // Reposiciona só quando o ângulo/projeção mudam — não a cada render (senão o usuário
    // nunca conseguiria orbitar livremente, a câmera voltaria pro ângulo fixo toda hora).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, ortho]);

  return (
    <>
      {ortho ? (
        <OrthographicCamera
          makeDefault
          position={position}
          zoom={85 / alcance}
          near={0.01}
          far={200}
        />
      ) : (
        <PerspectiveCamera makeDefault position={position} fov={42} near={0.01} far={200} />
      )}
      <OrbitControls ref={controlsRef} makeDefault enabled={enabled} target={target} enablePan />
    </>
  );
}
