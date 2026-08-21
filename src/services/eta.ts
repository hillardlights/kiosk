import type { KioskState, QueueItem } from "../state/types";

// RF doesn't return durations in the sequences list — we only know exact
// length for the currently-playing sequence (from FPP's anchor). For queued
// songs we estimate using this typical show-sequence length.
const AVG_SEQUENCE_SEC = 210;

/**
 * Approximate seconds until the queued song at `queueIndex` starts playing.
 * Sums: seconds remaining on current song + estimated duration of every
 * earlier queue entry.
 */
export function estimateEtaSec(
  queueIndex: number,
  state: Pick<KioskState, "nowPlaying">,
): number {
  const np = state.nowPlaying;
  const currentRemaining = np?.durationSec != null
    ? Math.max(0, np.durationSec - np.elapsedSec)
    : AVG_SEQUENCE_SEC;
  return currentRemaining + queueIndex * AVG_SEQUENCE_SEC;
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
