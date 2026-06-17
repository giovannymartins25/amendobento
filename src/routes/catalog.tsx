import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { CATALOG } from "@/lib/amendobento";
import { store } from "@/lib/store";
import { PackageBag } from "@/components/PackageBag";
import { useCatalogOverrides, useTopProduct } from "@/lib/useCatalog";
import { PriceTag } from "@/components/PriceTag";
import { requireAuthOrRedirect } from "@/lib/auth-guard";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catálogo — Amendobento" },
      { name: "description", content: "Todos os amendoins gourmet do Amendobento, com filtros e atalhos para kits e promoções." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const [query, setQuery] = useState("");
  const [minIntensity, setMinIntensity] = useState(1);
  const [maxKcal, setMaxKcal] = useState(700);
  const { applyMany, extras } = useCatalogOverrides();
  const topQ = useTopProduct();
  const topSlug = topQ.data?.top?.slug;

  const filtered = useMemo(() => {
    const extra = extras({ kind: "product", knownIds: CATALOG.map((p) => p.id) });
    const all = [...applyMany(CATALOG), ...extra];
    const list = all.filter((p: any) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.tags ?? []).some((t: string) => t.toLowerCase().includes(query.toLowerCase()));
      return matchesQuery && p.intensity >= minIntensity && (p.kcal ?? 0) <= maxKcal;
    });
    if (topSlug) {
      list.sort((a: any, b: any) => (a.id === topSlug ? -1 : b.id === topSlug ? 1 : 0));
    }
    return list;
  }, [applyMany, extras, query, minIntensity, maxKcal, topSlug]);

  async function addProduct(p: any) {
    if (!(await requireAuthOrRedirect())) return;
    store.addToCart(p.id, 1, "product", p?.promo?.unitsTotal ?? undefined);
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Catálogo técnico
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
              {filtered.length} produtos disponíveis
            </h1>
          </div>
        </div>

        {/* Atalhos para Kits e Promoções (movidos para dentro do catálogo) */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            to="/kits"
            className="flex items-center justify-between rounded-2xl border border-gold-tint bg-surface-raised p-5 transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-gold"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">Combos curados</p>
              <p className="mt-1 font-display text-lg font-semibold">Ver kits prontos</p>
              <p className="mt-1 text-xs text-muted-foreground">Combinações pensadas para cada momento.</p>
            </div>
            <span className="text-gold">→</span>
          </Link>
          <Link
            to="/promocoes"
            className="flex items-center justify-between rounded-2xl border border-destructive/40 bg-surface-raised p-5 transition-all hover:-translate-y-0.5 hover:border-destructive"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Ofertas relâmpago</p>
              <p className="mt-1 font-display text-lg font-semibold">Ver promoções</p>
              <p className="mt-1 text-xs text-muted-foreground">Descontos por tempo ou quantidade limitada.</p>
            </div>
            <span className="text-destructive">→</span>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-surface-raised p-5 md:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Buscar</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome ou bebida (ex: IPA)"
              className="rounded-lg border border-border bg-surface-overlay px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Intensidade mínima: {minIntensity}
            </span>
            <input
              type="range"
              min={1}
              max={5}
              value={minIntensity}
              onChange={(e) => setMinIntensity(Number(e.target.value))}
              className="accent-gold"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              kcal máx: {maxKcal}
            </span>
            <input
              type="range"
              min={500}
              max={700}
              step={5}
              value={maxKcal}
              onChange={(e) => setMaxKcal(Number(e.target.value))}
              className="accent-gold"
            />
          </label>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition-all hover:-translate-y-1 hover:border-gold"
            >
              <Link to="/produto/$id" params={{ id: p.id }} className="relative block">
                {topSlug === p.id && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-gold">
                    Mais pedido
                  </span>
                )}
                <PackageBag product={p} className="aspect-[4/5]" />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/produto/$id" params={{ id: p.id }} className="hover:text-gold">
                    <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                  </Link>
                  <span className="font-mono-coupon text-[10px] text-muted-foreground">{p.sku}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.origin} · {p.weight} · {p.kcal} kcal/100g
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(p.tags ?? []).slice(0, 3).map((t: string) => (
                    <span
                      key={t}
                      className="rounded border border-border bg-surface-overlay px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                  <PriceTag basePriceLabel={p.price} promo={(p as any).promo} size="sm" />
                  <div className="flex items-center gap-2">
                    <Link
                      to="/produto/$id"
                      params={{ id: p.id }}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-500"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => addProduct(p)}
                      className="rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-gold-light"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhum produto bate com os filtros.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
