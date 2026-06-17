import { Link } from "@tanstack/react-router";
import { levelFor } from "@/lib/amendobento";
import { useStore } from "@/lib/store";

export function XPBar({ compact = false }: { compact?: boolean }) {
  const xp = useStore((s) => s.xp);
  const { current, next, progress } = levelFor(xp);
  const pct = Math.round(progress * 100);

  return (
    <Link
      to="/clube"
      className={`group flex items-center gap-2 rounded-full border border-gold-tint bg-gold-tint px-3 py-1.5 text-xs transition-all hover:scale-105 ${
        compact ? "" : "min-w-[180px]"
      }`}
    >
      <span className="text-base leading-none">{current.emoji}</span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-[11px] font-semibold leading-none text-gold">
            {current.name}
          </span>
          {!compact && (
            <span className="font-mono-coupon text-[10px] leading-none text-muted-foreground">
              {xp} XP
            </span>
          )}
        </div>
        {!compact && (
          <div className="h-1 overflow-hidden rounded-full bg-background/40">
            <div
              className="animate-xp-fill h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      {next && !compact && (
        <span className="hidden font-mono-coupon text-[9px] uppercase tracking-wider text-muted-foreground sm:inline">
          → {next.emoji}
        </span>
      )}
    </Link>
  );
}