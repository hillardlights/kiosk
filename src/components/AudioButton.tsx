import { useKiosk } from "../hooks/useKiosk";

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
        : "TURN AUDIO ON";

  const detail = isActive
    ? formatCountdown(state.audioRemainingSec)
    : state.audio === "off"
      ? "Outdoor speakers · auto-off after 6 minutes"
      : " ";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      className={
        "audio-button relative w-full rounded-[2rem] px-8 py-10 text-center " +
        "transition active:scale-[0.985] " +
        (isActive ? "is-active" : "")
      }
    >
      <span className="block text-[clamp(1.5rem,4.5vw,3rem)] font-black uppercase tracking-[0.1em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">
        {primary}
      </span>
      <span
        className={
          "mt-3 block font-mono font-semibold tracking-[0.15em] " +
          (isActive
            ? "text-[clamp(2.5rem,6vw,4rem)] text-orange-200 drop-shadow-[0_0_18px_rgba(249,115,22,0.55)]"
            : "text-[clamp(0.9rem,1.6vw,1.25rem)] text-purple-100/80")
        }
      >
        {detail}
      </span>
    </button>
  );
}
