#!/usr/bin/env bash
# Read /boot/firmware/kiosk.conf (or legacy /boot/kiosk.conf) and emit
# /var/www/kiosk/config.json for the kiosk app to fetch at boot.
#
# Invoked once at Pi boot by kiosk-config.service (before nginx starts).
# Safe to run manually to re-apply after editing kiosk.conf without a
# full reboot: `sudo /usr/local/sbin/kiosk-generate-config.sh`.

set -euo pipefail

CONF=""
for candidate in /boot/firmware/kiosk.conf /boot/kiosk.conf; do
  if [[ -r "$candidate" ]]; then
    CONF="$candidate"
    break
  fi
done

OUT="/var/www/kiosk/config.json"
mkdir -p "$(dirname "$OUT")"

if [[ -z "$CONF" ]]; then
  echo '{}' > "$OUT"
  echo "kiosk-config: no kiosk.conf found on /boot/firmware or /boot; wrote empty $OUT"
  exit 0
fi

# Keys whose value is a pipe-separated list — emitted as JSON string
# arrays instead of a single string. Add to this list when you need
# another array-valued config key.
ARRAY_KEYS=" new_songs "

json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  printf '%s' "$s"
}

# Convert KEY=VALUE lines to JSON. Skips comments and blank lines,
# strips surrounding quotes on values, JSON-escapes backslashes and
# quotes. Keys listed in ARRAY_KEYS are split on `|` and emitted as
# JSON arrays. No external interpreter required (works on stock Pi OS).
{
  printf "{"
  first=1
  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="${raw#"${raw%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" ]] && continue
    [[ "$line" == \#* ]] && continue
    [[ "$line" != *=* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    if [[ "${value:0:1}" == "\"" && "${value: -1}" == "\"" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
      value="${value:1:${#value}-2}"
    fi
    [[ $first -eq 0 ]] && printf ","
    if [[ "$ARRAY_KEYS" == *" $key "* ]]; then
      printf '"%s":[' "$key"
      inner_first=1
      IFS='|' read -ra parts <<< "$value"
      for part in "${parts[@]}"; do
        part="${part#"${part%%[![:space:]]*}"}"
        part="${part%"${part##*[![:space:]]}"}"
        [[ -z "$part" ]] && continue
        escaped="$(json_escape "$part")"
        [[ $inner_first -eq 0 ]] && printf ","
        printf '"%s"' "$escaped"
        inner_first=0
      done
      printf ']'
    else
      escaped="$(json_escape "$value")"
      printf '"%s":"%s"' "$key" "$escaped"
    fi
    first=0
  done < "$CONF"
  printf "}"
} > "$OUT"

chmod 644 "$OUT"
chown www-data:www-data "$OUT" 2>/dev/null || true
echo "kiosk-config: wrote $OUT from $CONF"
