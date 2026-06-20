import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createClient } from "@supabase/supabase-js";

const ItemSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  qty: z.number().int().min(1).max(99),
  unit_price: z.number().min(0).max(100000),
});

const PlaceOrderInput = z.object({
  items: z.array(ItemSchema).min(1).max(50),
  total: z.number().min(0).max(1_000_000),
  customer_name: z.string().min(1).max(120),
  customer_email: z.string().email().max(200).optional().nullable(),
});

/**
 * Cria um pedido em public.orders + public.order_items.
 * Aceita usuário logado (user_id resolvido pelo bearer) OU convidado (user_id = NULL).
 */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlaceOrderInput.parse(input))
  .handler(async ({ data }) => {
    let userId: string | null = null;
    const auth = getRequestHeader("authorization");
    const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
    if (token) {
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      userId = userData.user?.id ?? null;
    }

    // Se a service role key secreta estiver ausente em desenvolvimento, 
    // criamos um client usando as credenciais do próprio usuário logado para passar pelas políticas RLS.
    let client = supabaseAdmin;
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && token) {
      client = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          auth: {
            storage: undefined,
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );
    }

    const { data: order, error: orderErr } = await client
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: data.customer_name,
        customer_email: data.customer_email ?? null,
        total: data.total,
        status: "pendente",
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr?.message ?? "Falha ao criar pedido");
    }

    const itemsRows = data.items.map((it) => ({
      order_id: order.id,
      product_slug: it.slug,
      product_name: it.name,
      qty: it.qty,
      unit_price: it.unit_price,
    }));

    const { error: itemsErr } = await client.from("order_items").insert(itemsRows);
    if (itemsErr) {
      throw new Error(itemsErr.message);
    }

    // Decrementa unidades de promoção quando aplicável.
    // Itens de kit chegam como "kit:slug", mas no banco o slug é salvo sem o prefixo.
    const purchasedQtyBySlug = new Map<string, number>();
    for (const item of data.items) {
      const normalizedSlug = item.slug.startsWith("kit:") ? item.slug.slice(4) : item.slug;
      purchasedQtyBySlug.set(normalizedSlug, (purchasedQtyBySlug.get(normalizedSlug) ?? 0) + item.qty);
    }

    const productSlugs = [...purchasedQtyBySlug.keys()];
    if (productSlugs.length > 0) {
      try {
        const { data: prods } = await client
          .from("products")
          .select("slug, promo_units_total")
          .in("slug", productSlugs);
        for (const p of prods ?? []) {
          if (p.promo_units_total == null) continue;
          const bought = purchasedQtyBySlug.get(p.slug) ?? 0;
          const remaining = Math.max(0, Number(p.promo_units_total) - bought);
          const patch: any = remaining === 0
            ? { promo_units_total: null, promo_price: null, promo_ends_at: null }
            : { promo_units_total: remaining };
          if (remaining === 0) {
            patch.promo_price = null;
            patch.promo_ends_at = null;
          }
          await client.from("products").update(patch).eq("slug", p.slug);
        }
      } catch (err) {
        console.warn("Failed to update product promo stock, likely due to RLS permissions in dev fallback client:", err);
      }
    }

    return { id: order.id, total: data.total };
  });
