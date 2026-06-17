import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogOverrides } from "@/lib/useCatalog";
import { CATALOG, priceToNumber, getProduct } from "@/lib/amendobento";
import { fmtBRL, type ComboCard } from "./clube";

export const Route = createFileRoute("/clube/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Assinatura ${params.id} — Amendobento` },
      { name: "description", content: "Detalhes e checkout da assinatura do Clube Amendobento." },
    ],
  }),
  component: ComboDetail,
});

function unitAvg() {
  const sum = CATALOG.reduce((s, p) => s + priceToNumber(p.price), 0);
  return sum / CATALOG.length;
}

function presetCombo(id: string): ComboCard | null {
  const presets: Record<string, ComboCard> = {
    degustacao: { id: "degustacao", source: "preset", name: "Combo Degustação", units: 4, desc: "1 pacote de cada sabor", detail: "Ideal pra quem quer experimentar a linha completa todo mês.", price: unitAvg() * 4 * 0.85 },
    fds: { id: "fds", source: "preset", name: "Combo Final de Semana", units: 8, desc: "8 pacotes mistos por mês", detail: "Pra quem recebe amigos no sábado e curte um happy hour sem fim.", price: unitAvg() * 8 * 0.85 },
    esporte: { id: "esporte", source: "preset", name: "Combo Esporte", units: 12, desc: "12 pacotes mistos por mês", detail: "Pra quem assiste jogo toda semana e quer estoque garantido.", price: unitAvg() * 12 * 0.85 },
  };
  return presets[id] ?? null;
}

function ComboDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { map } = useCatalogOverrides();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  let combo: (ComboCard & { items?: Array<{ slug: string; qty: number }> }) | null = presetCombo(id);
  let items: Array<{ slug: string; qty: number }> = [];

  const override = map.get(id);
  if (override && override.type === "combo" && override.active !== false) {
    items = override.items ?? [];
    const units = items.reduce((s, it) => s + (it.qty || 0), 0);
    combo = {
      id,
      source: "admin",
      name: override.name ?? id,
      units,
      desc: items.length ? `${units} pacotes selecionados` : "Combo personalizado",
      detail: override.story ?? "",
      price: Number(override.price ?? 0),
      items,
    };
  }

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, address")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setName(data.display_name ?? "");
        setPhone(data.phone ?? "");
        setAddress((data as any).address ?? "");
      }
    })();
  }, [user]);

  if (!combo) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="mx-auto max-w-xl px-6 py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Combo não encontrado</h1>
          <Link to="/clube" className="mt-6 inline-block text-gold underline">Voltar ao clube</Link>
        </main>
      </div>
    );
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setErr("Preencha nome, telefone e endereço de entrega.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("create_subscription" as any, {
      p_combo: combo!.id,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
      p_customer_address: address.trim(),
    });
    setSubmitting(false);
    if (error) {
      setErr("Não conseguimos ativar agora — tente novamente em instantes.");
      return;
    }
    setMsg("Assinatura ativada! Você pode acompanhar no seu perfil.");
    setTimeout(() => navigate({ to: "/perfil" }), 1200);
  }

  const sampleItems = items.length > 0
    ? items
    : CATALOG.slice(0, Math.min(combo.units, CATALOG.length)).map((p) => ({ slug: p.id, qty: 1 }));

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link to="/clube" className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao clube</Link>

        <header className="mt-6 grid gap-8 md:grid-cols-2 md:items-start">
          <div className="rounded-3xl border border-gold-tint bg-gradient-to-br from-gold-tint/30 to-surface-raised p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Assinatura mensal</p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{combo.name}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{combo.detail || combo.desc}</p>
            <p className="mt-6 font-display text-4xl font-bold text-gold">
              {fmtBRL(combo.price)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {combo.units} pacotes/mês · ~{fmtBRL(combo.price / Math.max(1, combo.units))} por pacote
            </p>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {items.length > 0 ? "Sabores que vão no combo" : "Exemplo de sabores"}
              </p>
              <ul className="space-y-1.5 text-sm">
                {sampleItems.map((it, i) => {
                  const p = getProduct(it.slug);
                  return (
                    <li key={i} className="flex justify-between border-b border-border/50 py-1">
                      <span>{p?.name ?? it.slug}</span>
                      <span className="text-muted-foreground">×{it.qty}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
              <li>✓ Entrega mensal na sua porta</li>
              <li>✓ Cancele quando quiser, sem multa</li>
              <li>✓ Pode ter várias assinaturas ativas ao mesmo tempo</li>
            </ul>
          </div>

          <form onSubmit={subscribe} className="rounded-3xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-xl font-semibold">Ativar assinatura</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pagamento mensal — você confirma os dados na primeira fatura. Após ativar, você acompanha no perfil.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="(00) 00000-0000" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endereço de entrega</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={3} placeholder="Rua, número, bairro, cidade, CEP" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light disabled:opacity-50"
            >
              {submitting ? "Ativando…" : user ? `Assinar por ${fmtBRL(combo.price)}/mês` : "Entrar para assinar"}
            </button>

            {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
            {msg && <p className="mt-3 text-sm text-gold">{msg}</p>}

            <p className="mt-3 text-[10px] text-muted-foreground">
              Ao assinar você concorda com a cobrança recorrente mensal. Você pode cancelar a qualquer momento no seu perfil.
            </p>
          </form>
        </header>
      </main>
    </div>
  );
}
