#!/usr/bin/env bash
set -euo pipefail

# Para GitHub Pages, a base precisa ser "/NOME_DO_REPO/"
REPO_NAME="${GITHUB_REPOSITORY##*/}"
BASE="/${REPO_NAME}/"

# Build Vite gerando pasta dist
npx vite build --base="${BASE}" --outDir dist
