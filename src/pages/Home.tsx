import { useState } from "react";
import { AudioPanel } from "../components/AudioPanel";
import { BackgroundFX } from "../components/BackgroundFX";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { FollowPanel } from "../components/FollowPanel";
import { Header } from "../components/Header";
import { NowPlayingBar } from "../components/NowPlayingBar";
import { PropPanel } from "../components/PropPanel";
import { SongPicker } from "../components/SongPicker";
import { TabBar } from "../components/TabBar";
import type { TabId } from "../state/types";

export function Home() {
  const [tab, setTab] = useState<TabId>("songs");

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden text-neutral-100">
      <BackgroundFX />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[900px] flex-col gap-4 px-6 pb-6 pt-4">
        <Header />
        <NowPlayingBar />
        <main className="min-h-0 flex-1">
          {tab === "songs" && <SongPicker />}
          {tab === "props" && <PropPanel />}
          {tab === "audio" && <AudioPanel />}
          {tab === "follow" && <FollowPanel />}
        </main>
        <TabBar active={tab} onSelect={setTab} />
      </div>
      <ConnectionStatus />
    </div>
  );
}
