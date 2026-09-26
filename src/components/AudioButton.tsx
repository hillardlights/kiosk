import { useKiosk } from "../hooks/useKiosk";
import { config } from "../config";

function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function AudioButton() {
  const { state, actions } = useKiosk();

  const isBusy = state.audio === "starting" || state.audio === "stopping";
  const isActive = state.audio === "active";
  const isOff = state.audio === "off";

  const onClick = () => {
    if (isBusy) return;
    if (isActive) actions.audioOff();
    else actions.audioOn();
  };

  const primary = isActive
    ? "AUDIO ON THE SPEAKERS"
    : state.audio === "starting"
      ? "TURNING ON…"
      : state.audio === "stopping"
        ? "TURNING OFF…"
        : "TAP TO TURN ON";

  const detail = isActive
    ? formatCountdown(state.audioRemainingSec)
    : state.audio === "off"
      ? "Auto-off after 6 min · Tap again to add time"
      : " ";

  const totalSec = config.audioDurationSeconds;
  const pct = isActive
    ? Math.min(100, Math.max(0, (state.audioRemainingSec / totalSec) * 100))
    : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      className={
        "audio-button relative w-full overflow-hidden rounded-[2.5rem] px-8 py-14 text-center " +
        "transition-transform active:scale-[0.985] " +
        (isActive ? "is-active" : isOff ? "is-idle" : "")
      }
    >
      <span
        aria-hidden
        className="relative z-10 mb-2 block text-5xl leading-none"
      >
        {isActive ? "🔊" : "🔈"}
      </span>
      <span className="relative z-10 block text-[clamp(1.75rem,4.5vw,3.25rem)] font-black uppercase tracking-[0.1em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">
        {primary}
      </span>
      <span
        className={
          "relative z-10 mt-4 block font-mono font-semibold tracking-[0.15em] " +
          (isActive
            ? "text-[clamp(2.75rem,7vw,4.5rem)] text-accent-100 drop-shadow-[0_0_22px_rgb(var(--accent-rgb)_/_0.7)]"
            : "text-[clamp(0.9rem,1.6vw,1.15rem)] text-cool-100/80")
        }
      >
        {detail}
      </span>

      {isActive ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-4 z-10 h-1.5 overflow-hidden rounded-full bg-white/10"
        >
          <span
            className="block h-full rounded-full bg-gradient-to-r from-accent-300 to-accent-500 shadow-[0_0_12px_rgb(var(--accent-rgb)_/_0.6)] transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </span>
      ) : null}
    </button>
  );
}
