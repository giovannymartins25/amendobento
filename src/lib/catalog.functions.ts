import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Limpa promoções que já expiraram (por tempo) ou esgotaram (unidades = 0). */
export async function cleanupExpiredPromos() {
  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from("products")
    .update({ promo_price: null, promo_ends_at: null, promo_units_total: null })
    .not("promo_ends_at", "is", null)
    .lt("promo_ends_at", nowIso);
  await supabaseAdmin
    .from("products")
    .update({ promo_price: null, promo_ends_at: null, promo_units_total: null })
    .eq("promo_units_total", 0);
}

/** Normaliza slug removendo o prefixo `kit:` usado em order_items. */
function normalizeSlug(s: string): string {
  return s?.startsWith("kit:") ? s.slice(4) : s;
}

type SalesAgg = {
  qtyAll: Map<string, number>;
  qty30d: Map<string, number>;
  qty7d: Map<string, number>;
};

export async function aggregateSales(): Promise<SalesAgg> {
  const now = Date.now();
  const since30 = new Date(now - 30 * 24 * 3600 * 1000).toISOString();
  const [{ data: items }, { data: orders }] = await Promise.all([
    supabaseAdmin
      .from("order_items")
      .select("product_slug, qty, order_id, created_at")
      .gte("created_at", since30),
    supabaseAdmin.from("orders").select("id, status"),
  ]);
  const allItemsRes = await supabaseAdmin
    .from("order_items")
    .select("product_slug, qty, order_id");
  const cancelled = new Set(
    (orders ?? []).filter((o: any) => o.status === "cancelado").map((o: any) => o.id),
  );
  const qtyAll = new Map<string, number>();
  const qty30d = new Map<string, number>();
  const qty7d = new Map<string, number>();
  const since7 = now - 7 * 24 * 3600 * 1000;
  for (const it of (allItemsRes.data ?? []) as any[]) {
    if (cancelled.has(it.order_id)) continue;
    const slug = normalizeSlug(it.product_slug);
    qtyAll.set(slug, (qtyAll.get(slug) ?? 0) + Number(it.qty));
  }
  for (const it of (items ?? []) as any[]) {
    if (cancelled.has(it.order_id)) continue;
    const slug = normalizeSlug(it.product_slug);
    qty30d.set(slug, (qty30d.get(slug) ?? 0) + Number(it.qty));
    if (+new Date(it.created_at) >= since7) {
      qty7d.set(slug, (qty7d.get(slug) ?? 0) + Number(it.qty));
    }
  }
  return { qtyAll, qty30d, qty7d };
}

/** Calcula badge automático com base em vendas, idade e estoque promocional. */
export function computeAutoBadge(
  p: { slug: string; created_at?: string | null; promo_units_total?: number | null },
  topSlug: string | null,
  sales: SalesAgg,
): string | null {
  const ageDays = p.created_at
    ? (Date.now() - +new Date(p.created_at)) / (24 * 3600 * 1000)
    : Infinity;
  const sold30 = sales.qty30d.get(p.slug) ?? 0;
  const sold7 = sales.qty7d.get(p.slug) ?? 0;

  // Prioridade: Esgotando > Mais vendido > Em alta > Novo
  if (p.promo_units_total != null && p.promo_units_total > 0 && p.promo_units_total <= 3) {
    return "Esgotando";
  }
  if (topSlug && p.slug === topSlug && (sales.qtyAll.get(topSlug) ?? 0) > 0) {
    return "Mais vendido";
  }
  if (sold7 >= 5 && ageDays <= 90) {
    return "Em alta";
  }
  if (ageDays <= 14 && sold30 < 5) {
    return "Novo";
  }
  return null;
}

/** Lê overrides editáveis pelo admin (preço, nome, status, badge, imagem, ordem, promoção). */
export const getCatalogOverrides = createServerFn({ method: "GET" }).handler(async () => {
  await cleanupExpiredPromos();
  const [overridesRes, sales] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        "slug, type, name, price, badge, image_url, active, sort_order, story, emoji, created_at, promo_price, promo_ends_at, promo_units_total, items",
      ),
    aggregateSales(),
  ]);
  if (overridesRes.error) throw new Error(overridesRes.error.message);
  let topSlug: string | null = null;
  let topQty = 0;
  for (const [s, q] of sales.qtyAll) if (q > topQty) { topQty = q; topSlug = s; }
  const items = (overridesRes.data ?? []).map((it: any) => ({
    ...it,
    auto_badge: computeAutoBadge(it, topSlug, sales),
  }));
  return { items };
});

/** Calcula o produto mais pedido com base em order_items (status != cancelado). */
export const getTopProduct = createServerFn({ method: "GET" }).handler(async () => {
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_slug, product_name, qty, order_id");
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, status");
  const cancelled = new Set((orders ?? []).filter((o: any) => o.status === "cancelado").map((o: any) => o.id));
  const map = new Map<string, { name: string; qty: number }>();
  for (const it of items ?? []) {
    if (cancelled.has((it as any).order_id)) continue;
    const slug = normalizeSlug((it as any).product_slug as string);
    const prev = map.get(slug) ?? { name: (it as any).product_name, qty: 0 };
    prev.qty += Number((it as any).qty);
    map.set(slug, prev);
  }
  const ranked = [...map.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .map(([slug, v]) => ({ slug, name: v.name, qty: v.qty }));
  return { top: ranked[0] ?? null, ranked };
});
