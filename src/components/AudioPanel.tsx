import { AudioButton } from "./AudioButton";

export function AudioPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="rounded-2xl border border-white/8 bg-black/40 px-4 py-3 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-accent-300/80">
          Outdoor Speakers
        </p>
        <p className="mt-1 text-sm text-neutral-300">
          Car visitors listen on FM. Tap below to hear the show on the driveway speakers for 6 minutes.
        </p>
      </div>
      <div className="flex-1" />
      <AudioButton />
      <div className="flex-1" />
    </div>
  );
}
