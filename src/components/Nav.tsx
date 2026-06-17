import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import logo from "@/assets/logo-amendobento.png";
import { useStore } from "@/lib/store";
import { UserMenu } from "@/components/UserMenu";

export function Nav() {
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0));

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Amendobento" className="h-10 w-10 object-contain" />
          <div className="hidden sm:block">
            <p className="font-display text-base font-bold leading-none text-gold">Amendobento</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Amendoim Gourmet
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {[
            { to: "/", label: "Início", exact: true },
            { to: "/catalog", label: "Catálogo" },
            { to: "/clube", label: "Clube" },
            { to: "/quem-somos", label: "Quem somos" },
            { to: "/contato", label: "Contato" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={l.exact ? { exact: true } : undefined}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground text-sm"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-sm text-gold bg-gold-tint" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <UserMenu />
          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-raised text-gold transition-colors hover:border-gold"
            aria-label="Carrinho"
          >
            <ShoppingCart size={15} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
