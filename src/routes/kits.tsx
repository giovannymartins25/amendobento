import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { KITS } from "@/lib/amendobento";
import { useCatalogOverrides } from "@/lib/useCatalog";
import comboCerveja from "@/assets/combo-cerveja.jpeg.asset.json";
import saboresTrio from "@/assets/sabores-trio.jpeg.asset.json";

export const Route = createFileRoute("/kits")({
  head: () => ({
    meta: [
      { title: "Kits Amendobento — combos curados" },
      { name: "description", content: "Conheça todos os kits Amendobento: combos curados para cada vibe, com sabores selecionados e preços especiais." },
      { property: "og:title", content: "Kits Amendobento — combos curados" },
      { property: "og:description", content: "Combos curados para cada vibe, com sabores selecionados." },
    ],
  }),
  component: KitsPage,
});

function KitsPage() {
  const { applyMany } = useCatalogOverrides();
  const kits = applyMany(KITS);
  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Combos curados
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
            Kits Amendobento
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Combinações pensadas para cada momento — do happy hour ao jantar romântico.
            Sabores que se completam, preço especial.
          </p>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-gold-tint bg-surface-raised">
            <img src={comboCerveja.url} alt="Amendobento — qualidade, sabor e satisfação" className="aspect-[795/1122] w-full object-cover" loading="lazy" />
          </div>
          <div className="overflow-hidden rounded-3xl border border-gold-tint bg-surface-raised">
            <img src={saboresTrio.url} alt="Sabores Amendobento — Tradicional, Cebola Crispy e Alho Frito" className="aspect-[795/1122] w-full object-cover" loading="lazy" />
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((k) => (
            <Link
              key={k.id}
              to="/kit/$id"
              params={{ id: k.id }}
              className="group flex flex-col rounded-2xl border border-border bg-surface-raised p-6 transition-all hover:-translate-y-1 hover:border-gold hover:shadow-gold"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-display text-xl font-semibold leading-tight">{k.name}</h2>
                {k.badge && (
                  <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    {k.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {k.story}
              </p>
              {k.social && (
                <p className="mt-3 text-xs text-gold">{k.social}</p>
              )}
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="font-mono-coupon text-[11px] text-muted-foreground">
                  {k.products.length} sabores
                </span>
                <span className="font-display text-xl font-bold text-gold">{k.price}</span>
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-12 rounded-3xl border border-gold-tint bg-gradient-to-r from-gold-tint/40 via-surface-raised to-surface-raised p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">Assinatura mensal</p>
              <h3 className="mt-1 font-display text-xl font-semibold">
                Gostou dos kits? Receba todo mês.
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Conheça os combos do clube e economize comparado à compra avulsa.
              </p>
            </div>
            <Link
              to="/clube"
              className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
            >
              Ver assinatura
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
