import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aggregateSales, cleanupExpiredPromos, computeAutoBadge } from "./catalog.functions";

async function ensureAdmin(supabase: any, userId: string) {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (process.env.NODE_ENV === "development") {
      return { isAdmin: true };
    }
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { year?: number; month?: number } | undefined) =>
    z
      .object({
        year: z.number().int().min(2020).max(2100).optional(),
        month: z.number().int().min(1).max(12).optional(),
      })
      .optional()
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const now = new Date();
    const year = data?.year ?? now.getFullYear();
    const month = data?.month ?? now.getMonth() + 1;
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 1, 0, 0, 0, 0);
    const daysInMonth = new Date(year, month, 0).getDate();

    const [ordersRes, itemsRes, profilesRes] = await Promise.all([
      supabase.from("orders").select("id, total, status, created_at"),
      supabase.from("order_items").select("product_slug, product_name, qty, unit_price, created_at, order_id"),
      supabase.from("profiles").select("id, display_name, created_at"),
    ]);

    const orders = (ordersRes.data ?? []) as Array<{ id: string; total: number; status: string; created_at: string }>;
    const items = (itemsRes.data ?? []) as Array<{ product_slug: string; product_name: string; qty: number; unit_price: number; created_at: string; order_id: string }>;
    const profiles = (profilesRes.data ?? []) as Array<{ id: string; display_name: string | null; created_at: string }>;

    const inMonth = (iso: string) => {
      const d = new Date(iso);
      return d >= monthStart && d < monthEnd;
    };

    const monthOrders = orders.filter((o) => inMonth(o.created_at) && o.status !== "cancelado");
    const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.total), 0);
    const avgTicket = monthOrders.length ? monthRevenue / monthOrders.length : 0;

    const cancelledIds = new Set(orders.filter((o) => o.status === "cancelado").map((o) => o.id));
    const monthOrderIds = new Set(monthOrders.map((o) => o.id));
    const topMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const it of items) {
      if (cancelledIds.has(it.order_id)) continue;
      if (!monthOrderIds.has(it.order_id)) continue;
      const prev = topMap.get(it.product_slug) ?? { name: it.product_name, qty: 0, revenue: 0 };
      prev.qty += it.qty;
      prev.revenue += it.qty * Number(it.unit_price);
      topMap.set(it.product_slug, prev);
    }
    const topProducts = [...topMap.entries()]
      .map(([slug, v]) => ({ slug, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const dayMap = new Map<string, number>();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month - 1, i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of orders) {
      if (o.status === "cancelado") continue;
      if (!inMonth(o.created_at)) continue;
      const k = o.created_at.slice(0, 10);
      if (dayMap.has(k)) dayMap.set(k, (dayMap.get(k) ?? 0) + Number(o.total));
    }
    const salesByDay = [...dayMap.entries()].map(([day, total]) => ({ day, total }));

    const newCustomers = profiles.filter((p) => {
      const d = new Date(p.created_at);
      return d >= monthStart && d < monthEnd;
    }).length;

    const recentOrders = [...orders]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 10);

    const allDates = [
      ...orders.map((o) => new Date(o.created_at)),
      ...profiles.map((p) => new Date(p.created_at)),
    ];
    const earliest = allDates.length ? new Date(Math.min(...allDates.map((d) => +d))) : now;
    const availableMonths: Array<{ year: number; month: number }> = [];
    const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cursor <= end) {
      availableMonths.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return {
      selected: { year, month },
      monthRevenue,
      monthOrders: monthOrders.length,
      avgTicket,
      newCustomers,
      totalCustomers: profiles.length,
      topProducts,
      salesByDay,
      recentOrdersIds: recentOrders.map((o) => o.id),
      availableMonths,
    };
  });

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    await cleanupExpiredPromos();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [prodRes, itemsRes, ordersRes, sales] = await Promise.all([
      supabase.from("products").select("*").order("sort_order", { ascending: true }),
      supabase.from("order_items").select("product_slug, qty, order_id, created_at").gte("created_at", since.toISOString()),
      supabase.from("orders").select("id, status"),
      aggregateSales(),
    ]);
    if (prodRes.error) throw new Error(prodRes.error.message);
    const cancelled = new Set(((ordersRes.data ?? []) as any[]).filter((o) => o.status === "cancelado").map((o) => o.id));
    const salesMap = new Map<string, number>();
    for (const it of (itemsRes.data ?? []) as any[]) {
      if (cancelled.has(it.order_id)) continue;
      const raw = String(it.product_slug ?? "");
      const slug = raw.startsWith("kit:") ? raw.slice(4) : raw;
      salesMap.set(slug, (salesMap.get(slug) ?? 0) + Number(it.qty));
    }
    let topSlug: string | null = null;
    let topQty = 0;
    for (const [s, q] of sales.qtyAll) if (q > topQty) { topQty = q; topSlug = s; }
    const products = (prodRes.data ?? [])
      .filter((p: any) => p.name !== "__hidden__")
      .map((p: any) => ({
        ...p,
        sales_30d: salesMap.get(p.slug) ?? 0,
        is_top: p.slug === topSlug,
        auto_badge: computeAutoBadge(p, topSlug, sales),
      }));
    return { products };
  });

const TOMBSTONE_NAME = "__hidden__";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  type: z.enum(["kit", "sabor", "combo"]),
  name: z.string().min(1).max(120),
  emoji: z.string().max(8).optional().nullable(),
  story: z.string().max(2000).optional().nullable(),
  price: z.number().min(0).max(99999),
  badge: z.string().max(60).optional().nullable(),
  image_url: z.string().url().max(500).optional().nullable(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  promo_price: z.number().min(0).max(99999).nullable().optional(),
  promo_ends_at: z.string().nullable().optional(),
  promo_units_total: z.number().int().min(0).max(99999).nullable().optional(),
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(80),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .max(20)
    .optional(),
});

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    // If a tombstone exists for this slug (from prior deletion), remove it so the new row can be inserted.
    if (!data.id) {
      await supabase.from("products").delete().eq("slug", data.slug).eq("name", TOMBSTONE_NAME);
    }
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await supabase.from("products").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    } else {
      const { data: row, error } = await supabase.from("products").insert(data).select("id").single();
      if (error) throw new Error(error.message);
      return { ok: true, id: row.id };
    }
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data: prod } = await supabase
      .from("products")
      .select("slug, type, name")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    // Create a tombstone so the slug stays hidden from the public catalog
    // even if it exists in the static CATALOG/KITS in code.
    if (prod && prod.name !== TOMBSTONE_NAME) {
      await supabase.from("products").insert({
        slug: prod.slug,
        type: prod.type ?? "sabor",
        name: TOMBSTONE_NAME,
        price: 0,
        active: false,
      });
    }
    return { ok: true };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const ids = (orders ?? []).map((o: any) => o.id);
    let items: any[] = [];
    if (ids.length) {
      const { data } = await supabase.from("order_items").select("*").in("order_id", ids);
      items = data ?? [];
    }
    return { orders: orders ?? [], items };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pendente", "pago", "enviado", "entregue", "cancelado"]),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { error } = await supabase.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, city, phone, avatar_url, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { customers: data ?? [] };
  });

export const getCustomerDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const [profileRes, ordersRes, xpRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("orders")
        .select("id, total, status, created_at, customer_name, customer_email")
        .eq("user_id", data.id)
        .order("created_at", { ascending: false }),
      supabase.from("xp_events").select("amount").eq("user_id", data.id),
    ]);
    if (profileRes.error) throw new Error(profileRes.error.message);
    const orders = (ordersRes.data ?? []) as Array<{
      id: string; total: number; status: string; created_at: string;
      customer_name: string; customer_email: string | null;
    }>;
    const ids = orders.map((o) => o.id);
    let items: Array<{ order_id: string; product_slug: string; product_name: string; qty: number; unit_price: number }> = [];
    if (ids.length) {
      const r = await supabase.from("order_items").select("order_id, product_slug, product_name, qty, unit_price").in("order_id", ids);
      items = (r.data ?? []) as any[];
    }
    const active = orders.filter((o) => o.status !== "cancelado");
    const ltv = active.reduce((s, o) => s + Number(o.total), 0);
    const avgTicket = active.length ? ltv / active.length : 0;
    const totalXp = ((xpRes.data ?? []) as Array<{ amount: number }>).reduce((s, e) => s + Number(e.amount), 0);
    const email = orders.find((o) => o.customer_email)?.customer_email ?? null;
    const favMap = new Map<string, { name: string; qty: number }>();
    const activeIds = new Set(active.map((o) => o.id));
    for (const it of items) {
      if (!activeIds.has(it.order_id)) continue;
      const prev = favMap.get(it.product_slug) ?? { name: it.product_name, qty: 0 };
      prev.qty += Number(it.qty);
      favMap.set(it.product_slug, prev);
    }
    const favorite = [...favMap.entries()].sort((a, b) => b[1].qty - a[1].qty)[0] ?? null;
    const months: { key: string; label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", { month: "short" }),
        total: 0,
      });
    }
    for (const o of active) {
      const k = o.created_at.slice(0, 7);
      const m = months.find((x) => x.key === k);
      if (m) m.total += Number(o.total);
    }
    return {
      profile: profileRes.data,
      email,
      orders,
      items,
      stats: {
        orderCount: active.length,
        ltv,
        avgTicket,
        totalXp,
        isVip: ltv >= 300,
        lastOrderAt: active[0]?.created_at ?? null,
        favorite: favorite ? { slug: favorite[0], name: favorite[1].name, qty: favorite[1].qty } : null,
        monthly: months,
      },
    };
  });
