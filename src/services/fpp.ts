import { config } from "../config";

// FPP's /api/system/status returns a rich object; we type only the fields
// we care about. Everything else is ignored.
export type FppStatus = {
  status?: string;
  mode?: string;
  fppd?: string;
  volume?: number;
  current_playlist?: {
    playlist?: string;
    section?: string;
    sequence?: string;
  };
  current_sequence?: string;
  current_song?: string;
  time?: string;
  time_elapsed?: string;
  time_remaining?: string;
};

export type FppError = {
  message: string;
  kind: "network" | "http" | "unknown";
};

export type FppResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: FppError };

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

export async function getStatus(signal?: AbortSignal): Promise<FppResult<FppStatus>> {
  return req<FppStatus>("/api/system/status", signal);
}
