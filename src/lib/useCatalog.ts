import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCatalogOverrides, getTopProduct } from "./catalog.functions";
import { computePromo, type PromoInfo } from "./promo";
import { priceToNumber } from "./amendobento";
import { resolveAssetUrl } from "./utils";

export const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export type Override = {
  slug: string;
  type: string;
  name: string | null;
  price: number | null;
  badge: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  story: string | null;
  emoji: string | null;
  auto_badge?: string | null;
  promo_price?: number | null;
  promo_ends_at?: string | null;
  promo_units_total?: number | null;
  items?: Array<{ slug: string; qty: number }> | null;
};

export function useCatalogOverrides() {
  const fn = useServerFn(getCatalogOverrides);
  const q = useQuery({
    queryKey: ["public", "catalog-overrides"],
    queryFn: () => fn(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const map = new Map<string, Override>();
  for (const it of (q.data?.items ?? []) as Override[]) map.set(it.slug, it);

  function apply<
    T extends {
      id: string;
      name: string;
      price: string;
      badge?: string;
      emoji?: string;
      story?: string;
      image_url?: string | null;
    },
  >(item: T): (T & { promo?: PromoInfo | null }) | null {
    const o = map.get(item.id);
    if (!o) return item;
    if (o.active === false) return null;
    const basePrice = o.price != null ? Number(o.price) : priceToNumber(item.price);
    const promo = computePromo(basePrice, o.promo_price, o.promo_ends_at, o.promo_units_total);
    // se há promoção ativa, sempre prioriza o badge "Promoção"
    const effectiveBadge = promo
      ? "Promoção"
      : (o.badge ?? o.auto_badge ?? (item as any).badge ?? undefined);
    return {
      ...item,
      name: o.name ?? item.name,
      price: o.price != null ? formatBRL(Number(o.price)) : item.price,
      badge: effectiveBadge || undefined,
      emoji: o.emoji ?? item.emoji,
      story: o.story ?? (item as any).story,
      image_url: resolveAssetUrl(o.image_url ?? (item as any).image_url ?? null) ?? null,
      items: o.items ?? null,
      promo,
    } as T & { promo?: PromoInfo | null };
  }

  function applyMany<
    T extends {
      id: string;
      name: string;
      price: string;
      badge?: string;
      emoji?: string;
      story?: string;
      image_url?: string | null;
    },
  >(list: T[]): (T & { promo?: PromoInfo | null })[] {
    return list.map(apply).filter(Boolean) as (T & { promo?: PromoInfo | null })[];
  }

  /** Produtos criados no admin que NÃO existem no catálogo estático (CATALOG/KITS). */
  function extras(opts: { kind: "product" | "kit"; knownIds: string[] }) {
    const known = new Set(opts.knownIds);
    const out: any[] = [];
    for (const o of map.values()) {
      if (o.active === false) continue;
      if (known.has(o.slug)) continue;
      const isKit = (o.type ?? "product") === "kit";
      if (opts.kind === "kit" && !isKit) continue;
      if (opts.kind === "product" && isKit) continue;
      const basePrice = o.price != null ? Number(o.price) : 0;
      const promo = computePromo(basePrice, o.promo_price, o.promo_ends_at, o.promo_units_total);
      const effectiveBadge = promo ? "Promoção" : (o.badge ?? o.auto_badge ?? undefined);
      if (opts.kind === "product") {
        out.push({
          id: o.slug,
          name: o.name ?? o.slug,
          emoji: o.emoji ?? "",
          color: "#E8B82A",
          weight: "150g",
          price: formatBRL(basePrice),
          intensity: 3,
          note: o.story ?? "",
          origin: "Tupã, SP",
          kcal: 600,
          ingredients: [],
          stock: 50,
          sku: o.slug.toUpperCase(),
          tags: [],
          story: o.story ?? "",
          badge: effectiveBadge,
          image_url: resolveAssetUrl(o.image_url) ?? null,
          promo,
        });
      } else {
        out.push({
          id: o.slug,
          name: o.name ?? o.slug,
          emoji: o.emoji ?? "",
          story: o.story ?? "",
          products: (o.items ?? []).map((it) => it.slug),
          items: o.items ?? [],
          price: formatBRL(basePrice),
          badge: effectiveBadge,
          image_url: resolveAssetUrl(o.image_url) ?? null,
          promo,
        });
      }
    }
    return out;
  }

  return { map, apply, applyMany, extras, isLoading: q.isLoading };
}

export function useTopProduct() {
  const fn = useServerFn(getTopProduct);
  return useQuery({
    queryKey: ["public", "top-product"],
    queryFn: () => fn(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

/** Invalida caches públicos após alterações do admin. */
export function useInvalidatePublicCatalog() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["public", "catalog-overrides"] });
    qc.invalidateQueries({ queryKey: ["public", "top-product"] });
  };
}
