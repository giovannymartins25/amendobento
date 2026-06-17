import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Users, ArrowLeft } from "lucide-react";

const ITEMS = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-surface-raised/30 md:flex md:flex-col">
      <div className="px-4 py-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Painel</p>
        <p className="font-display text-base font-bold text-gold">Amendobento Admin</p>
      </div>
      <nav className="flex-1 px-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`mb-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-gold-tint text-gold"
                  : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft size={13} /> Voltar ao site
        </Link>
      </div>
    </aside>
  );
}
