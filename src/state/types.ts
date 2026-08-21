export type ConnectionState = "connecting" | "online" | "offline";

export type AudioState = "off" | "starting" | "active" | "stopping" | "error";

export type ViewerControlMode = "JUKEBOX" | "VOTING";

// `name` is the sequence identifier RF/FPP use internally; `displayName` is
// what the visitor sees. When RF omits displayName, callers should fall back
// to name.
export type Song = {
  name: string;
  displayName: string;
  artist: string | null;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
};

export type QueueItem = {
  position: number;
  song: Song;
};

export type NowPlaying = {
  song: Song;
  elapsedSec: number;
  durationSec: number | null;
  queuedByKiosk: boolean;
};

export type PropDef = {
  id: string;
  label: string;
  preset: string;
  emoji: string;
  cooldownSec: number;
};

export type PropRuntime = {
  cooldownUntil: number | null;
  lastError: string | null;
};

export type TabId = "songs" | "props" | "audio";

export type SongFeedback =
  | { kind: "queued"; songName: string; at: number }
  | { kind: "error"; songName: string; message: string; at: number };

// Mirror of the RF preferences the kiosk cares about. jukeboxDepth === 0
// means unlimited per RF's own semantics.
export type ShowStatus = {
  showEnabled: boolean;
  showName: string | null;
  mode: ViewerControlMode | null;
  jukeboxDepth: number;
  jukeboxRequestLimit: number;
  checkIfRequested: boolean;
  locationCheckMethod: string | null;
};

export type KioskState = {
  fppConnection: ConnectionState;
  rfConnection: ConnectionState;
  audio: AudioState;
  audioRemainingSec: number;
  nowPlaying: NowPlaying | null;
  queue: QueueItem[];
  availableSongs: Song[];
  props: Record<string, PropRuntime>;
  showStatus: ShowStatus;
  songFeedback: SongFeedback | null;
  // Song names the kiosk has queued that are still pending in RF's queue.
  // Pruned on each rf/sync as items exit the queue.
  kioskQueuedSongs: string[];
};
