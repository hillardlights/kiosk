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

# Landscape orientation — no display rotation and no touch coordinate
# transform needed. If you swap panels back to a portrait install,
# add `xrandr --output HDMI-1 --rotate right` here and a matching
# xinput Coordinate Transformation Matrix on the touch device.

# Launch the kiosk. If Chromium crashes, exec back into it so the
# session self-heals.
while true; do
  "$HOME/chromium-kiosk.sh"
  sleep 2
done
