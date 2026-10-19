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

## Make it yours

This repo is shared as a reference for the light-show community — fork it,
rename it, run it in your own driveway. A few things are hardcoded for Hillard
Lights that you'll want to replace before you ship. All of these are
one-file edits:

**1. Branding — `src/config.ts`, the `brand` block (~line 144).**

```ts
brand: {
  name: "Your Show Name",
  siteUrl: "https://yourshow.com",
  fmFrequency: envString("VITE_FM_FREQUENCY", "88.1 FM"),
  socials: {
    facebook: { label: "Facebook", handle: "yourshow", url: "...", emoji: "📘" },
    // ...
  },
}
```

Updates the header, the Follow tab QR codes, the "That's a wrap" splash, and
the About panel footer.

**2. Remote Falcon show — your subdomain.**

Set `VITE_RF_SUBDOMAIN` in `.env` (and on the Pi, in
`/boot/firmware/kiosk.conf`). Everything else — song list, categories,
jukebox depth, request limits — comes back from RF, so once your subdomain
is set the kiosk pulls your show automatically.

**3. Props — `src/config.ts`, the `DEFAULT_PROPS` array (~line 75).**

Each entry maps a kiosk button to a named FPP command preset. Rename labels,
emojis, and cooldowns to match the props on your controller. The `preset`
field must match an FPP command-preset name exactly.

**4. Song metadata (optional) — `src/artworkManifest.ts` and `src/songFacts.ts`.**

Both are keyed by Remote Falcon sequence name. Drop a cover into
`public/artwork/`, add an entry to the manifest, and the kiosk picks it up on
the next build. Facts show in the "tap to confirm" popup when a guest
queues a song. Any sequence without an entry just renders without art/trivia.

**5. The About tab FAQ — `src/components/AboutPanel.tsx`.**

Hardcoded stats + Q&A about the show. Edit or delete entirely.

**6. Admin PIN.**

Default is empty (no PIN). Set `VITE_ADMIN_PIN` in `.env` or
`kiosk.conf` to any digit string. This is a convenience gate, not a security
boundary — anyone with physical SD-card access can read it in plain text.

Everything else — Pi hostname, LAN IPs, deploy scripts — is already
parameterised via `.env` + `deploy/kiosk.conf.example` and needs no code
changes.

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
