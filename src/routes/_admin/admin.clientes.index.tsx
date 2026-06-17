import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCustomers, listOrders } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Admin" }] }),
  component: AdminCustomers,
});

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

function AdminCustomers() {
  const navigate = useNavigate();
  const fnC = useServerFn(listCustomers);
  const fnO = useServerFn(listOrders);

  const customers = useQuery({ queryKey: ["admin", "customers"], queryFn: () => fnC() });
  const orders = useQuery({ queryKey: ["admin", "orders"], queryFn: () => fnO() });

  if (customers.isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;

  const list = (customers.data?.customers ?? []) as any[];
  const allOrders = (orders.data?.orders ?? []) as any[];

  const enriched = list.map((c) => {
    const cOrders = allOrders.filter((o) => o.user_id === c.id && o.status !== "cancelado");
    return {
      ...c,
      orderCount: cOrders.length,
      lifetime: cOrders.reduce((s, o) => s + Number(o.total), 0),
    };
  }).sort((a, b) => b.lifetime - a.lifetime);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Clube</p>
        <h1 className="font-display text-2xl font-bold">Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">{list.length} cadastrados</p>
      </header>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="text-left">Cidade</th>
              <th className="text-left">Telefone</th>
              <th className="text-right">Pedidos</th>
              <th className="p-3 text-right">LTV</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate({ to: "/admin/clientes/$id", params: { id: c.id } })}
                className="cursor-pointer border-t border-border transition-colors hover:bg-surface-raised/40"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3 group">
                    <Avatar className="h-8 w-8">
                      {c.avatar_url && <AvatarImage src={c.avatar_url} />}
                      <AvatarFallback className="bg-surface-raised text-xs">
                        {(c.display_name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium group-hover:text-gold">{c.display_name ?? "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground">
                        Desde {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground">{c.city ?? "—"}</td>
                <td className="text-muted-foreground">{c.phone ?? "—"}</td>
                <td className="text-right">{c.orderCount}</td>
                <td className="p-3 text-right">
                  <span className="inline-flex items-center gap-1 font-mono text-gold">
                    {fmtBRL(c.lifetime)}
                    <ChevronRight size={14} />
                  </span>
                </td>
              </tr>
            ))}
            {!enriched.length && (
              <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">Sem clientes ainda.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
