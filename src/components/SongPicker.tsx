import { useMemo, useState } from "react";
import { useKiosk } from "../hooks/useKiosk";
import type { QueueItem } from "../state/types";

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function SongPicker() {
  const { state, actions } = useKiosk();
  const [justQueued, setJustQueued] = useState<Record<string, number>>({});

  const queuedSongIds = useMemo(() => new Set(state.queue.map((q) => q.song.id)), [state.queue]);
  const currentSongId = state.nowPlaying?.song.id;

  const offline = state.rfConnection !== "online";

  const onTap = (songId: string) => {
    if (offline) return;
    actions.queueSong(songId);
    setJustQueued((prev) => ({ ...prev, [songId]: Date.now() }));
    window.setTimeout(() => {
      setJustQueued((prev) => {
        const next = { ...prev };
        delete next[songId];
        return next;
      });
    }, 1500);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <QueueSummary queue={state.queue} />

      {offline ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-300">
            Song requests offline
          </p>
          <p className="mt-1 text-sm text-rose-100/80">
            Waiting for the request server to come back. Props and audio still work.
          </p>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
        <ul className="grid grid-cols-1 gap-3">
          {state.availableSongs.map((song) => {
            const isCurrent = song.id === currentSongId;
            const isQueued = queuedSongIds.has(song.id);
            const flash = justQueued[song.id];
            return (
              <li key={song.id}>
                <button
                  type="button"
                  onClick={() => onTap(song.id)}
                  disabled={offline || isCurrent}
                  className={
                    "song-row group w-full rounded-2xl border px-5 py-4 text-left transition " +
                    "active:scale-[0.99] disabled:opacity-70 " +
                    (isCurrent
                      ? "border-orange-500/45 bg-orange-500/15"
                      : flash
                        ? "border-emerald-400/60 bg-emerald-500/15"
                        : isQueued
                          ? "border-purple-400/40 bg-purple-500/10"
                          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]")
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xl font-bold text-white">{song.title}</p>
                      {song.artist ? (
                        <p className="truncate text-sm text-neutral-400">{song.artist}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-xs text-neutral-400">
                        {clock(song.durationSec)}
                      </span>
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em]">
                        {isCurrent ? (
                          <span className="text-orange-300">Playing</span>
                        ) : flash ? (
                          <span className="text-emerald-300">Queued!</span>
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
      <p className="mt-1 truncate text-lg font-semibold text-white">{upNext.song.title}</p>
      {rest > 0 ? (
        <p className="text-xs text-neutral-400">
          + {rest} more in the queue
        </p>
      ) : null}
    </div>
  );
}
