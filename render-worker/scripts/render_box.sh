#!/usr/bin/env bash
# Atalho para validar a caixa parametrizada (entrega 3).
# Uso: ./scripts/render_box.sh [largura] [altura] [profundidade] [cor] [saida]
set -euo pipefail

L="${1:-800}"
A="${2:-720}"
P="${3:-550}"
COR="${4:-#EDE7DA}"
OUT="${5:-./caixa.png}"

BLENDER_BIN="${BLENDER_BIN:-blender}"

"$BLENDER_BIN" --background --python "$(dirname "$0")/../blender/box_demo.py" -- \
  --largura "$L" --altura "$A" --profundidade "$P" --espessura 15 \
  --cor "$COR" --out "$OUT"

echo "OK → $OUT"
