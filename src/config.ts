import type { PropDef } from "./state/types";

type RuntimeConfig = Record<
  string,
  string | number | boolean | string[] | null | undefined
>;

function runtimeConfig(): RuntimeConfig {
  const g = globalThis as unknown as { __KIOSK_RUNTIME_CONFIG__?: RuntimeConfig };
  return g.__KIOSK_RUNTIME_CONFIG__ ?? {};
}

// Exposed for the admin panel so the operator can see which values came
// from /boot/firmware/kiosk.conf vs the compiled-in build defaults.
export function getRuntimeOverrides(): RuntimeConfig {
  return runtimeConfig();
}

function envString(key: string, fallback: string): string {
  const rt = runtimeConfig()[key];
  if (typeof rt === "string" && rt.length > 0) return rt;
  const build = import.meta.env[key];
  return typeof build === "string" && build.length > 0 ? build : fallback;
}

function envNumber(key: string, fallback: number): number {
  const rt = runtimeConfig()[key];
  if (typeof rt === "number" && Number.isFinite(rt)) return rt;
  if (typeof rt === "string" && rt.length > 0) {
    const n = Number(rt);
    if (Number.isFinite(n)) return n;
  }
  const raw = import.meta.env[key];
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const rt = runtimeConfig()[key];
  if (typeof rt === "boolean") return rt;
  if (typeof rt === "string") return rt === "true" || rt === "1";
  const raw = import.meta.env[key];
  if (typeof raw !== "string") return fallback;
  return raw === "true" || raw === "1";
}

function envStringArray(key: string, fallback: string[]): string[] {
  const rt = runtimeConfig()[key];
  if (Array.isArray(rt)) return rt.filter((s) => typeof s === "string" && s.length > 0);
  if (typeof rt === "string" && rt.length > 0) {
    return rt
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return fallback;
}

function envSeason(
  key: string,
  fallback: "halloween" | "christmas",
): "halloween" | "christmas" {
  const rt = runtimeConfig()[key];
  if (rt === "halloween" || rt === "christmas") return rt;
  const raw = import.meta.env[key];
  if (raw === "halloween" || raw === "christmas") return raw;
  return fallback;
}

// Halloween effect set. `preset` values must match FPP command-preset names
// on the show controller — rename here if your FPP presets differ. Cooldowns
// are 3 min for standard effects, 5 min for the fog-bubble machine which
// needs longer to reheat between shots.
const DEFAULT_PROPS: PropDef[] = [
  { id: "fobbles",   label: "Fobbles",           preset: "KIOSK_PROP_FOBBLES",   emoji: "🫧",  cooldownSec: 300, cooldownMessage: "Boiling more brew", allowDuringSequence: true  },
  { id: "bats",      label: "Bat Frenzy",        preset: "KIOSK_PROP_BATS",      emoji: "🦇",  cooldownSec: 180, cooldownMessage: "Bats resettling"    },
  { id: "thunder",   label: "Rolling Thunder",   preset: "KIOSK_PROP_THUNDER",   emoji: "⛈️",  cooldownSec: 180, cooldownMessage: "Storm gathering"    },
  { id: "lightning", label: "Lightning Strike",  preset: "KIOSK_PROP_LIGHTNING", emoji: "⚡",  cooldownSec: 180, cooldownMessage: "Storing volts"      },
  { id: "spider",    label: "Spider Boogie",     preset: "KIOSK_PROP_SPIDER",    emoji: "🕷️", cooldownSec: 180, cooldownMessage: "Legs cramping"      },
  { id: "eyes-on",   label: "Wake the Watchers", preset: "KIOSK_PROP_EYES_ON",   emoji: "👁️", cooldownSec: 180, cooldownMessage: "Eyelids heavy"      },
  { id: "flood",     label: "Solar Flare",       preset: "KIOSK_PROP_FLOODLIGHT",emoji: "🔦",  cooldownSec: 180, cooldownMessage: "Bulbs cooling"      },
  { id: "tombstone", label: "Grave Whisper",     preset: "KIOSK_PROP_TOMBSTONE", emoji: "🪦",  cooldownSec: 180, cooldownMessage: "Skull remembering"  },
];

const season = envSeason("VITE_SEASON", "halloween");

// Bump on each meaningful release; surfaced in the admin panel.
export const APP_VERSION = "0.10.0";

export const config = {
  fppUrl: envString("VITE_FPP_URL", "http://192.168.1.1"),
  rfBaseUrl: envString("VITE_RF_BASE_URL", "https://remotefalcon.com/remote-falcon-viewer"),
  rfSubdomain: envString("VITE_RF_SUBDOMAIN", "hillardlightshows"),
  rfPollMs: envNumber("VITE_RF_POLL_MS", 3000),
  rfPresenceMs: envNumber("VITE_RF_PRESENCE_MS", 30000),
  // Audio on/off is a direct Volume Set (0–100) on the FPP rather than
  // a named command preset — the preset list on the FPP gets wiped by
  // reinstalls / config resets, and a missing preset silently 500s,
  // leaving the speakers stuck on. Volume Set is a built-in command.
  audioOnVolume: envNumber("VITE_AUDIO_ON_VOLUME", 70),
  audioOffVolume: envNumber("VITE_AUDIO_OFF_VOLUME", 0),
  // PipeWire sink the audio button targets. FPP plays each sequence to
  // one group-sink, so to drive both the rock speakers and the FM
  // transmitter we keep both USB cards as members of a single group
  // ("Rock Speakers") and target the specific CODEC card here. Muting
  // the card silences the driveway speakers while the FM card inside
  // the same group keeps streaming to cars tuned in. Empty string =
  // global Volume Set (nukes everything). Find the current sink IDs via
  // `curl http://<fpp>/api/pipewire/audio/targets`.
  audioTarget: envString("VITE_AUDIO_TARGET", "sink:fpp_fx_g1_codec"),
  audioDurationSeconds: envNumber("VITE_AUDIO_DURATION_SECONDS", 360),
  // Fresh Chromium launch mutes FPP so the "TAP TO TURN ON" button matches
  // reality. Flip to false in /boot/firmware/kiosk.conf when the touchscreen
  // is dead — otherwise audio can never be enabled from the kiosk UI.
  coldBootMute: envBool("cold_boot_mute", true),
  pollIntervalMs: envNumber("VITE_POLL_INTERVAL_MS", 1000),
  demoMode: envBool("VITE_DEMO_MODE", true),
  demoAudioSeconds: envNumber("VITE_DEMO_AUDIO_SECONDS", 30),
  adminPin: envString("VITE_ADMIN_PIN", ""),
  newSongs: envStringArray("new_songs", []),
  // Nightly show window (local time, minutes since midnight). Used by the
  // AfterHoursPage: show the "that's a wrap" takeover between the show-end
  // boundary and midnight; show the next-show countdown using the start
  // minutes. Operators can override via /boot/firmware/kiosk.conf.
  showStartMinutes: envNumber("VITE_SHOW_START_MINUTES", 18 * 60 + 30),
  showEndMinutes: envNumber("VITE_SHOW_END_MINUTES", 21 * 60),
  // Window during which the after-hours takeover is shown. Default is the
  // show-end boundary through local midnight — if the kiosk is still on
  // past midnight, it reverts to the normal UI (user's rule, so stale
  // overnight sessions don't get stuck on the end-of-night splash).
  afterHoursStartMinutes: envNumber("VITE_AFTERHOURS_START_MINUTES", 21 * 60),
  afterHoursEndMinutes: envNumber("VITE_AFTERHOURS_END_MINUTES", 24 * 60),
  // Name of the RF sequence that loops while the show is idle waiting for
  // requests. All effects remain enabled while this specific sequence
  // plays. Any other (real music) sequence blocks every effect except
  // those flagged `allowDuringSequence: true`. Set to "" to treat every
  // sequence as blocking.
  waitingSequenceName: envString("VITE_WAITING_SEQUENCE", "Ghostly Music Box"),
  props: DEFAULT_PROPS,
  brand: {
    name: "Hillard Lights",
    tagline: "A residential light show synced to music",
    motto: "Subtle Was Never the Plan",
    siteUrl: "https://hillardlights.com",
    season,
    seasonYear: envNumber("VITE_SEASON_YEAR", 2026),
    seasonEmoji: season === "halloween" ? "👻" : "🎄",
    seasonLabel: season === "halloween" ? "Halloween" : "Christmas",
    fmFrequency: envString("VITE_FM_FREQUENCY", "105.3 FM"),
    socials: {
      facebook: { label: "Facebook", handle: "hillardlights", url: "https://www.facebook.com/hillardlights/", emoji: "📘" },
      instagram: { label: "Instagram", handle: "@hillardlights", url: "https://www.instagram.com/hillardlights/", emoji: "📸" },
      youtube: { label: "YouTube", handle: "@hillardlights", url: "https://www.youtube.com/@hillardlights", emoji: "▶" },
      tiktok: { label: "TikTok", handle: "@hillardlights", url: "https://www.tiktok.com/@hillardlights", emoji: "🎵" },
    },
  },
} as const;

export type Config = typeof config;
