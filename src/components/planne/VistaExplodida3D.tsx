import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import {
  calcularCenaCompleta,
  type ModuloComPosicao,
  type PecaVisual3D,
} from "@/lib/motor-parametrico/vista-explodida";

function PecaMesh({
  peca,
  explosao,
  corHex,
  selecionada,
  raioX,
  onSelect,
}: {
  peca: PecaVisual3D;
  explosao: number;
  corHex: string;
  selecionada: boolean;
  raioX: boolean;
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
      <meshStandardMaterial
        color={cor}
        roughness={0.6}
        metalness={0.05}
        transparent={raioX}
        opacity={raioX ? (corFrente ? 0.06 : 0.12) : 1}
        depthWrite={!raioX}
      />
      <Edges color={selecionada ? "#1d4ed8" : raioX ? "#1e293b" : "#64748b"} />
    </mesh>
  );
}

/**
 * Visualizador 3D interativo da cena inteira (todos os módulos na parede) —
 * órbita/zoom, Raio-X, ligar/desligar portas e gavetas, clique num módulo
 * pra focar nele e explodir com o slider. Geometria vem de
 * calcularCenaCompleta() — esquemática (caixas), não a chapa real.
 */
export function VistaExplodida3D({
  modulos,
  corHex = "#f2f0eb",
  moduloFocoInicial = null,
}: {
  modulos: ModuloComPosicao[];
  corHex?: string;
  moduloFocoInicial?: number | null;
}) {
  const cena = useMemo(() => calcularCenaCompleta(modulos), [modulos]);
  const [explosao, setExplosao] = useState(moduloFocoInicial !== null ? 0.4 : 0);
  const [focoIndex, setFocoIndex] = useState<number | null>(moduloFocoInicial);
  const [raioX, setRaioX] = useState(false);
  const [mostrarPortas, setMostrarPortas] = useState(true);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  const todasPecas = cena.flatMap((m) => m.pecas);
  const selecionada = todasPecas.find((p) => p.id === selecionadaId) ?? null;

  const larguraTotal = cena.length ? Math.max(...cena.map((m) => m.origemX + m.larguraM)) : 1;
  const alturaTotal = cena.length
    ? Math.max(...modulos.map((m) => m.altura_cm / 100 + (m.posicao_y_cm >= 100 ? 1.5 : 0.1)))
    : 1;
  const alcance = Math.max(larguraTotal, alturaTotal, 1);

  const selecionarPeca = (moduloIndex: number, id: string) => {
    setSelecionadaId(id);
    if (focoIndex !== moduloIndex) {
      setFocoIndex(moduloIndex);
      setExplosao(0.4);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg border border-border overflow-hidden"
        style={{ height: 380, background: raioX ? "#c7ced6" : "#eef1f4" }}
      >
        <Canvas
          camera={{ position: [larguraTotal / 2, alturaTotal * 0.9, alcance * 1.5], fov: 42 }}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[2, 4, 3]} intensity={1.1} />
          <directionalLight position={[-2, 1.5, -2]} intensity={0.35} />
          <group onPointerMissed={() => setSelecionadaId(null)}>
            {cena.map((m) =>
              m.pecas
                .filter((p) => mostrarPortas || (p.tipo !== "porta" && p.tipo !== "gaveta"))
                .map((p) => (
                  <PecaMesh
                    key={p.id}
                    peca={p}
                    explosao={m.moduloIndex === focoIndex ? explosao : 0}
                    corHex={corHex}
                    raioX={raioX}
                    selecionada={p.id === selecionadaId}
                    onSelect={() => selecionarPeca(m.moduloIndex, p.id)}
                  />
                )),
            )}
          </group>
          <OrbitControls makeDefault target={[larguraTotal / 2, alturaTotal / 2, 0]} enablePan />
        </Canvas>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-[11px]">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={raioX}
            onChange={(e) => setRaioX(e.target.checked)}
            className="size-3"
          />
          Raio-X
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarPortas}
            onChange={(e) => setMostrarPortas(e.target.checked)}
            className="size-3"
          />
          Portas e gavetas
        </label>
        {focoIndex !== null && (
          <button
            type="button"
            onClick={() => {
              setFocoIndex(null);
              setExplosao(0);
              setSelecionadaId(null);
            }}
            className="ml-auto text-accent hover:underline"
          >
            Desfocar {cena[focoIndex]?.nome}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground shrink-0">Montado</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(explosao * 100)}
          disabled={focoIndex === null}
          onChange={(e) => setExplosao(Number(e.target.value) / 100)}
          className="flex-1 disabled:opacity-40"
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
        ) : focoIndex === null ? (
          "Clique numa peça pra focar o módulo e explodir."
        ) : (
          "Clique numa peça pra ver o nome e as medidas."
        )}
      </div>
    </div>
  );
}
