#!/usr/bin/env bash
# Provision a Raspberry Pi as the Hillard Lights kiosk.
#
# Usage:
#   sudo ./deploy/install.sh              # full setup (system + app)
#   sudo ./deploy/install.sh --app-only   # rebuild + redeploy app only
#
# Idempotent: safe to re-run.

set -euo pipefail

APP_ONLY=0
if [[ "${1-}" == "--app-only" ]]; then
  APP_ONLY=1
fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KIOSK_USER="${SUDO_USER:-pi}"
KIOSK_HOME="$(getent passwd "$KIOSK_USER" | cut -d: -f6)"
WEB_ROOT="/var/www/kiosk"

log() { printf "\n\033[1;33m[kiosk-install]\033[0m %s\n" "$*"; }

if [[ $EUID -ne 0 ]]; then
  echo "Must be run with sudo" >&2
  exit 1
fi

if [[ $APP_ONLY -eq 0 ]]; then
  log "Updating apt package index"
  apt-get update -y

  log "Installing system packages"
  apt-get install -y --no-install-recommends \
    nginx \
    chromium-browser \
    xserver-xorg \
    xserver-xorg-legacy \
    x11-xserver-utils \
    xinit \
    openbox \
    unclutter \
    fonts-inter \
    fonts-noto-color-emoji \
    curl \
    ca-certificates \
    gnupg

  log "Installing Node.js 20 from NodeSource"
  if ! command -v node >/dev/null || [[ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi

  log "Allowing any user to start X (needed for kiosk autologin flow)"
  cat > /etc/X11/Xwrapper.config <<'EOF'
allowed_users=anybody
needs_root_rights=yes
EOF

  log "Enabling console autologin on tty1 for user $KIOSK_USER"
  mkdir -p /etc/systemd/system/getty@tty1.service.d
  cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf <<EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $KIOSK_USER --noclear %I \$TERM
EOF
  systemctl daemon-reload

  log "Installing nginx site config"
  install -m 0644 "$REPO_DIR/deploy/nginx-kiosk.conf" /etc/nginx/sites-available/kiosk
  rm -f /etc/nginx/sites-enabled/default
  ln -sf /etc/nginx/sites-available/kiosk /etc/nginx/sites-enabled/kiosk

  log "Installing runtime config systemd unit"
  install -m 0644 "$REPO_DIR/deploy/kiosk-config.service" /etc/systemd/system/kiosk-config.service
  systemctl daemon-reload
  systemctl enable kiosk-config.service

  if [[ ! -e /boot/firmware/kiosk.conf && ! -e /boot/kiosk.conf ]]; then
    log "Seeding /boot/firmware/kiosk.conf from deploy/kiosk.conf.example"
    if [[ -d /boot/firmware ]]; then
      install -m 0644 "$REPO_DIR/deploy/kiosk.conf.example" /boot/firmware/kiosk.conf
    else
      install -m 0644 "$REPO_DIR/deploy/kiosk.conf.example" /boot/kiosk.conf
    fi
    echo "  → edit that file to point at your real FPP + RF settings"
  fi
fi

# Launcher scripts belong to the app, not the system config — refresh
# them on every deploy (including --app-only) so ship.sh changes to
# .bash_profile / .xinitrc / chromium-kiosk.sh land without a full
# reinstall.
log "Installing bash_profile autostart snippet for $KIOSK_USER"
install -m 0644 -o "$KIOSK_USER" -g "$KIOSK_USER" \
  "$REPO_DIR/deploy/bash_profile.sh" \
  "$KIOSK_HOME/.bash_profile"

log "Installing xinitrc for $KIOSK_USER"
install -m 0755 -o "$KIOSK_USER" -g "$KIOSK_USER" \
  "$REPO_DIR/deploy/xinitrc.sh" \
  "$KIOSK_HOME/.xinitrc"

log "Installing chromium kiosk launcher"
install -m 0755 -o "$KIOSK_USER" -g "$KIOSK_USER" \
  "$REPO_DIR/deploy/chromium-kiosk.sh" \
  "$KIOSK_HOME/chromium-kiosk.sh"

log "Installing runtime config generator"
install -m 0755 "$REPO_DIR/deploy/generate-config.sh" /usr/local/sbin/kiosk-generate-config.sh

log "Preparing web root at $WEB_ROOT"
mkdir -p "$WEB_ROOT"
chown -R www-data:www-data "$WEB_ROOT"

log "Installing npm dependencies (this can take a couple of minutes)"
cd "$REPO_DIR"
sudo -u "$KIOSK_USER" npm ci

log "Building the app"
if [[ ! -f "$REPO_DIR/.env" ]]; then
  echo "warn: no .env file found; the build will use defaults (demo mode ON)." >&2
  echo "      copy .env.example to .env before running --app-only for a real build." >&2
fi
sudo -u "$KIOSK_USER" npm run build

log "Deploying built assets to $WEB_ROOT"
rm -rf "$WEB_ROOT"/*
cp -r "$REPO_DIR/dist"/* "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"

log "Regenerating /config.json from kiosk.conf"
/usr/local/sbin/kiosk-generate-config.sh || echo "warn: config generator failed; using empty overrides"

log "Reloading nginx"
nginx -t
systemctl reload nginx || systemctl restart nginx
systemctl enable nginx

log "Done."
if [[ $APP_ONLY -eq 0 ]]; then
  echo ""
  echo "Next steps:"
  echo "  1. Copy .env.example to .env and set your real FPP/RF values"
  echo "  2. Re-run: sudo $0 --app-only"
  echo "  3. Reboot: sudo reboot"
else
  echo ""
  echo "App redeployed. Reboot or reload Chromium to pick up changes."
fi
