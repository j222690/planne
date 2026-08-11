import { useTexture } from "@react-three/drei";
import { RepeatWrapping, type Texture } from "three";
import { useMemo } from "react";

/**
 * Textura de relevo (roughness/normal) de MDF real — CC0, reaproveitada do
 * catálogo de assets do render-worker (`render-worker/assets/textures/
 * madeira/Wood095_1K-JPG_*`, mesma licença já documentada lá), redimensionada
 * pra WebP 512px (~11-13KB cada) em `public/textures/`.
 *
 * Segue o MESMO padrão do render Blender (`scene_from_job.py`): a cor sólida
 * do MDF continua vindo de `color` (não da textura) — só o relevo/rugosidade
 * usa a imagem, senão MDF colorido pareceria madeira crua.
 *
 * `useTexture` cacheia por URL — como várias peças de tamanhos diferentes
 * compartilham a MESMA textura, ajustar `repeat` direto no objeto cacheado
 * afetaria todas de uma vez. Por isso clona por instância (barato: reusa a
 * imagem já carregada, só cria um wrapper novo).
 */
export function useTexturasMdf(largura_m: number, altura_m: number): { roughnessMap: Texture; normalMap: Texture } {
  const base = useTexture({
    roughnessMap: "/textures/mdf-roughness.webp",
    normalMap: "/textures/mdf-normal.webp",
  });

  return useMemo(() => {
    const roughnessMap = base.roughnessMap.clone();
    const normalMap = base.normalMap.clone();
    for (const tex of [roughnessMap, normalMap]) {
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
      tex.repeat.set(Math.max(0.3, largura_m), Math.max(0.3, altura_m));
      tex.needsUpdate = true;
    }
    return { roughnessMap, normalMap };
  }, [base, largura_m, altura_m]);
}
