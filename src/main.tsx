import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

// Fetch runtime overrides from /config.json (written by the boot-time
// systemd unit from /boot/firmware/kiosk.conf on the Pi). Sets a global
// that config.ts consults before falling back to build-time env values.
// The dynamic import of ./App below guarantees config.ts doesn't
// evaluate until this fetch has completed.
async function loadRuntimeConfig(): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch("/config.json", {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return;
    const data = (await res.json()) as Record<string, unknown>;
    (globalThis as { __KIOSK_RUNTIME_CONFIG__?: Record<string, unknown> })
      .__KIOSK_RUNTIME_CONFIG__ = data;
  } catch {
    // No /config.json served, request timed out, or JSON was malformed.
    // Silently fall through to build-time defaults from .env.
  } finally {
    window.clearTimeout(timer);
  }
}

void (async () => {
  await loadRuntimeConfig();
  const { default: App } = await import("./App");
  const { config } = await import("./config");
  // Set the season attribute so index.css can swap the accent/cool
  // palette. Must happen before first paint of app content so we
  // never flash the wrong season's colors.
  document.documentElement.dataset.season = config.brand.season;
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
})();
