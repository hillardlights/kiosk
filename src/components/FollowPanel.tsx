import { QRCodeSVG } from "qrcode.react";
import { config } from "../config";

type SocialKey = keyof typeof config.brand.socials;
const SOCIAL_ORDER: SocialKey[] = ["facebook", "instagram", "youtube", "tiktok"];

export function FollowPanel() {
  const { brand } = config;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="rounded-2xl border border-accent-500/25 bg-black/40 px-4 py-3 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-accent-300/80">
          Follow Hillard Lights
        </p>
        <p className="mt-1 text-sm text-neutral-300">
          {brand.motto}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
        <div className="grid grid-cols-1 gap-4">
          {SOCIAL_ORDER.map((key) => {
            const s = brand.socials[key];
            return (
              <div
                key={key}
                className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="rounded-2xl bg-white p-3 shadow-[0_0_18px_rgb(var(--accent-rgb) / 0.25)]">
                  <QRCodeSVG
                    value={s.url}
                    size={132}
                    level="M"
                    marginSize={0}
                    bgColor="#ffffff"
                    fgColor="#0a0a0a"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-2xl leading-none" aria-hidden>
                    {s.emoji}
                  </span>
                  <p className="mt-2 truncate text-xl font-bold uppercase tracking-[0.12em] text-white">
                    {s.label}
                  </p>
                  <p className="truncate text-sm text-accent-200/80">{s.handle}</p>
                  <p className="mt-2 text-xs text-neutral-500">Scan with your camera</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-3xl border border-cool-500/25 bg-cool-950/25 px-5 py-4 text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-cool-300/80">
            Or visit
          </p>
          <p className="mt-1 text-lg font-bold text-white">{brand.siteUrl.replace(/^https?:\/\//, "")}</p>
        </div>
      </div>
    </div>
  );
}
