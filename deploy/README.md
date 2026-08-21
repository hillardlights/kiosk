# Hillard Lights Kiosk — Raspberry Pi deployment

Turns a freshly-flashed Raspberry Pi into an auto-booting kiosk that
launches the app in fullscreen Chromium the moment it powers on.

Target: **Raspberry Pi 5 (8GB)** running **Raspberry Pi OS Bookworm
Lite (64-bit)**, driving a 21.5" portrait touchscreen at 1080×1920.

## What you'll end up with

- Console autologin as user `pi` on tty1
- `~/.bash_profile` launches `startx` when logged in on tty1
- `~/.xinitrc` starts Openbox + a Chromium kiosk launcher
- Chromium opens `http://localhost/` in `--kiosk` mode, no chrome, no
  crash bubbles, no update prompts
- nginx on port 80 serves the built app from `/var/www/kiosk/`
- Screen never blanks; mouse cursor is hidden (`unclutter`)
- localStorage persists across reboots (so the outdoor-audio safety
  timer survives)

## One-time setup (from a fresh SD flash)

### 1. Flash the SD card

Use Raspberry Pi Imager. Pick **Raspberry Pi OS Lite (64-bit)**.
Click the gear icon and pre-configure:

- **Hostname**: `hillard-kiosk` (or whatever you like)
- **Enable SSH**: yes, with a password or public key
- **Username**: `pi`
- **WiFi**: your show network SSID + password (or leave blank if
  ethernet)
- **Locale**: your timezone

Flash, insert into the Pi, boot it.

### 2. SSH in

```bash
ssh pi@hillard-kiosk.local
```

### 3. Clone the kiosk repo and run the provisioner

```bash
sudo apt update && sudo apt install -y git
git clone https://github.com/YOU/kiosk.git /home/pi/kiosk
cd /home/pi/kiosk
sudo ./deploy/install.sh
```

The script prints what it's doing at each step. Total time: ~5-10
minutes depending on your internet.

### 4. Configure runtime settings

The installer seeds `/boot/firmware/kiosk.conf` from
`deploy/kiosk.conf.example`. Edit it — either by SSH:

```bash
sudo nano /boot/firmware/kiosk.conf
```

Or, easier, pop the SD card out and edit `kiosk.conf` from a Windows
or Mac card reader (the `/boot/firmware` partition is FAT32 and
mounts on any desktop OS). Set at minimum:

```
VITE_DEMO_MODE=false
VITE_FPP_URL=http://192.168.5.8
VITE_RF_SUBDOMAIN=hillardlightshows
```

### 5. Reboot into kiosk mode

```bash
sudo reboot
```

The Pi boots, autologs in, launches X, and Chromium opens the kiosk.
Total time from power-on: ~20 seconds on a Pi 5.

## Making changes later

**Update to the latest kiosk code:**

```bash
cd /home/pi/kiosk
git pull
sudo ./deploy/install.sh --app-only
```

The `--app-only` flag skips reinstalling system packages and just
rebuilds + redeploys the app.

**Change FPP IP, RF subdomain, or any runtime setting:**

Edit `/boot/firmware/kiosk.conf` — either via SSH:

```bash
sudo nano /boot/firmware/kiosk.conf
```

Or by pulling the SD card and editing it on a desktop OS (the boot
partition is FAT32 and mounts as a regular removable drive). No
rebuild required.

Then apply:

```bash
# Option A — full reboot:
sudo reboot

# Option B — regenerate config, reload chromium from admin panel:
sudo /usr/local/sbin/kiosk-generate-config.sh
# then in the kiosk: 7-tap the header, admin → "Reload kiosk"
```

See `deploy/kiosk.conf.example` for the full list of overridable
settings.

**Get into the shell over an active kiosk session:**

SSH in from another machine. The kiosk keeps running; you're on a
separate tty.

To kill the kiosk temporarily (for troubleshooting):

```bash
sudo systemctl stop getty@tty1  # stops autologin
# ...do things...
sudo systemctl start getty@tty1  # resume kiosk
```

Or just `sudo pkill chromium-browser` to force a chromium restart —
the autostart chain will bring it back on next tty1 login.

## Troubleshooting

**Kiosk shows a black screen after reboot**

Check that X started:

```bash
ps aux | grep -E "(Xorg|chromium|openbox)"
```

If X didn't start, look at `~/.xsession-errors` or run `startx` from
tty1 manually and watch for errors.

**Chromium opens but shows "This site can't be reached"**

nginx isn't running or isn't serving from the right place:

```bash
sudo systemctl status nginx
ls -la /var/www/kiosk/
```

**Kiosk shows the app but "Show" dot is red**

FPP isn't reachable from the kiosk's subnet. Verify:

```bash
curl -m 5 http://192.168.5.8/api/system/status
```

If that times out, you have a routing problem, not a kiosk problem.

**Kiosk shows the app but "Requests" dot is red**

Kiosk can't reach Remote Falcon. Check internet:

```bash
curl -m 5 https://remotefalcon.com/remote-falcon-viewer/graphql -X POST \
  -H "content-type: application/json" \
  -d '{"query":"{__typename}"}'
```

**Cursor is visible / distracting**

`unclutter` should hide it after 1 sec of idle. Verify:

```bash
ps aux | grep unclutter
```

**Screen goes black after a few minutes**

Screen-blanking bypass didn't take. Verify:

```bash
xset q  # should show "Standby: 0" and "DPMS is Disabled"
```

If not, re-run the DPMS-disable commands from `deploy/xinitrc.sample`.

**Chromium prompts "Restore pages?" on every boot**

The kiosk-crashed sentinel wasn't cleared. `deploy/chromium-kiosk.sh`
already handles this — check it's the version being run.

## What's still MVP

- **Auto-update on WiFi**: no unattended-upgrades or cron pull.
  Ship updates manually with `git pull && ./deploy/install.sh
  --app-only`.
- **HTTPS**: kiosk is loopback-only so http suffices. If you ever
  point the kiosk browser at an external URL, add TLS at the proxy.
- **Watchdog / auto-restart Chromium on crash**: currently relies on
  bash_profile re-launching startx if X dies. A stricter systemd
  service that restarts Chromium on crash would be sturdier.
