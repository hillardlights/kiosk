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

// Halloween starter set. Swap `preset` values to match the FPP command
// preset names on your Pi. Add or remove entries freely; the UI adapts.
const DEFAULT_PROPS: PropDef[] = [
  { id: "fog",      label: "Fog Burst",   preset: "KIOSK_PROP_FOG",       emoji: "💨", cooldownSec: 30 },
  { id: "spider",   label: "Spider Drop", preset: "KIOSK_PROP_SPIDER",    emoji: "🕷", cooldownSec: 45 },
  { id: "scare",    label: "Jump Scare",  preset: "KIOSK_PROP_SCARE",     emoji: "👻", cooldownSec: 60 },
  { id: "thunder",  label: "Thunderclap", preset: "KIOSK_PROP_THUNDER",   emoji: "⚡", cooldownSec: 20 },
  { id: "eyes-on",  label: "Eyes On",     preset: "KIOSK_PROP_EYES_ON",   emoji: "👁", cooldownSec: 5 },
  { id: "eyes-off", label: "Eyes Off",    preset: "KIOSK_PROP_EYES_OFF",  emoji: "💤", cooldownSec: 5 },
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
  audioOnPreset: envString("VITE_AUDIO_ON_PRESET", "KIOSK_AUDIO_ON"),
  audioOffPreset: envString("VITE_AUDIO_OFF_PRESET", "KIOSK_AUDIO_OFF"),
  audioDurationSeconds: envNumber("VITE_AUDIO_DURATION_SECONDS", 360),
  pollIntervalMs: envNumber("VITE_POLL_INTERVAL_MS", 1000),
  demoMode: envBool("VITE_DEMO_MODE", true),
  demoAudioSeconds: envNumber("VITE_DEMO_AUDIO_SECONDS", 30),
  adminPin: envString("VITE_ADMIN_PIN", ""),
  newSongs: envStringArray("new_songs", []),
  props: DEFAULT_PROPS,
  brand: {
    name: "Hillard Lights",
    tagline: "A residential light show synced to music",
    motto: "One house. Two seasons. Way too many pixels.",
    siteUrl: "https://hillardlights.com",
    season,
    seasonYear: envNumber("VITE_SEASON_YEAR", 2026),
    seasonEmoji: season === "halloween" ? "🎃" : "🎄",
    seasonLabel: season === "halloween" ? "Halloween" : "Christmas",
    socials: {
      facebook: { label: "Facebook", handle: "hillardlights", url: "https://www.facebook.com/hillardlights/", emoji: "📘" },
      instagram: { label: "Instagram", handle: "@hillardlights", url: "https://www.instagram.com/hillardlights/", emoji: "📸" },
      youtube: { label: "YouTube", handle: "@hillardlights", url: "https://www.youtube.com/@hillardlights", emoji: "▶" },
      tiktok: { label: "TikTok", handle: "@hillardlights", url: "https://www.tiktok.com/@hillardlights", emoji: "🎵" },
    },
  },
} as const;

export type Config = typeof config;
