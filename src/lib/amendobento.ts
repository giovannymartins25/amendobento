export type Drink = { id: string; name: string; emoji: string };

export type Vibe = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  drinks: string[];
};

export const VIBES: Vibe[] = [
  { id: "futebol", name: "Jogo de Futebol", emoji: "", desc: "Galera reunida, grito de gol e cerveja gelada.", drinks: ["cerveja", "refrigerante", "suco"] },
  { id: "basquete", name: "Jogo de Basquete", emoji: "", desc: "Ritmo acelerado pedindo snacks crocantes.", drinks: ["cerveja", "refrigerante", "agua-gas"] },
  { id: "churrasco", name: "Churrasco", emoji: "", desc: "Carne na brasa, sol e bebida na mão.", drinks: ["cerveja", "vinho-tinto", "refrigerante"] },
  { id: "piquenique", name: "Piquenique", emoji: "", desc: "Toalha xadrez, sombra e lanches leves.", drinks: ["vinho-branco", "suco", "agua-gas"] },
  { id: "happy-hour", name: "Happy Hour", emoji: "", desc: "Fim de expediente com drinques autorais.", drinks: ["drinque", "cerveja", "vinho-branco"] },
  { id: "jantar", name: "Jantar Romântico", emoji: "", desc: "Velas, taça cheia e conversa demorada.", drinks: ["vinho-tinto", "vinho-branco", "drinque"] },
  { id: "cinema", name: "Noite de Cinema", emoji: "", desc: "Filme bom, sofá e algo pra petiscar.", drinks: ["refrigerante", "cerveja", "suco"] },
  { id: "trabalho", name: "Foco no Trabalho", emoji: "", desc: "Deadline apertado e café renovando o gás.", drinks: ["cafe", "agua-gas", "suco"] },
];

export function getVibe(id: string): Vibe | undefined {
  return VIBES.find((v) => v.id === id);
}

export const DRINKS: Drink[] = [
  { id: "cerveja", name: "Cerveja", emoji: "" },
  { id: "vinho-tinto", name: "Vinho Tinto", emoji: "" },
  { id: "vinho-branco", name: "Vinho Branco", emoji: "" },
  { id: "cafe", name: "Café", emoji: "" },
  { id: "suco", name: "Suco", emoji: "" },
  { id: "refrigerante", name: "Refrigerante", emoji: "" },
  { id: "agua-gas", name: "Água com Gás", emoji: "" },
  { id: "drinque", name: "Drinque", emoji: "" },
];

/**
 * Linha oficial Amendobento — amendoim torrado artesanal,
 * grãos selecionados. 4 sabores reais da marca.
 */
import tradicionalImg from "@/assets/produto-tradicional.jpeg.asset.json";
import alhoImg from "@/assets/produto-alho.jpeg.asset.json";
import cebolaImg from "@/assets/produto-cebola.jpeg.asset.json";

export type Product = {
  id: string;
  name: string;
  emoji: string;
  /** cor do rótulo do sabor (overlay sobre o pacote) */
  color: string;
  weight: string;
  price: string;
  intensity: number;
  note: string;
  origin: string;
  kcal: number;
  ingredients: string[];
  stock: number;
  sku: string;
  tags: string[];
  /** foto real do produto (URL CDN). Quando ausente, usa o mockup. */
  image?: string;
};

export const CATALOG: Product[] = [
  {
    id: "tradicional",
    name: "Tradicional",
    emoji: "",
    color: "#E8B82A",
    weight: "150g",
    price: "R$ 19,90",
    intensity: 2,
    note: "O clássico Amendobento: torra média, sal na medida certa. Combina com tudo.",
    origin: "Tupã, SP",
    kcal: 598,
    ingredients: ["Amendoim torrado", "Sal refinado"],
    stock: 120,
    sku: "AMD-TRD-150",
    tags: ["Cerveja", "Chopp", "Universal"],
    image: tradicionalImg.url,
  },
  {
    id: "alho-frito",
    name: "Alho Frito",
    emoji: "",
    color: "#D4A02A",
    weight: "150g",
    price: "R$ 22,90",
    intensity: 4,
    note: "Lascas de alho dourado que carameliza no grão — umami profundo, ideal para churrasco e tintos encorpados.",
    origin: "Tupã, SP",
    kcal: 624,
    ingredients: ["Amendoim torrado", "Alho desidratado frito", "Sal", "Azeite"],
    stock: 48,
    sku: "AMD-ALH-150",
    tags: ["Churrasco", "Vinho Tinto", "IPA"],
    image: alhoImg.url,
  },
  {
    id: "cebola-crispy",
    name: "Cebola Crispy",
    emoji: "",
    color: "#B07A2A",
    weight: "150g",
    price: "R$ 22,90",
    intensity: 3,
    note: "Cebola crocante envolvendo o amendoim — doçura tostada que pede chopp gelado e happy hour.",
    origin: "Tupã, SP",
    kcal: 615,
    ingredients: ["Amendoim torrado", "Cebola crispy", "Sal", "Cebola em pó"],
    stock: 36,
    sku: "AMD-CEB-150",
    tags: ["Chopp", "Lager", "Drinque"],
    image: cebolaImg.url,
  },
];

const byId = (id: string) => CATALOG.find((p) => p.id === id)!;

/** Harmonizações: cada bebida -> lista de sabores reais ordenados por afinidade. */
export const PAIRINGS: Record<string, Product[]> = {
  cerveja: [byId("alho-frito"), byId("cebola-crispy"), byId("tradicional")],
  "vinho-tinto": [byId("alho-frito"), byId("tradicional")],
  "vinho-branco": [byId("tradicional"), byId("cebola-crispy")],
  cafe: [byId("tradicional"), byId("alho-frito")],
  suco: [byId("tradicional"), byId("cebola-crispy")],
  refrigerante: [byId("cebola-crispy"), byId("tradicional")],
  "agua-gas": [byId("tradicional"), byId("cebola-crispy")],
  drinque: [byId("cebola-crispy"), byId("alho-frito")],
};

export function getProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}

export function priceToNumber(price: string): number {
  return parseFloat(price.replace(/[^\d,]/g, "").replace(",", "."));
}

/**
 * XP recompensa por compra: 1 XP por real + bônus fixo de 50 XP por compra concluída.
 */
export function calcXpReward(total: number): { base: number; bonus: number; total: number } {
  const base = Math.max(0, Math.round(total));
  const bonus = total > 0 ? 50 : 0;
  return { base, bonus, total: base + bonus };
}

export type Mission = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  points: number;
  done?: boolean;
};

export const MISSIONS: Mission[] = [
  { id: "m1", emoji: "", name: "Experimente o Alho Frito", desc: "Adicione o Alho Frito ao carrinho", points: 50 },
  { id: "m2", emoji: "", name: "Prove os 4 sabores", desc: "Experimente toda a linha Amendobento", points: 120 },
  { id: "m3", emoji: "", name: "Indique um amigo", desc: "Compartilhe o clube com alguém especial", points: 80 },
  { id: "m4", emoji: "", name: "Primeira harmonização", desc: "Use o seletor de bebidas pela primeira vez", points: 30, done: true },
];

/* ────────────────────────────────────────────────────────────
 * Camada Experience: XP, Níveis, Arquétipos, Kits, Parceiros
 * ──────────────────────────────────────────────────────────── */

export type Level = { name: string; min: number; emoji: string; tagline: string };

export const LEVELS: Level[] = [
  { name: "Iniciante",          min: 0,    emoji: "", tagline: "Sua jornada começou." },
  { name: "Explorador",         min: 200,  emoji: "", tagline: "Provando o mundo, grão a grão." },
  { name: "Apreciador",         min: 500,  emoji: "", tagline: "Paladar treinado." },
  { name: "Sommelier",          min: 1000, emoji: "", tagline: "Harmoniza de olhos fechados." },
  { name: "Mestre Amendobento", min: 2000, emoji: "", tagline: "Lenda viva do clube." },
];

export function levelFor(xp: number): { current: Level; next: Level | null; progress: number } {
  const sorted = [...LEVELS].sort((a, b) => a.min - b.min);
  let current = sorted[0];
  let next: Level | null = null;
  for (let i = 0; i < sorted.length; i++) {
    if (xp >= sorted[i].min) {
      current = sorted[i];
      next = sorted[i + 1] ?? null;
    }
  }
  const progress = next ? Math.min(1, (xp - current.min) / (next.min - current.min)) : 1;
  return { current, next, progress };
}

export type Archetype = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  /** sabor sugerido principal */
  hero: string;
  /** cupom desbloqueado */
  coupon: { code: string; discount: number };
};

export const ARCHETYPES: Record<string, Archetype> = {
  cerveja: {
    id: "ipa-lover",
    name: "IPA Lover",
    emoji: "",
    desc: "Você curte o lúpulo amargo e a crocância salgada. Sua noite pede intensidade.",
    hero: "alho-frito",
    coupon: { code: "IPALOVER10", discount: 0.1 },
  },
  "vinho-tinto": {
    id: "sommelier-encorpado",
    name: "Sommelier Encorpado",
    emoji: "",
    desc: "Taninos, madeira e umami profundo — paladar que pede companhia à altura.",
    hero: "alho-frito",
    coupon: { code: "TINTO12", discount: 0.12 },
  },
  "vinho-branco": {
    id: "explorador-leve",
    name: "Explorador Leve",
    emoji: "",
    desc: "Acidez, frescor e equilíbrio. Você curte sutileza com personalidade.",
    hero: "tradicional",
    coupon: { code: "BRANCO08", discount: 0.08 },
  },
  cafe: {
    id: "coffee-snacker",
    name: "Coffee Snacker",
    emoji: "",
    desc: "Café puxa amendoim. Seu petisco é parceiro do foco.",
    hero: "tradicional",
    coupon: { code: "CAFE10", discount: 0.1 },
  },
  suco: {
    id: "fresh-mood",
    name: "Fresh Mood",
    emoji: "",
    desc: "Doçura natural com crocância — tarde leve, sabor marcado.",
    hero: "alho-frito",
    coupon: { code: "FRESH08", discount: 0.08 },
  },
  refrigerante: {
    id: "spicy-chiller",
    name: "Spicy Chiller",
    emoji: "",
    desc: "Refresco gelado pedindo picância — combo viciante garantido.",
    hero: "alho-frito",
    coupon: { code: "SPICY10", discount: 0.1 },
  },
  "agua-gas": {
    id: "purist",
    name: "Purist",
    emoji: "",
    desc: "Você valoriza o grão na sua essência. Menos é mais.",
    hero: "tradicional",
    coupon: { code: "PURE05", discount: 0.05 },
  },
  drinque: {
    id: "mixologista",
    name: "Mixologista",
    emoji: "",
    desc: "Cítrico, doce, amargo — você curte camadas. Snacks aromáticos te seguem.",
    hero: "cebola-crispy",
    coupon: { code: "MIXO12", discount: 0.12 },
  },
};

export function archetypeFor(drinkId: string): Archetype {
  return ARCHETYPES[drinkId] ?? ARCHETYPES.cerveja;
}

export type Kit = {
  id: string;
  name: string;
  emoji: string;
  story: string;
  products: string[];
  price: string;
  badge?: string;
  social?: string;
  urgency?: string;
  vibe?: string;
};

export const KITS: Kit[] = [
  {
    id: "ipa-experience",
    name: "Kit IPA Experience",
    emoji: "",
    story: "Perfeito para noites intensas com cervejas fortes e amigos. Alho dourado e picância para encarar lúpulos amargos.",
    products: ["alho-frito"],
    price: "R$ 39,90",
    badge: "Mais vendido",
    social: "★ 4.9 · 234 avaliações",
    urgency: "Últimas 12 unidades hoje",
    vibe: "happy-hour",
  },
  {
    id: "churrasco-master",
    name: "Kit Churrasco Master",
    emoji: "",
    story: "Carne na brasa pede amendoim com personalidade. Alho frito + tradicional para abrir o apetite.",
    products: ["alho-frito", "tradicional"],
    price: "R$ 39,90",
    badge: "Combo perfeito",
    social: "★ 4.8 · 189 avaliações",
    vibe: "churrasco",
  },
  {
    id: "happy-hour",
    name: "Kit Happy Hour",
    emoji: "",
    social: "★ 4.9 · 312 avaliações",
    story: "Pós-trabalho merece celebração. Cebola crispy e picância para acompanhar drinques autorais.",
    products: ["cebola-crispy", "alho-frito"],
    price: "R$ 39,90",
    badge: "Favorito do clube",
    vibe: "happy-hour",
  },
  {
    id: "cinema-night",
    name: "Kit Cinema Night",
    emoji: "",
    story: "Filme bom no sofá, refrigerante gelado e amendoim na mão. Doçura, sal e picância sutil.",
    products: ["tradicional", "alho-frito"],
    price: "R$ 39,90",
    social: "★ 4.7 · 156 avaliações",
    vibe: "cinema",
  },
  {
    id: "sommelier-box",
    name: "Sommelier Box (4 sabores)",
    emoji: "",
    story: "A linha completa Amendobento em uma caixa. Para quem quer conhecer cada nuance da casa.",
    products: ["tradicional", "alho-frito", "cebola-crispy"],
    price: "R$ 74,90",
    badge: "Exclusivo",
    social: "★ 5.0 · 87 avaliações",
    urgency: "Edição limitada",
    vibe: "jantar",
  },
];

export function getKit(id: string): Kit | undefined {
  return KITS.find((k) => k.id === id);
}

export type Partner = {
  slug: string;
  name: string;
  city: string;
  type: string;
  coupon: { code: string; discount: number };
  kit: string;
  greeting: string;
};

export const PARTNERS: Partner[] = [
  {
    slug: "bar-do-ze",
    name: "Bar do Zé",
    city: "Tupã/SP",
    type: "Botequim artesanal",
    coupon: { code: "ZEBAR15", discount: 0.15 },
    kit: "happy-hour",
    greeting: "Provou no balcão? Agora leva pra casa.",
  },
  {
    slug: "tap-house",
    name: "Tap House Lupulagem",
    city: "São Paulo/SP",
    type: "Cervejaria craft",
    coupon: { code: "TAPHOUSE20", discount: 0.2 },
    kit: "ipa-experience",
    greeting: "Sua IPA pediu Amendobento. A gente entrega.",
  },
  {
    slug: "vinheria-sul",
    name: "Vinheria do Sul",
    city: "Porto Alegre/RS",
    type: "Wine bar",
    coupon: { code: "VINHO15", discount: 0.15 },
    kit: "sommelier-box",
    greeting: "Cada taça pede uma harmonização à altura.",
  },
];

export function getPartner(slug: string): Partner | undefined {
  return PARTNERS.find((p) => p.slug === slug);
}
