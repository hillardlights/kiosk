# Auto-launched by bash on interactive login. If we're on the
# physical console (tty1) and there's no X session running yet,
# start one. This is the trigger for the whole kiosk chain.

if [[ -z "${DISPLAY-}" ]] && [[ "$(tty)" = "/dev/tty1" ]]; then
  exec startx -- -nocursor
fi
