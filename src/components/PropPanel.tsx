import { config } from "../config";
import { useKiosk } from "../hooks/useKiosk";
import { PropButton } from "./PropButton";

export function PropPanel() {
  const { state } = useKiosk();
  const nowPlayingName = state.nowPlaying?.song.name ?? null;
  const waitingName = config.waitingSequenceName;
  const inRealSequence =
    nowPlayingName !== null && (waitingName === "" || nowPlayingName !== waitingName);
  const nowPlayingTitle = state.nowPlaying?.song.displayName ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {inRealSequence ? (
        <div className="rounded-2xl border border-accent-500/40 bg-accent-950/40 px-4 py-3 text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-accent-200">
            🔒 Show in progress
          </p>
          <p className="mt-1 text-sm text-neutral-200">
            Only{" "}
            <span className="font-bold text-accent-100">Fobbles</span>{" "}
            fires while a song plays
            {nowPlayingTitle ? ` — enjoy “${nowPlayingTitle}”` : ""}. Other
            effects unlock between songs.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-black/40 px-4 py-3 text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-accent-300/80">
            Audience Effects
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            Tap once — each effect cools down before it can fire again.
          </p>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <div className="grid h-full grid-cols-4 grid-rows-2 gap-3">
          {config.props.map((def) => (
            <PropButton key={def.id} def={def} />
          ))}
        </div>
      </div>
    </div>
  );
}
