import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { calcXpReward, priceToNumber } from "@/lib/amendobento";
import { placeOrder } from "@/lib/orders.functions";
import { resolveCartItem, store, useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogOverrides } from "@/lib/useCatalog";
import { computePromo } from "@/lib/promo";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    buyNow: search.buyNow === 1 || search.buyNow === "1" ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout — Amendobento" },
      { name: "description", content: "Finalize seu pedido de amendoins gourmet." },
    ],
  }),
  component: CheckoutPage,
});

const VALID_COUPONS: Record<string, number> = {
  "AMENDO-GOLD-50": 0.15,
  "BEMVINDO10": 0.1,
};

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

function CheckoutPage() {
  const navigate = useNavigate();
  const { buyNow } = Route.useSearch();
  const cart = useStore((s) => s.cart);
  const buyNowItem = useStore((s) => s.buyNow);
  const coupon = useStore((s) => s.coupon);
  const { user, loading: authLoading } = useAuth();
  const placeOrderFn = useServerFn(placeOrder);
  const qc = useQueryClient();
  const { map } = useCatalogOverrides();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({
        to: "/login",
        search: { redirect: buyNow ? "/checkout?buyNow=1" : "/checkout" },
        replace: true,
      });
    }
  }, [authLoading, user, navigate, buyNow]);

  const sourceItems = buyNow && buyNowItem ? [buyNowItem] : cart;
  const items = sourceItems
    .map((c) => {
      const r = resolveCartItem(c);
      if (!r) return null;
      const baseName = r.kind === "kit" ? r.kit.name : r.product.name;
      const basePriceStr = r.kind === "kit" ? r.kit.price : r.product.price;
      const o = map.get(r.id);
      const basePrice = o?.price != null ? Number(o.price) : priceToNumber(basePriceStr);
      const promo = computePromo(basePrice, o?.promo_price, o?.promo_ends_at, o?.promo_units_total);
      const unit = promo ? promo.promoPrice : basePrice;
      const name = o?.name ?? baseName;
      const emoji = o?.emoji ?? (r.kind === "kit" ? r.kit.emoji : r.product.emoji);
      return { resolved: r, name, emoji, unit, basePrice, promo };
    })
    .filter(Boolean) as Array<{
      resolved: NonNullable<ReturnType<typeof resolveCartItem>>;
      name: string;
      emoji: string;
      unit: number;
      basePrice: number;
      promo: ReturnType<typeof computePromo>;
    }>;

  const subtotal = items.reduce((s, c) => s + c.unit * c.resolved.qty, 0);

  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [code, setCode] = useState(coupon?.code ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = subtotal === 0 ? 0 : delivery === "express" ? 14.9 : 7.9;
  const discount = subtotal * (coupon?.discount ?? 0);
  const total = subtotal + deliveryFee - discount;
  const xpReward = calcXpReward(total);

  const applyCoupon = () => {
    const c = code.trim().toUpperCase();
    if (VALID_COUPONS[c]) {
      store.applyCoupon(c, VALID_COUPONS[c]);
      setError("");
    } else {
      store.clearCoupon();
      setError("Cupom inválido ou expirado.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        items: items.map((c) => ({
          slug: c.resolved.kind === "kit" ? `kit:${c.resolved.id}` : c.resolved.id,
          name: c.resolved.kind === "kit" ? `Kit ${c.name}` : c.name,
          qty: c.resolved.qty,
          unit_price: c.unit,
        })),
        total,
        customer_name:
          (user?.user_metadata?.full_name as string | undefined) ??
          user?.email?.split("@")[0] ??
          "Convidado",
        customer_email: user?.email ?? null,
      };
      const res = await placeOrderFn({ data: payload });
      if (buyNow) store.clearBuyNow();
      else store.clearCart();
      qc.invalidateQueries({ queryKey: ["public", "top-product"] });
      qc.invalidateQueries({ queryKey: ["public", "catalog-overrides"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/confirmation", search: { orderId: res.id, xp: xpReward.total } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar pedido");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/cart" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar ao carrinho
        </Link>

        <h1 className="mt-6 font-display text-4xl font-bold leading-tight md:text-5xl">
          {buyNow ? "Compra rápida" : "Finalizar pedido"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {buyNow ? "Só esse item — seu carrinho fica intacto." : "Revise, aplique cupom e confirme."}
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Seu carrinho está vazio.{" "}
              <Link to="/catalog" className="text-gold underline">
                Ver catálogo
              </Link>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map(({ resolved, name, unit, basePrice, promo }) => (
                <div key={`${resolved.kind}:${resolved.id}`} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-overlay text-[10px] uppercase text-muted-foreground">
                    {resolved.kind === "kit" ? "Kit" : "Un"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      {resolved.kind === "kit" && (
                        <span className="mr-1 rounded bg-gold/20 px-1 text-[9px] font-bold uppercase tracking-wider text-gold">
                          Kit
                        </span>
                      )}
                      {name} <span className="text-muted-foreground">× {resolved.qty}</span>
                    </p>
                    {resolved.kind === "kit" && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {resolved.products.map((p) => p.name).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gold">{fmt(unit * resolved.qty)}</p>
                    {promo && (
                      <p className="text-[10px] text-muted-foreground line-through">
                        {fmt(basePrice * resolved.qty)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entrega</p>
            <div className="mt-3 flex flex-col gap-3">
              {([
                { id: "standard", title: "Entrega padrão", desc: "3–5 dias úteis", fee: "R$ 7,90" },
                { id: "express", title: "Express", desc: "1–2 dias úteis", fee: "R$ 14,90" },
              ] as const).map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDelivery(opt.id)}
                  className={`flex items-center gap-3 rounded-lg border bg-surface-raised p-4 text-left transition-colors ${
                    delivery === opt.id ? "border-gold bg-gold-tint" : "border-border hover:border-gold/40"
                  }`}
                >
                  <span
                    className={`h-4 w-4 shrink-0 rounded-full border-2 transition-all ${
                      delivery === opt.id ? "border-gold bg-gold ring-2 ring-inset ring-surface-raised" : "border-border"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{opt.title}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <span className="text-sm font-semibold text-gold">{opt.fee}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cupom</p>
            <div className="mt-3 flex gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="AMENDO-GOLD-50"
                className="font-mono-coupon flex-1 rounded-lg border border-border bg-surface-overlay px-4 py-3 text-sm font-bold uppercase text-gold placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="rounded-lg border border-gold px-5 text-sm font-semibold text-gold transition-colors hover:bg-gold-tint"
              >
                Aplicar
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            {coupon && (
              <p className="mt-2 text-xs text-success">
                ✓ {coupon.code} aplicado — {(coupon.discount * 100).toFixed(0)}% de desconto
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex justify-between border-b border-border py-2 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between border-b border-border py-2 text-sm">
              <span className="text-muted-foreground">Entrega</span>
              <span>{fmt(deliveryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between border-b border-border py-2 text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-success">−{fmt(discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-gold">{fmt(total)}</span>
            </div>
            {xpReward.total > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-gold/40 bg-gold-tint px-4 py-3 text-sm">
                <span className="text-muted-foreground">Você vai ganhar</span>
                <span className="font-display text-lg font-bold text-gold">+{xpReward.total} pontos</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={items.length === 0 || submitting}
            className="rounded-lg bg-gold py-4 text-base font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.01] hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Processando…" : "Confirmar pedido →"}
          </button>
        </form>
      </main>
    </div>
  );
}
