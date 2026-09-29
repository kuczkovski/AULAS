#!/usr/bin/env bash
# Monta o site estático das aulas em _site/:
#   /            página inicial
#   /fracoes/    explorador de frações
#   /treino/     PWA Treino Full Body
# SITE_PREFIX é o caminho onde o site é servido: vazio na Vercel ou em
# domínio próprio; "/<repositório>" no GitHub Pages de projeto.
set -euo pipefail
cd "$(dirname "$0")/../.."

SITE_PREFIX="${SITE_PREFIX:-}"
export NEXT_PUBLIC_BASE_PATH="${SITE_PREFIX}/treino"

(cd treino-full-body && npm run build)

rm -rf _site
mkdir -p _site
cp .github/pages/index.html _site/index.html
cp -r fracoes _site/fracoes
cp -r treino-full-body/out _site/treino
touch _site/.nojekyll
echo "Site montado em _site/ (app em ${NEXT_PUBLIC_BASE_PATH}/)"
