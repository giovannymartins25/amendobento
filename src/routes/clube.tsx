import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { supabase } from "@/integrations/supabase/client";
import { CATALOG, priceToNumber } from "@/lib/amendobento";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogOverrides } from "@/lib/useCatalog";

export const Route = createFileRoute("/clube")({
  head: () => ({
    meta: [
      { title: "Clube Amendobento — Assinatura mensal" },
      { name: "description", content: "Assine o Clube Amendobento e receba todo mês seus amendoins gourmet favoritos por um preço melhor." },
      { property: "og:title", content: "Clube Amendobento — Assinatura mensal" },
      { property: "og:description", content: "Combos mensais de amendoim gourmet, entregues na sua casa." },
    ],
  }),
  component: AssinaturaPage,
});

export type ComboCard = {
  id: string;
  name: string;
  units: number;
  desc: string;
  detail: string;
  price: number;
  source: "preset" | "admin";
};

function unitAvg() {
  const sum = CATALOG.reduce((s, p) => s + priceToNumber(p.price), 0);
  return sum / CATALOG.length;
}

function comboPriceNum(units: number): number {
  return unitAvg() * units * 0.85;
}

export function fmtBRL(n: number) {
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

const PRESET_COMBOS: ComboCard[] = [
  { id: "degustacao", source: "preset", name: "Combo Degustação", units: 4, desc: "1 pacote de cada sabor", detail: "Ideal pra quem quer experimentar a linha completa todo mês.", price: comboPriceNum(4) },
  { id: "fds", source: "preset", name: "Combo Final de Semana", units: 8, desc: "8 pacotes mistos por mês", detail: "Pra quem recebe amigos no sábado e curte um happy hour sem fim.", price: comboPriceNum(8) },
  { id: "esporte", source: "preset", name: "Combo Esporte", units: 12, desc: "12 pacotes mistos por mês", detail: "Pra quem assiste jogo toda semana e quer estoque garantido.", price: comboPriceNum(12) },
];

type ActiveSub = {
  id: string;
  combo: string;
  combo_name: string;
  units: number;
  price: number;
  started_at: string;
};

export function getComboById(id: string, adminCombos: ComboCard[]): ComboCard | undefined {
  return PRESET_COMBOS.find((c) => c.id === id) ?? adminCombos.find((c) => c.id === id);
}

function AssinaturaPage() {
  const { user } = useAuth();
  const { map } = useCatalogOverrides();
  const [activeSubs, setActiveSubs] = useState<ActiveSub[]>([]);

  const adminCombos: ComboCard[] = [];
  for (const o of map.values()) {
    if (o.type !== "combo" || o.active === false) continue;
    const items = o.items ?? [];
    const units = items.reduce((s, it) => s + (it.qty || 0), 0) || 0;
    adminCombos.push({
      id: o.slug,
      source: "admin",
      name: o.name ?? o.slug,
      units,
      desc: items.length > 0 ? `${units} pacotes selecionados` : "Combo personalizado",
      detail: o.story ?? "",
      price: Number(o.price ?? 0),
    });
  }

  const allCombos = [...PRESET_COMBOS, ...adminCombos];

  async function loadSubs() {
    if (!user) {
      setActiveSubs([]);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("id, combo, combo_name, units, price, started_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("started_at", { ascending: false });
    setActiveSubs((data as ActiveSub[]) ?? []);
  }

  useEffect(() => {
    loadSubs();
  }, [user]);

  async function cancelSub(id: string) {
    if (!confirm("Cancelar essa assinatura?")) return;
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id);
    loadSubs();
  }

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Clube Amendobento</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">
          Assine e receba todo mês
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Escolha um combo, veja os detalhes e assine em poucos cliques. Você pode ter várias assinaturas
          ativas ao mesmo tempo e gerenciar todas no seu perfil.
        </p>

        {activeSubs.length > 0 && (
          <section className="mt-8 rounded-2xl border border-gold bg-gold-tint/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Suas assinaturas ativas ({activeSubs.length})</p>
            <ul className="mt-3 space-y-2">
              {activeSubs.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <strong className="text-foreground">{s.combo_name}</strong>{" "}
                    <span className="text-muted-foreground">· {s.units} un · {fmtBRL(Number(s.price))}/mês</span>
                  </div>
                  <button onClick={() => cancelSub(s.id)} className="rounded-md border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {allCombos.map((c) => (
            <article
              key={c.id}
              className="flex flex-col rounded-2xl border border-border bg-surface-raised p-6 transition-all hover:border-gold/50"
            >
              <p className="text-xs uppercase tracking-wider text-gold">Mensal · {c.units} pacotes</p>
              <h2 className="mt-2 font-display text-xl font-semibold">{c.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
              <p className="mt-4 font-display text-3xl font-bold text-gold">
                {fmtBRL(c.price)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">/mês</span>
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {c.detail}
              </p>
              <Link
                to="/clube/$id"
                params={{ id: c.id }}
                className="mt-5 rounded-lg bg-gold py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
              >
                Ver detalhes e assinar
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-xl font-semibold">Como funciona</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">
            <li><strong className="text-foreground">1.</strong> Escolha um combo e veja o detalhe.</li>
            <li><strong className="text-foreground">2.</strong> Preencha seus dados e ative a assinatura.</li>
            <li><strong className="text-foreground">3.</strong> Cancele ou adicione outras assinaturas quando quiser.</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Prefere comprar avulso? <Link to="/catalog" className="text-gold hover:underline">Veja o catálogo</Link>{" "}
            ou <Link to="/kits" className="text-gold hover:underline">monte um kit</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
