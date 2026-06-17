import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getDashboardStats, listOrders } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({ meta: [{ title: "Painel — Amendobento Admin" }] }),
  component: AdminDashboard,
});

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function AdminDashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const fetchOrders = useServerFn(listOrders);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const stats = useQuery({
    queryKey: ["admin", "stats", year, month],
    queryFn: () => fetchStats({ data: { year, month } }),
  });
  const orders = useQuery({ queryKey: ["admin", "orders"], queryFn: () => fetchOrders() });

  if (stats.isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (stats.error) return <div className="p-8 text-sm text-red-400">{(stats.error as Error).message}</div>;

  const s = stats.data!;
  const recent = (orders.data?.orders ?? []).slice(0, 10);
  const maxTop = Math.max(1, ...s.topProducts.map((p) => p.qty));

  const years = Array.from(new Set(s.availableMonths.map((m) => m.year))).sort((a, b) => b - a);
  const monthsForYear = s.availableMonths.filter((m) => m.year === year).map((m) => m.month).sort((a, b) => a - b);
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const periodLabel = `${MONTH_NAMES[month - 1]}/${year}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Visão geral</p>
          <h1 className="font-display text-2xl font-bold">Dashboard · {periodLabel}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(monthsForYear.length ? monthsForYear : [month]).map((m) => (
                <SelectItem key={m} value={String(m)}>{MONTH_NAMES[m - 1]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(years.length ? years : [year]).map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isCurrent && (
            <Button variant="outline" size="sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}>
              Mês atual
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Vendas (${periodLabel})`} value={fmtBRL(s.monthRevenue)} />
        <StatCard label={`Pedidos (${periodLabel})`} value={String(s.monthOrders)} />
        <StatCard label="Ticket médio" value={fmtBRL(s.avgTicket)} />
        <StatCard label="Novos clientes" value={String(s.newCustomers)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-4">
          <p className="mb-3 text-sm font-semibold">Vendas por dia · {periodLabel}</p>
          <ChartContainer
            config={{ total: { label: "Vendas", color: "#ffffff" } }}
            className="h-56 w-full"
          >
            <AreaChart data={s.salesByDay}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-total)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-total)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.18} />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} fontSize={10} stroke="#ffffff" tick={{ fill: "#ffffff" }} />
              <YAxis fontSize={10} stroke="#ffffff" tick={{ fill: "#ffffff" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="url(#g1)" />
            </AreaChart>
          </ChartContainer>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold">Top produtos</p>
          <ul className="space-y-3">
            {s.topProducts.map((p) => (
              <li key={p.slug}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate text-foreground">{p.name}</span>
                  <span className="text-muted-foreground">{p.qty} un · {fmtBRL(p.revenue)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div className="h-full bg-gold" style={{ width: `${(p.qty / maxTop) * 100}%` }} />
                </div>
              </li>
            ))}
            {!s.topProducts.length && (
              <li className="text-xs text-muted-foreground">Sem pedidos ainda.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Pedidos recentes</p>
          <Link to="/admin/pedidos" className="text-xs text-gold hover:underline">Ver todos →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2 text-left">Cliente</th><th className="text-left">Status</th><th className="text-left">Data</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {recent.map((o: any) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="py-2">{o.customer_name}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="text-right font-mono">{fmtBRL(Number(o.total))}</td>
                </tr>
              ))}
              {!recent.length && (
                <tr><td colSpan={4} className="py-4 text-center text-xs text-muted-foreground">Sem pedidos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    pago: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    enviado: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    entregue: "bg-green-500/15 text-green-400 border-green-500/30",
    cancelado: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${map[status] ?? "bg-surface-raised text-muted-foreground"}`}>
      {status}
    </span>
  );
}
