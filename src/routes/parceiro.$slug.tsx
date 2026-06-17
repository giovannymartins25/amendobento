import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Particles } from "@/components/Particles";
import { PackageBag } from "@/components/PackageBag";
import { getKit, getPartner, getProduct, type Partner } from "@/lib/amendobento";
import { store } from "@/lib/store";

export const Route = createFileRoute("/parceiro/$slug")({
  head: ({ params }) => {
    const p = getPartner(params.slug);
    return {
      meta: [
        { title: p ? `Vindo de ${p.name} — Amendobento` : "Parceiro — Amendobento" },
        { name: "description", content: p ? `Cupom exclusivo para quem provou Amendobento no ${p.name}.` : "Experiência B2B Amendobento." },
      ],
    };
  },
  loader: ({ params }) => {
    const partner = getPartner(params.slug);
    if (!partner) throw notFound();
    return { partner };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-6xl">🍺</p>
        <h1 className="mt-4 font-display text-3xl font-bold">Parceiro não encontrado</h1>
        <Link to="/" className="mt-6 inline-block text-gold underline">
          Ir para a home
        </Link>
      </main>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background p-10 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  component: PartnerPage,
});

function PartnerPage() {
  const data = Route.useLoaderData() as { partner: Partner };
  const partner = data.partner;
  const kit = getKit(partner.kit);
  const heroProduct = kit ? getProduct(kit.products[0]) : undefined;

  useEffect(() => {
    store.setReferral(partner.slug);
    store.applyCoupon(partner.coupon.code, partner.coupon.discount);
    store.saySomething(`Provou no ${partner.name}? Cupom liberado! 🎁`, "celebrating", 6000);
  }, [partner.slug, partner.name, partner.coupon.code, partner.coupon.discount]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-tabbar">
      <Particles count={18} />
      <Nav />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          🍺 Você conheceu Amendobento no
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-6xl">
          {partner.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {partner.type} · {partner.city}
        </p>
        <p className="mt-5 max-w-xl text-lg italic text-foreground">
          “{partner.greeting}”
        </p>

        {/* Cupom */}
        <section className="mt-8 overflow-hidden rounded-3xl border-2 border-dashed border-gold bg-gold-tint p-6 shadow-amber">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">🎁 Cupom exclusivo</p>
          <p className="font-mono-coupon mt-2 text-4xl font-bold text-gold">{partner.coupon.code}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong className="text-gold">{Math.round(partner.coupon.discount * 100)}% OFF</strong> aplicado automaticamente na sua próxima compra.
          </p>
        </section>

        {/* Kit recomendado */}
        {kit && heroProduct && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-surface-raised">
            <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
              <PackageBag product={heroProduct} className="aspect-[4/5] md:aspect-auto" />
              <div className="flex flex-col justify-between p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Sugestão do {partner.name}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold">{kit.emoji} {kit.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{kit.story}</p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-display text-2xl font-bold text-gold">{kit.price}</span>
                  <Link
                    to="/kit/$id"
                    params={{ id: kit.id }}
                    className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
                  >
                    Resgatar agora →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/harmonizacao"
            className="rounded-lg border border-gold px-5 py-3 text-sm font-semibold text-gold hover:bg-gold-tint"
          >
            Falar com o Mestre 💬
          </Link>
          <Link
            to="/catalog"
            className="rounded-lg border border-border bg-surface-raised px-5 py-3 text-sm text-muted-foreground hover:border-gold hover:text-gold"
          >
            Ver todos os sabores
          </Link>
        </div>
      </main>
    </div>
  );
}