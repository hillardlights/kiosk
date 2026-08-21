import { useState } from "react";
import { config } from "../../config";

const KEYS: (string | "back" | "enter")[] = [
  "1", "2", "3",
  "4", "5", "6",
  "7", "8", "9",
  "back", "0", "enter",
];

export function PinGate({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [entered, setEntered] = useState("");
  const [shake, setShake] = useState(false);

  const submit = (value: string) => {
    if (value === config.adminPin) {
      onSuccess();
    } else {
      setShake(true);
      window.setTimeout(() => {
        setShake(false);
        setEntered("");
      }, 400);
    }
  };

  const onKey = (key: string | "back" | "enter") => {
    if (key === "back") {
      setEntered((p) => p.slice(0, -1));
      return;
    }
    if (key === "enter") {
      submit(entered);
      return;
    }
    setEntered((p) => (p.length >= 8 ? p : p + key));
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-8">
      <div className="text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-accent-300/80">
          Admin Access
        </p>
        <p className="mt-2 text-3xl font-bold text-white">Enter PIN</p>
      </div>

      <div
        className={
          "flex h-16 w-64 items-center justify-center gap-3 rounded-2xl border-2 " +
          "border-white/15 bg-black/60 " +
          (shake ? "border-rose-500/70 animate-[shake_0.3s]" : "")
        }
      >
        {Array.from({ length: Math.max(entered.length, 4) }).map((_, i) => (
          <span
            key={i}
            className={
              "h-4 w-4 rounded-full " +
              (i < entered.length ? "bg-accent-400" : "bg-white/15")
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={String(k)}
            type="button"
            onClick={() => onKey(k)}
            className={
              "h-20 w-20 rounded-2xl border border-white/10 bg-white/[0.05] " +
              "text-2xl font-bold text-white transition active:scale-95 " +
              "hover:bg-white/[0.09]"
            }
          >
            {k === "back" ? "⌫" : k === "enter" ? "✓" : k}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-4 rounded-2xl border border-white/10 bg-black/40 px-8 py-3 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-200"
      >
        Cancel
      </button>
    </div>
  );
}
