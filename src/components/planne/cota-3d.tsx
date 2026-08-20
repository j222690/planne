import { Line, Html } from "@react-three/drei";

export interface Cota3D {
  id: string;
  p1: [number, number, number];
  p2: [number, number, number];
}

function distanciaCm(p1: [number, number, number], p2: [number, number, number]): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 100);
}

/** Linha de cota manual — 2 pontos em coordenada de mundo (congelados no
 * clique) + rótulo com a distância euclidiana em cm no meio. */
export function CotaLinha3D({ cota, onRemover }: { cota: Cota3D; onRemover: (id: string) => void }) {
  const meio: [number, number, number] = [
    (cota.p1[0] + cota.p2[0]) / 2,
    (cota.p1[1] + cota.p2[1]) / 2,
    (cota.p1[2] + cota.p2[2]) / 2,
  ];
  return (
    <group>
      <Line points={[cota.p1, cota.p2]} color="#f59e0b" lineWidth={2} />
      <Html position={meio} center distanceFactor={8} occlude={false}>
        <div className="flex items-center gap-1 rounded bg-amber-500 text-white text-[11px] font-medium px-1.5 py-0.5 whitespace-nowrap shadow pointer-events-auto select-none">
          <span>{distanciaCm(cota.p1, cota.p2)}cm</span>
          <button
            type="button"
            onClick={() => onRemover(cota.id)}
            className="hover:opacity-70 leading-none"
            title="Remover cota"
          >
            ×
          </button>
        </div>
      </Html>
    </group>
  );
}

/** Marcador do 1º ponto já clicado, enquanto espera o 2º clique. */
export function MarcadorPontoCota({ ponto }: { ponto: [number, number, number] }) {
  return (
    <mesh position={ponto}>
      <sphereGeometry args={[0.02, 12, 12]} />
      <meshBasicMaterial color="#f59e0b" />
    </mesh>
  );
}
