import { useState } from "react";
import { AboutPanel } from "../components/AboutPanel";
import { AttractOverlay } from "../components/AttractOverlay";
import { AudioPanel } from "../components/AudioPanel";
import { BackgroundFX } from "../components/BackgroundFX";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { FollowPanel } from "../components/FollowPanel";
import { Header } from "../components/Header";
import { NowPlayingBar } from "../components/NowPlayingBar";
import { PropPanel } from "../components/PropPanel";
import { SongPicker } from "../components/SongPicker";
import { TabBar } from "../components/TabBar";
import { useIdle } from "../hooks/useIdle";
import type { TabId } from "../state/types";
import { Admin } from "./Admin";

const ATTRACT_IDLE_MS = 60_000;

export function Home() {
  const [tab, setTab] = useState<TabId>("songs");
  const [adminOpen, setAdminOpen] = useState(false);
  const [attractDismissed, setAttractDismissed] = useState(false);
  const isIdle = useIdle(ATTRACT_IDLE_MS);

  // Attract mode never covers the admin panel.
  const showAttract = isIdle && !adminOpen && !attractDismissed;

  // Reset dismiss when the user has been active — so the next idle can arm again.
  if (!isIdle && attractDismissed) {
    // schedule a state update outside render to avoid warning
    queueMicrotask(() => setAttractDismissed(false));
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden text-neutral-100">
      <BackgroundFX />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[900px] flex-col gap-4 px-6 pb-6 pt-4">
        <Header onAdminGesture={() => setAdminOpen(true)} />
        <NowPlayingBar />
        <main className="min-h-0 flex-1">
          {tab === "songs" && <SongPicker />}
          {tab === "props" && <PropPanel />}
          {tab === "audio" && <AudioPanel />}
          {tab === "follow" && <FollowPanel />}
          {tab === "about" && <AboutPanel />}
        </main>
        <TabBar active={tab} onSelect={setTab} />
      </div>
      <ConnectionStatus />
      {adminOpen && <Admin onClose={() => setAdminOpen(false)} />}
      {showAttract && <AttractOverlay onDismiss={() => setAttractDismissed(true)} />}
    </div>
  );
}
