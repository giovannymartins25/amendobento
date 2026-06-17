import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { PackageBag } from "@/components/PackageBag";
import { PriceTag } from "@/components/PriceTag";
import { CATALOG, KITS } from "@/lib/amendobento";
import { useCatalogOverrides } from "@/lib/useCatalog";
import { formatCountdown } from "@/lib/promo";

export const Route = createFileRoute("/promocoes")({
  head: () => ({
    meta: [
      { title: "Promoções — Amendobento" },
      { name: "description", content: "Confira todas as promoções ativas do Amendobento — descontos em sabores e kits, por tempo limitado." },
    ],
  }),
  component: PromocoesPage,
});

function PromocoesPage() {
  const { applyMany, extras } = useCatalogOverrides();
  const extraProducts = extras({ kind: "product", knownIds: CATALOG.map((p) => p.id) });
  const extraKits = extras({ kind: "kit", knownIds: KITS.map((k) => k.id) });
  const products = [...applyMany(CATALOG), ...extraProducts].filter((p: any) => p.promo);
  const kits = [...applyMany(KITS), ...extraKits].filter((k: any) => k.promo);
  const total = products.length + kits.length;

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
            Ofertas relâmpago
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
            Promoções ativas
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {total > 0
              ? `${total} ${total === 1 ? "produto" : "produtos"} em oferta agora.`
              : "Nenhuma promoção rolando no momento — volte em breve!"}
          </p>
        </header>

        {kits.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold">Kits em promoção</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {kits.map((k: any) => (
                <Link
                  key={k.id}
                  to="/kit/$id"
                  params={{ id: k.id }}
                  className="group flex flex-col rounded-2xl border border-destructive/40 bg-surface-raised p-6 transition-all hover:-translate-y-1 hover:border-destructive"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-display text-xl font-semibold">{k.name}</h3>
                    <span className="rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      −{k.promo.discountPct}%
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{k.story}</p>
                  <div className="mt-4 border-t border-border pt-4">
                    <PriceTag basePriceLabel={k.price} promo={k.promo} size="md" />
                    {k.promo.hasTimeLimit && (
                      <p className="mt-1 text-[11px] text-destructive">Termina em {formatCountdown(k.promo.endsAt)}</p>
                    )}
                    {k.promo.hasUnitLimit && (
                      <p className="mt-1 text-[11px] text-destructive">{k.promo.unitsTotal} un restantes</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold">Sabores em promoção</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p: any) => (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-destructive/40 bg-surface-raised"
                >
                  <Link to="/produto/$id" params={{ id: p.id }} className="relative block">
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      −{p.promo.discountPct}%
                    </span>
                    <PackageBag product={p} className="aspect-[4/5]" />
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{p.origin} · {p.weight}</p>
                    <div className="mt-4 border-t border-border pt-3">
                      <PriceTag basePriceLabel={p.price} promo={p.promo} size="sm" />
                      {p.promo.hasTimeLimit && (
                        <p className="mt-1 text-[11px] text-destructive">Termina em {formatCountdown(p.promo.endsAt)}</p>
                      )}
                      {p.promo.hasUnitLimit && (
                        <p className="mt-1 text-[11px] text-destructive">{p.promo.unitsTotal} un restantes</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {total === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Volte logo — sempre tem promoção nova rolando.
            </p>
            <Link to="/catalog" className="mt-6 inline-block rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-gold-light">
              Ver catálogo completo
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
