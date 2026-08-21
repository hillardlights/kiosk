# Hillard Lights Kiosk

Outdoor touchscreen kiosk for the Hillard Lights Halloween show. Runs on a
Raspberry Pi 5 driving a 21.5" portrait touchscreen. The kiosk itself does not
control any pixels — it sends commands over the LAN to a Raspberry Pi running
[Falcon Player (FPP)](https://github.com/FalconChristmas/fpp), which is the
authoritative show controller.

```
Touchscreen  ->  Kiosk web app  ->  FPP (LAN)  ->  Lights + audio
```

## Status

Phase 1 scaffold: Vite + React 19 + TypeScript + Tailwind CSS 4 + vite-plugin-pwa.
The rest of the app arrives in later phases.

## Development

```bash
npm install
npm run dev
```

Then open the printed URL. In demo mode (the default) the app does not need to
reach FPP.

### Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Purpose |
| --- | --- |
| `VITE_FPP_URL` | Falcon Player base URL on the LAN. |
| `VITE_SHOW_PLAYLIST` | Playlist name FPP should start. |
| `VITE_AUDIO_ON_PRESET` | FPP command preset that enables outdoor speakers. |
| `VITE_AUDIO_OFF_PRESET` | FPP command preset that disables outdoor speakers. |
| `VITE_AUDIO_DURATION_SECONDS` | Max outdoor-speaker on-time (default 360). |
| `VITE_POLL_INTERVAL_MS` | FPP status poll interval. |
| `VITE_DEMO_MODE` | `true` to simulate FPP; `false` for a real deployment. |
| `VITE_DEMO_AUDIO_SECONDS` | Shortened audio countdown for demo mode. |
| `VITE_ADMIN_PIN` | PIN gating admin actions (not a security boundary). |

## Production build

```bash
npm run build
npm run preview
```

The built app lives in `dist/`. On the Pi it will be served by a small local
static server (details in a later phase).

## Target hardware

- Raspberry Pi 5 (8GB)
- 21.5" outdoor touchscreen, 1080×1920 portrait
- Raspberry Pi OS Lite booting straight into Chromium in `--kiosk` mode
- FPP-controlled show on a separate Pi on the same LAN

## Roadmap

- [x] Phase 1 — scaffold + build
- [ ] Phase 2 — Halloween Home screen (demo mode)
- [ ] Phase 3 — audio timer
- [ ] Phase 4 — FPP service abstraction
- [ ] Phase 5 — real FPP integration
- [ ] Phase 6 — status polling
- [ ] Phase 7 — admin mode
- [ ] Phase 8 — PWA / offline polish
- [ ] Phase 9 — failure / recovery testing
- [ ] Phase 10 — Pi deployment docs
