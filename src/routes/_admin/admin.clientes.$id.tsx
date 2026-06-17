import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCustomerDetail } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/_admin/admin/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — Admin" }] }),
  component: CustomerDetail,
});

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

function CustomerDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getCustomerDetail);
  const q = useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => fn({ data: { id } }),
  });

  if (q.isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (q.isError || !q.data) return <div className="p-8 text-sm text-red-500">Erro ao carregar cliente.</div>;

  const { profile, email, orders, items, stats } = q.data as any;
  const itemsByOrder = new Map<string, any[]>();
  for (const it of items) {
    const arr = itemsByOrder.get(it.order_id) ?? [];
    arr.push(it);
    itemsByOrder.set(it.order_id, arr);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link to="/admin/clientes" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-gold">
        ← Clientes
      </Link>

      <header className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar className="h-16 w-16">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
          <AvatarFallback className="bg-surface-raised">
            {(profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{profile?.display_name ?? "Sem nome"}</h1>
            {stats.isVip && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                ★ VIP
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[email, profile?.city, profile?.phone].filter(Boolean).join(" · ") || "Sem dados de contato"}
          </p>
          {profile?.address && (
            <p className="text-xs text-muted-foreground">📍 {profile.address}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Cliente desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "—"}
          </p>
        </div>
      </header>

      {profile?.bio && (
        <Card className="mt-4 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bio</p>
          <p className="mt-1 text-sm">{profile.bio}</p>
        </Card>
      )}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Pedidos" value={String(stats.orderCount)} />
        <Stat label="LTV" value={fmtBRL(stats.ltv)} highlight />
        <Stat label="Ticket médio" value={fmtBRL(stats.avgTicket)} />
        <Stat label="XP total" value={String(stats.totalXp ?? 0)} />
        <Stat
          label="Último pedido"
          value={stats.lastOrderAt ? new Date(stats.lastOrderAt).toLocaleDateString("pt-BR") : "—"}
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="font-display text-sm font-semibold">Gasto nos últimos 6 meses</h2>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly}>
                <XAxis dataKey="label" stroke="#ffffff" tick={{ fill: "#ffffff" }} fontSize={11} />
                <YAxis stroke="#ffffff" tick={{ fill: "#ffffff" }} fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(v: any) => fmtBRL(Number(v))}
                  contentStyle={{ background: "hsl(var(--surface-raised))", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="total" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-sm font-semibold">Produto favorito</h2>
          {stats.favorite ? (
            <div className="mt-3">
              <p className="font-display text-xl font-bold">{stats.favorite.name}</p>
              <p className="text-xs text-muted-foreground">{stats.favorite.qty} unidades compradas</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Ainda sem dados.</p>
          )}
          {profile?.favorite_drink && (
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Bebida favorita: <span className="text-foreground">{profile.favorite_drink}</span>
            </p>
          )}
          {profile?.favorite_vibe && (
            <p className="text-xs text-muted-foreground">
              Vibe: <span className="text-foreground">{profile.favorite_vibe}</span>
            </p>
          )}
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Histórico de pedidos
        </h2>
        <Card className="mt-3 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Pedido</th>
                <th className="text-left">Data</th>
                <th className="text-left">Itens</th>
                <th className="text-left">Status</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => {
                const its = itemsByOrder.get(o.id) ?? [];
                return (
                  <tr key={o.id} className="border-t border-border align-top">
                    <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 text-xs">
                      {its.map((it: any) => (
                        <div key={it.product_slug + it.order_id}>
                          {it.qty}× {it.product_name}
                        </div>
                      ))}
                    </td>
                    <td>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-gold">{fmtBRL(Number(o.total))}</td>
                  </tr>
                );
              })}
              {!orders.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                    Nenhum pedido ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${highlight ? "text-gold" : ""}`}>{value}</p>
    </Card>
  );
}
