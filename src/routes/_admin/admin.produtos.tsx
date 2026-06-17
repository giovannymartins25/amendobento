import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listProducts, upsertProduct, deleteProduct } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/_admin/admin/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Admin" }] }),
  component: AdminProducts,
});

type KitItem = { slug: string; qty: number };

type Product = {
  id: string;
  slug: string;
  type: "kit" | "sabor" | "combo";
  name: string;
  emoji: string | null;
  story: string | null;
  price: number;
  badge: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  sales_30d?: number;
  is_top?: boolean;
  promo_price?: number | null;
  promo_ends_at?: string | null;
  promo_units_total?: number | null;
  auto_badge?: string | null;
  items?: KitItem[] | null;
};

const TYPE_LABEL: Record<Product["type"], string> = {
  sabor: "Item único",
  kit: "Kit",
  combo: "Combo",
};

const BADGE_PRESETS = ["Mais vendido", "Novo", "Edição limitada", "Esgotando", "Em alta"];
const NO_BADGE = "__none__";

function isPromoActive(p: Pick<Product, "promo_price" | "promo_ends_at" | "promo_units_total" | "price">) {
  if (p.promo_price == null) return false;
  if (Number(p.promo_price) <= 0 || Number(p.promo_price) >= Number(p.price)) return false;
  if (p.promo_ends_at && new Date(p.promo_ends_at).getTime() < Date.now()) return false;
  if (p.promo_units_total != null && Number(p.promo_units_total) <= 0) return false;
  return true;
}

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

function AdminProducts() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listProducts);
  const fnUpsert = useServerFn(upsertProduct);
  const fnDelete = useServerFn(deleteProduct);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => fetchList(),
  });

  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [filter, setFilter] = useState<"all" | Product["type"]>("all");

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["public", "catalog-overrides"] });
    qc.invalidateQueries({ queryKey: ["public", "top-product"] });
  };

  const upsertMut = useMutation({
    mutationFn: (payload: any) => fnUpsert({ data: payload }),
    onSuccess: () => {
      invalidateAll();
      setEditing(null);
      toast.success("Produto salvo");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => fnDelete({ data: { id } }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Produto excluído");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;

  const products = (data?.products ?? []) as Product[];
  const sabores = products.filter((p) => p.type === "sabor" && p.active);
  const filtered = filter === "all" ? products : products.filter((p) => p.type === filter);

  function summary(list: Product[]) {
    const count = list.length;
    const totalSales = list.reduce((s, p) => s + (p.sales_30d ?? 0), 0);
    const activePrices = list.filter((p) => p.active).map((p) => Number(p.price) || 0);
    const avgPrice = activePrices.length ? activePrices.reduce((s, n) => s + n, 0) / activePrices.length : 0;
    return { count, totalSales, avgPrice };
  }
  const sAll = summary(products);
  const sCurrent = summary(filtered);

  const editingIsBundle = editing?.type === "kit" || editing?.type === "combo";
  const editingItems: KitItem[] = (editing?.items as KitItem[] | undefined) ?? [];

  function setItems(next: KitItem[]) {
    setEditing((prev) => (prev ? { ...prev, items: next } : prev));
  }
  function addItem() {
    const firstSlug = sabores[0]?.slug ?? "";
    if (!firstSlug) {
      toast.error("Cadastre ao menos um sabor (item único) antes.");
      return;
    }
    setItems([...editingItems, { slug: firstSlug, qty: 1 }]);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Catálogo</p>
          <h1 className="font-display text-2xl font-bold">Produtos</h1>
        </div>
        <Button
          onClick={() => setEditing({ type: filter === "all" ? "sabor" : filter, active: true, price: 0, sort_order: products.length + 1 })}
          className="bg-gold text-primary-foreground hover:bg-gold-light"
        >
          <Plus size={16} className="mr-1" /> Novo {filter === "all" ? "produto" : TYPE_LABEL[filter].toLowerCase()}
        </Button>
      </header>

      {/* Resumo agregado */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Todos os produtos</p>
          <p className="mt-1 font-display text-2xl font-bold">{sAll.count}</p>
          <p className="text-[11px] text-muted-foreground">Preço médio (ativos): {fmtBRL(sAll.avgPrice)}</p>
          <p className="text-[11px] text-muted-foreground">Vendas 30d: {sAll.totalSales} un</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Filtro atual ({filter === "all" ? "Todos" : TYPE_LABEL[filter as Product["type"]]})</p>
          <p className="mt-1 font-display text-2xl font-bold">{sCurrent.count}</p>
          <p className="text-[11px] text-muted-foreground">Preço médio: {fmtBRL(sCurrent.avgPrice)}</p>
          <p className="text-[11px] text-muted-foreground">Vendas 30d: {sCurrent.totalSales} un</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Por tipo</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {(["sabor", "kit", "combo"] as const).map((t) => {
              const s = summary(products.filter((p) => p.type === t));
              return (
                <li key={t} className="flex justify-between">
                  <span>{TYPE_LABEL[t]}</span>
                  <span className="text-muted-foreground">{s.count} · {fmtBRL(s.avgPrice)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Tabs de filtro */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { id: "all", label: "Todos" },
          { id: "sabor", label: "Item único" },
          { id: "kit", label: "Kit" },
          { id: "combo", label: "Combo" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              filter === tab.id
                ? "border-gold bg-gold text-primary-foreground"
                : "border-border bg-surface-raised text-muted-foreground hover:border-gold/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left">Nome</th>
              <th className="px-3 py-3 text-left">Tipo</th>
              <th className="px-3 py-3 text-right">Preço</th>
              <th className="px-3 py-3 text-left">Badge</th>
              <th className="px-3 py-3 text-right">Vendas 30d</th>
              <th className="px-3 py-3 text-center">Ativo</th>
              <th className="px-3 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const autoBadge = isPromoActive(p) ? "Promoção" : (p.auto_badge ?? null);
              const effectiveBadge = p.badge || autoBadge;
              const isAuto = !p.badge && !!autoBadge;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] uppercase">{TYPE_LABEL[p.type] ?? p.type}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    {isPromoActive(p) ? (
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-destructive">{fmtBRL(Number(p.promo_price))}</span>
                        <span className="text-[10px] text-muted-foreground line-through">{fmtBRL(Number(p.price))}</span>
                      </div>
                    ) : (
                      fmtBRL(Number(p.price))
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {effectiveBadge ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.badge ? "bg-gold/20 text-gold" : "bg-emerald-500/15 text-emerald-400"}`}>
                        {effectiveBadge}
                        {isAuto && <span className="ml-1 opacity-60">(auto)</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs">
                    {(p.sales_30d ?? 0) > 0 ? `${p.sales_30d} un` : "—"}
                  </td>
                  <td className="px-3 py-3 text-center">{p.active ? "Sim" : "Não"}</td>
                  <td className="px-3 py-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(p)} aria-label="Editar">
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Excluir"
                      onClick={() => {
                        if (confirm(`Excluir "${p.name}" do site? O produto deixará de aparecer publicamente.`)) deleteMut.mutate(p.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">Nenhum produto neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const base = Number(editing.price) || 0;
                const promoPrice =
                  editing.promo_price != null && editing.promo_price !== ("" as any)
                    ? Number(editing.promo_price)
                    : null;
                const promoEnds =
                  editing.promo_ends_at && String(editing.promo_ends_at).trim() !== ""
                    ? new Date(String(editing.promo_ends_at)).toISOString()
                    : null;
                const promoUnits =
                  editing.promo_units_total != null && editing.promo_units_total !== ("" as any)
                    ? Number(editing.promo_units_total)
                    : null;
                if (promoPrice != null && (promoPrice <= 0 || promoPrice >= base)) {
                  toast.error("Preço promocional precisa ser maior que zero e menor que o preço cheio.");
                  return;
                }
                const bundleItems = editingIsBundle
                  ? editingItems.filter((it) => it.slug && it.qty > 0)
                  : [];
                if (editingIsBundle && bundleItems.length === 0) {
                  toast.error("Adicione pelo menos um sabor à composição.");
                  return;
                }
                const payload: any = {
                  id: editing.id,
                  slug: editing.slug,
                  type: editing.type,
                  name: editing.name,
                  emoji: editing.emoji || null,
                  story: editing.story || null,
                  price: base,
                  badge: editing.badge || null,
                  image_url: editing.image_url || null,
                  active: editing.active ?? true,
                  sort_order: Number(editing.sort_order) || 0,
                  promo_price: promoPrice,
                  promo_ends_at: promoEnds,
                  promo_units_total: promoUnits,
                  items: bundleItems,
                };
                upsertMut.mutate(payload);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={editing.slug ?? ""}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                    required
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sabor">Item único</SelectItem>
                      <SelectItem value="kit">Kit</SelectItem>
                      <SelectItem value="combo">Combo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preço cheio (R$)</Label>
                  <Input type="number" step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Badge</Label>
                  <Select
                    value={editing.badge ?? NO_BADGE}
                    onValueChange={(v) => setEditing({ ...editing, badge: v === NO_BADGE ? null : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="— (auto se for o top)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_BADGE}>— (sem badge / auto)</SelectItem>
                      {BADGE_PRESETS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>História / descrição</Label>
                <Textarea rows={3} value={editing.story ?? ""} onChange={(e) => setEditing({ ...editing, story: e.target.value })} />
              </div>
              <div>
                <Label>URL da imagem</Label>
                <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />
              </div>

              {/* Promoção */}
              <div className="rounded-md border border-gold/40 bg-gold-tint/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="m-0 text-gold">Promoção</Label>
                  {editing.promo_price ? (
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({ ...editing, promo_price: null, promo_ends_at: null, promo_units_total: null })
                      }
                      className="text-[11px] text-muted-foreground underline hover:text-foreground"
                    >
                      remover promoção
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-[11px]">Novo preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="ex: 14,90"
                      value={editing.promo_price ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          promo_price: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Válida até</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editing.promo_ends_at && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editing.promo_ends_at
                            ? format(new Date(editing.promo_ends_at), "dd/MM/yyyy HH:mm")
                            : "Escolha a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editing.promo_ends_at ? new Date(editing.promo_ends_at) : undefined}
                          onSelect={(d) =>
                            setEditing({
                              ...editing,
                              promo_ends_at: d ? d.toISOString() : null,
                            })
                          }
                          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {[
                        { label: "+30min", ms: 30 * 60_000 },
                        { label: "+1h", ms: 60 * 60_000 },
                        { label: "+6h", ms: 6 * 60 * 60_000 },
                        { label: "+1d", ms: 24 * 60 * 60_000 },
                        { label: "+7d", ms: 7 * 24 * 60 * 60_000 },
                        { label: "+30d", ms: 30 * 24 * 60 * 60_000 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              promo_ends_at: new Date(Date.now() + p.ms).toISOString(),
                            })
                          }
                          className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[10px] hover:bg-gold/20"
                        >
                          {p.label}
                        </button>
                      ))}
                      {editing.promo_ends_at && (
                        <button
                          type="button"
                          onClick={() => setEditing({ ...editing, promo_ends_at: null })}
                          className="rounded-full px-2 py-0.5 text-[10px] text-muted-foreground underline"
                        >
                          limpar
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px]">Unidades disponíveis</Label>
                    <Input
                      type="number"
                      placeholder="ex: 50"
                      value={editing.promo_units_total ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          promo_units_total: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Preencha tempo, unidades ou os dois. Se ambos vazios, a promoção fica ativa até você remover.
                </p>
              </div>

              {editingIsBundle && (
                <div className="rounded-md border border-border bg-surface-raised p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="m-0">
                      Composição ({editing.type === "kit" ? "kit" : "combo"})
                    </Label>
                    <Button type="button" size="sm" variant="outline" onClick={addItem}>
                      <Plus size={12} className="mr-1" /> Adicionar sabor
                    </Button>
                  </div>
                  {editingItems.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      Nenhum sabor adicionado. Clique em "Adicionar sabor".
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {editingItems.map((it, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Select
                            value={it.slug}
                            onValueChange={(v) => {
                              const next = [...editingItems];
                              next[idx] = { ...next[idx], slug: v };
                              setItems(next);
                            }}
                          >
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {sabores.map((s) => (
                                <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            className="w-20"
                            value={it.qty}
                            onChange={(e) => {
                              const next = [...editingItems];
                              next[idx] = { ...next[idx], qty: Math.max(1, Number(e.target.value) || 1) };
                              setItems(next);
                            }}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setItems(editingItems.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Escolha quais sabores compõem este {editing.type === "kit" ? "kit" : "combo"} e a quantidade de pacotes de cada um.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label className="m-0">Ativo no site</Label>
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" disabled={upsertMut.isPending} className="bg-gold text-primary-foreground hover:bg-gold-light">
                  {upsertMut.isPending ? "Salvando…" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
