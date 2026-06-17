import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { PackageBag } from "@/components/PackageBag";
import { calcXpReward, getKit, getProduct, KITS, priceToNumber, type Kit, type Product } from "@/lib/amendobento";
import { store } from "@/lib/store";
import { useCatalogOverrides } from "@/lib/useCatalog";
import { PriceTag } from "@/components/PriceTag";
import { requireAuthOrRedirect } from "@/lib/auth-guard";

export const Route = createFileRoute("/kit/$id")({
  head: ({ params }) => {
    const kit = getKit(params.id);
    return {
      meta: [
        { title: kit ? `${kit.name} — Amendobento` : "Kit — Amendobento" },
        { name: "description", content: kit?.story ?? "Kits Amendobento curados para cada vibe." },
      ],
    };
  },
  loader: ({ params }) => {
    const kit = getKit(params.id);
    if (!kit) throw notFound();
    return { kit };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="mt-4 font-display text-3xl font-bold">Kit não encontrado</h1>
        <Link to="/catalog" className="mt-6 inline-block text-gold underline">
          Ver todos os kits
        </Link>
      </main>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background p-10 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  component: KitPage,
});

function KitPage() {
  const data = Route.useLoaderData() as { kit: Kit };
  const { apply } = useCatalogOverrides();
  const kit = (apply(data.kit) ?? data.kit) as Kit & { items?: Array<{ slug: string; qty: number }> | null };
  const composedSlugs = (kit.items && kit.items.length > 0)
    ? kit.items.flatMap((it) => Array(it.qty).fill(it.slug))
    : kit.products;
  const products: Product[] = composedSlugs
    .map((id) => apply(getProduct(id) as any) as Product | null)
    .filter((p): p is Product => !!p);
  const kitPrice = priceToNumber(kit.price);
  const promo = (kit as any).promo as { promoPrice: number; unitsTotal: number | null } | null | undefined;
  const effectivePrice = promo ? promo.promoPrice : kitPrice;
  const xpReward = calcXpReward(effectivePrice);
  const maxQty = promo?.unitsTotal ?? undefined;

  const addKit = async () => {
    if (!(await requireAuthOrRedirect())) return;
    store.addToCart(kit.id, 1, "kit", maxQty);
  };

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground">
          Voltar
        </Link>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-raised p-8">
            <div className="relative flex h-72 items-end justify-center gap-2 sm:h-96">
              {products.map((p, i) => (
                <div
                  key={p.id}
                  className="relative h-full w-1/3 transition-transform hover:-translate-y-2"
                  style={{
                    transform: `translateY(${i * 6}px) rotate(${(i - (products.length - 1) / 2) * 4}deg)`,
                  }}
                >
                  <PackageBag product={p} className="h-full w-full" />
                </div>
              ))}
            </div>
            {kit.badge && (
              <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                {kit.badge}
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Combo curado
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">{kit.name}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{kit.story}</p>

            {kit.social && (
              <p className="mt-4 text-sm text-gold">{kit.social}</p>
            )}

            <div className="mt-6">
              <PriceTag basePriceLabel={kit.price} promo={(kit as any).promo} size="lg" />
              {(kit as any).promo?.hasTimeLimit && (
                <p className="mt-2 text-xs text-destructive">
                  Promoção termina em {new Date((kit as any).promo.endsAt).toLocaleString("pt-BR")}
                </p>
              )}
              {(kit as any).promo?.hasUnitLimit && (
                <p className="mt-1 text-xs text-destructive">
                  Só {(kit as any).promo.unitsTotal} unidades nesta promoção
                </p>
              )}
            </div>

            {kit.urgency && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] text-destructive">
                {kit.urgency}
              </p>
            )}

            <button
              onClick={addKit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 text-base font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.01] hover:bg-gold-light"
            >
              Adicionar kit ao carrinho
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Comprando este kit você ganha <span className="font-bold text-gold">+{xpReward.total} pontos</span>
            </p>

            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border text-center">
              {[
                { k: "Sabores", v: products.length.toString() },
                { k: "Peso total", v: `${products.length * 150}g` },
                { k: "Pontos", v: `+${xpReward.total}` },
              ].map((s) => (
                <div key={s.k} className="bg-surface-raised p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.k}</p>
                  <p className="mt-1 font-display text-lg font-bold text-gold">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Assinatura */}
        <section className="mt-10 rounded-3xl border border-gold-tint bg-gradient-to-r from-gold-tint/40 via-surface-raised to-surface-raised p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">Quer mais?</p>
              <h3 className="mt-1 font-display text-xl font-semibold">
                Gostou desses sabores? Assine o clube e receba muito mais!
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Combos mensais com preço melhor que o avulso, entregues na sua casa.
              </p>
            </div>
            <Link
              to="/clube"
              className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
            >
              Conhecer a assinatura
            </Link>
          </div>
        </section>

        {/* O que vem no kit */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">O que vem dentro</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
                <PackageBag product={p} className="aspect-[4/5]" />
                <div className="p-4">
                  <p className="font-display text-base font-semibold">{p.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{p.weight} · {p.kcal} kcal</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Outros kits */}
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-2xl font-semibold">Outros kits</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KITS.filter((k) => k.id !== kit.id).slice(0, 4).map((k) => (
              <Link
                key={k.id}
                to="/kit/$id"
                params={{ id: k.id }}
                className="flex flex-col rounded-2xl border border-border bg-surface-raised p-4 transition-all hover:-translate-y-1 hover:border-gold"
              >
                <p className="font-display text-sm font-semibold leading-tight">{k.name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{k.story}</p>
                <p className="mt-3 font-display text-base font-bold text-gold">{k.price}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
