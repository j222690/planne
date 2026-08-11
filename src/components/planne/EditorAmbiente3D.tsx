import { useMemo, useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Edges, Environment } from "@react-three/drei";
import { Search, Trash2, RotateCw, Waves, X, Loader2 } from "lucide-react";
import {
  calcularCenaCompleta,
  type ModuloComPosicao,
} from "@/lib/motor-parametrico/vista-explodida";
import { listarTodosOsModulos } from "@/lib/motor-parametrico/editor-manual";
import { useTexturasMdf } from "./texturas-mdf";
import {
  moverModuloNaParede,
  moverModuloIlha,
  proximaPosicaoLivreNaParede,
} from "@/lib/motor-parametrico/editor-colisao";
import type {
  ModuloParametrico,
  ParedeId,
  ConfiguracaoModulo,
  CategoriaAmbiente,
} from "@/lib/motor-parametrico/tipos";

const PROXIMA_PAREDE: Record<ParedeId, ParedeId> = {
  top: "right",
  right: "bottom",
  bottom: "left",
  left: "top",
};
const NOME_PAREDE: Record<ParedeId, string> = {
  top: "Fundo",
  bottom: "Frente",
  left: "Esquerda",
  right: "Direita",
};

const TIPOS_PORTA_EDITAVEIS: { valor: ConfiguracaoModulo["tipo_porta"]; label: string }[] = [
  { valor: "dobradica", label: "Dobradiça" },
  { valor: "correr", label: "Correr" },
  { valor: "veneziana", label: "Veneziana" },
  { valor: "aluminio_vidro", label: "Alumínio/vidro" },
  { valor: "provencal", label: "Provençal" },
  { valor: "palha", label: "Palha" },
];

export interface PlacementPayload {
  template_codigo: string;
  posicao_x_cm: number;
  posicao_y_cm: number;
  parede: ParedeId;
  largura_cm?: number;
  eh_ilha?: boolean;
  tipo_porta?: ConfiguracaoModulo["tipo_porta"];
}

interface PlacementLocal {
  uid: string;
  template: ModuloParametrico;
  posicao_x_cm: number;
  posicao_y_cm: number;
  parede: ParedeId;
  largura_cm: number;
  ehIlha: boolean;
  tipoPorta?: ConfiguracaoModulo["tipo_porta"];
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Um placement local → forma que calcularCenaCompleta entende (pra reusar o mesmo cálculo de posição/rotação do visualizador read-only). */
function paraModuloComPosicao(p: PlacementLocal): ModuloComPosicao {
  return {
    largura_cm: p.largura_cm,
    altura_cm: p.template.altura.padrao_cm,
    profundidade_cm: p.template.profundidade.padrao_cm,
    configuracao: p.template.configuracao_padrao,
    posicao_x_cm: p.posicao_x_cm,
    posicao_y_cm: p.posicao_y_cm,
    parede: p.parede,
    eh_ilha: p.ehIlha,
    nome_display: p.template.nome,
  };
}

function ModuloBox({
  placement,
  grupoPosicao,
  grupoRotacaoY,
  corHex,
  selecionado,
  onSelecionar,
  onPointerDownModulo,
}: {
  placement: PlacementLocal;
  grupoPosicao: [number, number, number];
  grupoRotacaoY: number;
  corHex: string;
  selecionado: boolean;
  onSelecionar: () => void;
  onPointerDownModulo: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const L = placement.largura_cm / 100;
  const A = placement.template.altura.padrao_cm / 100;
  const P = placement.template.profundidade.padrao_cm / 100;
  // Textura só no estado normal — selecionado usa azul chapado (mais claro
  // de ver qual módulo está ativo do que um MDF "azul" texturizado).
  const { roughnessMap, normalMap } = useTexturasMdf(L, A);
  return (
    <group position={grupoPosicao} rotation={[0, grupoRotacaoY, 0]}>
      <mesh
        position={[0, A / 2, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelecionar();
          onPointerDownModulo(e);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <boxGeometry args={[L, A, P]} />
        {selecionado ? (
          <meshStandardMaterial color="#3b82f6" roughness={0.6} metalness={0.05} />
        ) : (
          <meshStandardMaterial
            color={corHex}
            roughness={0.8}
            metalness={0.02}
            roughnessMap={roughnessMap}
            normalMap={normalMap}
            transparent
            opacity={0.92}
          />
        )}
        <Edges color={selecionado ? "#1d4ed8" : "#64748b"} />
      </mesh>
    </group>
  );
}

/**
 * Editor 3D de ambiente — arrastar/soltar módulos livremente numa cena 3D.
 * Módulo preso à parede: arrasto 1 eixo (ao longo da parede). Módulo "ilha":
 * arrasto livre X/profundidade no chão. Lógica de posição/colisão pura em
 * editor-colisao.ts (testada isoladamente); aqui só R3F + estado da UI.
 * Ao gerar, produz o MESMO payload que o motor consome pra qualquer projeto
 * (modulos_manuais em /api/motor?action=gerar) — reusa 100% do pipeline de
 * orçamento/corte/PCP já existente.
 */
export function EditorAmbiente3D({
  ambiente,
  corMdfHex = "#D9C7A8",
  categoriaInicial,
  onGerar,
  gerando = false,
  onClose,
}: {
  ambiente: { largura_cm: number; profundidade_cm: number; altura_cm: number };
  corMdfHex?: string;
  categoriaInicial?: CategoriaAmbiente;
  onGerar: (placements: PlacementPayload[]) => void;
  gerando?: boolean;
  onClose: () => void;
}) {
  const [placements, setPlacements] = useState<PlacementLocal[]>([]);
  const [selecionadoUid, setSelecionadoUid] = useState<string | null>(null);
  const [arrastandoUid, setArrastandoUid] = useState<string | null>(null);
  const [orbitAtivo, setOrbitAtivo] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<CategoriaAmbiente | "todas">(
    categoriaInicial ?? "todas",
  );

  const catalogo = useMemo(() => {
    const todos = listarTodosOsModulos(categoria === "todas" ? undefined : categoria);
    const q = busca.trim().toLowerCase();
    return q ? todos.filter((m) => m.nome.toLowerCase().includes(q)) : todos;
  }, [categoria, busca]);

  const cena = useMemo(
    () => calcularCenaCompleta(placements.map(paraModuloComPosicao), ambiente),
    [placements, ambiente],
  );

  const selecionado = placements.find((p) => p.uid === selecionadoUid) ?? null;

  const adicionarModulo = (template: ModuloParametrico) => {
    const parede: ParedeId = "top";
    const largura_cm = template.largura.padrao_cm;
    const existentesNaParede = placements
      .filter((p) => !p.ehIlha && p.parede === parede)
      .map((p) => ({ id: p.uid, posicao_x_cm: p.posicao_x_cm, largura_cm: p.largura_cm }));
    const posicao_x_cm = proximaPosicaoLivreNaParede(
      largura_cm,
      parede,
      ambiente,
      existentesNaParede,
    );
    const novo: PlacementLocal = {
      uid: uid(),
      template,
      posicao_x_cm,
      posicao_y_cm: 0,
      parede,
      largura_cm,
      ehIlha: false,
    };
    setPlacements((prev) => [...prev, novo]);
    setSelecionadoUid(novo.uid);
  };

  const atualizar = useCallback((alvoUid: string, patch: Partial<PlacementLocal>) => {
    setPlacements((prev) => prev.map((p) => (p.uid === alvoUid ? { ...p, ...patch } : p)));
  }, []);

  const excluirSelecionado = () => {
    if (!selecionadoUid) return;
    setPlacements((prev) => prev.filter((p) => p.uid !== selecionadoUid));
    setSelecionadoUid(null);
  };

  const alternarIlha = () => {
    if (!selecionado) return;
    if (selecionado.ehIlha) {
      // Ilha → parede: volta pra "top", encontra o próximo espaço livre.
      const outros = placements
        .filter((p) => !p.ehIlha && p.parede === "top" && p.uid !== selecionado.uid)
        .map((p) => ({ id: p.uid, posicao_x_cm: p.posicao_x_cm, largura_cm: p.largura_cm }));
      const posicao_x_cm = proximaPosicaoLivreNaParede(
        selecionado.largura_cm,
        "top",
        ambiente,
        outros,
      );
      atualizar(selecionado.uid, { ehIlha: false, parede: "top", posicao_x_cm, posicao_y_cm: 0 });
    } else {
      // Parede → ilha: centraliza no cômodo.
      const posicao_x_cm = Math.max(0, (ambiente.largura_cm - selecionado.largura_cm) / 2);
      const posicao_y_cm = Math.max(
        0,
        (ambiente.profundidade_cm - selecionado.template.profundidade.padrao_cm) / 2,
      );
      atualizar(selecionado.uid, { ehIlha: true, posicao_x_cm, posicao_y_cm });
    }
  };

  const girarParede = () => {
    if (!selecionado || selecionado.ehIlha) return;
    const novaParede = PROXIMA_PAREDE[selecionado.parede];
    const outros = placements
      .filter((p) => !p.ehIlha && p.parede === novaParede && p.uid !== selecionado.uid)
      .map((p) => ({ id: p.uid, posicao_x_cm: p.posicao_x_cm, largura_cm: p.largura_cm }));
    const posicao_x_cm = proximaPosicaoLivreNaParede(
      selecionado.largura_cm,
      novaParede,
      ambiente,
      outros,
    );
    atualizar(selecionado.uid, { parede: novaParede, posicao_x_cm });
  };

  // ─── Arraste (raycast no plano do chão) ────────────────────────────────────
  const onGroundPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!arrastandoUid) return;
    const alvo = placements.find((p) => p.uid === arrastandoUid);
    if (!alvo) return;
    const worldX_cm = e.point.x * 100;
    const worldZ_cm = e.point.z * 100;

    if (alvo.ehIlha) {
      const L = alvo.largura_cm;
      const P = alvo.template.profundidade.padrao_cm;
      const outros = placements
        .filter((p) => p.ehIlha && p.uid !== alvo.uid)
        .map((p) => ({
          id: p.uid,
          posicao_x_cm: p.posicao_x_cm,
          posicao_y_cm: p.posicao_y_cm,
          largura_cm: p.largura_cm,
          profundidade_cm: p.template.profundidade.padrao_cm,
        }));
      const resultado = moverModuloIlha(
        {
          id: alvo.uid,
          posicao_x_cm: alvo.posicao_x_cm,
          posicao_y_cm: alvo.posicao_y_cm,
          largura_cm: L,
          profundidade_cm: P,
        },
        { x: worldX_cm - L / 2, z: worldZ_cm - P / 2 },
        ambiente,
        outros,
      );
      atualizar(alvo.uid, {
        posicao_x_cm: resultado.posicao_x_cm,
        posicao_y_cm: resultado.posicao_y_cm,
      });
    } else {
      const eixoMundo = alvo.parede === "left" || alvo.parede === "right" ? worldZ_cm : worldX_cm;
      const desejado = eixoMundo - alvo.largura_cm / 2;
      const outros = placements
        .filter((p) => !p.ehIlha && p.parede === alvo.parede && p.uid !== alvo.uid)
        .map((p) => ({ id: p.uid, posicao_x_cm: p.posicao_x_cm, largura_cm: p.largura_cm }));
      const novaX = moverModuloNaParede(
        { id: alvo.uid, posicao_x_cm: alvo.posicao_x_cm, largura_cm: alvo.largura_cm },
        desejado,
        alvo.parede,
        ambiente,
        outros,
      );
      atualizar(alvo.uid, { posicao_x_cm: novaX });
    }
  };

  const encerrarArraste = () => {
    setArrastandoUid(null);
    setOrbitAtivo(true);
  };

  const gerarOrcamento = () => {
    const payload: PlacementPayload[] = placements.map((p) => ({
      template_codigo: p.template.codigo,
      posicao_x_cm: p.posicao_x_cm,
      posicao_y_cm: p.posicao_y_cm,
      parede: p.parede,
      largura_cm: p.largura_cm,
      eh_ilha: p.ehIlha,
      tipo_porta: p.tipoPorta,
    }));
    onGerar(payload);
  };

  const larguraM = ambiente.largura_cm / 100;
  const profundidadeM = ambiente.profundidade_cm / 100;

  return (
    <div className="fixed inset-0 z-[70] flex bg-background">
      {/* Catálogo */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col">
        <div className="p-2.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">Editor 3D</span>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar módulo..."
              className="w-full h-8 pl-7 pr-2 rounded-md border border-border bg-surface-2 text-[12px] outline-none focus:border-border-strong"
            />
          </div>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaAmbiente | "todas")}
            className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] outline-none"
          >
            <option value="todas">Todas categorias</option>
            <option value="cozinha">Cozinha</option>
            <option value="quarto">Quarto</option>
            <option value="closet">Closet</option>
            <option value="sala">Sala</option>
            <option value="escritorio">Escritório</option>
            <option value="banheiro">Banheiro</option>
            <option value="lavanderia">Lavanderia</option>
          </select>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {catalogo.map((m) => (
            <button
              key={m.codigo}
              type="button"
              onClick={() => adicionarModulo(m)}
              className="w-full text-left px-2.5 py-2 rounded-md border border-border hover:border-accent hover:bg-accent/5 text-[12px]"
            >
              <div className="font-medium">{m.nome}</div>
              <div className="text-[10.5px] text-muted-foreground">
                {m.largura.padrao_cm}×{m.altura.padrao_cm}×{m.profundidade.padrao_cm}cm
              </div>
            </button>
          ))}
          {catalogo.length === 0 && (
            <div className="text-[11.5px] text-muted-foreground text-center py-6">
              Nenhum módulo encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Cena 3D */}
      <div className="flex-1 relative">
        <Canvas
          camera={{
            position: [
              larguraM * 0.7,
              Math.max(larguraM, profundidadeM) * 0.9,
              profundidadeM * 1.4 + 2,
            ],
            fov: 45,
          }}
          onPointerUp={encerrarArraste}
          onPointerLeave={encerrarArraste}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 3]} intensity={1.1} />
          <directionalLight position={[-3, 2, -3]} intensity={0.35} />

          {/* Chão — também é o plano de raycast do arraste */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[larguraM / 2, 0, profundidadeM / 2]}
            onPointerMove={onGroundPointerMove}
            onPointerMissed={() => setSelecionadoUid(null)}
          >
            <planeGeometry args={[Math.max(larguraM, 1) + 4, Math.max(profundidadeM, 1) + 4]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          <Grid
            position={[larguraM / 2, 0.001, profundidadeM / 2]}
            args={[larguraM, profundidadeM]}
            cellSize={0.5}
            sectionSize={1}
            fadeDistance={30}
            cellColor="#c7ced6"
            sectionColor="#94a3b8"
          />

          {/* Contorno das paredes — caixa invisível fina, só as arestas aparecem */}
          <mesh position={[larguraM / 2, 0.01, profundidadeM / 2]}>
            <boxGeometry args={[larguraM, 0.02, profundidadeM]} />
            <meshBasicMaterial visible={false} />
            <Edges color="#334155" />
          </mesh>

          {/* Suspense: useTexture (MDF) e Environment carregam de forma
              assíncrona — sem isso o R3F derruba a montagem da cena. */}
          <Suspense fallback={null}>
            <Environment preset="apartment" />
            {cena.map((m, i) => (
              <ModuloBox
                key={placements[i].uid}
                placement={placements[i]}
                grupoPosicao={m.grupoPosicao}
                grupoRotacaoY={m.grupoRotacaoY}
                corHex={corMdfHex}
                selecionado={placements[i].uid === selecionadoUid}
                onSelecionar={() => setSelecionadoUid(placements[i].uid)}
                onPointerDownModulo={() => {
                  setArrastandoUid(placements[i].uid);
                  setOrbitAtivo(false);
                }}
              />
            ))}
          </Suspense>

          <OrbitControls
            makeDefault
            enabled={orbitAtivo}
            target={[larguraM / 2, 0.6, profundidadeM / 2]}
          />
        </Canvas>

        {/* Toolbar do módulo selecionado */}
        {selecionado && (
          <div className="absolute top-3 left-3 bg-surface border border-border rounded-lg shadow-lg p-3 space-y-2 w-64">
            <div className="text-[12.5px] font-semibold">{selecionado.template.nome}</div>
            <div>
              <div className="text-[10.5px] text-muted-foreground mb-0.5">Largura (cm)</div>
              <input
                type="number"
                value={selecionado.largura_cm}
                min={selecionado.template.largura.min_cm}
                max={selecionado.template.largura.max_cm}
                step={selecionado.template.largura.passo_cm}
                onChange={(e) => atualizar(selecionado.uid, { largura_cm: Number(e.target.value) })}
                className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none"
              />
            </div>
            {selecionado.template.configuracao_padrao.num_portas > 0 && (
              <div>
                <div className="text-[10.5px] text-muted-foreground mb-0.5">Tipo de porta</div>
                <select
                  value={selecionado.tipoPorta ?? ""}
                  onChange={(e) =>
                    atualizar(selecionado.uid, {
                      tipoPorta: (e.target.value || undefined) as
                        | ConfiguracaoModulo["tipo_porta"]
                        | undefined,
                    })
                  }
                  className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none"
                >
                  <option value="">Padrão do módulo</option>
                  {TIPOS_PORTA_EDITAVEIS.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-1">
              {!selecionado.ehIlha && (
                <button
                  type="button"
                  onClick={girarParede}
                  title="Girar pra próxima parede"
                  className="h-7 px-2 rounded border border-border text-[11px] hover:bg-secondary inline-flex items-center gap-1"
                >
                  <RotateCw className="size-3" /> {NOME_PAREDE[selecionado.parede]}
                </button>
              )}
              <button
                type="button"
                onClick={alternarIlha}
                title="Alternar preso à parede / solto (ilha)"
                className={`h-7 px-2 rounded border text-[11px] inline-flex items-center gap-1 ${selecionado.ehIlha ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-secondary"}`}
              >
                <Waves className="size-3" /> Ilha
              </button>
              <button
                type="button"
                onClick={excluirSelecionado}
                title="Excluir módulo"
                className="h-7 px-2 rounded border border-destructive/40 text-destructive text-[11px] hover:bg-destructive/10 ml-auto inline-flex items-center gap-1"
              >
                <Trash2 className="size-3" /> Excluir
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 text-[11px] text-muted-foreground bg-surface/90 border border-border rounded px-2 py-1">
          {placements.length} módulo(s) · clique num módulo do catálogo pra adicionar, arraste na
          cena pra posicionar
        </div>

        <button
          type="button"
          disabled={gerando || placements.length === 0}
          onClick={gerarOrcamento}
          className="absolute bottom-3 right-3 h-10 px-4 rounded-md bg-accent text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {gerando && <Loader2 className="size-3.5 animate-spin" />}
          {gerando ? "Gerando…" : "Gerar orçamento"}
        </button>
      </div>
    </div>
  );
}
