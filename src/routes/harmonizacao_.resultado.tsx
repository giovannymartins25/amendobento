import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { Nav } from "@/components/Nav";
import { PackageBag } from "@/components/PackageBag";
import {
  DRINKS,
  KITS,
  PAIRINGS,
  archetypeFor,
  getVibe,
  type Product,
} from "@/lib/amendobento";
import { store, useStore } from "@/lib/store";
import { requireAuthOrRedirect } from "@/lib/auth-guard";

const search = z.object({
  drink: z.string().default("cerveja"),
  vibe: z.string().optional(),
});

export const Route = createFileRoute("/harmonizacao_/resultado")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Sua harmonização — Amendobento" },
      {
        name: "description",
        content:
          "Os amendoins e kits que harmonizam com a sua bebida e vibe, prontos para comprar.",
      },
    ],
  }),
  component: ResultadoPage,
});

function ResultadoPage() {
  const { drink, vibe } = Route.useSearch();
  const navigate = useNavigate();

  const drinkObj = DRINKS.find((d) => d.id === drink) ?? DRINKS[0];
  const vibeObj = vibe ? getVibe(vibe) : undefined;
  const arche = archetypeFor(drink);
  const pairings: Product[] = PAIRINGS[drink] ?? PAIRINGS.cerveja;

  const suggestedKits = KITS.filter(
    (k) =>
      k.products.includes(arche.hero) || (vibe && k.vibe === vibe),
  ).slice(0, 3);

  const unlocked = useStore((s) => s.unlockedArchetype);

  useEffect(() => {
    if (unlocked !== arche.id) {
      store.unlockArchetype(arche.id);
      store.applyCoupon(arche.coupon.code, arche.coupon.discount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arche.id]);

  const addToCart = async (p: Product) => {
    if (!(await requireAuthOrRedirect())) return;
    store.addToCart(p.id);
  };

  const buyNow = async (p: Product) => {
    if (!(await requireAuthOrRedirect())) return;
    store.setBuyNow(p.id);
    navigate({ to: "/checkout", search: { buyNow: 1 } });
  };

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/harmonizacao"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Refazer harmonização
        </Link>

        {/* Combinação escolhida */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-gold-tint bg-surface-raised p-6 sm:p-10 shadow-amber">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Sua harmonização
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {drinkObj.name}
            {vibeObj ? ` + ${vibeObj.name}` : ""}{" "}
            <span className="text-gold">=</span> combinação perfeita
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Pra {drinkObj.name.toLowerCase()}
            {vibeObj ? ` na vibe ${vibeObj.name.toLowerCase()}` : ""}, separamos esses sabores
            pra você. Bora pro carrinho?
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gold-tint bg-background/40 px-3 py-1 text-xs text-gold">
              {drinkObj.name}
            </span>
            {vibeObj && (
              <span className="rounded-full border border-gold-tint bg-background/40 px-3 py-1 text-xs text-gold">
                {vibeObj.name}
              </span>
            )}
          </div>
        </section>

        {/* Amendoins que harmonizam */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">
              Amendoins que harmonizam
            </h2>
            <Link
              to="/catalog"
              className="text-xs uppercase tracking-wider text-gold hover:underline"
            >
              Ver catálogo
            </Link>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pairings.map((p) => (
              <article
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition-all hover:-translate-y-1 hover:border-gold hover:shadow-gold"
              >
                <Link
                  to="/produto/$id"
                  params={{ id: p.id }}
                  className="block aspect-[4/5] overflow-hidden"
                >
                  <PackageBag product={p} className="h-full w-full" />
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <Link
                    to="/produto/$id"
                    params={{ id: p.id }}
                    className="font-display text-lg font-semibold hover:text-gold"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {p.note}
                  </p>
                  <p className="mt-3 font-display text-xl font-bold text-gold">
                    {p.price}
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      onClick={() => buyNow(p)}
                      className="rounded-lg bg-gold py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
                    >
                      Comprar agora
                    </button>
                    <button
                      onClick={() => addToCart(p)}
                      className="rounded-lg border border-gold py-2 text-xs font-semibold text-gold hover:bg-gold/10"
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Kits sugeridos */}
        {suggestedKits.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold">
              Kits do seu perfil
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedKits.map((k) => (
                <Link
                  key={k.id}
                  to="/kit/$id"
                  params={{ id: k.id }}
                  className="group flex flex-col rounded-2xl border border-border bg-surface-raised p-5 transition-all hover:-translate-y-1 hover:border-gold hover:shadow-gold"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">{k.name}</h3>
                    {k.badge && (
                      <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                        {k.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {k.story}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="font-display text-base font-bold text-gold">
                      {k.price}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {k.social}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cupom desbloqueado */}
        <section className="mt-10 rounded-2xl border-2 border-dashed border-gold bg-gold-tint p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Cupom desbloqueado
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono-coupon text-3xl font-bold text-gold">
                {arche.coupon.code}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(arche.coupon.discount * 100)}% off · válido por 7 dias
              </p>
            </div>
            <Link
              to="/checkout"
              className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
            >
              Usar agora
            </Link>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/harmonizacao"
            className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground hover:border-gold hover:text-gold"
          >
            Refazer harmonização
          </Link>
          <Link
            to="/catalog"
            className="rounded-lg border border-gold px-5 py-2.5 text-sm font-semibold text-gold hover:bg-gold/10"
          >
            Ver catálogo completo
          </Link>
        </div>
      </main>
    </div>
  );
}
