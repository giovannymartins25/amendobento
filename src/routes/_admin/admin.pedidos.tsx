import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listOrders, updateOrderStatus } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./admin.index";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Admin" }] }),
  component: AdminOrders,
});

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const STATUSES = ["pendente", "pago", "enviado", "entregue", "cancelado"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const fn = useServerFn(listOrders);
  const fnUpd = useServerFn(updateOrderStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => fn(),
  });

  const updMut = useMutation({
    mutationFn: (v: { id: string; status: any }) => fnUpd({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      qc.invalidateQueries({ queryKey: ["public", "top-product"] });
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;

  const orders = (data?.orders ?? []) as any[];
  const items = (data?.items ?? []) as any[];
  const opened = orders.find((o) => o.id === openId);
  const openedItems = items.filter((i) => i.order_id === openId);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Vendas</p>
        <h1 className="font-display text-2xl font-bold">Pedidos</h1>
      </header>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="text-left">Data</th>
              <th className="text-left">Status</th>
              <th className="text-right">Total</th>
              <th className="p-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.customer_email ?? "—"}</div>
                </td>
                <td className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                <td>
                  <Select value={o.status} onValueChange={(v) => updMut.mutate({ id: o.id, status: v })}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue><StatusBadge status={o.status} /></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="text-right font-mono">{fmtBRL(Number(o.total))}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setOpenId(o.id)} className="text-xs text-gold hover:underline">
                    Ver itens →
                  </button>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">Sem pedidos.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedido de {opened?.customer_name}</DialogTitle>
          </DialogHeader>
          <ul className="divide-y divide-border">
            {openedItems.map((it) => (
              <li key={it.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{it.product_name}</div>
                  <div className="text-xs text-muted-foreground">{it.qty} × {fmtBRL(Number(it.unit_price))}</div>
                </div>
                <div className="font-mono">{fmtBRL(it.qty * Number(it.unit_price))}</div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total</span>
            <span className="font-mono text-gold">{fmtBRL(Number(opened?.total ?? 0))}</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
