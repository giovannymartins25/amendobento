import { Link, useLocation } from "@tanstack/react-router";
import { Home, BookOpen, User, LogIn, ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";

type TabTo = "/" | "/catalog" | "/cart" | "/login" | "/perfil";
type Tab = { to: TabTo; label: string; Icon: typeof Home; badge?: boolean };

export function MobileTabBar() {
  const { pathname } = useLocation();
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0));
  const { user, loading } = useAuth();

  const TABS: Tab[] = [
    { to: "/", label: "Início", Icon: Home },
    { to: "/catalog", label: "Catálogo", Icon: BookOpen },
    !loading && !user
      ? { to: "/login", label: "Entrar", Icon: LogIn }
      : { to: "/perfil", label: "Perfil", Icon: User },
    { to: "/cart", label: "Carrinho", Icon: ShoppingCart, badge: true },
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((t) => {
          const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
          const Icon = t.Icon;
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-3 text-[10px] font-semibold transition-colors ${
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                <span className="leading-none">{t.label}</span>
                {t.badge && cartCount > 0 && (
                  <span className="absolute right-4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-gold" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
