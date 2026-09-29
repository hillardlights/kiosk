import { config } from "../config";

// FPP's /api/system/status returns a rich object; we type only the fields
// we care about. Numeric fields arrive as strings — always parse.
export type FppStatus = {
  status?: string;
  mode?: string | number;
  mode_name?: string;
  fppd?: string;
  volume?: number;
  current_playlist?: {
    playlist?: string;
    section?: string;
    sequence?: string;
  };
  current_sequence?: string;
  current_song?: string;
  seconds_elapsed?: string;
  seconds_remaining?: string;
  seconds_played?: string;
};

export type FppError = {
  message: string;
  kind: "network" | "http" | "unknown";
};

export type FppResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: FppError };

export type FppNowPlaying = {
  sequenceName: string;
  elapsedSec: number;
  durationSec: number;
};

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

async function req<T>(
  path: string,
  signal?: AbortSignal,
): Promise<FppResult<T>> {
  const init: RequestInit = { method: "GET" };
  if (signal) init.signal = signal;
  try {
    const res = await fetch(joinUrl(config.fppUrl, path), init);
    if (!res.ok) {
      return {
        ok: false,
        error: { message: `HTTP ${res.status}`, kind: "http" },
      };
    }
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("application/json")
      ? ((await res.json()) as T)
      : ((await res.text()) as unknown as T);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: {
        message: err instanceof Error ? err.message : "Network error",
        kind: "network",
      },
    };
  }
}

// GET keeps us out of CORS preflight territory (no custom headers, no
// non-simple content types). FPP accepts either verb for this endpoint.
export async function triggerPreset(
  name: string,
  signal?: AbortSignal,
): Promise<FppResult> {
  const encoded = encodeURIComponent(name);
  const result = await req<unknown>(
    `/api/command/Trigger%20Command%20Preset/${encoded}`,
    signal,
  );
  if (result.ok) return { ok: true, data: undefined };
  return result;
}

// Direct volume control via FPP's built-in "Volume Set" command. Used by
// the audio button so a wiped command-preset list on the FPP can't leave
// the driveway speakers stuck at full volume.
export async function setVolume(
  level: number,
  signal?: AbortSignal,
): Promise<FppResult> {
  const clamped = Math.min(100, Math.max(0, Math.round(level)));
  const result = await req<unknown>(
    `/api/command/Volume%20Set/${clamped}`,
    signal,
  );
  if (result.ok) return { ok: true, data: undefined };
  return result;
}

export async function getStatus(signal?: AbortSignal): Promise<FppResult<FppStatus>> {
  return req<FppStatus>("/api/system/status", signal);
}

// FPP names sequences with extensions (`.fseq`, `.mp3`, etc.); RF stores
// them without. Normalize so we can match FPP's currently-playing sequence
// against the RF catalog for metadata enrichment.
export function stripSequenceExtension(name: string): string {
  return name.replace(/\.(fseq|mp3|wav|ogg|flac|m4a)$/i, "");
}

// Turn a raw status payload into a normalized now-playing snapshot, or
// null if FPP isn't currently playing a sequence.
export function extractNowPlaying(status: FppStatus): FppNowPlaying | null {
  const raw = status.current_sequence;
  if (!raw || raw.length === 0) return null;
  const elapsed = Number(status.seconds_elapsed);
  const remaining = Number(status.seconds_remaining);
  if (!Number.isFinite(elapsed) || !Number.isFinite(remaining)) return null;
  const duration = elapsed + remaining;
  if (duration <= 0) return null;
  return {
    sequenceName: stripSequenceExtension(raw),
    elapsedSec: elapsed,
    durationSec: duration,
  };
}
