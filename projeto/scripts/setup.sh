#!/bin/bash
# Restaura o ambiente de produção (rodar 1 vez por conversa, leva uns 3 minutos).
# Uso: bash setup.sh   (dentro do clone do repositório videos-canal)
set -e
REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p /tmp/remo && cp -r "$REPO_DIR/projeto/src" "$REPO_DIR/projeto/package.json" /tmp/remo/
cp -r "$REPO_DIR/projeto/scripts" /tmp/remo/
cd /tmp/remo
npm install --no-audit --no-fund react@18 react-dom@18 remotion @remotion/cli @remotion/three three@0.170 @react-three/fiber@8 >/dev/null 2>&1
pip install piper-tts soundfile --break-system-packages -q 2>&1 | tail -1
mkdir -p /tmp/sh && cd /tmp/sh
[ -d vits-piper-pt_BR-faber-medium ] || { curl -sSL -o faber.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-faber-medium.tar.bz2 && tar xjf faber.tar.bz2; }
echo "ambiente pronto"
