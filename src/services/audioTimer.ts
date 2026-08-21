// Persistence for the outdoor-speaker timer. We store an absolute expiration
// timestamp (ms since epoch) so the countdown survives browser reloads and
// stays accurate under tab throttling. localStorage may be unavailable
// (private mode, corrupted profile) — every helper degrades to a no-op
// rather than throwing.

const STORAGE_KEY = "kiosk.audioExpiresAt";

export function readAudioExpiry(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function persistAudioExpiry(expiresAt: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(expiresAt));
  } catch {
    // No-op — the reducer state still tracks the expiry in-memory.
  }
}

export function clearAudioExpiry(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // No-op.
  }
}

export function remainingFromExpiry(expiresAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}
