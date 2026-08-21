import { useKiosk } from "../hooks/useKiosk";

export function ShowButton() {
  const { state, actions } = useKiosk();

  const disabled = state.show === "starting" || state.show === "playing";
  const label =
    state.show === "starting"
      ? "STARTING…"
      : state.show === "playing"
        ? "SHOW PLAYING"
        : "START THE SHOW";
  const subtitle =
    state.show === "playing"
      ? "Enjoy the lights!"
      : state.show === "starting"
        ? "Cueing up the show"
        : "Tap to begin the Halloween show";

  return (
    <button
      type="button"
      onClick={actions.startShow}
      disabled={disabled}
      className={
        "show-button relative w-full rounded-[2.25rem] px-10 py-14 text-center " +
        "transition active:scale-[0.985] disabled:opacity-90 " +
        (state.show === "playing" ? "is-playing" : "")
      }
    >
      <span className="block text-[clamp(2rem,6.5vw,4.5rem)] font-black uppercase tracking-[0.08em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)]">
        {label}
      </span>
      <span className="mt-4 block text-[clamp(1rem,1.9vw,1.5rem)] font-medium uppercase tracking-[0.35em] text-orange-100/85">
        {subtitle}
      </span>
    </button>
  );
}
