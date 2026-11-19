// A Vercel, com "type": "module", não inclui no runtime da função:
//   - arquivos api/_*.ts (não viram rota e o file trace não os segue)
//   - imports de uma rota em api/ para outro arquivo (src/ ou api/_calc)
// A função sobe, quebra na carga e QUALQUER método — inclusive GET — responde
// 500 FUNCTION_INVOCATION_FAILED antes do handler. Foi o que aconteceu com
// lista-corte (./_calc), calcular-orcamento (./_calc, ./_regras-base) e agent
// (src/lib/base-conhecimento).
//
// Cada rota vive em src/server/http/ e este script gera um api/*.js autocontido,
// no mesmo esquema do motor. Só o .js fica em api/, então a Vercel não compila
// o .ts quebrado junto. api/webhook-asaas.ts continua fonte direta (público).

import { build } from "esbuild";

const ENTRIES = [
  ["src/server/http/ai.ts", "api/ai.js"],
  ["src/server/http/vision.ts", "api/vision.js"],
  ["src/server/http/analisar-planta.ts", "api/analisar-planta.js"],
  ["src/server/http/pdf-orcamento.ts", "api/pdf-orcamento.js"],
  ["src/server/http/calcular-orcamento.ts", "api/calcular-orcamento.js"],
  ["src/server/http/render.ts", "api/render.js"],
  ["src/server/http/lista-corte.ts", "api/lista-corte.js"],
  ["src/server/http/agent.ts", "api/agent.js"],
  ["src/server/http/fiscal.ts", "api/fiscal.js"],
  ["src/server/http/invite-membro.ts", "api/invite-membro.js"],
];

const externalizarNpm = {
  name: "externalizar-npm",
  setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => {
      if (args.path.startsWith(".") || args.path.startsWith("/") || args.path.startsWith("\0")) {
        return null;
      }
      return { path: args.path, external: true };
    });
  },
};

for (const [entry, outfile] of ENTRIES) {
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    outfile,
    plugins: [externalizarNpm],
    banner: {
      js: "// ARQUIVO GERADO por scripts/bundle-api.mjs — NÃO EDITAR.\n// Edite src/server/http/ e rode npm run build.\n",
    },
    logLevel: "info",
  });
}

console.log("✓ api/*.js gerados a partir de src/server/http/");
