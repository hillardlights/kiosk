import { useEffect, useState } from "react";
import { config } from "../config";
import { useKiosk } from "../hooks/useKiosk";
import type { PropDef } from "../state/types";

function formatCooldown(remainingSec: number): string {
  const s = Math.max(0, Math.ceil(remainingSec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function PropButton({ def }: { def: PropDef }) {
  const { state, actions } = useKiosk();
  const runtime = state.props[def.id];
  const [now, setNow] = useState(() => Date.now());
  const offline = state.fppConnection !== "online";

  const cooldownUntil = runtime?.cooldownUntil ?? null;
  const cooling = cooldownUntil !== null && cooldownUntil > now;
  const remainingSec = cooling ? Math.max(0, (cooldownUntil - now) / 1000) : 0;
  const errorMsg = runtime?.lastError ?? null;

  // Effects are gated by what's on the wire so viewer taps can't collide
  // with a choreographed sequence. Idle time and the ambient waiting-loop
  // leave everything unlocked. A real music sequence blocks every effect
  // except those flagged `allowDuringSequence: true` (physical-only props
  // like the fog-bubble machine that don't share light channels).
  const nowPlayingName = state.nowPlaying?.song.name ?? null;
  const waitingName = config.waitingSequenceName;
  const inRealSequence =
    nowPlayingName !== null && (waitingName === "" || nowPlayingName !== waitingName);
  const showtimeBlocked = inRealSequence && def.allowDuringSequence !== true;

  useEffect(() => {
    if (!cooling) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [cooling]);

  const disabled = offline || cooling || showtimeBlocked;

  return (
    <button
      type="button"
      onClick={() => void actions.triggerProp(def.id)}
      disabled={disabled}
      className={
        "prop-button relative flex h-full w-full flex-col items-center justify-center " +
        "gap-3 rounded-3xl border px-4 py-4 transition active:scale-[0.97] " +
        (errorMsg
          ? "border-rose-500/40 bg-rose-950/40 text-rose-100"
          : cooling
            ? "border-white/10 bg-white/[0.04] text-neutral-500"
            : showtimeBlocked
              ? "border-accent-500/15 bg-accent-950/25 text-accent-200/60"
              : offline
                ? "border-rose-500/25 bg-rose-950/20 text-rose-200/60"
                : "border-accent-500/30 bg-gradient-to-b from-accent-950/60 to-black/70 text-accent-100 shadow-[0_0_28px_rgb(var(--accent-rgb) / 0.18)]")
      }
    >
      <span
        className={
          "text-6xl leading-none " +
          (cooling || showtimeBlocked
            ? "opacity-40"
            : "drop-shadow-[0_0_16px_rgb(var(--accent-rgb) / 0.55)]")
        }
      >
        {def.emoji}
      </span>
      {errorMsg ? (
        <>
          <span className="line-clamp-2 text-center text-base font-bold uppercase tracking-widest leading-tight">
            {def.label}
          </span>
          <span className="line-clamp-2 text-center text-xs font-semibold uppercase tracking-widest text-rose-200">
            {errorMsg}
          </span>
        </>
      ) : cooling ? (
        <>
          <span className="line-clamp-2 text-center text-sm font-semibold uppercase tracking-widest leading-tight text-neutral-400">
            {def.cooldownMessage}…
          </span>
          <span className="font-mono text-2xl font-bold tracking-wider text-cool-200">
            {formatCooldown(remainingSec)}
          </span>
        </>
      ) : showtimeBlocked ? (
        <>
          <span className="line-clamp-2 text-center text-base font-bold uppercase tracking-widest leading-tight text-accent-200/70">
            {def.label}
          </span>
          <span className="text-xs uppercase tracking-widest text-accent-300/60">
            🔒 During show
          </span>
        </>
      ) : (
        <>
          <span className="line-clamp-2 text-center text-base font-bold uppercase tracking-widest leading-tight">
            {def.label}
          </span>
          <span className="text-xs uppercase tracking-widest text-accent-300/70">
            {offline ? "Offline" : "Tap"}
          </span>
        </>
      )}
    </button>
  );
}
