import type { PromoInfo } from "@/lib/promo";
import { formatBRL } from "@/lib/promo";

type Props = {
  basePriceLabel: string; // ex. "R$ 22,90"
  promo?: PromoInfo | null;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
};

const sizes = {
  sm: { promo: "text-base", base: "text-[10px]", badge: "text-[9px]" },
  md: { promo: "text-xl", base: "text-xs", badge: "text-[10px]" },
  lg: { promo: "text-3xl md:text-4xl", base: "text-sm", badge: "text-xs" },
};

export function PriceTag({ basePriceLabel, promo, size = "md", showBadge = true, className = "" }: Props) {
  const s = sizes[size];
  if (!promo) {
    return (
      <span className={`font-display font-bold text-gold ${s.promo} ${className}`}>
        {basePriceLabel}
      </span>
    );
  }
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`font-display font-bold text-gold ${s.promo}`}>
        {formatBRL(promo.promoPrice)}
      </span>
      <span className={`text-muted-foreground line-through ${s.base}`}>
        {basePriceLabel}
      </span>
      {showBadge && (
        <span
          className={`rounded-full bg-destructive/20 px-1.5 py-0.5 font-bold uppercase tracking-wider text-destructive ${s.badge}`}
        >
          −{promo.discountPct}%
        </span>
      )}
    </span>
  );
}
