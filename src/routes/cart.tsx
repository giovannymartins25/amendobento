import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { calcXpReward, priceToNumber } from "@/lib/amendobento";
import { resolveCartItem, store, useStore, type CartKind } from "@/lib/store";
import { useCatalogOverrides } from "@/lib/useCatalog";
import { computePromo } from "@/lib/promo";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Carrinho — Amendobento" },
      { name: "description", content: "Seu carrinho de amendoins gourmet." },
    ],
  }),
  component: CartPage,
});

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

function CartPage() {
  const cart = useStore((s) => s.cart);
  const { map } = useCatalogOverrides();

  const items = cart
    .map((c) => {
      const resolved = resolveCartItem(c);
      if (!resolved) return null;
      const slug = resolved.id;
      const baseName = resolved.kind === "kit" ? resolved.kit.name : resolved.product.name;
      const basePriceStr = resolved.kind === "kit" ? resolved.kit.price : resolved.product.price;
      const o = map.get(slug);
      const basePrice = o?.price != null ? Number(o.price) : priceToNumber(basePriceStr);
      const promo = computePromo(basePrice, o?.promo_price, o?.promo_ends_at, o?.promo_units_total);
      const unitPrice = promo ? promo.promoPrice : basePrice;
      const name = o?.name ?? baseName;
      const emoji = o?.emoji ?? (resolved.kind === "kit" ? resolved.kit.emoji : resolved.product.emoji);
      const maxQty = promo?.unitsTotal ?? undefined;
      return { resolved, name, emoji, unitPrice, basePrice, promo, maxQty };
    })
    .filter(Boolean) as Array<{
      resolved: NonNullable<ReturnType<typeof resolveCartItem>>;
      name: string;
      emoji: string;
      unitPrice: number;
      basePrice: number;
      promo: ReturnType<typeof computePromo>;
      maxQty?: number;
    }>;

  const subtotal = items.reduce((s, c) => s + c.unitPrice * c.resolved.qty, 0);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Carrinho</p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
          {items.length === 0 ? "Seu carrinho está vazio" : `${cart.reduce((n, c) => n + c.qty, 0)} itens`}
        </h1>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Adicione amendoins do catálogo ou da harmonização.</p>
            <Link
              to="/catalog"
              className="mt-6 inline-flex rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-3">
              {items.map(({ resolved, name, unitPrice, basePrice, promo, maxQty }) => {
                const id = resolved.id;
                const kind: CartKind = resolved.kind;
                const qty = resolved.qty;
                const isKit = resolved.kind === "kit";
                const atMax = maxQty != null && qty >= maxQty;
                return (
                  <div
                    key={`${kind}:${id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="h-12 w-12 shrink-0 rounded-xl border border-border"
                        style={{
                          background: (resolved as any)?.product?.color ?? "var(--surface-overlay)",
                        }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isKit && (
                            <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                              Kit
                            </span>
                          )}
                          <p className="truncate font-semibold">{name}</p>
                        </div>
                        {isKit ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Inclui: {resolved.products.map((p) => p.name).join(" · ")}
                          </p>
                        ) : (
                          <p className="font-mono-coupon text-[10px] text-muted-foreground">
                            {resolved.product.sku}
                          </p>
                        )}
                        {promo && (
                          <p className="mt-1 text-[10px] text-destructive">
                            {promo.discountPct}% OFF
                            {maxQty != null && ` · máx. ${maxQty} un.`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-border">
                        <button
                          onClick={() => store.setQty(id, qty - 1, kind, maxQty)}
                          className="px-2 py-1 text-sm text-muted-foreground hover:text-gold"
                          aria-label="Diminuir"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-bold">{qty}</span>
                        <button
                          onClick={() => store.setQty(id, qty + 1, kind, maxQty)}
                          disabled={atMax}
                          className="px-2 py-1 text-sm text-muted-foreground hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-bold text-gold">{fmt(unitPrice * qty)}</p>
                        {promo && (
                          <p className="text-[10px] text-muted-foreground line-through">
                            {fmt(basePrice * qty)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => store.removeFromCart(id, kind)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
              <div className="flex justify-between border-b border-border py-2 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="font-semibold">A pagar</span>
                <span className="font-display text-2xl font-bold text-gold">{fmt(subtotal)}</span>
              </div>
              {subtotal > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-gold/40 bg-gold-tint px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Finalizando você ganha</span>
                  <span className="font-display text-lg font-bold text-gold">
                    +{calcXpReward(subtotal).total} pontos
                  </span>
                </div>
              )}
              <Link
                to="/checkout"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gold py-4 text-base font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.01] hover:bg-gold-light"
              >
                Continuar
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
