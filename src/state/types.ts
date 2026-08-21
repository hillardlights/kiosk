export type FppConnectionState = "connecting" | "online" | "offline";

export type ShowState = "idle" | "starting" | "playing" | "stopping" | "error";

export type AudioState = "off" | "starting" | "active" | "stopping" | "error";

export type NowPlaying = {
  title: string;
  elapsedSec: number;
  durationSec: number;
};

export type KioskState = {
  connection: FppConnectionState;
  show: ShowState;
  audio: AudioState;
  nowPlaying: NowPlaying | null;
  audioRemainingSec: number;
};
