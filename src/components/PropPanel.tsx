import { config } from "../config";
import { PropButton } from "./PropButton";

export function PropPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="rounded-2xl border border-white/8 bg-black/40 px-4 py-3 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-orange-300/80">
          Audience Effects
        </p>
        <p className="mt-1 text-sm text-neutral-300">
          Tap once — each effect cools down before it can fire again.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {config.props.map((def) => (
            <PropButton key={def.id} def={def} />
          ))}
        </div>
      </div>
    </div>
  );
}
