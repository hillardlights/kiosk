import { useKiosk } from "../hooks/useKiosk";

// Full-width flash pill that pops up briefly when the audio button is
// tapped while already active — confirms the 6-min timer was refreshed.
// KioskContext clears state.audioResetAt after ~2s, unmounting the toast.
export function AudioResetToast() {
  const { state } = useKiosk();
  if (state.audioResetAt == null) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-8 z-50 -translate-x-1/2"
    >
      <div className="audio-reset-toast flex items-center gap-3 rounded-full border border-accent-400/60 bg-accent-500/25 px-6 py-3 shadow-[0_0_36px_rgb(var(--accent-rgb)_/_0.55)] backdrop-blur-sm">
        <span className="text-2xl leading-none" aria-hidden>
          🔊
        </span>
        <div className="text-left">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-accent-200/85">
            Timer Reset
          </p>
          <p className="text-lg font-black uppercase tracking-[0.08em] text-white">
            Speakers on for 6:00
          </p>
        </div>
      </div>
    </div>
  );
}
