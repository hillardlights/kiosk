import { AudioButton } from "../components/AudioButton";
import { BackgroundFX } from "../components/BackgroundFX";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { Header } from "../components/Header";
import { NowPlaying } from "../components/NowPlaying";
import { ShowButton } from "../components/ShowButton";

export function Home() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden text-neutral-100">
      <BackgroundFX />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-[900px] flex-col items-center gap-10 px-8 pb-[6vh]">
        <Header />
        <div className="flex-1" />
        <NowPlaying />
        <ShowButton />
        <AudioButton />
      </main>
      <ConnectionStatus />
    </div>
  );
}
