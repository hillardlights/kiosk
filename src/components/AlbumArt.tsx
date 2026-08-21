import { useState } from "react";
import { config } from "../config";

type Size = "tiny" | "small" | "medium" | "large" | "hero";

const SIZE_CLASS: Record<Size, string> = {
  tiny: "h-10 w-10",
  small: "h-14 w-14",
  medium: "h-16 w-16",
  large: "h-24 w-24",
  hero: "h-32 w-32 sm:h-36 sm:w-36",
};

export function AlbumArt({
  imageUrl,
  size = "medium",
  alt = "",
  glow = false,
}: {
  imageUrl: string | null;
  size?: Size;
  alt?: string;
  glow?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const glowCls = glow
    ? "shadow-[0_0_28px_rgb(var(--accent-rgb)_/_0.35),0_8px_24px_rgb(0_0_0_/_0.5)]"
    : "shadow-[0_4px_16px_rgb(0_0_0_/_0.5)]";

  return (
    <div
      className={
        SIZE_CLASS[size] +
        " relative shrink-0 overflow-hidden rounded-xl border border-white/10 " +
        "bg-gradient-to-br from-accent-950 via-black to-cool-950 " +
        glowCls
      }
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <span className="text-3xl select-none">{config.brand.seasonEmoji}</span>
      </div>
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 " +
            (loaded ? "opacity-100" : "opacity-0")
          }
        />
      ) : null}
    </div>
  );
}
