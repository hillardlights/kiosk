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

export const config = {
  fppUrl: envString("VITE_FPP_URL", "http://192.168.1.1"),
  showPlaylist: envString("VITE_SHOW_PLAYLIST", "Hillard Lights"),
  audioOnPreset: envString("VITE_AUDIO_ON_PRESET", "KIOSK_AUDIO_ON"),
  audioOffPreset: envString("VITE_AUDIO_OFF_PRESET", "KIOSK_AUDIO_OFF"),
  audioDurationSeconds: envNumber("VITE_AUDIO_DURATION_SECONDS", 360),
  pollIntervalMs: envNumber("VITE_POLL_INTERVAL_MS", 1000),
  demoMode: envBool("VITE_DEMO_MODE", true),
  demoAudioSeconds: envNumber("VITE_DEMO_AUDIO_SECONDS", 30),
  adminPin: envString("VITE_ADMIN_PIN", ""),
} as const;

export type Config = typeof config;
