import { useRef, useState } from "react";
import { config } from "../config";
import { useKiosk } from "../hooks/useKiosk";

function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

// Compact audio widget for the right rail — always visible so the driveway
// speakers are one tap from any tab. Shares state with the full AudioPanel.
export function AudioCard() {
  const { state, actions } = useKiosk();
  const isBusy = state.audio === "starting" || state.audio === "stopping";
  const isActive = state.audio === "active";
  const totalSec = config.audioDurationSeconds;
  const pct = isActive
    ? Math.min(100, Math.max(0, (state.audioRemainingSec / totalSec) * 100))
    : 0;

  // Local flash so the button visibly responds the instant the finger
  // touches down, without waiting for the browser's touchend → click
  // pipeline. Prevents the "did my tap register?" 2-second feeling on
  // the Pi 4.
  const [tapped, setTapped] = useState(false);
  const firedRef = useRef(false);

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (!isBusy) actions.audioOn();
    // Release the guard on next frame so a follow-up tap can fire again.
    window.setTimeout(() => {
      firedRef.current = false;
    }, 200);
  };

  const onPointerDown = () => {
    setTapped(true);
    // Trigger the action on pointer-down so state flips before Chromium
    // finishes its synthesized-click pipeline. onClick still runs as a
    // fallback for keyboard/no-pointer environments; firedRef prevents
    // a double-fire.
    fire();
  };
  const onPointerUp = () => setTapped(false);
  const onPointerCancel = () => setTapped(false);
  const onClick = () => {
    fire();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerCancel}
      disabled={isBusy}
      className={
        "audio-card relative flex h-[168px] flex-col overflow-hidden rounded-3xl border p-4 text-left " +
        (tapped ? "tapped " : "") +
        (isActive
          ? "is-active border-accent-400/45 bg-accent-950/40"
          : "is-idle border-cool-400/35 bg-cool-950/30")
      }
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {isActive ? "🔊" : "🔈"}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={
              "text-[0.6rem] font-semibold uppercase tracking-[0.4em] " +
              (isActive ? "text-accent-300/85" : "text-cool-300/85")
            }
          >
            Driveway Speakers
          </p>
          <p className="mt-0.5 text-sm font-black uppercase tracking-[0.08em] text-white">
            {isActive
              ? "Tap to add time"
              : state.audio === "starting"
                ? "Turning on…"
                : state.audio === "stopping"
                  ? "Turning off…"
                  : "Tap to turn on"}
          </p>
        </div>
      </div>

      {/* Second row is a fixed slot so the card height never changes as the
         state flips — a shifting hit target was letting taps register on
         whatever ended up under the finger after the button grew. */}
      <div className="mt-auto">
        {isActive ? (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-accent-200/70">
                Remaining
              </span>
              <span className="font-mono text-3xl font-bold tabular-nums text-accent-100 drop-shadow-[0_0_14px_rgb(var(--accent-rgb)_/_0.6)]">
                {formatCountdown(state.audioRemainingSec)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-300 to-accent-500 shadow-[0_0_10px_rgb(var(--accent-rgb)_/_0.55)] transition-[width] duration-1000 ease-linear"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-[0.65rem] uppercase tracking-widest text-neutral-500">
            Auto-off after 6 min
          </p>
        )}
      </div>
    </button>
  );
}
