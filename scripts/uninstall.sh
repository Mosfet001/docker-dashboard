#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  scripts/uninstall.sh — Stop and remove all dashboard containers and images
#
#  Usage: bash scripts/uninstall.sh
#  Add --volumes to also delete nginx log volume.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BOLD='\033[1m'; RESET='\033[0m'
warn() { echo -e "${YELLOW}[!]${RESET} $*"; }
log()  { echo -e "${GREEN}[✓]${RESET} $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

warn "This will stop and remove all Docker Dashboard containers and images."
read -r -p "Continue? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

FLAGS="--rmi local"
[[ "${1:-}" == "--volumes" ]] && FLAGS="$FLAGS --volumes"

docker compose down $FLAGS

log "Docker Dashboard removed."
echo -e "\n  ${BOLD}Your .env file was NOT deleted.${RESET} Remove it manually if needed: rm .env"
