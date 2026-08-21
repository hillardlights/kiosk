import { useMemo } from "react";
import { useKiosk } from "../hooks/useKiosk";
import type { QueueItem } from "../state/types";

export function SongPicker() {
  const { state, actions } = useKiosk();

  const queuedSongNames = useMemo(
    () => new Set(state.queue.map((q) => q.song.name)),
    [state.queue],
  );
  const currentSongName = state.nowPlaying?.song.name;
  const offline = state.rfConnection !== "online";
  const showDisabled = !state.showStatus.showEnabled;
  const feedback = state.songFeedback;

  const onTap = (songName: string) => {
    if (offline || showDisabled) return;
    void actions.queueSong(songName);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <QueueSummary queue={state.queue} />

      {offline ? (
        <Banner
          tone="error"
          label="Song requests offline"
          body="Waiting for the request server to come back. Props and audio still work."
        />
      ) : showDisabled ? (
        <Banner
          tone="warn"
          label="Show is currently off"
          body="Song requests will open when the show turns on."
        />
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
        <ul className="grid grid-cols-1 gap-3">
          {state.availableSongs.length === 0 && !offline ? (
            <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-center text-neutral-400">
              No songs loaded from the show yet.
            </li>
          ) : null}
          {state.availableSongs.map((song) => {
            const isCurrent = song.name === currentSongName;
            const isQueued = queuedSongNames.has(song.name);
            const flash =
              feedback && feedback.songName === song.name ? feedback : null;
            const flashKind = flash?.kind;

            return (
              <li key={song.name}>
                <button
                  type="button"
                  onClick={() => onTap(song.name)}
                  disabled={offline || showDisabled || isCurrent}
                  className={
                    "song-row group w-full rounded-2xl border px-5 py-4 text-left transition " +
                    "active:scale-[0.99] disabled:opacity-70 " +
                    (isCurrent
                      ? "border-orange-500/45 bg-orange-500/15"
                      : flashKind === "queued"
                        ? "border-emerald-400/60 bg-emerald-500/15"
                        : flashKind === "error"
                          ? "border-rose-400/60 bg-rose-500/15"
                          : isQueued
                            ? "border-purple-400/40 bg-purple-500/10"
                            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]")
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-bold text-white">
                        {song.displayName}
                      </p>
                      {song.artist ? (
                        <p className="truncate text-sm text-neutral-400">{song.artist}</p>
                      ) : null}
                      {flash && flash.kind === "error" ? (
                        <p className="mt-1 text-sm text-rose-200">{flash.message}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em]">
                        {isCurrent ? (
                          <span className="text-orange-300">Playing</span>
                        ) : flashKind === "queued" ? (
                          <span className="text-emerald-300">Queued!</span>
                        ) : flashKind === "error" ? (
                          <span className="text-rose-300">Try again</span>
                        ) : isQueued ? (
                          <span className="text-purple-300">In queue</span>
                        ) : (
                          <span className="text-neutral-500 group-hover:text-orange-300">Tap to queue</span>
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function QueueSummary({ queue }: { queue: QueueItem[] }) {
  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-black/40 px-4 py-3 text-center text-sm text-neutral-400">
        Queue is empty — you're next up!
      </div>
    );
  }
  const upNext = queue[0]!;
  const rest = queue.length - 1;
  return (
    <div className="rounded-2xl border border-purple-500/25 bg-purple-950/30 px-4 py-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-purple-300/80">
        Up next
      </p>
      <p className="mt-1 truncate text-lg font-semibold text-white">{upNext.song.displayName}</p>
      {rest > 0 ? (
        <p className="text-xs text-neutral-400">+ {rest} more in the queue</p>
      ) : null}
    </div>
  );
}

function Banner({
  tone,
  label,
  body,
}: {
  tone: "error" | "warn";
  label: string;
  body: string;
}) {
  const cls =
    tone === "error"
      ? "border-rose-500/30 bg-rose-950/40 text-rose-200"
      : "border-amber-500/30 bg-amber-950/30 text-amber-100";
  return (
    <div className={"rounded-3xl border px-5 py-4 text-center " + cls}>
      <p className="text-xs font-semibold uppercase tracking-[0.4em]">{label}</p>
      <p className="mt-1 text-sm opacity-90">{body}</p>
    </div>
  );
}
