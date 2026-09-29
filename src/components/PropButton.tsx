import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!cooling) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [cooling]);

  const disabled = offline || cooling;

  return (
    <button
      type="button"
      onClick={() => void actions.triggerProp(def.id)}
      disabled={disabled}
      className={
        "prop-button relative flex aspect-square w-full flex-col items-center justify-center " +
        "gap-1 rounded-2xl border px-1.5 py-2 transition active:scale-[0.97] " +
        (errorMsg
          ? "border-rose-500/40 bg-rose-950/40 text-rose-100"
          : cooling
            ? "border-white/10 bg-white/[0.04] text-neutral-500"
            : offline
              ? "border-rose-500/25 bg-rose-950/20 text-rose-200/60"
              : "border-accent-500/30 bg-gradient-to-b from-accent-950/60 to-black/70 text-accent-100 shadow-[0_0_20px_rgb(var(--accent-rgb) / 0.15)]")
      }
    >
      <span
        className={
          "text-2xl leading-none " +
          (cooling
            ? "opacity-40"
            : "drop-shadow-[0_0_10px_rgb(var(--accent-rgb) / 0.5)]")
        }
      >
        {def.emoji}
      </span>
      {errorMsg ? (
        <>
          <span className="line-clamp-2 text-center text-[0.65rem] font-bold uppercase tracking-wider leading-tight">
            {def.label}
          </span>
          <span className="line-clamp-2 text-center text-[0.55rem] font-semibold uppercase tracking-wider text-rose-200">
            {errorMsg}
          </span>
        </>
      ) : cooling ? (
        <>
          <span className="line-clamp-2 text-center text-[0.6rem] font-semibold uppercase tracking-wider leading-tight text-neutral-400">
            {def.cooldownMessage}…
          </span>
          <span className="font-mono text-[0.7rem] font-bold text-cool-200">
            {formatCooldown(remainingSec)}
          </span>
        </>
      ) : (
        <>
          <span className="line-clamp-2 text-center text-[0.65rem] font-bold uppercase tracking-wider leading-tight">
            {def.label}
          </span>
          <span className="text-[0.55rem] uppercase tracking-widest text-accent-300/60">
            {offline ? "Offline" : "Tap"}
          </span>
        </>
      )}
    </button>
  );
}
