#!/usr/bin/env bash
# Run by startx after X server comes up. Sets up the environment for
# a bulletproof kiosk session, then hands off to the Chromium launcher.

# Prevent screen blanking / DPMS / screensaver — the kiosk should be
# awake for hours at a time.
xset s off
xset s noblank
xset -dpms

# Hide the mouse cursor after 1s of inactivity.
unclutter -idle 1 -root &

# Openbox is our window manager. It draws no chrome, respects
# fullscreen requests, and stays out of Chromium's way.
openbox-session &

# Give Openbox a moment to come up before launching Chromium.
sleep 1

# Rotate the display for portrait orientation. If your touchscreen
# needs a different orientation, change "right" (rotates 90 CW) to
# "left" (90 CCW) or "inverted" (180). Comment out if the panel is
# already installed rotated.
xrandr --output HDMI-1 --rotate right 2>/dev/null || true

# Rotate touch input to match. Detect the touchscreen device and
# apply a matching transform matrix.
TOUCH_DEV=$(xinput --list --name-only 2>/dev/null | grep -iE "touch|touchscreen" | head -1)
if [[ -n "$TOUCH_DEV" ]]; then
  xinput set-prop "$TOUCH_DEV" "Coordinate Transformation Matrix" \
    0 1 0 -1 0 1 0 0 1 2>/dev/null || true
fi

# Launch the kiosk. If Chromium crashes, exec back into it so the
# session self-heals.
while true; do
  "$HOME/chromium-kiosk.sh"
  sleep 2
done
