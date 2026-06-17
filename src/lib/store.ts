import { useSyncExternalStore } from "react";
import { getKit, getProduct, type Kit, type Product } from "./amendobento";

export type CartKind = "product" | "kit";
export type CartItem = { id: string; qty: number; kind: CartKind };

export type ChatMsg = {
  id: string;
  role: "mestre" | "user";
  text: string;
  ts: number;
};

export type MestreState = {
  message: string | null;
  mood: "idle" | "excited" | "wise" | "celebrating";
  ttl: number;
};

export type AmendoState = {
  points: number;
  xp: number;
  cart: CartItem[];
  buyNow: CartItem | null;
  missionsDone: string[];
  coupon: { code: string; discount: number } | null;
  streak: number;
  lastClaim: number | null;
  lastVisit: string | null;
  referral: string | null;
  chat: ChatMsg[];
  unlockedArchetype: string | null;
  mestre: MestreState;
};

const KEY = "amendobento.v2";
const initial: AmendoState = {
  points: 320,
  xp: 320,
  cart: [],
  buyNow: null,
  missionsDone: ["m4"],
  coupon: null,
  streak: 1,
  lastClaim: null,
  lastVisit: null,
  referral: null,
  chat: [],
  unlockedArchetype: null,
  mestre: { message: null, mood: "idle", ttl: 0 },
};

let state: AmendoState = load();
const listeners = new Set<() => void>();

function migrateItem(c: any): CartItem {
  return { kind: "product", ...c, qty: Number(c?.qty ?? 1) };
}

function load(): AmendoState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    const merged = { ...initial, ...parsed };
    merged.cart = Array.isArray(merged.cart) ? merged.cart.map(migrateItem) : [];
    merged.buyNow = merged.buyNow ? migrateItem(merged.buyNow) : null;
    return merged;
  } catch {
    return initial;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function set(patch: Partial<AmendoState> | ((s: AmendoState) => Partial<AmendoState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  persist();
  listeners.forEach((l) => l());
}

function sameItem(a: CartItem, id: string, kind: CartKind) {
  return a.id === id && a.kind === kind;
}

export const store = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  addToCart(id: string, qty = 1, kind: CartKind = "product", maxQty?: number) {
    const existing = state.cart.find((c) => sameItem(c, id, kind));
    const desired = (existing?.qty ?? 0) + qty;
    const capped = maxQty != null ? Math.min(desired, Math.max(0, maxQty)) : desired;
    if (capped <= 0) return;
    const cart = existing
      ? state.cart.map((c) => (sameItem(c, id, kind) ? { ...c, qty: capped } : c))
      : [...state.cart, { id, qty: capped, kind }];
    set({ cart });
    if (maxQty != null && desired > capped) {
      store.saySomething(`Limite da promoção: máx. ${maxQty} unidade(s).`, "wise", 4000);
    }
  },
  setQty(id: string, qty: number, kind: CartKind = "product", maxQty?: number) {
    const capped = maxQty != null ? Math.min(qty, Math.max(0, maxQty)) : qty;
    const cart =
      capped <= 0
        ? state.cart.filter((c) => !sameItem(c, id, kind))
        : state.cart.map((c) => (sameItem(c, id, kind) ? { ...c, qty: capped } : c));
    set({ cart });
    if (maxQty != null && qty > capped) {
      store.saySomething(`Limite da promoção: máx. ${maxQty} unidade(s).`, "wise", 4000);
    }
  },
  removeFromCart(id: string, kind: CartKind = "product") {
    set({ cart: state.cart.filter((c) => !sameItem(c, id, kind)) });
  },
  clearCart() {
    set({ cart: [] });
  },
  setBuyNow(id: string, qty = 1, kind: CartKind = "product") {
    set({ buyNow: { id, qty, kind } });
  },
  clearBuyNow() {
    set({ buyNow: null });
  },
  applyCoupon(code: string, discount: number) {
    set({ coupon: { code, discount } });
  },
  clearCoupon() {
    set({ coupon: null });
  },
  addPoints(n: number) {
    set((s) => ({ points: Math.max(0, s.points + n) }));
  },
  addXp(n: number) {
    set((s) => ({ xp: Math.max(0, s.xp + n), points: Math.max(0, s.points + n) }));
  },
  completeMission(id: string, points: number) {
    if (state.missionsDone.includes(id)) return;
    set((s) => ({
      missionsDone: [...s.missionsDone, id],
      points: s.points + points,
      xp: s.xp + points,
    }));
  },
  pushChat(role: ChatMsg["role"], text: string) {
    const msg: ChatMsg = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role, text, ts: Date.now() };
    set((s) => ({ chat: [...s.chat, msg] }));
  },
  clearChat() {
    set({ chat: [] });
  },
  setReferral(slug: string) {
    set({ referral: slug });
  },
  unlockArchetype(id: string) {
    set({ unlockedArchetype: id });
  },
  saySomething(message: string, mood: MestreState["mood"] = "idle", ttl = 6000) {
    set({ mestre: { message, mood, ttl: Date.now() + ttl } });
  },
  dismissMestre() {
    set({ mestre: { message: null, mood: "idle", ttl: 0 } });
  },
  tickDailyVisit() {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastVisit === today) return;
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const streak = state.lastVisit === yesterday ? state.streak + 1 : 1;
    set({ lastVisit: today, streak });
  },
  claimDaily(): number | null {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastClaim && new Date(state.lastClaim).toISOString().slice(0, 10) === today) {
      return null;
    }
    const reward = [10, 20, 30, 50, 80, 100][Math.floor(Math.random() * 6)];
    set((s) => ({ lastClaim: Date.now(), xp: s.xp + reward, points: s.points + reward }));
    return reward;
  },
};

export type ResolvedCartItem =
  | { kind: "product"; id: string; qty: number; product: Product; kit?: undefined }
  | { kind: "kit"; id: string; qty: number; kit: Kit; products: Product[]; product?: undefined };

export function resolveCartItem(c: CartItem): ResolvedCartItem | null {
  if (c.kind === "kit") {
    const kit = getKit(c.id);
    if (!kit) return null;
    const products = kit.products
      .map((id) => getProduct(id))
      .filter((p): p is Product => !!p);
    return { kind: "kit", id: c.id, qty: c.qty, kit, products };
  }
  const product = getProduct(c.id);
  if (!product) return null;
  return { kind: "product", id: c.id, qty: c.qty, product };
}

export function useStore<T>(selector: (s: AmendoState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(initial),
  );
}
