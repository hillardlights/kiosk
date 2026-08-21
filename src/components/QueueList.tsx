import { useMemo } from "react";
import { estimateEtaSec, formatEta } from "../services/eta";
import type { KioskState, QueueItem, ShowStatus } from "../state/types";
import { AlbumArt } from "./AlbumArt";

export function QueueList({
  queue,
  kioskQueuedSongs,
  showStatus,
  nowPlaying,
}: {
  queue: QueueItem[];
  kioskQueuedSongs: string[];
  showStatus: ShowStatus;
  nowPlaying: KioskState["nowPlaying"];
}) {
  const kioskSet = useMemo(() => new Set(kioskQueuedSongs), [kioskQueuedSongs]);
  const cap = showStatus.jukeboxDepth > 0 ? showStatus.jukeboxDepth : null;
  const capacityLabel = cap != null ? `${queue.length} / ${cap}` : `${queue.length}`;

  if (queue.length === 0) {
    return (
      <section className="rounded-3xl border border-white/8 bg-black/40 px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-neutral-500">
            Queue
          </p>
          <p className="font-mono text-xs text-neutral-500">{capacityLabel}</p>
        </div>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Nothing queued — pick a song and you're up next!
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-cool-500/25 bg-cool-950/25 px-4 py-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-cool-300/80">
          Queue
        </p>
        <p className="font-mono text-xs text-cool-200/80">{capacityLabel}</p>
      </div>

      <ol className="flex max-h-[40vh] min-h-0 flex-col gap-2 overflow-y-auto pr-1">
        {queue.map((item, idx) => {
          const isUpNext = idx === 0;
          const mine = kioskSet.has(item.song.name);
          const etaSec = estimateEtaSec(idx, { nowPlaying });
          return (
            <li
              key={`${item.position}-${item.song.name}`}
              className={
                "flex items-center gap-3 rounded-2xl border px-3 py-2.5 " +
                (mine
                  ? "border-emerald-400/45 bg-emerald-500/10"
                  : isUpNext
                    ? "border-cool-400/40 bg-cool-500/12"
                    : "border-white/10 bg-white/[0.04]")
              }
            >
              <span
                className={
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold " +
                  (mine
                    ? "bg-emerald-500/25 text-emerald-100"
                    : isUpNext
                      ? "bg-cool-500/25 text-cool-100"
                      : "bg-white/10 text-neutral-300")
                }
                aria-label={`Position ${idx + 1}`}
              >
                {idx + 1}
              </span>
              <AlbumArt
                imageUrl={item.song.imageUrl}
                alt={item.song.displayName}
                size="tiny"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">
                  {item.song.displayName}
                </p>
                <div className="flex items-center gap-2 truncate text-xs text-neutral-400">
                  {item.song.artist ? (
                    <span className="truncate">{item.song.artist}</span>
                  ) : null}
                  {item.song.artist ? <span aria-hidden>·</span> : null}
                  <span className="whitespace-nowrap text-neutral-500">
                    {isUpNext ? "up next" : `plays in ${formatEta(etaSec)}`}
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-widest">
                {mine ? (
                  <span className="text-emerald-300">Your request</span>
                ) : isUpNext ? (
                  <span className="text-cool-200">Up next</span>
                ) : (
                  <span className="text-neutral-500">Queued</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
