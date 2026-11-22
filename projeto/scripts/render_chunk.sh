#!/bin/bash
# Renderiza um trecho. Uso: bash render_chunk.sh COMPOSICAO INICIO FIM SAIDA.mp4
# Cada comando tem limite de 300 s: use trechos de ~170 frames (cenas pesadas) ou ~200 (leves).
cd /tmp/remo
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
timeout 280 npx remotion render src/index.ts "$1" "$4" --frames="$2-$3" --browser-executable=$B --gl=swangle 2>&1 | grep -E "^\+|rror" | tail -1
