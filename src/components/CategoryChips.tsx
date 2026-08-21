export function CategoryChips({
  categories,
  active,
  onSelect,
}: {
  categories: string[];
  active: string | null;
  onSelect: (cat: string | null) => void;
}) {
  if (categories.length < 2) return null;

  return (
    <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto pb-1">
      <Chip label="All" isActive={active === null} onClick={() => onSelect(null)} />
      {categories.map((cat) => (
        <Chip
          key={cat}
          label={cat}
          isActive={active === cat}
          onClick={() => onSelect(cat)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition active:scale-95 " +
        (isActive
          ? "border-accent-400/60 bg-accent-500/20 text-accent-100 shadow-[0_0_14px_rgb(var(--accent-rgb)_/_0.35)]"
          : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200")
      }
    >
      {label}
    </button>
  );
}
