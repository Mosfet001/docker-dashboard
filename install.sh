#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  install.sh — Docker Dashboard one-shot installer for Ubuntu 20.04/22.04/24.04
#
#  Usage:
#    chmod +x install.sh && sudo ./install.sh
#
#  What it does:
#    1. Installs Docker Engine + Docker Compose plugin (if not present)
#    2. Installs Node.js 20 via NodeSource (if not present)
#    3. Installs project npm dependencies (server + client)
#    4. Generates a .env file with a random JWT secret
#    5. Builds and starts the full stack with Docker Compose
#    6. Prints the dashboard URL and default credentials
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${GREEN}[✓]${RESET} $*"; }
info() { echo -e "${CYAN}[→]${RESET} $*"; }
warn() { echo -e "${YELLOW}[!]${RESET} $*"; }
err()  { echo -e "${RED}[✗]${RESET} $*" >&2; exit 1; }
step() { echo -e "\n${BOLD}${CYAN}── $* ──${RESET}"; }

# ── Root check ────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  err "Please run as root: sudo ./install.sh"
fi

# ── Detect Ubuntu ─────────────────────────────────────────────────────────────
if [[ ! -f /etc/os-release ]]; then
  err "Cannot detect OS. This script supports Ubuntu 20.04, 22.04, 24.04."
fi
source /etc/os-release
if [[ "$ID" != "ubuntu" ]]; then
  warn "Detected OS: $PRETTY_NAME. This script is tested on Ubuntu. Proceeding anyway…"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${BOLD}  🐳  Docker Dashboard — Installer${RESET}"
echo -e "  Ubuntu $VERSION_ID | $(date)"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
step "1/6  System packages"
# ─────────────────────────────────────────────────────────────────────────────
apt-get update -qq
apt-get install -y -qq \
  ca-certificates curl gnupg lsb-release \
  openssl git jq > /dev/null
log "System packages ready"

# ─────────────────────────────────────────────────────────────────────────────
step "2/6  Docker Engine"
# ─────────────────────────────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
  DOCKER_VER=$(docker --version | grep -oP '[\d.]+' | head -1)
  log "Docker already installed (v${DOCKER_VER})"
else
  info "Installing Docker Engine…"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
     https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin > /dev/null

  systemctl enable --now docker
  log "Docker Engine installed"
fi

# Verify compose plugin
if ! docker compose version &>/dev/null; then
  err "Docker Compose plugin not found. Install it manually."
fi
log "Docker Compose plugin: $(docker compose version --short)"

# ─────────────────────────────────────────────────────────────────────────────
step "3/6  Node.js 20"
# ─────────────────────────────────────────────────────────────────────────────
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  MAJOR=$(echo "$NODE_VER" | grep -oP '\d+' | head -1)
  if [[ "$MAJOR" -ge 18 ]]; then
    log "Node.js already installed ($NODE_VER)"
  else
    warn "Node.js $NODE_VER is below v18. Upgrading…"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
    apt-get install -y -qq nodejs > /dev/null
    log "Node.js upgraded to $(node --version)"
  fi
else
  info "Installing Node.js 20 via NodeSource…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
  apt-get install -y -qq nodejs > /dev/null
  log "Node.js installed: $(node --version)"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "4/6  npm dependencies"
# ─────────────────────────────────────────────────────────────────────────────
info "Installing server dependencies…"
(cd "$SCRIPT_DIR/server" && npm install --silent)
log "Server deps installed"

info "Installing client dependencies…"
(cd "$SCRIPT_DIR/client" && npm install --silent)
log "Client deps installed"

info "Installing root dev dependencies…"
(cd "$SCRIPT_DIR" && npm install --silent)
log "Root deps installed"

# ─────────────────────────────────────────────────────────────────────────────
step "5/6  Environment configuration"
# ─────────────────────────────────────────────────────────────────────────────
ENV_FILE="$SCRIPT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  warn ".env already exists — skipping generation (delete it to regenerate)"
else
  info "Generating .env with a random JWT secret…"

  JWT_SECRET=$(openssl rand -hex 32)
  PUBLIC_IP=$(curl -sf --connect-timeout 5 https://api.ipify.org || echo "localhost")

  cat > "$ENV_FILE" << EOF
# Generated by install.sh on $(date)
# Edit these values before going to production.

HTTP_PORT=80
HTTPS_PORT=443
PORT=3001

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES=24h

DASHBOARD_USER=admin
DASHBOARD_PASS=changeme

DISABLE_AUTH=false
CLIENT_ORIGIN=http://${PUBLIC_IP}

DOCKER_SOCKET=/var/run/docker.sock
EOF

  chmod 600 "$ENV_FILE"
  log ".env created (JWT secret auto-generated)"
  warn "IMPORTANT: Change DASHBOARD_PASS in .env before exposing to the internet!"
fi

# ── Create nginx certs directory (TLS optional) ───────────────────────────────
mkdir -p "$SCRIPT_DIR/nginx/certs"

# ─────────────────────────────────────────────────────────────────────────────
step "6/6  Build & launch"
# ─────────────────────────────────────────────────────────────────────────────
info "Building Docker images (this may take 2–4 minutes on first run)…"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d --build

# ── Wait for health ───────────────────────────────────────────────────────────
info "Waiting for services to become healthy…"
MAX_WAIT=60
ELAPSED=0
until curl -sf http://localhost/api/health > /dev/null 2>&1; do
  if [[ $ELAPSED -ge $MAX_WAIT ]]; then
    warn "Health check timed out after ${MAX_WAIT}s. Check logs: docker compose logs -f"
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

if curl -sf http://localhost/api/health > /dev/null 2>&1; then
  log "All services healthy"
fi

# ─────────────────────────────────────────────────────────────────────────────
#  Done
# ─────────────────────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -sf --connect-timeout 5 https://api.ipify.org || echo "localhost")

echo ""
echo -e "${BOLD}${GREEN}  ✅  Docker Dashboard is running!${RESET}"
echo ""
echo -e "  ${BOLD}URL:${RESET}       http://${PUBLIC_IP}"
echo -e "  ${BOLD}Username:${RESET}  admin"
echo -e "  ${BOLD}Password:${RESET}  changeme   ${RED}← change this in .env${RESET}"
echo ""
echo -e "  ${BOLD}Useful commands:${RESET}"
echo -e "    docker compose logs -f        # tail all logs"
echo -e "    docker compose restart server # restart the API"
echo -e "    docker compose down           # stop everything"
echo -e "    docker compose up -d --build  # rebuild after changes"
echo ""
echo -e "  ${BOLD}To enable HTTPS:${RESET}"
echo -e "    bash scripts/setup-ssl.sh your-domain.com"
echo ""
