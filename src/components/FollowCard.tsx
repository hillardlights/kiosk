import { QRCodeSVG } from "qrcode.react";
import { config } from "../config";

export function FollowCard() {
  const { brand } = config;
  return (
    <section className="rounded-3xl border border-cool-500/25 bg-cool-950/25 p-4 backdrop-blur-md">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-cool-300/85">
        Follow Along
      </p>
      <div className="mt-3 flex items-center gap-4">
        <div className="rounded-xl bg-white p-2 shadow-[0_0_16px_rgb(var(--accent-rgb)_/_0.25)]">
          <QRCodeSVG
            value={brand.siteUrl}
            size={96}
            level="M"
            marginSize={0}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Scan with your camera</p>
          <p className="mt-1 truncate text-xs text-accent-200/80">
            {brand.siteUrl.replace(/^https?:\/\//, "")}
          </p>
          <p className="mt-2 text-[0.65rem] uppercase tracking-widest text-neutral-500">
            {brand.socials.instagram.handle}
          </p>
        </div>
      </div>
    </section>
  );
}
