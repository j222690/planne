import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import {
  calcularVistaExplodida,
  type ModuloParaVista3D,
  type PecaVisual3D,
} from "@/lib/motor-parametrico/vista-explodida";

function PecaMesh({
  peca,
  explosao,
  corHex,
  selecionada,
  onSelect,
}: {
  peca: PecaVisual3D;
  explosao: number;
  corHex: string;
  selecionada: boolean;
  onSelect: () => void;
}) {
  const pos: [number, number, number] = [
    peca.posicao[0] + peca.direcaoExplosao[0] * peca.distanciaExplosao * explosao,
    peca.posicao[1] + peca.direcaoExplosao[1] * peca.distanciaExplosao * explosao,
    peca.posicao[2] + peca.direcaoExplosao[2] * peca.distanciaExplosao * explosao,
  ];
  const corFrente = peca.tipo === "porta" || peca.tipo === "gaveta";
  const cor = selecionada ? "#3b82f6" : corFrente ? corHex : "#f2f0eb";
  return (
    <mesh
      position={pos}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <boxGeometry args={peca.tamanho} />
      <meshStandardMaterial color={cor} roughness={0.6} metalness={0.05} />
      <Edges color={selecionada ? "#1d4ed8" : "#00000033"} />
    </mesh>
  );
}

/**
 * Visualizador 3D interativo do módulo — órbita/zoom + slider de explosão
 * (0% montado → 100% peças separadas) + clique na peça mostra nome/medidas.
 * Geometria vem de calcularVistaExplodida() — esquemática, não a chapa real.
 */
export function VistaExplodida3D({
  modulo,
  corHex = "#f2f0eb",
}: {
  modulo: ModuloParaVista3D;
  corHex?: string;
}) {
  const pecas = useMemo(() => calcularVistaExplodida(modulo), [modulo]);
  const [explosao, setExplosao] = useState(0.4);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const selecionada = pecas.find((p) => p.id === selecionadaId) ?? null;
  const altura = modulo.altura_cm / 100;

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg border border-border overflow-hidden"
        style={{ height: 340, background: "#eef1f4" }}
      >
        <Canvas camera={{ position: [altura * 1.7, altura * 1.15, altura * 2.3], fov: 40 }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[2, 4, 3]} intensity={1.1} />
          <directionalLight position={[-2, 1.5, -2]} intensity={0.35} />
          <group onPointerMissed={() => setSelecionadaId(null)}>
            {pecas.map((p) => (
              <PecaMesh
                key={p.id}
                peca={p}
                explosao={explosao}
                corHex={corHex}
                selecionada={p.id === selecionadaId}
                onSelect={() => setSelecionadaId(p.id)}
              />
            ))}
          </group>
          <OrbitControls makeDefault target={[0, altura / 2, 0]} enablePan={false} />
        </Canvas>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground shrink-0">Montado</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(explosao * 100)}
          onChange={(e) => setExplosao(Number(e.target.value) / 100)}
          className="flex-1"
          aria-label="Nível de explosão"
        />
        <span className="text-[11px] text-muted-foreground shrink-0">Explodido</span>
      </div>
      <div className="text-[11.5px] text-muted-foreground bg-secondary/40 rounded px-2.5 py-1.5 min-h-[30px]">
        {selecionada ? (
          <>
            <strong className="text-foreground">{selecionada.nome}</strong> —{" "}
            {selecionada.larguraMm}×{selecionada.comprimentoMm}mm
          </>
        ) : (
          "Clique numa peça pra ver o nome e as medidas."
        )}
      </div>
    </div>
  );
}
