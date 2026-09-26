import { QRCodeSVG } from "qrcode.react";
import { config } from "../config";

export function FollowCard() {
  const fb = config.brand.socials.facebook;
  return (
    <section className="rounded-3xl border border-cool-500/25 bg-cool-950/25 p-4">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-cool-300/85">
        Follow Along
      </p>
      <div className="mt-3 flex items-center gap-4">
        <div className="rounded-xl bg-white p-2">
          <QRCodeSVG
            value={fb.url}
            size={96}
            level="M"
            marginSize={0}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            <span aria-hidden className="mr-1">
              {fb.emoji}
            </span>
            {fb.label}
          </p>
          <p className="mt-1 truncate text-xs text-accent-200/80">/{fb.handle}</p>
          <p className="mt-2 text-[0.6rem] uppercase tracking-widest text-neutral-500">
            Scan for updates
          </p>
        </div>
      </div>
    </section>
  );
}
