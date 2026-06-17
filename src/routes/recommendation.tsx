import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { DRINKS, PAIRINGS } from "@/lib/amendobento";
import { store } from "@/lib/store";
import { PackageBag } from "@/components/PackageBag";
import { z } from "zod";

const search = z.object({ drink: z.string().default("cerveja") });

export const Route = createFileRoute("/recommendation")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Sua harmonização perfeita — Amendobento" },
      { name: "description", content: "Amendoins gourmet selecionados para combinar com sua bebida." },
    ],
  }),
  component: RecommendationPage,
});

function RecommendationPage() {
  const { drink } = Route.useSearch();
  const drinkObj = DRINKS.find((d) => d.id === drink) ?? DRINKS[0];
  const products = PAIRINGS[drink] ?? PAIRINGS.cerveja;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link to="/selector" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← Trocar bebida
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-3xl">{drinkObj.emoji}</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">
            Harmonização para {drinkObj.name}
          </p>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
          Combinações perfeitas para o seu momento
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Selecionamos os melhores amendoins curados por especialistas.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article
              key={p.id}
              className="group overflow-hidden rounded-2xl border border-border bg-surface-raised transition-all hover:-translate-y-1 hover:border-gold hover:shadow-gold"
            >
              <PackageBag product={p} className="aspect-[4/5]" />
              <div className="p-5">
                <h2 className="font-display text-lg font-semibold">
                  <span className="mr-1">{p.emoji}</span>
                  {p.name}
                </h2>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{p.weight}</span>
                  <span className="text-lg font-bold text-gold">{p.price}</span>
                </div>
                <p className="mt-3 rounded border-l-2 border-gold bg-gold-tint p-3 text-xs italic leading-relaxed text-muted-foreground">
                  {p.note}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Intensidade
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 w-2 rounded-full ${i < p.intensity ? "bg-gold" : "bg-border"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-background/40 p-2 text-[10px] text-muted-foreground">
                  <div>
                    <p className="text-foreground">{p.kcal}</p>
                    <p className="uppercase tracking-wider">kcal</p>
                  </div>
                  <div>
                    <p className="text-foreground">{p.stock}</p>
                    <p className="uppercase tracking-wider">estoque</p>
                  </div>
                  <div>
                    <p className="font-mono-coupon text-foreground">{p.sku?.slice(-3)}</p>
                    <p className="uppercase tracking-wider">lote</p>
                  </div>
                </div>
                <button
                  onClick={() => store.addToCart(p.id)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.02] hover:bg-gold-light"
                >
                  + Adicionar à carrinho
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                📖 Dica de Harmonização
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold">
                A combinação certa eleva a experiência
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Equilibrar intensidade, sal e textura é o segredo. Comece com pequenas porções
                e descubra como cada nota dialoga com sua bebida.
              </p>
            </div>
            <Link
              to="/rewards"
              className="hidden shrink-0 items-center gap-2 rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold-tint sm:inline-flex"
            >
              🏅 Meu clube
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}