import packaging from "@/assets/packaging-amendobento.png";
import type { Product } from "@/lib/amendobento";

type Props = {
  product: Product;
  className?: string;
};

/**
 * Mockup do pacote real Amendobento.
 * Usa a foto da embalagem com overlay da cor do sabor + tag textual.
 */
export function PackageBag({ product, className = "" }: Props) {
  const src = product.image ?? packaging;
  const isPhoto = !!product.image;
  return (
    <div
      className={`relative isolate flex items-end justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, ${product.color}22 0%, transparent 60%), linear-gradient(180deg, var(--surface-overlay) 0%, var(--surface-raised) 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent 0 8px, currentColor 8px 9px)",
        }}
      />
      <img
        src={src}
        alt={isPhoto ? `Amendobento ${product.name}` : ""}
        aria-hidden={!isPhoto}
        className={
          isPhoto
            ? "relative z-10 h-full w-full object-cover"
            : "relative z-10 h-[88%] w-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)]"
        }
        style={!isPhoto ? { filter: "saturate(1.05)" } : undefined}
      />
      {!isPhoto && (
        <span
          className="absolute right-3 top-3 z-20 rounded-md px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-black shadow-md"
          style={{ background: product.color }}
        >
          {product.name}
        </span>
      )}
      <span className="absolute left-3 top-3 z-20 rounded-full border border-gold/40 bg-background/70 px-2 py-0.5 font-mono-coupon text-[9px] uppercase tracking-wider text-gold backdrop-blur">
        {product.sku}
      </span>
    </div>
  );
}
