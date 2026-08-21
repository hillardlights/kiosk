import { QRCodeSVG } from "qrcode.react";
import { config } from "../config";
import { useKiosk } from "../hooks/useKiosk";
import { AlbumArt } from "./AlbumArt";

type SocialKey = keyof typeof config.brand.socials;
const SOCIAL_ORDER: SocialKey[] = ["instagram", "youtube", "tiktok"];

export function AttractOverlay({ onDismiss }: { onDismiss: () => void }) {
  const { state } = useKiosk();
  const { brand } = config;
  const np = state.nowPlaying;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onDismiss}
      onTouchStart={onDismiss}
      className="fixed inset-0 z-40 flex flex-col overflow-hidden text-neutral-100 attract-fade"
    >
      {/* Ambient background matching the app palette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgb(var(--cool-rgb) / 0.4), transparent 55%), " +
            "radial-gradient(ellipse at 80% 90%, rgb(var(--accent-rgb) / 0.45), transparent 60%), " +
            "#050505",
        }}
      />
      <div className="fog fog-a" />
      <div className="fog fog-b" />

      <div className="relative flex min-h-dvh flex-col items-center justify-between px-8 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-4xl" aria-hidden>{brand.seasonEmoji}</span>
            <h1 className="brand-title text-[clamp(3rem,10vw,6rem)] font-black uppercase leading-none tracking-[0.08em]">
              {brand.name}
            </h1>
            <span className="text-4xl" aria-hidden>{brand.seasonEmoji}</span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.5em] text-accent-300/80">
            {brand.seasonLabel} {brand.seasonYear}
          </p>
          <p className="mt-3 max-w-md text-lg font-medium text-neutral-300">
            {brand.motto}
          </p>
        </div>

        {np ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-accent-300/80">
              On the house right now
            </p>
            <div className="flex items-center gap-4">
              <AlbumArt imageUrl={np.song.imageUrl} alt={np.song.displayName} size="large" glow />
              <div className="text-left">
                <p className="text-2xl font-bold text-white">{np.song.displayName}</p>
                {np.song.artist ? (
                  <p className="text-sm text-neutral-300">{np.song.artist}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="w-full max-w-lg">
          <p className="mb-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-neutral-400">
            Follow along
          </p>
          <div className="grid grid-cols-3 gap-3">
            {SOCIAL_ORDER.map((key) => {
              const s = brand.socials[key];
              return (
                <div
                  key={key}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3"
                >
                  <div className="rounded-xl bg-white p-2 shadow-[0_0_18px_rgb(var(--accent-rgb)_/_0.25)]">
                    <QRCodeSVG
                      value={s.url}
                      size={110}
                      level="M"
                      marginSize={0}
                      bgColor="#ffffff"
                      fgColor="#0a0a0a"
                    />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white">
                    {s.label}
                  </p>
                  <p className="truncate text-[0.65rem] text-neutral-400">{s.handle}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="attract-pulse rounded-full border border-accent-400/50 bg-accent-500/10 px-8 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.5em] text-accent-100">
            Tap anywhere to start
          </p>
        </div>
      </div>
    </div>
  );
}
