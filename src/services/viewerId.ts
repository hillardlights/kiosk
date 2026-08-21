const STORAGE_KEY = "kiosk.viewerId";

export function getOrCreateViewerId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // localStorage may be unavailable (private mode); fall through to mint an ephemeral id.
  }
  const fresh = crypto.randomUUID();
  try {
    window.localStorage.setItem(STORAGE_KEY, fresh);
  } catch {
    // Ephemeral only — still a valid identifier for the RF request.
  }
  return fresh;
}
