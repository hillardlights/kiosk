#!/usr/bin/env bash
# One-command deploy from a dev machine to the kiosk Pi.
#
# Usage:
#   ./deploy/ship.sh "commit message"
#   ./deploy/ship.sh --no-commit           # already committed, just push + pull + build
#   ./deploy/ship.sh -r "commit message"   # also restart chromium after deploy
#
# Env overrides (put in .env.ship, gitignored):
#   PI_HOST=hillard-kiosk.local
#   PI_USER=pi
#   PI_REPO=/home/pi/kiosk
#
# Requires: git, ssh in PATH. Runs from any shell that can run bash
# (Git Bash on Windows, WSL, macOS, Linux).

set -euo pipefail

# Load overrides if present.
if [[ -f "$(dirname "${BASH_SOURCE[0]}")/../.env.ship" ]]; then
  # shellcheck disable=SC1091
  set -a; . "$(dirname "${BASH_SOURCE[0]}")/../.env.ship"; set +a
fi

PI_HOST="${PI_HOST:-hillard-kiosk.local}"
PI_USER="${PI_USER:-pi}"
PI_REPO="${PI_REPO:-/home/pi/kiosk}"

NO_COMMIT=0
RESTART_CHROMIUM=0
COMMIT_MSG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-commit) NO_COMMIT=1; shift ;;
    -r|--restart) RESTART_CHROMIUM=1; shift ;;
    *) COMMIT_MSG="$1"; shift ;;
  esac
done

log() { printf "\n\033[1;33m[ship]\033[0m %s\n" "$*"; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

if [[ $NO_COMMIT -eq 0 ]]; then
  if [[ -z "$COMMIT_MSG" ]]; then
    echo "usage: $0 \"commit message\" [-r]" >&2
    echo "       $0 --no-commit [-r]" >&2
    exit 1
  fi
  if [[ -z "$(git status --porcelain)" ]]; then
    log "No local changes to commit — skipping commit"
  else
    log "Committing local changes"
    git add -A
    git commit -m "$COMMIT_MSG"
  fi
fi

log "Pushing to origin"
git push

log "Pulling on $PI_USER@$PI_HOST and rebuilding app"
ssh -o BatchMode=no "$PI_USER@$PI_HOST" bash -s <<REMOTE
set -e
cd "$PI_REPO"
git pull --ff-only
sudo bash ./deploy/install.sh --app-only
REMOTE

if [[ $RESTART_CHROMIUM -eq 1 ]]; then
  log "Restarting Chromium on the kiosk"
  # Purge the service-worker + HTTP caches before restart. The PWA
  # registers with registerType: autoUpdate, which installs a new SW
  # in the background but keeps serving the *old* cached shell on the
  # very next load — so a single Chromium restart isn't enough to see
  # a fresh deploy. Wiping SW/Cache/Code-Cache forces a full network
  # fetch of index.html on relaunch. Chromium's own state (profile,
  # cookies, singleton lock, etc.) is preserved.
  # The [c]hromium regex trick prevents pkill from matching its own
  # ssh command line (which would kill our connection).
  ssh "$PI_USER@$PI_HOST" bash <<'REMOTE' || true
set -e
PROFILE="$HOME/.config/kiosk-chromium/Default"
rm -rf "$PROFILE/Service Worker" "$PROFILE/Cache" "$PROFILE/Code Cache" 2>/dev/null || true
sudo pkill -f '[c]hromium' || true
REMOTE
fi

log "Done. Reload Chromium from the admin panel (or use -r next time)."
