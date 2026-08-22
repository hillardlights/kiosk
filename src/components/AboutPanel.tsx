import { config } from "../config";

type Stat = {
  value: string;
  label: string;
  caption: string;
};

const STATS: Stat[] = [
  { value: "30,000", label: "Pixels", caption: "individually addressable" },
  { value: "6", label: "Years", caption: "and counting" },
  { value: "$0", label: "Earned", caption: "it's a hobby, promise" },
];

type FaqItem = {
  q: string;
  a: string;
};

const FAQ: FaqItem[] = [
  {
    q: "How many lights are actually out there?",
    a: "Around 30,000 individually-addressable pixels. Each one has its own tiny brain, its own color, and very strong opinions about the beat drop.",
  },
  {
    q: "How long have you been doing this?",
    a: "This is year six. What started as \"a few strands on the porch\" has escalated into a full-blown obsession with cable management, spreadsheet-driven prop layouts, and a truly alarming amount of extension cord.",
  },
  {
    q: "Is this your job?",
    a: "Sort of adjacent. By day I'm a software engineer. By night I write code that bosses around 30,000 LEDs. Nobody pays me for the second part — this is a hobby that got wildly out of hand, and I wouldn't have it any other way.",
  },
];

export function AboutPanel() {
  const { brand } = config;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="rounded-2xl border border-cool-500/25 bg-black/40 px-4 py-3 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-accent-300/80">
          Behind the Show
        </p>
        <p className="mt-1 text-sm text-neutral-300">
          The pixels, the years, and the person hiding inside.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] px-3 py-5 text-center"
            >
              <span className="bg-gradient-to-b from-accent-200 to-accent-500 bg-clip-text text-3xl font-black leading-none tracking-tight text-transparent">
                {stat.value}
              </span>
              <span className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-neutral-200">
                {stat.label}
              </span>
              <span className="text-[0.65rem] leading-tight text-neutral-500">
                {stat.caption}
              </span>
            </div>
          ))}
        </div>

        <ol className="mt-5 flex flex-col gap-3">
          {FAQ.map((item, i) => (
            <li
              key={item.q}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-500/20 text-[0.7rem] font-black text-accent-200">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-snug text-white">
                    {item.q}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                    {item.a}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-3xl border border-accent-500/25 bg-gradient-to-b from-accent-500/10 to-transparent px-5 py-4 text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-accent-300/80">
            Made with soldering irons &amp; sleep deprivation
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            Thanks for stopping by. Enjoy the show!
          </p>
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.3em] text-neutral-500">
            {brand.name} · {brand.seasonLabel} {brand.seasonYear}
          </p>
        </div>
      </div>
    </div>
  );
}
