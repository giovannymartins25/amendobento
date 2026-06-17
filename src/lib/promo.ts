// Helpers de promoção compartilhados client/server.

export type PromoInfo = {
  basePrice: number;
  promoPrice: number;
  discountPct: number; // 0–100
  discountAbs: number;
  endsAt: string | null;
  unitsTotal: number | null;
  hasTimeLimit: boolean;
  hasUnitLimit: boolean;
};

export function computePromo(
  basePrice: number,
  promoPrice: number | null | undefined,
  endsAt: string | null | undefined,
  unitsTotal: number | null | undefined,
): PromoInfo | null {
  if (promoPrice == null || isNaN(Number(promoPrice))) return null;
  const pp = Number(promoPrice);
  if (pp <= 0 || pp >= basePrice) return null;
  if (endsAt && new Date(endsAt).getTime() < Date.now()) return null;
  if (unitsTotal != null && Number(unitsTotal) <= 0) return null;
  return {
    basePrice,
    promoPrice: pp,
    discountAbs: basePrice - pp,
    discountPct: Math.round(((basePrice - pp) / basePrice) * 100),
    endsAt: endsAt ?? null,
    unitsTotal: unitsTotal != null ? Number(unitsTotal) : null,
    hasTimeLimit: !!endsAt,
    hasUnitLimit: unitsTotal != null,
  };
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export function formatBRL(n: number) {
  return fmtBRL(n);
}

export function formatCountdown(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "encerrada";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
