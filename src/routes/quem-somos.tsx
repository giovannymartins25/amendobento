import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import logo from "@/assets/logo-amendobento.png";

import historia from "@/assets/historia.jpeg.asset.json";
import graos from "@/assets/graos-selecionados.jpeg.asset.json";
import saboresTrio from "@/assets/sabores-trio.jpeg.asset.json";
import banner from "@/assets/banner-amarelo.jpeg.asset.json";

export const Route = createFileRoute("/quem-somos")({
  head: () => ({
    meta: [
      { title: "Quem somos — Amendobento" },
      { name: "description", content: "Conheça a história da Amendobento, marca de amendoim gourmet feita em Marília–SP." },
      { property: "og:title", content: "Quem somos — Amendobento" },
      { property: "og:description", content: "A história, os valores e o jeito Amendobento de fazer amendoim." },
    ],
  }),
  component: QuemSomosPage,
});

function QuemSomosPage() {
  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Nossa história</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">
          Quem somos
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          O Amendobento segue a tradição iniciada pelo Sr Bento, um avô muito habilidoso na produção dos petiscos e agora homenageado com seu retrato no rótulo dos nossos produtos.
          <br /><br />
          Provenientes da agricultura familiar, selecionamos os melhores e maiores grãos para a produção. Seguimos a receita herdada e o passo a passo da torra tradicional garantindo sua crocancia, qualidade e sabor incomparável. Uma empresa familiar que cuida de todos os detalhes até nossos produtos chegarem às suas mãos.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border bg-surface-raised">
            <img src={historia.url} alt="Nossa história — tradição iniciada pelo Sr. Bento" className="aspect-[795/1122] w-full object-cover" loading="lazy" />
          </div>
          <div className="overflow-hidden rounded-3xl border border-border bg-surface-raised">
            <img src={graos.url} alt="Grãos selecionados, não fritos, com ziplock" className="aspect-[795/1122] w-full object-cover" loading="lazy" />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface-raised">
          <img src={banner.url} alt="Amendobento" className="aspect-[820/312] w-full object-cover" loading="lazy" />
        </div>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Origem</p>
            <h2 className="mt-2 font-display text-lg font-semibold">Direto da terra do amendoim</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Trabalhamos com produtores locais de Marília e região, garantindo
              grão fresco, rastreável e da safra mais recente.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Torra</p>
            <h2 className="mt-2 font-display text-lg font-semibold">Artesanal e na medida</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cada lote é torrado com atenção ao ponto certo, preservando crocância,
              sabor e os óleos naturais do amendoim.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Sabor</p>
            <h2 className="mt-2 font-display text-lg font-semibold">Quatro receitas autorais</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tradicional, Alho Frito, Cebola Crispy e Pimenta — desenvolvidos
              pra harmonizar com a sua bebida e o seu momento.
            </p>
          </div>
        </section>

        <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-surface-raised">
          <img src={saboresTrio.url} alt="Sabores Amendobento" className="w-full object-cover" loading="lazy" />
        </div>

        <section className="mt-12 rounded-3xl border border-gold-tint bg-surface-raised p-8 text-center">
          <img src={logo} alt="" className="mx-auto h-24 w-24 object-contain" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Mais que petisco, ritual</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A Amendobento é o convite pra desacelerar e curtir o agora. Seja num churrasco,
            no happy hour ou no sofá vendo um filme — a gente quer estar lá com você.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/catalog" className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light">
              Conhecer a linha
            </Link>
            <Link to="/clube" className="rounded-lg border border-gold px-6 py-2.5 text-sm font-semibold text-gold hover:bg-gold-tint">
              Assinar o clube
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
