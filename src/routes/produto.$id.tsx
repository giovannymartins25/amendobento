import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { PackageBag } from "@/components/PackageBag";
import { calcXpReward, getProduct, priceToNumber } from "@/lib/amendobento";
import { store } from "@/lib/store";
import { useCatalogOverrides, useTopProduct } from "@/lib/useCatalog";
import { PriceTag } from "@/components/PriceTag";
import { requireAuthOrRedirect } from "@/lib/auth-guard";

export const Route = createFileRoute("/produto/$id")({
  head: ({ params }) => {
    const p = getProduct(params.id);
    return {
      meta: [
        { title: p ? `${p.name} — Amendobento` : "Produto — Amendobento" },
        { name: "description", content: p?.note ?? "Amendoim gourmet Amendobento." },
      ],
    };
  },
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Sabor não encontrado</h1>
        <Link to="/catalog" className="mt-6 inline-block text-gold underline">
          Voltar ao catálogo
        </Link>
      </main>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Algo deu errado</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      </main>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product: base } = Route.useLoaderData();
  const navigate = useNavigate();
  const { apply } = useCatalogOverrides();
  const topQ = useTopProduct();
  const p = (apply(base) ?? base) as typeof base;
  const isTop = topQ.data?.top?.slug === p.id;

  const buyNow = async () => {
    if (!(await requireAuthOrRedirect())) return;
    store.setBuyNow(p.id);
    navigate({ to: "/checkout", search: { buyNow: 1 } });
  };

  const addToCart = async () => {
    if (!(await requireAuthOrRedirect())) return;
    store.addToCart(p.id, 1, "product", (p as any).promo?.unitsTotal ?? undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link to="/catalog" className="text-sm text-muted-foreground hover:text-gold">
          Voltar ao catálogo
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border bg-surface-raised">
            {(p as any).image_url ? (
              <img
                src={(p as any).image_url}
                alt={p.name}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <PackageBag product={p} className="aspect-[4/5]" />
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {p.origin} · {p.weight}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
              {p.name}
              {isTop && (
                <span className="ml-3 inline-block align-middle rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Mais pedido
                </span>
              )}
            </h1>
            <p className="mt-4 text-base text-muted-foreground">{p.note}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {(p.tags ?? []).map((t: string) => (
                <span
                  key={t}
                  className="rounded border border-border bg-surface-overlay px-2 py-1 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-surface-raised p-4 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Intensidade</p>
                <p className="mt-1 font-display text-xl font-bold text-gold">{p.intensity}/5</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kcal/100g</p>
                <p className="mt-1 font-display text-xl font-bold text-gold">{p.kcal}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Estoque</p>
                <p className="mt-1 font-display text-xl font-bold text-gold">{p.stock}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ingredientes</p>
              <p className="mt-2 text-sm">{p.ingredients.join(" · ")}</p>
              <p className="mt-3 font-mono-coupon text-[10px] text-muted-foreground">{p.sku}</p>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <PriceTag basePriceLabel={p.price} promo={(p as any).promo} size="lg" />
              {(p as any).promo?.hasTimeLimit && (
                <p className="mt-2 text-xs text-destructive">
                  Promoção termina em {new Date((p as any).promo.endsAt).toLocaleString("pt-BR")}
                </p>
              )}
              {(p as any).promo?.hasUnitLimit && (
                <p className="mt-1 text-xs text-destructive">
                  Restam {(p as any).promo.unitsTotal} unidades em promoção
                </p>
              )}
              {(p as any).promo && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Economize R$ {(p as any).promo.discountAbs.toFixed(2).replace(".", ",")} ({(p as any).promo.discountPct}% OFF)
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={buyNow}
                className="flex-1 rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
              >
                Comprar agora
              </button>
              <button
                onClick={addToCart}
                className="flex-1 rounded-lg border border-gold py-3 text-sm font-semibold text-gold hover:bg-gold/10"
              >
                Adicionar ao carrinho
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Comprando agora você ganha{" "}
              <span className="font-bold text-gold">
                +{calcXpReward((p as any).promo ? (p as any).promo.promoPrice : priceToNumber(p.price)).total} pontos
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
