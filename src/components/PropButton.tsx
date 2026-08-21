import { useEffect, useState } from "react";
import { useKiosk } from "../hooks/useKiosk";
import type { PropDef } from "../state/types";

export function PropButton({ def }: { def: PropDef }) {
  const { state, actions } = useKiosk();
  const runtime = state.props[def.id];
  const [now, setNow] = useState(() => Date.now());
  const offline = state.fppConnection !== "online";

  const cooldownUntil = runtime?.cooldownUntil ?? null;
  const cooling = cooldownUntil !== null && cooldownUntil > now;
  const remainingSec = cooling ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const errorMsg = runtime?.lastError ?? null;

  useEffect(() => {
    if (!cooling) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
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
        "gap-1 rounded-3xl border transition active:scale-[0.97] " +
        (errorMsg
          ? "border-rose-500/40 bg-rose-950/40 text-rose-100"
          : cooling
            ? "border-white/10 bg-white/[0.04] text-neutral-500"
            : offline
              ? "border-rose-500/25 bg-rose-950/20 text-rose-200/60"
              : "border-orange-500/30 bg-gradient-to-b from-orange-950/60 to-black/70 text-orange-100 shadow-[0_0_28px_rgba(249,115,22,0.15)]")
      }
    >
      <span className="text-4xl drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]">{def.emoji}</span>
      <span className="text-center text-sm font-bold uppercase tracking-[0.15em]">
        {def.label}
      </span>
      {errorMsg ? (
        <span className="mt-1 max-w-[90%] truncate text-center text-[0.6rem] font-semibold uppercase tracking-widest text-rose-200">
          {errorMsg}
        </span>
      ) : cooling ? (
        <span className="mt-1 font-mono text-xs text-neutral-500">Ready in {remainingSec}s</span>
      ) : offline ? (
        <span className="mt-1 text-[0.6rem] uppercase tracking-widest text-rose-300/70">Offline</span>
      ) : (
        <span className="mt-1 text-[0.6rem] uppercase tracking-widest text-orange-300/60">Tap</span>
      )}
    </button>
  );
}
