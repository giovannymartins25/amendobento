import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Instagram, MessageCircle, Mail, MapPin } from "lucide-react";
import { CONTACT } from "@/lib/contact";
import banner from "@/assets/banner-amarelo.jpeg.asset.json";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Amendobento" },
      { name: "description", content: "Fale com a Amendobento pelo WhatsApp, Instagram ou e-mail." },
      { property: "og:title", content: "Contato — Amendobento" },
      { property: "og:description", content: "WhatsApp, Instagram e e-mail oficiais da Amendobento." },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Fale com a gente</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">Contato</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Pedidos, parcerias ou só pra trocar uma ideia sobre amendoim — estamos por aqui.
        </p>

        <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-surface-raised">
          <img src={banner.url} alt="Amendobento" className="aspect-[820/312] w-full object-cover" />
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-border bg-surface-raised p-6 transition-all hover:-translate-y-0.5 hover:border-gold"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-tint text-gold">
              <MessageCircle size={20} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp</p>
              <p className="mt-1 font-display text-lg font-semibold">{CONTACT.whatsappDisplay}</p>
              <p className="mt-1 text-xs text-muted-foreground">Resposta rápida em horário comercial.</p>
            </div>
          </a>

          <a
            href={CONTACT.instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-border bg-surface-raised p-6 transition-all hover:-translate-y-0.5 hover:border-gold"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-tint text-gold">
              <Instagram size={20} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Instagram</p>
              <p className="mt-1 font-display text-lg font-semibold">{CONTACT.instagramHandle}</p>
              <p className="mt-1 text-xs text-muted-foreground">Bastidores, lançamentos e parcerias.</p>
            </div>
          </a>

          <a
            href="mailto:amendobento@gmail.com"
            className="flex items-start gap-4 rounded-2xl border border-border bg-surface-raised p-6 transition-all hover:-translate-y-0.5 hover:border-gold"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-tint text-gold">
              <Mail size={20} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</p>
              <p className="mt-1 font-display text-lg font-semibold">amendobento@gmail.com</p>
              <p className="mt-1 text-xs text-muted-foreground">Pedidos corporativos e atacado.</p>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-2xl border border-border bg-surface-raised p-6">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-tint text-gold">
              <MapPin size={20} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Onde estamos</p>
              <p className="mt-1 font-display text-lg font-semibold">{CONTACT.city}</p>
              <p className="mt-1 text-xs text-muted-foreground">Capital nacional do amendoim.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
