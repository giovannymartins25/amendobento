import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { store } from "@/lib/store";
import { Nav } from "@/components/Nav";
import logo from "@/assets/logo-amendobento.png";
import { CATALOG, KITS } from "@/lib/amendobento";
import { PackageBag } from "@/components/PackageBag";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogOverrides, useTopProduct } from "@/lib/useCatalog";
import { PriceTag } from "@/components/PriceTag";
import { requireAuthOrRedirect } from "@/lib/auth-guard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Amendobento — Amendoim gourmet de Marília" },
      { name: "description", content: "Descubra os 4 sabores Amendobento. Combos, assinatura mensal e vantagens exclusivas." },
      { property: "og:title", content: "Amendobento — Do grão à experiência" },
      { property: "og:description", content: "Amendoim gourmet, combos e assinatura mensal." },
    ],
  }),
  component: Index,
}));

/** Hook simples pra animar entrada quando entra na viewport */
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

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

  const harmInView = useInView();
  const saboresInView = useInView();
  const kitsInView = useInView();

  async function addProduct(p: any) {
    if (!(await requireAuthOrRedirect())) return;
    store.addToCart(p.id, 1, "product", p?.promo?.unitsTotal ?? undefined);
  }

  return (
    <div className="min-h-screen bg-background">
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

      {/* ─── 1. HERO CARROSSEL ─── */}
      <HeroCarousel />

      {/* ─── 2. HARMONIZAÇÃO EM DESTAQUE ─── */}
      <section
        ref={harmInView.ref}
        className="relative overflow-hidden"
        id="harmonizacao-destaque"
      >
        {/* Fundo gradiente impactante */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-tint/50 via-background to-brown/30" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold/10 blur-[100px]" />
        <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-gold/8 blur-[80px]" />

        <div className={`relative mx-auto max-w-6xl px-6 py-16 md:py-24 ${harmInView.visible ? "animate-slide-up" : "opacity-0"}`}>
          <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-tint bg-gold-tint px-4 py-1.5">
                <span className="text-lg">✨</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Harmonização
                </span>
              </div>

              <h2 className="mt-5 font-display text-3xl font-bold leading-tight md:text-5xl">
                Qual amendoim combina com{" "}
                <span className="text-gold">sua bebida</span>?
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-lg">
                Conte sua vibe e o que está bebendo — em 3 perguntas rápidas a gente sugere
                o sabor (e o kit) perfeito. Rápido, divertido e sem complicação.
              </p>

              <Link
                to="/harmonizacao"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-gold px-8 py-4 text-base font-bold text-primary-foreground shadow-gold animate-pulse-gold transition-all hover:scale-[1.03] hover:bg-gold-light hover:shadow-gold-lg active:scale-[0.98]"
              >
                Descobrir agora
              </Link>
            </div>

            {/* Cards dos 3 passos */}
            <div className="flex flex-col gap-4">
              {[
                { step: "1", title: "Escolha a vibe", desc: "Futebol, churrasco, happy hour, cinema…" },
                { step: "2", title: "Diga sua bebida", desc: "Cerveja, vinho, café, drinque ou suco." },
                { step: "3", title: "Receba a harmonização", desc: "Sabor ideal + cupom exclusivo pra você." },
              ].map((item, i) => (
                <div
                  key={item.step}
                  className={`group flex items-center gap-4 rounded-2xl border border-border bg-surface-raised/80 p-5 backdrop-blur transition-all hover:border-gold hover:shadow-gold ${
                    harmInView.visible ? `animate-slide-up animate-slide-up-delay-${i + 1}` : "opacity-0"
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold font-display text-lg font-bold text-primary-foreground transition-transform group-hover:scale-110">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                      Passo {item.step}
                    </p>
                    <p className="font-display text-base font-semibold leading-tight">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. CLUBE DE ASSINATURA ─── */}
      <section className="relative overflow-hidden py-16 md:py-20">
        {/* Background com gradiente premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-brown/60 via-background to-gold-tint/20" />
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-gold/8 blur-[120px]" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-gold/6 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-3xl border border-gold/30 bg-surface-raised/90 backdrop-blur-sm">
            <div className="grid items-center gap-0 md:grid-cols-[1.2fr_1fr]">
              {/* Conteúdo */}
              <div className="p-8 md:p-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-tint px-4 py-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                    Clube Amendobento
                  </span>
                </div>

                <h2 className="mt-5 font-display text-3xl font-bold leading-tight md:text-4xl">
                  Receba todo mês,{" "}
                  <span className="text-gold">sem pensar</span>
                </h2>

                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                  Assine o clube e receba seus sabores favoritos na porta de casa.
                  Sem frete, sem preocupação — só prazer garantido todo mês.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Entrega mensal automática",
                    "Frete grátis em todas as entregas",
                    "Desconto exclusivo de assinante",
                    "Acumule pontos em dobro no clube",
                    "Cancele quando quiser, sem multa",
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-sm text-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[10px] font-bold text-gold">
                        ✓
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/clube"
                    className="inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-4 text-base font-bold text-primary-foreground shadow-gold animate-pulse-gold transition-all hover:scale-[1.03] hover:bg-gold-light hover:shadow-gold-lg active:scale-[0.98]"
                  >
                    Assinar agora
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    a partir de <span className="font-display text-lg font-bold text-gold">R$ 34,90</span>/mês
                  </span>
                </div>
              </div>

              {/* Lado direito — visual */}
              <div className="relative hidden h-full min-h-[400px] items-center justify-center bg-gradient-to-br from-gold-tint/30 to-brown/20 md:flex">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--gold)_0%,_transparent_70%)] opacity-10" />
                <div className="relative text-center">
                  <img
                    src={logo}
                    alt="Clube Amendobento"
                    className="mx-auto h-40 w-40 object-contain drop-shadow-2xl"
                  />
                  <div className="mt-6 rounded-2xl border border-gold/20 bg-background/60 px-6 py-4 backdrop-blur">
                    <p className="font-display text-sm font-semibold text-gold">Clube Amendobento</p>
                    <p className="mt-1 text-xs text-muted-foreground">Seu amendoim favorito, todo mês</p>
                    <div className="mt-3 flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="text-sm text-gold">★</span>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">4.9 · 312 assinantes ativos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. OS 4 SABORES ─── */}
      <section
        ref={saboresInView.ref}
        className={`mx-auto max-w-6xl px-6 py-16 ${saboresInView.visible ? "animate-slide-up" : "opacity-0"}`}
      >
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Linha oficial
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
              Os sabores Amendobento
            </h2>
          </div>
          <Link to="/catalog" className="text-xs uppercase tracking-wider text-gold hover:underline">
            Ver catálogo
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sabores.map((p) => (
            <article
              key={p.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition-all hover:-translate-y-1 hover:border-gold hover:shadow-gold-lg"
            >
              {topSlug === p.id && (
                <span className="absolute left-3 top-3 z-10 animate-pulse-gold rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-gold">
                  ⭐ Mais pedido
                </span>
              )}
              <Link to="/produto/$id" params={{ id: p.id }} className="relative block">
                <PackageBag product={p} className="aspect-[4/5]" />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shadow-sm"
                    style={{ background: p.color }}
                    aria-hidden
                  />
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                </div>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">{p.note}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-mono-coupon text-[10px] text-muted-foreground">
                    {p.weight} · {p.sku}
                  </span>
                  <span className="font-display text-lg font-bold text-gold">{p.price}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    to="/produto/$id"
                    params={{ id: p.id }}
                    className="flex items-center justify-center rounded-lg border border-border bg-surface-overlay px-3 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-gold hover:text-gold"
                  >
                    Ver detalhes
                  </Link>
                  <button
                    onClick={() => addProduct(p)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2.5 text-xs font-bold text-primary-foreground shadow-gold transition-all hover:scale-[1.02] hover:bg-gold-light hover:shadow-gold-lg active:scale-[0.98]"
                  >
                    🛒 Comprar
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

      {/* ─── 4. KITS EM DESTAQUE ─── */}
      <section
        ref={kitsInView.ref}
        className={`mx-auto max-w-6xl px-6 pb-16 ${kitsInView.visible ? "animate-slide-up" : "opacity-0"}`}
      >
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

      {/* ─── 6. PROMOÇÕES ─── */}
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

      {/* ─── 6. QUEM SOMOS ─── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
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
    </div>
  );
}
