import type { KioskState, QueueItem } from "../state/types";

// Fallback when a queued song's duration is unknown (RF sometimes returns
// null for freshly-uploaded sequences). Roughly the median show track.
const AVG_SEQUENCE_SEC = 210;

/**
 * Approximate seconds until the queued song at `queueIndex` starts playing.
 * Sums: seconds remaining on current song + real duration of every earlier
 * queue entry (falling back to AVG_SEQUENCE_SEC only if RF hasn't populated
 * duration for that sequence).
 */
export function estimateEtaSec(
  queueIndex: number,
  state: Pick<KioskState, "nowPlaying" | "queue">,
): number {
  const np = state.nowPlaying;
  const currentRemaining = np?.durationSec != null
    ? Math.max(0, np.durationSec - np.elapsedSec)
    : AVG_SEQUENCE_SEC;
  let precedingSec = 0;
  for (let i = 0; i < queueIndex; i++) {
    precedingSec += state.queue[i]?.song.durationSec ?? AVG_SEQUENCE_SEC;
  }
  return currentRemaining + precedingSec;
}

export function formatEta(seconds: number): string {
  if (seconds <= 30) return "any moment";
  const mins = Math.round(seconds / 60);
  if (mins <= 1) return "~1 min";
  return `~${mins} min`;
}

export function queueIndexOfKioskSong(
  queue: QueueItem[],
  kioskQueuedSongs: string[],
): number | null {
  const set = new Set(kioskQueuedSongs);
  const idx = queue.findIndex((q) => set.has(q.song.name));
  return idx < 0 ? null : idx;
}
