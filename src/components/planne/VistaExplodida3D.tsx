import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import { Camera, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
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
 * Visualizador 3D interativo da cena inteira (todos os módulos, em quantas
 * paredes o ambiente tiver — L/U inclusive) — órbita/zoom, Raio-X,
 * ligar/desligar portas e gavetas, clique num módulo pra focar nele e
 * explodir com o slider. Geometria vem de calcularCenaCompleta() —
 * esquemática (caixas), não a chapa real. Cada módulo é um <group> próprio
 * (posição + rotação da parede) — a rotação em si fica por conta do
 * Three.js, as peças internas continuam em coordenadas locais.
 */
export function VistaExplodida3D({
  modulos,
  medidas,
  corHex = "#f2f0eb",
  moduloFocoInicial = null,
}: {
  modulos: ModuloComPosicao[];
  /** Dimensões do ambiente (cm) — necessário quando há paredes "bottom"/"right". */
  medidas?: { largura_cm: number; profundidade_cm: number };
  corHex?: string;
  moduloFocoInicial?: number | null;
}) {
  const cena = useMemo(() => calcularCenaCompleta(modulos, medidas), [modulos, medidas]);
  const [explosao, setExplosao] = useState(moduloFocoInicial !== null ? 0.4 : 0);
  const [focoIndex, setFocoIndex] = useState<number | null>(moduloFocoInicial);
  const [raioX, setRaioX] = useState(false);
  const [mostrarPortas, setMostrarPortas] = useState(true);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [arvoreAberta, setArvoreAberta] = useState(false);
  const glRef = useRef<HTMLCanvasElement | null>(null);

  const todasPecas = cena.flatMap((m) => m.pecas);
  const selecionada = todasPecas.find((p) => p.id === selecionadaId) ?? null;

  // Enquadramento da câmera: usa as dimensões do ambiente quando disponíveis
  // (cobre L/U corretamente); sem elas, estima pela extensão dos grupos.
  const larguraAmb = medidas ? medidas.largura_cm / 100 : undefined;
  const profundidadeAmb = medidas ? medidas.profundidade_cm / 100 : undefined;
  const centrosX = cena.map((m) => m.grupoPosicao[0]);
  const centrosZ = cena.map((m) => m.grupoPosicao[2]);
  const alturasM = modulos.map((m) => m.altura_cm / 100 + (m.posicao_y_cm >= 100 ? 1.5 : 0.1));
  const larguraTotal =
    larguraAmb ?? (centrosX.length ? Math.max(...centrosX) - Math.min(...centrosX) + 1 : 3);
  const profundidadeTotal =
    profundidadeAmb ?? (centrosZ.length ? Math.max(...centrosZ) - Math.min(...centrosZ) + 1 : 3);
  const alturaTotal = alturasM.length ? Math.max(...alturasM) : 1;
  const alcance = Math.max(larguraTotal, profundidadeTotal, alturaTotal, 1);
  const centroX =
    larguraAmb !== undefined
      ? larguraAmb / 2
      : centrosX.length
        ? (Math.max(...centrosX) + Math.min(...centrosX)) / 2
        : 0;
  const centroZ =
    profundidadeAmb !== undefined
      ? profundidadeAmb / 2
      : centrosZ.length
        ? (Math.max(...centrosZ) + Math.min(...centrosZ)) / 2
        : 0;

  const selecionarPeca = (moduloIndex: number, id: string) => {
    setSelecionadaId(id);
    if (focoIndex !== moduloIndex) {
      setFocoIndex(moduloIndex);
      setExplosao(0.4);
    }
  };

  const tirarFoto = () => {
    if (!glRef.current) return;
    const url = glRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "vista-explodida.png";
    a.click();
  };

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg border border-border overflow-hidden"
        style={{ height: 380, background: raioX ? "#c7ced6" : "#eef1f4" }}
      >
        <Canvas
          camera={{
            position: [centroX + alcance * 0.9, alturaTotal * 1.1, centroZ + alcance * 1.3],
            fov: 42,
          }}
          gl={{ preserveDrawingBuffer: true }}
          onCreated={(state) => {
            glRef.current = state.gl.domElement;
          }}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[2, 4, 3]} intensity={1.1} />
          <directionalLight position={[-2, 1.5, -2]} intensity={0.35} />
          <group onPointerMissed={() => setSelecionadaId(null)}>
            {cena.map((m) => (
              <group
                key={m.moduloIndex}
                position={m.grupoPosicao}
                rotation={[0, m.grupoRotacaoY, 0]}
              >
                {m.pecas
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
                  ))}
              </group>
            ))}
          </group>
          <OrbitControls makeDefault target={[centroX, alturaTotal / 2, centroZ]} enablePan />
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
        <button
          type="button"
          onClick={tirarFoto}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <Camera className="size-3" /> Tirar Foto
        </button>
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

      <div className="rounded-md border border-border">
        <button
          type="button"
          onClick={() => setArvoreAberta((v) => !v)}
          className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium"
        >
          {arvoreAberta ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRightIcon className="size-3.5" />
          )}
          Árvore de peças ({todasPecas.length})
        </button>
        {arvoreAberta && (
          <div className="px-2.5 pb-2 space-y-1.5 max-h-40 overflow-auto">
            {cena.map((m) => (
              <div key={m.moduloIndex}>
                <button
                  type="button"
                  onClick={() => {
                    setFocoIndex(m.moduloIndex);
                    setExplosao(0.4);
                    setSelecionadaId(null);
                  }}
                  className={`text-[11px] font-medium ${m.moduloIndex === focoIndex ? "text-accent" : "text-foreground"}`}
                >
                  {m.nome}
                </button>
                <div className="pl-3 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {m.pecas.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => selecionarPeca(m.moduloIndex, p.id)}
                      className={`text-[10.5px] hover:underline ${p.id === selecionadaId ? "text-accent font-medium" : "text-muted-foreground"}`}
                    >
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
