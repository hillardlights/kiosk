import type { PropDef } from "./state/types";

function envString(key: string, fallback: string): string {
  const value = import.meta.env[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function envNumber(key: string, fallback: number): number {
  const raw = import.meta.env[key];
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = import.meta.env[key];
  if (typeof raw !== "string") return fallback;
  return raw === "true" || raw === "1";
}

function envSeason(key: string, fallback: "halloween" | "christmas"): "halloween" | "christmas" {
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
export const APP_VERSION = "0.7.0";

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
      youtube: { label: "YouTube", handle: "@hillardlights", url: "https://www.youtube.com/@hillardlights", emoji: "▶" },
      tiktok: { label: "TikTok", handle: "@hillardlights", url: "https://www.tiktok.com/@hillardlights", emoji: "🎵" },
      instagram: { label: "Instagram", handle: "@hillardlights", url: "https://www.instagram.com/hillardlights/", emoji: "📸" },
    },
  },
} as const;

export type Config = typeof config;
