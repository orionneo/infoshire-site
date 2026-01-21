#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"

echo "== Procurando por 'ipapi' e padrões comuns =="
echo

# usa rg se existir, senão grep
if command -v rg >/dev/null 2>&1; then
  SEARCH="rg -n --hidden --no-ignore-vcs"
else
  SEARCH="grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git"
fi

echo "-- ipapi / ip-api / ipinfo / geo / country --"
$SEARCH "ipapi\.co|ip-api\.com|ipinfo\.io|geoip|geolocation|country|client ip" "$ROOT" || true
echo

echo "-- fetch('http...') ou axios/http endpoints (pode ter ipapi em string montada) --"
$SEARCH "fetch\(|axios\(|http(s)?://" "$ROOT" || true
echo

echo "-- Env vars relacionadas (caso endpoint venha do .env) --"
$SEARCH "VITE_.*(IP|GEO|LOCATION|COUNTRY)|IPAPI|GEO" "$ROOT" || true
echo

echo "== FIM =="
