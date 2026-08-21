# Hillard Lights Kiosk

Outdoor touchscreen kiosk for the [Hillard Lights](https://hillardlights.com)
Halloween/Christmas show. Runs on a Raspberry Pi 5 driving a 21.5" portrait
touchscreen at the driveway. The kiosk itself does not control any pixels — it
sends song requests to [Remote Falcon](https://remotefalcon.com) so kiosk taps
share one fair queue with QR-code viewers in cars, and it triggers named FPP
command presets over the LAN for props and outdoor speakers.

```
Touchscreen  ->  Kiosk web app  --(internet)-->  Remote Falcon  -->  FPP plugin  -->  FPP
                        \
                          --(LAN)-->  FPP command presets  -->  Props / audio amp
```

## Development

```bash
npm install
npm run dev
```

Then open the printed URL. In demo mode (the default), the app doesn't call RF
or FPP — it simulates everything from `src/state/demoData.ts` so you can
iterate on UI without the show gear running.

### Configuration

Copy `.env.example` to `.env` and adjust. See `.env.example` for the full list;
the ones you'll actually change often:

| Variable | Purpose |
| --- | --- |
| `VITE_DEMO_MODE` | `true` to simulate; `false` to hit real RF + FPP |
| `VITE_FPP_URL` | Falcon Player base URL on the LAN |
| `VITE_RF_SUBDOMAIN` | Your Remote Falcon show subdomain |
| `VITE_SEASON` | `halloween` or `christmas` (swaps header emoji + label) |
| `VITE_ADMIN_PIN` | PIN gating the admin panel (empty = no PIN) |

## Production build

```bash
npm run build
npm run preview
```

The built app lives in `dist/`. On the Pi it's served by nginx on port 80 (see
Deployment).

## Deployment

Full Raspberry Pi setup — from fresh SD flash to auto-booting kiosk — lives in
[`deploy/README.md`](./deploy/README.md).

The short version: flash Raspberry Pi OS Bookworm Lite (64-bit), SSH in, then:

```bash
git clone <this-repo> /home/pi/kiosk
cd /home/pi/kiosk
sudo ./deploy/install.sh
cp .env.example .env && nano .env  # set your real values
sudo ./deploy/install.sh --app-only
sudo reboot
```

Pi boots straight into fullscreen Chromium in `--kiosk` mode pointing at the
locally-hosted app. Screen never blanks, cursor is hidden, autologin gets you
back if the Pi loses power.

## Target hardware

- Raspberry Pi 5 (8GB)
- 21.5" outdoor touchscreen, 1080×1920 portrait
- Falcon Player on a separate Pi on the show LAN
- Remote Falcon show at `<yoursubdomain>.remotefalcon.com`

## Admin

7-tap the "Hillard Lights" title in the header to open the admin overlay. If
`VITE_ADMIN_PIN` is set, a keypad gates entry. Admin shows live FPP/RF
connection state, current audio state and expiry, now-playing, config readout,
and one-tap diagnostics (Test FPP, Test RF, Force Audio Off, Reload).

## Roadmap

- [x] Phase 1 — scaffold + build
- [x] Phase 2 — Home screen (tabs, demo mode)
- [x] Phase 3 — Remote Falcon integration + preference honoring
- [x] Phase 4 — real FPP for props + audio
- [x] Phase 5 — collapsed into 3+4 (both integrations live)
- [x] Phase 6 — robust audio timer (absolute timestamp + localStorage)
- [x] Phase 7 — admin panel behind 7-tap gesture
- [ ] Phase 8 — PWA polish (installability, offline shell)
- [ ] Phase 9 — dedicated failure/recovery testing
- [x] Phase 10 — Pi deployment (see [`deploy/`](./deploy/))
