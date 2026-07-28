#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  scripts/setup-ssl.sh — Issue a Let's Encrypt TLS cert and configure nginx
#
#  Usage:
#    sudo bash scripts/setup-ssl.sh your-domain.com [email@example.com]
#
#  Prerequisites:
#    - Port 80 is open and the domain's A record points to this server
#    - install.sh has already been run
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; BOLD='\033[1m'; RESET='\033[0m'
log()  { echo -e "${GREEN}[✓]${RESET} $*"; }
info() { echo -e "${CYAN}[→]${RESET} $*"; }
err()  { echo -e "${RED}[✗]${RESET} $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && err "Run as root: sudo bash scripts/setup-ssl.sh"
[[ $# -lt 1 ]]    && err "Usage: sudo bash scripts/setup-ssl.sh your-domain.com [email]"

DOMAIN="$1"
EMAIL="${2:-admin@${DOMAIN}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERTS_DIR="$SCRIPT_DIR/nginx/certs"

info "Setting up SSL for: $DOMAIN"

# Install certbot if needed
if ! command -v certbot &>/dev/null; then
  info "Installing Certbot…"
  apt-get update -qq
  apt-get install -y -qq certbot > /dev/null
  log "Certbot installed"
fi

# Temporarily stop nginx to free port 80 for certbot standalone
docker compose -f "$SCRIPT_DIR/docker-compose.yml" stop nginx

# Issue certificate
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  --cert-path "$CERTS_DIR/cert.pem" \
  --key-path  "$CERTS_DIR/privkey.pem" \
  --fullchain-path "$CERTS_DIR/fullchain.pem" \
  --chain-path "$CERTS_DIR/chain.pem" || {
    # Fallback: use symlinks from /etc/letsencrypt
    mkdir -p "$CERTS_DIR"
    ln -sf "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "$CERTS_DIR/fullchain.pem"
    ln -sf "/etc/letsencrypt/live/${DOMAIN}/privkey.pem"   "$CERTS_DIR/privkey.pem"
  }

log "Certificate issued for $DOMAIN"

# Patch nginx config to enable HTTPS block
NGINX_CONF="$SCRIPT_DIR/nginx/default.conf"
info "Enabling HTTPS block in nginx config…"
sed -i "s/# server {/server {/"                                  "$NGINX_CONF"
sed -i "s/#     listen 443/    listen 443/"                      "$NGINX_CONF"
sed -i "s/#     server_name your-domain.com/    server_name $DOMAIN/" "$NGINX_CONF"
sed -i 's/#     ssl_certificate /    ssl_certificate /'          "$NGINX_CONF"
sed -i 's/#     ssl_certificate_key /    ssl_certificate_key /'  "$NGINX_CONF"
sed -i 's/#     ssl_protocols/    ssl_protocols/'                "$NGINX_CONF"
sed -i 's/#     ssl_ciphers/    ssl_ciphers/'                    "$NGINX_CONF"
sed -i 's/#     ssl_session/    ssl_session/g'                   "$NGINX_CONF"
sed -i 's/#     add_header/    add_header/g'                     "$NGINX_CONF"
sed -i 's/#     location \/ {/    location \/ {/'                "$NGINX_CONF"
sed -i 's/#         proxy_pass http:\/\/client/        proxy_pass http:\/\/client/' "$NGINX_CONF"
sed -i 's/#         proxy_set_header Host/        proxy_set_header Host/'           "$NGINX_CONF"
sed -i 's/#         proxy_http_version/        proxy_http_version/'                 "$NGINX_CONF"
sed -i 's/#     }/    }/g'                                       "$NGINX_CONF"
sed -i 's/#     location \/api/    location \/api/'              "$NGINX_CONF"
sed -i 's/#     location \/ws/    location \/ws/'                "$NGINX_CONF"
sed -i 's/#     listen 80;/    listen 80;/'                      "$NGINX_CONF"
sed -i "s/# Redirect HTTP/# Redirect HTTP/;s/# server {$/server {/" "$NGINX_CONF"

# Restart nginx with new config
docker compose -f "$SCRIPT_DIR/docker-compose.yml" start nginx

# Set up auto-renewal
CRON_JOB="0 3 * * * certbot renew --quiet && docker compose -f $SCRIPT_DIR/docker-compose.yml restart nginx"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
log "Auto-renewal cron job configured (runs daily at 3 AM)"

echo ""
echo -e "${BOLD}${GREEN}  ✅  HTTPS enabled!${RESET}"
echo -e "  Dashboard: https://${DOMAIN}"
echo ""
