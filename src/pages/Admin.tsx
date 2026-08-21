import { useCallback, useEffect, useState } from "react";
import { PinGate } from "../components/admin/PinGate";
import { APP_VERSION, config } from "../config";
import { useKiosk } from "../hooks/useKiosk";
import { clearAudioExpiry } from "../services/audioTimer";
import * as fpp from "../services/fpp";
import * as rf from "../services/rf";

export function Admin({ onClose }: { onClose: () => void }) {
  const requirePin = config.adminPin.length > 0;
  const [gate, setGate] = useState<"pin" | "open">(requirePin ? "pin" : "open");

  if (gate === "pin") {
    return (
      <AdminOverlay title="Admin" onClose={onClose}>
        <PinGate onSuccess={() => setGate("open")} onCancel={onClose} />
      </AdminOverlay>
    );
  }

  return (
    <AdminOverlay title="Admin" onClose={onClose}>
      <AdminContent onClose={onClose} />
    </AdminOverlay>
  );
}

function AdminOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/70 px-6 py-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-orange-300/80">
          {title}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-bold uppercase tracking-widest text-white hover:bg-white/[0.1]"
        >
          Exit
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function AdminContent({ onClose }: { onClose: () => void }) {
  const { state, actions } = useKiosk();
  const [swStatus, setSwStatus] = useState<"unknown" | "ready" | "none">("unknown");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setSwStatus("none");
      return;
    }
    void navigator.serviceWorker.getRegistration().then((reg) => {
      setSwStatus(reg ? "ready" : "none");
    });
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-6 py-8">
      <Section title="Live status">
        <div className="grid grid-cols-2 gap-3">
          <Cell label="FPP" value={state.fppConnection.toUpperCase()} tone={toneForConn(state.fppConnection)} />
          <Cell label="RF" value={state.rfConnection.toUpperCase()} tone={toneForConn(state.rfConnection)} />
          <Cell label="Audio" value={state.audio.toUpperCase()} tone={state.audio === "active" ? "warn" : "neutral"} />
          <Cell
            label="Audio expires"
            value={
              state.audioExpiresAt
                ? new Date(state.audioExpiresAt).toLocaleTimeString()
                : "—"
            }
          />
          <Cell
            label="Now playing"
            value={state.nowPlaying?.song.displayName ?? "—"}
            wide
          />
          <Cell label="Queue depth" value={String(state.queue.length)} />
          <Cell
            label="Show mode"
            value={
              state.showStatus.mode
                ? `${state.showStatus.mode} · ${state.showStatus.showEnabled ? "on" : "off"}`
                : "—"
            }
          />
          <Cell label="Kiosk-queued" value={String(state.kioskQueuedSongs.length)} />
          <Cell label="Service worker" value={swStatus.toUpperCase()} tone={swStatus === "ready" ? "ok" : "neutral"} />
        </div>
      </Section>

      <Section title="Diagnostics">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TestButton
            label="Test FPP status"
            run={async () => {
              const r = await fpp.getStatus();
              if (!r.ok) throw new Error(r.error.message);
              const s = r.data;
              return `mode=${s.mode_name ?? s.mode ?? "?"} · fppd=${s.fppd ?? "?"} · seq=${s.current_sequence ?? "(idle)"}`;
            }}
          />
          <TestButton
            label="Test RF getShow"
            run={async () => {
              const show = await rf.getShow();
              return `${show.showName ?? "?"} · seqs=${show.sequences.length} · queue=${show.requests.length}`;
            }}
          />
          <TestButton
            label="Force AUDIO OFF (safety)"
            run={async () => {
              clearAudioExpiry();
              await actions.audioOff();
              return "Cleared timer + fired KIOSK_AUDIO_OFF";
            }}
          />
          <TestButton
            label="Fire test AUDIO ON"
            run={async () => {
              await actions.audioOn();
              return "Sent KIOSK_AUDIO_ON — countdown active";
            }}
          />
        </div>
      </Section>

      <Section title="Configuration">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <KV k="Version" v={APP_VERSION} />
          <KV k="Demo mode" v={config.demoMode ? "ON" : "off"} />
          <KV k="FPP URL" v={config.fppUrl} />
          <KV k="RF API" v={config.rfBaseUrl} />
          <KV k="RF subdomain" v={config.rfSubdomain} />
          <KV k="Season" v={`${config.brand.seasonLabel} ${config.brand.seasonYear}`} />
          <KV k="Audio duration" v={`${config.audioDurationSeconds}s`} />
          <KV k="Admin PIN" v={config.adminPin ? "set" : "not set"} />
          <KV k="RF poll" v={`${config.rfPollMs}ms`} />
          <KV k="RF presence" v={`${config.rfPresenceMs}ms`} />
        </div>
      </Section>

      <Section title="Kiosk actions" tone="danger">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TestButton
            label="Reload kiosk"
            run={async () => {
              window.location.reload();
              return "Reloading…";
            }}
          />
          <TestButton
            label="Clear localStorage + reload"
            run={async () => {
              try {
                window.localStorage.clear();
              } catch {
                // ignore
              }
              window.location.reload();
              return "Cleared + reloading…";
            }}
          />
        </div>
      </Section>

      <div className="pt-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl border border-orange-500/40 bg-orange-500/10 px-8 py-4 text-lg font-bold uppercase tracking-widest text-orange-100 hover:bg-orange-500/15"
        >
          Return to kiosk
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  tone = "default",
  children,
}: {
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        "rounded-3xl border p-5 " +
        (tone === "danger"
          ? "border-rose-500/25 bg-rose-950/20"
          : "border-white/10 bg-white/[0.03]")
      }
    >
      <h2 className="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-neutral-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Cell({
  label,
  value,
  tone = "neutral",
  wide = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "bad";
  wide?: boolean;
}) {
  const toneCls =
    tone === "ok"
      ? "text-emerald-300"
      : tone === "warn"
        ? "text-amber-300"
        : tone === "bad"
          ? "text-rose-300"
          : "text-white";
  return (
    <div
      className={
        "rounded-2xl border border-white/8 bg-black/40 px-4 py-3 " +
        (wide ? "col-span-2" : "")
      }
    >
      <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p className={"mt-1 truncate font-mono text-sm " + toneCls}>{value}</p>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2 last:border-b-0">
      <span className="text-neutral-400">{k}</span>
      <span className="truncate font-mono text-neutral-200">{v}</span>
    </div>
  );
}

function toneForConn(c: "connecting" | "online" | "offline"): "ok" | "warn" | "bad" {
  if (c === "online") return "ok";
  if (c === "connecting") return "warn";
  return "bad";
}

type TestButtonProps = { label: string; run: () => Promise<string> };
function TestButton({ label, run }: TestButtonProps) {
  const [status, setStatus] = useState<"idle" | "running" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const onClick = useCallback(async () => {
    setStatus("running");
    setMessage("");
    try {
      const result = await run();
      setStatus("ok");
      setMessage(result);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed");
    }
    window.setTimeout(() => setStatus("idle"), 5000);
  }, [run]);

  const border =
    status === "ok"
      ? "border-emerald-500/40 bg-emerald-500/10"
      : status === "error"
        ? "border-rose-500/40 bg-rose-500/10"
        : status === "running"
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === "running"}
      className={
        "rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] " +
        border
      }
    >
      <p className="text-sm font-bold uppercase tracking-widest text-white">{label}</p>
      <p className="mt-1 min-h-[1.25rem] truncate font-mono text-xs text-neutral-300">
        {status === "idle" ? "Tap to run" : status === "running" ? "Running…" : message}
      </p>
    </button>
  );
}
