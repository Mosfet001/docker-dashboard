#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  scripts/update.sh — Pull latest code and redeploy zero-downtime
#
#  Usage: bash scripts/update.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; BOLD='\033[1m'; RESET='\033[0m'
info() { echo -e "${CYAN}[→]${RESET} $*"; }
log()  { echo -e "${GREEN}[✓]${RESET} $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

info "Pulling latest code…"
git pull

info "Installing updated deps…"
(cd server && npm install --silent)
(cd client && npm install --silent)

info "Rebuilding and restarting containers…"
docker compose up -d --build --no-deps

log "Update complete → $(git log -1 --oneline)"
