// Bundla a lógica do motor paramétrico num único arquivo serverless autocontido.
//
// Motivo: o projeto usa "type": "module" e o Vercel não bundla imports de
// api/ → src/ (deixa-os como imports ESM que não resolvem em runtime). Arquivos
// com prefixo "_" em api/ também não vão para o runtime. Solução: pré-bundlar
// src/server/motor-entry.ts (que importa todo o motor) num api/motor.js
// autocontido, que o Vercel deploya como a função /api/motor.

import { build } from "esbuild";

await build({
  entryPoints: ["src/server/motor-entry.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "api/motor.js",
  // @vercel/node fornece apenas tipos (apagados na transpilação) — não bundlar.
  external: ["@vercel/node"],
  banner: { js: "// ARQUIVO GERADO por scripts/bundle-motor.mjs — NÃO EDITAR.\n// Edite src/server/motor-entry.ts e os módulos do motor; rode npm run build." },
  logLevel: "info",
});

console.log("✓ api/motor.js gerado (motor paramétrico bundlado)");
