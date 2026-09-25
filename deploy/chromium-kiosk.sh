#!/usr/bin/env bash
# Launches Chromium in bulletproof kiosk mode pointing at the local
# nginx-served kiosk bundle.

set -u

KIOSK_URL="${KIOSK_URL:-http://localhost/}"
PROFILE_DIR="$HOME/.config/kiosk-chromium"

# Locate the Chromium binary — package name varies by Raspbian version.
CHROMIUM_BIN=$(command -v chromium-browser || command -v chromium || true)
if [[ -z "$CHROMIUM_BIN" ]]; then
  echo "chromium not found on PATH" >&2
  exit 1
fi

# Chromium sometimes leaves a crash sentinel in the profile that pops
# a "Restore pages?" bubble on next launch. Nuke it so the kiosk
# always starts clean without stealing focus.
if [[ -f "$PROFILE_DIR/Default/Preferences" ]]; then
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/;s/"exit_type":"Crashed"/"exit_type":"Normal"/' \
    "$PROFILE_DIR/Default/Preferences" 2>/dev/null || true
fi

# Chromium's SingletonLock/Cookie/Socket symlinks are stamped with
# hostname+pid. If the pi was renamed (e.g. raspberrypi → hillard-kiosk)
# or Chromium didn't exit cleanly, the stale lock refuses launch with
# "profile appears to be in use by another Chromium process on another
# computer" — black screen forever. Nothing else can hold this lock on
# a single-user kiosk, so it's always safe to clear.
rm -f "$PROFILE_DIR"/Singleton* 2>/dev/null || true

exec "$CHROMIUM_BIN" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI,OverscrollHistoryNavigation \
  --overscroll-history-navigation=0 \
  --touch-events=enabled \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-pinch \
  --user-data-dir="$PROFILE_DIR" \
  --window-position=0,0 \
  --start-fullscreen \
  "$KIOSK_URL"
