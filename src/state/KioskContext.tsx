import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { config } from "../config";
import {
  DEMO_INITIAL_NOW_PLAYING_ELAPSED,
  DEMO_INITIAL_QUEUE,
  DEMO_SONGS,
} from "./demoData";
import type {
  AudioState,
  ConnectionState,
  KioskState,
  NowPlaying,
  PropRuntime,
  QueueItem,
  Song,
} from "./types";

type Action =
  | { type: "connection/fpp"; state: ConnectionState }
  | { type: "connection/rf"; state: ConnectionState }
  | { type: "song/queue"; item: QueueItem }
  | { type: "song/advance" }
  | { type: "song/tick"; elapsedSec: number }
  | { type: "audio/set"; state: AudioState; remainingSec?: number }
  | { type: "audio/tick"; remainingSec: number }
  | { type: "prop/cooldown"; propId: string; until: number }
  | { type: "prop/ready"; propId: string }
  | { type: "prop/error"; propId: string; message: string };

function buildInitialProps(): Record<string, PropRuntime> {
  const out: Record<string, PropRuntime> = {};
  for (const p of config.props) {
    out[p.id] = { cooldownUntil: null, lastError: null };
  }
  return out;
}

function initialState(): KioskState {
  const inDemo = config.demoMode;
  const firstUp: NowPlaying | null = inDemo
    ? {
        song: DEMO_SONGS[1]!,
        elapsedSec: DEMO_INITIAL_NOW_PLAYING_ELAPSED,
        queuedByKiosk: false,
      }
    : null;
  return {
    fppConnection: inDemo ? "online" : "connecting",
    rfConnection: inDemo ? "online" : "connecting",
    audio: "off",
    audioRemainingSec: 0,
    nowPlaying: firstUp,
    queue: inDemo ? [...DEMO_INITIAL_QUEUE] : [],
    availableSongs: inDemo ? DEMO_SONGS : [],
    props: buildInitialProps(),
  };
}

function reducer(state: KioskState, action: Action): KioskState {
  switch (action.type) {
    case "connection/fpp":
      return { ...state, fppConnection: action.state };
    case "connection/rf":
      return { ...state, rfConnection: action.state };
    case "song/queue":
      return { ...state, queue: [...state.queue, action.item] };
    case "song/advance": {
      const [next, ...rest] = state.queue;
      if (!next) return { ...state, nowPlaying: null };
      return {
        ...state,
        nowPlaying: { song: next.song, elapsedSec: 0, queuedByKiosk: false },
        queue: rest,
      };
    }
    case "song/tick": {
      if (!state.nowPlaying) return state;
      return {
        ...state,
        nowPlaying: { ...state.nowPlaying, elapsedSec: action.elapsedSec },
      };
    }
    case "audio/set":
      return {
        ...state,
        audio: action.state,
        audioRemainingSec: action.remainingSec ?? state.audioRemainingSec,
      };
    case "audio/tick":
      return { ...state, audioRemainingSec: Math.max(0, action.remainingSec) };
    case "prop/cooldown": {
      const existing = state.props[action.propId];
      if (!existing) return state;
      return {
        ...state,
        props: {
          ...state.props,
          [action.propId]: { cooldownUntil: action.until, lastError: null },
        },
      };
    }
    case "prop/ready": {
      const existing = state.props[action.propId];
      if (!existing) return state;
      return {
        ...state,
        props: {
          ...state.props,
          [action.propId]: { ...existing, cooldownUntil: null },
        },
      };
    }
    case "prop/error": {
      const existing = state.props[action.propId];
      if (!existing) return state;
      return {
        ...state,
        props: {
          ...state.props,
          [action.propId]: { ...existing, lastError: action.message },
        },
      };
    }
    default:
      return state;
  }
}

type KioskActions = {
  queueSong: (songId: string) => void;
  triggerProp: (propId: string) => void;
  audioOn: () => void;
  audioOff: () => void;
};

type KioskContextValue = {
  state: KioskState;
  actions: KioskActions;
};

// eslint-disable-next-line react-refresh/only-export-components
export const KioskContext = createContext<KioskContextValue | null>(null);

export function KioskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const audioBusyRef = useRef(false);

  const queueSong = useCallback(
    (songId: string) => {
      const song: Song | undefined = state.availableSongs.find((s) => s.id === songId);
      if (!song) return;
      const item: QueueItem = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        song,
        queuedAt: Date.now(),
      };
      dispatch({ type: "song/queue", item });
      // Real RF call goes here in Phase 4.
    },
    [state.availableSongs],
  );

  const triggerProp = useCallback((propId: string) => {
    const def = config.props.find((p) => p.id === propId);
    if (!def) return;
    const runtime = state.props[propId];
    if (runtime?.cooldownUntil && runtime.cooldownUntil > Date.now()) return;
    dispatch({
      type: "prop/cooldown",
      propId,
      until: Date.now() + def.cooldownSec * 1000,
    });
    // Real FPP preset trigger goes here in Phase 4.
  }, [state.props]);

  const audioOn = useCallback(() => {
    if (audioBusyRef.current) return;
    if (state.audio === "active" || state.audio === "starting") return;
    audioBusyRef.current = true;
    dispatch({ type: "audio/set", state: "starting" });
    window.setTimeout(() => {
      const seconds = config.demoMode ? config.demoAudioSeconds : config.audioDurationSeconds;
      dispatch({ type: "audio/set", state: "active", remainingSec: seconds });
      audioBusyRef.current = false;
    }, 500);
  }, [state.audio]);

  const audioOff = useCallback(() => {
    if (audioBusyRef.current) return;
    audioBusyRef.current = true;
    dispatch({ type: "audio/set", state: "stopping" });
    window.setTimeout(() => {
      dispatch({ type: "audio/set", state: "off", remainingSec: 0 });
      audioBusyRef.current = false;
    }, 300);
  }, []);

  // Now-playing ticker
  useEffect(() => {
    if (!state.nowPlaying) return;
    const startTs = Date.now() - state.nowPlaying.elapsedSec * 1000;
    const duration = state.nowPlaying.song.durationSec;
    const id = window.setInterval(() => {
      const elapsed = Math.min(duration, Math.floor((Date.now() - startTs) / 1000));
      dispatch({ type: "song/tick", elapsedSec: elapsed });
      if (elapsed >= duration) {
        window.clearInterval(id);
        dispatch({ type: "song/advance" });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.nowPlaying?.song.id]);

  // Audio countdown (naive placeholder; Phase 3 replaces with absolute-timestamp + persistence)
  useEffect(() => {
    if (state.audio !== "active") return;
    const expiresAt = Date.now() + state.audioRemainingSec * 1000;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      dispatch({ type: "audio/tick", remainingSec: remaining });
      if (remaining <= 0) {
        window.clearInterval(id);
        dispatch({ type: "audio/set", state: "off", remainingSec: 0 });
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [state.audio]);

  // Prop cooldown watcher — ticks every 500ms and clears expired cooldowns
  useEffect(() => {
    const anyOnCooldown = Object.values(state.props).some(
      (p) => p.cooldownUntil !== null,
    );
    if (!anyOnCooldown) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      for (const [propId, runtime] of Object.entries(state.props)) {
        if (runtime.cooldownUntil && runtime.cooldownUntil <= now) {
          dispatch({ type: "prop/ready", propId });
        }
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [state.props]);

  const value = useMemo<KioskContextValue>(
    () => ({ state, actions: { queueSong, triggerProp, audioOn, audioOff } }),
    [state, queueSong, triggerProp, audioOn, audioOff],
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}
