import { useMemo, useRef, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  Camera,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  ListChecks,
  Printer,
} from "lucide-react";
import {
  calcularCenaCompleta,
  calcularPassosMontagem,
  type ModuloComPosicao,
} from "@/lib/motor-parametrico/vista-explodida";
import { PecaMesh } from "./peca-mesh";
import { CameraControlada, VISTAS_NOMEADAS, type VistaCamera } from "./camera-controles";

function imprimirManual(nomeModulo: string, passos: ReturnType<typeof calcularPassosMontagem>) {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Manual de montagem — ${nomeModulo}</title>
<style>
  body{font-family:sans-serif;max-width:640px;margin:32px auto;padding:0 16px;color:#111}
  h1{font-size:18px;margin-bottom:2px}
  .sub{color:#666;font-size:12.5px;margin-bottom:24px}
  .passo{border:1px solid #ddd;border-radius:8px;padding:14px 16px;margin-bottom:12px;page-break-inside:avoid}
  .passo h2{font-size:14px;margin:0 0 8px;display:flex;align-items:center;gap:8px}
  .n{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#111;color:#fff;font-size:12px;flex-shrink:0}
  .ferragens{font-size:12.5px;color:#444;margin:0;padding-left:18px}
  .sem-ferragem{font-size:12px;color:#999;font-style:italic}
  .no-print{margin-bottom:20px}
  @media print{.no-print{display:none}}
</style></head><body>
<div class="no-print"><button onclick="window.print()" style="padding:8px 20px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">Imprimir</button></div>
<h1>Manual de montagem</h1>
<div class="sub">${nomeModulo} · ${passos.length} passo(s)</div>
${passos
  .map(
    (p, i) => `
  <div class="passo">
    <h2><span class="n">${i + 1}</span> ${p.titulo}</h2>
    ${
      p.ferragens.length
        ? `<ul class="ferragens">${p.ferragens.map((f) => `<li>${f.quantidade}× ${f.tipo}</li>`).join("")}</ul>`
        : `<div class="sem-ferragem">Sem ferragem nesta etapa.</div>`
    }
  </div>`,
  )
  .join("")}
</body></html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

/**
 * Visualizador 3D interativo da cena inteira (todos os módulos, em quantas
 * paredes o ambiente tiver — L/U inclusive) — órbita/zoom, Raio-X,
 * ligar/desligar portas e gavetas, clique num módulo pra focar nele e
 * explodir com o slider, árvore de peças, Tirar Foto e Manual de montagem
 * (passo a passo, com a ferragem de cada etapa). Geometria vem de
 * calcularCenaCompleta() — esquemática (caixas), não a chapa real.
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
  const [modoManual, setModoManual] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);
  const [vista, setVista] = useState<VistaCamera>("livre");
  const [modoTecnico, setModoTecnico] = useState(false);
  const glRef = useRef<HTMLCanvasElement | null>(null);

  const todasPecas = cena.flatMap((m) => m.pecas);
  const selecionada = todasPecas.find((p) => p.id === selecionadaId) ?? null;

  const moduloFoco = focoIndex !== null ? modulos[focoIndex] : null;
  const passos = useMemo(
    () => (moduloFoco ? calcularPassosMontagem(moduloFoco.configuracao, moduloFoco.ferragens) : []),
    [moduloFoco],
  );
  const passoAtualSeguro = Math.min(passoAtual, Math.max(0, passos.length - 1));
  const tiposInstalados = new Set(passos.slice(0, passoAtualSeguro + 1).flatMap((p) => p.tipos));
  const tiposDoPassoAtual = new Set(passos[passoAtualSeguro]?.tipos ?? []);

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
      setModoManual(false);
    }
  };

  const ligarManual = () => {
    if (focoIndex === null) return;
    setModoManual(true);
    setPassoAtual(0);
    setSelecionadaId(null);
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
          gl={{ preserveDrawingBuffer: true }}
          onCreated={(state) => {
            glRef.current = state.gl.domElement;
          }}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[2, 4, 3]} intensity={1.1} />
          <directionalLight position={[-2, 1.5, -2]} intensity={0.35} />
          {/* Suspense: useTexture (MDF) e Environment carregam de forma
              assíncrona — sem isso o R3F derruba a montagem da cena. Sem
              Environment no raio-x — o contraste ali já foi ajustado à mão
              (ver memória do projeto) e reflexo ambiente atrapalharia. */}
          <Suspense fallback={null}>
            {!raioX && <Environment preset="apartment" />}
            <group onPointerMissed={() => setSelecionadaId(null)}>
              {cena.map((m) => (
                <group
                  key={m.moduloIndex}
                  position={m.grupoPosicao}
                  rotation={[0, m.grupoRotacaoY, 0]}
                >
                  {m.pecas
                    .filter((p) => mostrarPortas || (p.tipo !== "porta" && p.tipo !== "gaveta"))
                    .filter(
                      (p) =>
                        !(modoManual && m.moduloIndex === focoIndex) || tiposInstalados.has(p.tipo),
                    )
                    .map((p) => (
                      <PecaMesh
                        key={p.id}
                        peca={p}
                        explosao={modoManual ? 0 : m.moduloIndex === focoIndex ? explosao : 0}
                        corHex={corHex}
                        raioX={raioX}
                        semTextura={modoTecnico}
                        destaque={
                          modoManual && m.moduloIndex === focoIndex && tiposDoPassoAtual.has(p.tipo)
                        }
                        selecionada={p.id === selecionadaId}
                        onSelect={() => selecionarPeca(m.moduloIndex, p.id)}
                      />
                    ))}
                </group>
              ))}
            </group>
          </Suspense>
          <CameraControlada
            vista={vista}
            ortho={modoTecnico}
            bbox={{ centroX, centroZ, larguraM: larguraTotal, profundidadeM: profundidadeTotal, alturaM: alturaTotal }}
          />
        </Canvas>
      </div>

      <div className="flex items-center gap-1 flex-wrap text-[11px]">
        {VISTAS_NOMEADAS.map((v) => (
          <button
            key={v.valor}
            type="button"
            onClick={() => setVista(v.valor)}
            className={`h-6 px-2 rounded border text-[10.5px] ${
              vista === v.valor
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {v.label}
          </button>
        ))}
        <label className="flex items-center gap-1.5 cursor-pointer select-none ml-1">
          <input
            type="checkbox"
            checked={modoTecnico}
            onChange={(e) => setModoTecnico(e.target.checked)}
            className="size-3"
          />
          Modo técnico
        </label>
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
        {focoIndex !== null && !modoManual && (
          <button
            type="button"
            onClick={ligarManual}
            className="text-accent hover:underline inline-flex items-center gap-1"
          >
            <ListChecks className="size-3" /> Manual de montagem
          </button>
        )}
        {focoIndex !== null && (
          <button
            type="button"
            onClick={() => {
              setFocoIndex(null);
              setExplosao(0);
              setSelecionadaId(null);
              setModoManual(false);
            }}
            className="ml-auto text-accent hover:underline"
          >
            Desfocar {cena[focoIndex]?.nome}
          </button>
        )}
      </div>

      {modoManual && moduloFoco ? (
        <div className="rounded-md border border-accent/40 bg-accent/5 p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold">
              Passo {passoAtualSeguro + 1} de {passos.length} — {passos[passoAtualSeguro]?.titulo}
            </span>
            <button
              type="button"
              onClick={() => imprimirManual(moduloFoco.nome_display ?? "Módulo", passos)}
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Printer className="size-3" /> Imprimir
            </button>
          </div>
          {passos[passoAtualSeguro]?.ferragens.length ? (
            <ul className="text-[11.5px] text-muted-foreground list-disc pl-4 space-y-0.5">
              {passos[passoAtualSeguro].ferragens.map((f, i) => (
                <li key={i}>
                  {f.quantidade}× {f.tipo}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[11px] text-muted-foreground italic">
              Sem ferragem nesta etapa.
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={passoAtualSeguro === 0}
              onClick={() => setPassoAtual((p) => Math.max(0, p - 1))}
              className="h-7 px-3 rounded border border-border text-[11.5px] disabled:opacity-40 hover:bg-secondary"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={passoAtualSeguro >= passos.length - 1}
              onClick={() => setPassoAtual((p) => Math.min(passos.length - 1, p + 1))}
              className="h-7 px-3 rounded bg-accent text-white text-[11.5px] disabled:opacity-40"
            >
              Próximo
            </button>
            <button
              type="button"
              onClick={() => setModoManual(false)}
              className="ml-auto text-[11px] text-muted-foreground hover:text-foreground"
            >
              Sair do manual
            </button>
          </div>
        </div>
      ) : (
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
      )}

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
                    setModoManual(false);
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
