import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, MapPin } from "lucide-react";
import logo from "@/assets/logo-amendobento.png";
import { CONTACT } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface-raised">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Amendobento" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-display text-base font-bold text-gold">Amendobento</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Amendoim Gourmet
              </p>
            </div>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Do grão à experiência. Amendoins gourmet harmonizados pra cada momento.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Contato</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin size={16} className="text-gold" />
              {CONTACT.city}
            </li>
            <li>
              <a
                href={CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-gold"
              >
                <MessageCircle size={16} className="text-gold" />
                WhatsApp {CONTACT.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={CONTACT.instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-gold"
              >
                <Instagram size={16} className="text-gold" />
                Instagram {CONTACT.instagramHandle}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Navegação</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {[
              { to: "/", label: "Início" },
              { to: "/catalog", label: "Catálogo" },
              { to: "/kits", label: "Kits" },
              { to: "/promocoes", label: "Promoções" },
              { to: "/harmonizacao", label: "Harmonização" },
              { to: "/clube", label: "Assinatura" },
              { to: "/quem-somos", label: "Quem somos" },
              { to: "/perfil", label: "Perfil" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
        © {new Date().getFullYear()} Amendobento · Feito com amendoim em Marília–SP
      </div>
    </footer>
  );
}
