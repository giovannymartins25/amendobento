import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { store } from "@/lib/store";
import { Nav } from "@/components/Nav";
import heroImg from "@/assets/hero-peanuts.jpg";
import logo from "@/assets/logo-amendobento.png";
import { CATALOG, KITS } from "@/lib/amendobento";
import { PackageBag } from "@/components/PackageBag";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogOverrides, useTopProduct } from "@/lib/useCatalog";
import { PriceTag } from "@/components/PriceTag";
import { requireAuthOrRedirect } from "@/lib/auth-guard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Amendobento — Amendoim gourmet de Marília" },
      { name: "description", content: "Descubra os 4 sabores Amendobento. Combos, assinatura mensal e vantagens exclusivas." },
      { property: "og:title", content: "Amendobento — Do grão à experiência" },
      { property: "og:description", content: "Amendoim gourmet, combos e assinatura mensal." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const showSignupBanner = !loading && !user;
  const { applyMany } = useCatalogOverrides();
  const topQ = useTopProduct();
  const topSlug = topQ.data?.top?.slug;
  const sabores = applyMany(CATALOG).sort((a, b) =>
    a.id === topSlug ? -1 : b.id === topSlug ? 1 : 0,
  );
  const kits = applyMany(KITS);

  async function addProduct(p: any) {
    if (!(await requireAuthOrRedirect())) return;
    store.addToCart(p.id, 1, "product", p?.promo?.unitsTotal ?? undefined);
  }

  return (
    <div className="radial-hero min-h-screen">
      <Nav />

      {showSignupBanner && (
        <div className="border-b border-gold-tint bg-gradient-to-r from-gold-tint/60 via-background to-gold-tint/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6 py-2.5 text-center text-xs sm:text-sm">
            <span>Crie sua conta grátis e ganhe 50 pontos de boas-vindas.</span>
            <Link
              to="/login"
              className="rounded-full bg-gold px-4 py-1 text-xs font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.03] hover:bg-gold-light"
            >
              Criar conta
            </Link>
          </div>
        </div>
      )}

      <main className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20 lg:py-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.04] grid-overlay" />
        <div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Amendoim gourmet, torrado em{" "}
            <span className="text-gold italic">Marília–SP</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Quatro sabores autorais, embalados com cuidado e prontos pra acompanhar
            cada momento. Conheça nossa linha, monte seu kit ou assine e receba todo mês.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-8 py-4 text-base font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.02] hover:bg-gold-light hover:shadow-gold-lg active:scale-[0.98]"
            >
              Ver catálogo
            </Link>
            <Link
              to="/clube"
              className="inline-flex items-center gap-2 rounded-lg border border-gold px-6 py-4 text-base font-semibold text-gold transition-colors hover:bg-gold-tint"
            >
              Assine o clube
            </Link>
          </div>
        </div>

        <Link
          to="/catalog"
          className="group relative block"
          aria-label="Ver catálogo"
        >
          <div className="absolute -inset-10 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-raised shadow-2xl transition-transform group-hover:-translate-y-1 group-hover:shadow-gold-lg">
            <img
              src={heroImg}
              alt="Amendoins gourmet em tigela escura com iluminação dourada"
              width={1280}
              height={960}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div className="rounded-xl border border-gold-tint bg-background/80 px-3 py-2 backdrop-blur">
                <p className="font-display text-sm font-bold leading-tight text-foreground">
                  Linha Amendobento
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gold">
                  Toque pra ver
                </p>
              </div>
              <img
                src={logo}
                alt=""
                className="h-14 w-14 object-contain opacity-90 drop-shadow-lg"
              />
            </div>
          </div>
        </Link>
      </main>

      {/* Kits em destaque */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex items-baseline justify-between border-t border-border pt-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Combos curados
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
              Kits em destaque
            </h2>
          </div>
          <Link to="/kits" className="text-xs uppercase tracking-wider text-gold hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kits.slice(0, 4).map((k) => (
            <Link
              key={k.id}
              to="/kit/$id"
              params={{ id: k.id }}
              className="group flex flex-col rounded-2xl border border-border bg-surface-raised p-5 transition-all hover:-translate-y-1 hover:border-gold hover:shadow-gold"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display text-base font-semibold leading-tight">{k.name}</h3>
                {k.badge && (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                    {k.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                {k.story}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="font-mono-coupon text-[10px] text-muted-foreground">
                  {k.products.length} sabores
                </span>
                <span className="font-display text-base font-bold text-gold">{k.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Harmonização (movido para baixo de Kits) */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="overflow-hidden rounded-3xl border border-gold-tint bg-gradient-to-br from-gold-tint/40 via-surface-raised to-surface-raised p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Harmonização
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-4xl">
                Qual amendoim combina com sua bebida?
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                Conte sua bebida e o momento — a gente sugere o sabor (e o kit)
                perfeito pra acompanhar. Rápido, divertido e sem complicação.
              </p>
              <Link
                to="/harmonizacao"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
              >
                Descobrir minha harmonização
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="rounded-2xl border border-border bg-background/40 p-6">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Em 3 perguntas
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>1. Qual a vibe do momento?</li>
                  <li>2. O que você está bebendo?</li>
                  <li>3. Receba sua harmonização ideal.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quem somos com link pra página detalhada */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid items-center gap-10 rounded-3xl border border-gold-tint bg-surface-raised p-8 md:grid-cols-[1.4fr_1fr] md:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Nossa história
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-4xl">
              Quem somos
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              O Amendobento segue a tradição iniciada pelo Sr Bento, um avô muito habilidoso na produção dos petiscos e agora homenageado com seu retrato no rótulo dos nossos produtos.
              <br /><br />
              Provenientes da agricultura familiar, selecionamos os melhores e maiores grãos para a produção. Seguimos a receita herdada e o passo a passo da torra tradicional garantindo sua crocancia, qualidade e sabor incomparável. Uma empresa familiar que cuida de todos os detalhes até nossos produtos chegarem às suas mãos.
            </p>
            <Link
              to="/quem-somos"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gold px-5 py-2.5 text-sm font-semibold text-gold hover:bg-gold-tint"
            >
              Ver mais sobre nós
            </Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-gold/15 blur-3xl" />
            <img
              src={logo}
              alt="Selo Amendobento"
              className="relative mx-auto h-48 w-48 object-contain drop-shadow-2xl md:h-56 md:w-56"
            />
          </div>
        </div>
      </section>

      {/* Promoções */}
      {(() => {
        const promoSabores = sabores.filter((s: any) => s.promo).slice(0, 3);
        const promoKits = kits.filter((k: any) => k.promo).slice(0, 3);
        const promos = [...promoKits, ...promoSabores].slice(0, 3);
        if (promos.length === 0) return null;
        return (
          <section className="mx-auto max-w-6xl px-6 pb-16">
            <div className="flex items-baseline justify-between border-t border-border pt-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
                  Ofertas relâmpago
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
                  Promoções
                </h2>
              </div>
              <Link to="/promocoes" className="text-sm text-muted-foreground hover:text-destructive">
                Ver todas
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {promos.map((item: any) => {
                const isKit = !!item.products;
                const linkProps = isKit
                  ? { to: "/kit/$id" as const, params: { id: item.id } }
                  : { to: "/produto/$id" as const, params: { id: item.id } };
                return (
                  <Link
                    key={item.id}
                    {...linkProps}
                    className="group flex flex-col rounded-2xl border border-destructive/40 bg-surface-raised p-6 transition-all hover:-translate-y-1 hover:border-destructive"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                      <span className="rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        −{item.promo.discountPct}%
                      </span>
                    </div>
                    <div className="mt-3 border-t border-border pt-3">
                      <PriceTag basePriceLabel={item.price} promo={item.promo} size="sm" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* Os 4 sabores */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex items-baseline justify-between border-t border-border pt-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Linha oficial
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
              Os 4 sabores Amendobento
            </h2>
          </div>
          <Link to="/catalog" className="text-xs uppercase tracking-wider text-gold hover:underline">
            Ver catálogo
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sabores.map((p) => (
            <article
              key={p.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition-all hover:-translate-y-1 hover:border-gold"
            >
              {topSlug === p.id && (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-gold">
                  Mais pedido
                </span>
              )}
              <Link to="/produto/$id" params={{ id: p.id }} className="relative block">
                <PackageBag product={p} className="aspect-[4/5]" />
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: p.color }}
                    aria-hidden
                  />
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.note}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-mono-coupon text-[10px] text-muted-foreground">
                    {p.weight} · {p.sku}
                  </span>
                  <span className="font-display text-base font-bold text-gold">{p.price}</span>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
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
            </article>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
          Amendoim torrado artesanal · grãos selecionados · Tupã/SP
        </p>
      </section>
    </div>
  );
}
