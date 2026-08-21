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
import type { KioskState, NowPlaying } from "./types";

type Action =
  | { type: "connection/set"; state: KioskState["connection"] }
  | { type: "show/starting" }
  | { type: "show/playing"; nowPlaying: NowPlaying }
  | { type: "show/tick"; elapsedSec: number }
  | { type: "show/stopping" }
  | { type: "show/idle" }
  | { type: "audio/starting" }
  | { type: "audio/active"; remainingSec: number }
  | { type: "audio/tick"; remainingSec: number }
  | { type: "audio/stopping" }
  | { type: "audio/off" };

const initialState: KioskState = {
  connection: "connecting",
  show: "idle",
  audio: "off",
  nowPlaying: null,
  audioRemainingSec: 0,
};

function reducer(state: KioskState, action: Action): KioskState {
  switch (action.type) {
    case "connection/set":
      return { ...state, connection: action.state };
    case "show/starting":
      return { ...state, show: "starting" };
    case "show/playing":
      return { ...state, show: "playing", nowPlaying: action.nowPlaying };
    case "show/tick":
      if (!state.nowPlaying) return state;
      return {
        ...state,
        nowPlaying: { ...state.nowPlaying, elapsedSec: action.elapsedSec },
      };
    case "show/stopping":
      return { ...state, show: "stopping" };
    case "show/idle":
      return { ...state, show: "idle", nowPlaying: null };
    case "audio/starting":
      return { ...state, audio: "starting" };
    case "audio/active":
      return { ...state, audio: "active", audioRemainingSec: action.remainingSec };
    case "audio/tick":
      return { ...state, audioRemainingSec: Math.max(0, action.remainingSec) };
    case "audio/stopping":
      return { ...state, audio: "stopping" };
    case "audio/off":
      return { ...state, audio: "off", audioRemainingSec: 0 };
    default:
      return state;
  }
}

type KioskActions = {
  startShow: () => void;
  stopShow: () => void;
  audioOn: () => void;
  audioOff: () => void;
};

type KioskContextValue = {
  state: KioskState;
  actions: KioskActions;
};

// eslint-disable-next-line react-refresh/only-export-components
export const KioskContext = createContext<KioskContextValue | null>(null);

const DEMO_TRACK: NowPlaying = {
  title: "James Bond",
  elapsedSec: 0,
  durationSec: 348,
};

export function KioskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef({ show: false, audio: false });

  useEffect(() => {
    dispatch({ type: "connection/set", state: config.demoMode ? "online" : "connecting" });
  }, []);

  const startShow = useCallback(() => {
    if (busyRef.current.show) return;
    if (state.show === "playing" || state.show === "starting") return;
    busyRef.current.show = true;
    dispatch({ type: "show/starting" });
    showTimerRef.current = setTimeout(() => {
      dispatch({ type: "show/playing", nowPlaying: { ...DEMO_TRACK, elapsedSec: 0 } });
      busyRef.current.show = false;
    }, 900);
  }, [state.show]);

  const stopShow = useCallback(() => {
    if (busyRef.current.show) return;
    busyRef.current.show = true;
    dispatch({ type: "show/stopping" });
    showTimerRef.current = setTimeout(() => {
      dispatch({ type: "show/idle" });
      busyRef.current.show = false;
    }, 400);
  }, []);

  const audioOn = useCallback(() => {
    if (busyRef.current.audio) return;
    if (state.audio === "active" || state.audio === "starting") return;
    busyRef.current.audio = true;
    dispatch({ type: "audio/starting" });
    audioTimerRef.current = setTimeout(() => {
      const seconds = config.demoMode ? config.demoAudioSeconds : config.audioDurationSeconds;
      dispatch({ type: "audio/active", remainingSec: seconds });
      busyRef.current.audio = false;
    }, 500);
  }, [state.audio]);

  const audioOff = useCallback(() => {
    if (busyRef.current.audio) return;
    busyRef.current.audio = true;
    dispatch({ type: "audio/stopping" });
    audioTimerRef.current = setTimeout(() => {
      dispatch({ type: "audio/off" });
      busyRef.current.audio = false;
    }, 300);
  }, []);

  useEffect(() => {
    if (state.show !== "playing" || !state.nowPlaying) return;
    const startTs = Date.now() - state.nowPlaying.elapsedSec * 1000;
    const duration = state.nowPlaying.durationSec;
    const id = window.setInterval(() => {
      const elapsed = Math.min(duration, Math.floor((Date.now() - startTs) / 1000));
      dispatch({ type: "show/tick", elapsedSec: elapsed });
      if (elapsed >= duration) {
        window.clearInterval(id);
        dispatch({ type: "show/idle" });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.show, state.nowPlaying?.durationSec, state.nowPlaying?.title]);

  useEffect(() => {
    if (state.audio !== "active") return;
    const expiresAt = Date.now() + state.audioRemainingSec * 1000;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      dispatch({ type: "audio/tick", remainingSec: remaining });
      if (remaining <= 0) {
        window.clearInterval(id);
        dispatch({ type: "audio/off" });
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [state.audio]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    };
  }, []);

  const value = useMemo<KioskContextValue>(
    () => ({ state, actions: { startShow, stopShow, audioOn, audioOff } }),
    [state, startShow, stopShow, audioOn, audioOff],
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}
