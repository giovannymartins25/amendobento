import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { DRINKS, getProduct, getVibe, levelFor } from "@/lib/amendobento";
import { store, useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Amendobento" },
      { name: "description", content: "Suas estatísticas, conta e cupons no clube Amendobento." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const xp = useStore((s) => s.xp);
  const streak = useStore((s) => s.streak);
  const coupon = useStore((s) => s.coupon);
  const { current, next, progress } = levelFor(xp);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-tabbar">
      <Nav />
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Meu perfil
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">
          Sua jornada no clube
        </h1>

        <AccountSection />

        <MyStats />

        <MySubscriptions />

        {/* Nível + cupom enxuto */}
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface-raised p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-lg font-semibold">{current.name}</p>
              <span className="font-mono-coupon text-[11px] text-muted-foreground">
                {xp} pontos · {streak}d
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{current.tagline}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            {next && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Faltam <strong className="text-gold">{next.min - xp} pontos</strong> para {next.name}.
              </p>
            )}
            <Link
              to="/vantagens"
              className="mt-3 inline-flex items-center text-xs text-gold hover:underline"
            >
              Ver vantagens
            </Link>
          </div>

          {coupon ? (
            <div className="rounded-2xl border-2 border-dashed border-gold bg-gold-tint p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Cupom ativo
              </p>
              <p className="font-mono-coupon mt-2 text-2xl font-bold text-gold">
                {coupon.code}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(coupon.discount * 100)}% off no checkout
              </p>
              <Link
                to="/checkout"
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gold py-2 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
              >
                Usar agora
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface-raised p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sem cupom ativo
              </p>
              <p className="mt-2 text-sm">
                Faça uma harmonização e destrave um cupom exclusivo.
              </p>
              <Link
                to="/harmonizacao"
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gold py-2 text-sm font-semibold text-gold hover:bg-gold/10"
              >
                Ir pra harmonização
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ============ Assinaturas do Clube ============

type Sub = {
  id: string;
  combo: string;
  combo_name: string;
  units: number;
  price: number;
  status: string;
  started_at: string;
  cancelled_at: string | null;
};

function MySubscriptions() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) {
      setSubs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("id, combo, combo_name, units, price, status, started_at, cancelled_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });
    setSubs((data as Sub[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function cancel(id: string) {
    if (!confirm("Cancelar essa assinatura?")) return;
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id);
    load();
  }

  if (!user) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold">Minhas assinaturas</h2>
      {loading ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface-raised p-6 text-sm text-muted-foreground">
          Carregando…
        </div>
      ) : subs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-raised p-6 text-center">
          <p className="text-sm text-muted-foreground">Você ainda não tem nenhuma assinatura ativa no Clube.</p>
          <Link
            to="/clube"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
          >
            Conhecer o Clube
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {subs.map((s) => {
            const isActive = s.status === "active";
            return (
              <li
                key={s.id}
                className={`rounded-2xl border p-5 ${
                  isActive
                    ? "border-gold-tint bg-gradient-to-br from-gold-tint to-surface-raised"
                    : "border-border bg-surface-raised opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                      {isActive ? "Ativa" : s.status === "cancelled" ? "Cancelada" : s.status}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold">{s.combo_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.units} unidades · R$ {Number(s.price).toFixed(2).replace(".", ",")}/mês
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Desde {new Date(s.started_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {isActive && (
                    <button
                      onClick={() => cancel(s.id)}
                      className="rounded-md border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}



type Stats = {
  totalOrders: number;
  totalSpent: number;
  topProduct: { slug: string; name: string; qty: number } | null;
  uniqueProducts: number;
  lastOrderAt: string | null;
};

function MyStats() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setStats(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total, created_at")
        .eq("user_id", user.id);
      const orderIds = (orders ?? []).map((o) => o.id);
      let items: { product_slug: string; product_name: string; qty: number }[] = [];
      if (orderIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("product_slug, product_name, qty")
          .in("order_id", orderIds);
        items = itemsData ?? [];
      }

      const totals: Record<string, { name: string; qty: number }> = {};
      for (const it of items) {
        if (!totals[it.product_slug]) {
          totals[it.product_slug] = { name: it.product_name, qty: 0 };
        }
        totals[it.product_slug].qty += it.qty;
      }
      const top = Object.entries(totals).sort((a, b) => b[1].qty - a[1].qty)[0];
      const totalSpent = (orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
      const lastOrderAt = (orders ?? []).reduce<string | null>((acc, o) => {
        if (!acc) return o.created_at;
        return new Date(o.created_at) > new Date(acc) ? o.created_at : acc;
      }, null);

      if (cancelled) return;
      setStats({
        totalOrders: orders?.length ?? 0,
        totalSpent,
        topProduct: top
          ? { slug: top[0], name: top[1].name, qty: top[1].qty }
          : null,
        uniqueProducts: Object.keys(totals).length,
        lastOrderAt,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const fmtBRL = (n: number) =>
    `R$ ${n.toFixed(2).replace(".", ",")}`;
  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  // Preferências salvas (perfil) — bebida/vibe favorita
  const [prefs, setPrefs] = useState<{ drink: string; vibe: string } | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("favorite_drink, favorite_vibe")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPrefs({
          drink: (data as any)?.favorite_drink ?? "",
          vibe: (data as any)?.favorite_vibe ?? "",
        });
      });
  }, [user]);

  const drinkObj = useMemo(
    () => (prefs?.drink ? DRINKS.find((d) => d.id === prefs.drink) : null),
    [prefs],
  );
  const vibeObj = useMemo(
    () => (prefs?.vibe ? getVibe(prefs.vibe) ?? null : null),
    [prefs],
  );

  if (!user) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold">Minhas estatísticas</h2>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface-raised p-6 text-sm text-muted-foreground">
          Carregando seus dados…
        </div>
      ) : stats && stats.totalOrders > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Item mais comprado */}
          {stats.topProduct && (
            <div className="rounded-2xl border border-gold-tint bg-gradient-to-br from-gold-tint to-surface-raised p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                Item mais comprado
              </p>
              <p className="mt-2 font-display text-xl font-bold">{stats.topProduct.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.topProduct.qty} unidade{stats.topProduct.qty > 1 ? "s" : ""} compradas
              </p>
              {getProduct(stats.topProduct.slug) && (
                <Link
                  to="/produto/$id"
                  params={{ id: stats.topProduct.slug }}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gold py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
                >
                  Comprar de novo
                </Link>
              )}
            </div>
          )}

          <StatCard label="Total de pedidos" value={String(stats.totalOrders)} hint={`Últ.: ${fmtDate(stats.lastOrderAt)}`} />
          <StatCard label="Total investido" value={fmtBRL(stats.totalSpent)} hint="Acumulado na loja" />
          <StatCard label="Sabores diferentes" value={String(stats.uniqueProducts)} hint="Variedade da sua despensa" />
          <StatCard
            label="Bebida favorita"
            value={drinkObj ? drinkObj.name : "Defina no perfil"}
            hint="Usada na harmonização"
          />
          <StatCard
            label="Vibe favorita"
            value={vibeObj ? vibeObj.name : prefs?.vibe || "Defina no perfil"}
            hint="Sua energia padrão"
          />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-raised p-8 text-center">
          <p className="mt-3 font-display text-lg font-semibold">
            Sem pedidos por aqui ainda
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Suas estatísticas aparecem assim que rolar a primeira compra.
          </p>
          <Link
            to="/kits"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
          >
            Ver kits
          </Link>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ============ Conta (login + edição de perfil) ============

function AccountSection() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState({
    display_name: "",
    address: "",
    phone: "",
    avatar_url: "",
    bio: "",
    birthdate: "",
    favorite_drink: "",
    favorite_vibe: "",
    city: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select(
        "display_name,address,phone,avatar_url,bio,birthdate,favorite_drink,favorite_vibe,city",
      )
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setProfile({
            display_name: (data as any).display_name ?? "",
            address: (data as any).address ?? "",
            phone: (data as any).phone ?? "",
            avatar_url: (data as any).avatar_url ?? "",
            bio: (data as any).bio ?? "",
            birthdate: (data as any).birthdate ?? "",
            favorite_drink: (data as any).favorite_drink ?? "",
            favorite_vibe: (data as any).favorite_vibe ?? "",
            city: (data as any).city ?? "",
          });
      });
  }, [user]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      setMsg("Imagem deve ter até 5MB");
      return;
    }
    setUploading(true);
    setMsg(null);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setMsg(upErr.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfile((p) => ({ ...p, avatar_url: publicUrl }));
    await supabase.from("profiles").upsert({ id: user.id, avatar_url: publicUrl });
    setUploading(false);
    setMsg("Foto atualizada");
    setTimeout(() => setMsg(null), 3000);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMsg(null);
    const payload: any = {
      id: user.id,
      ...profile,
      birthdate: profile.birthdate || null,
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    setMsg(error ? error.message : "Perfil atualizado");
    if (!error) setEditing(false);
    setTimeout(() => setMsg(null), 3000);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (loading) return null;

  if (!user) {
    return (
      <section className="mt-6 rounded-3xl border border-gold-tint bg-surface-raised p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Sua conta</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Entre pra salvar seu perfil</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Crie uma conta gratuita e administre seu nome, endereço e contato — além de acumular XP entre sessões.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
        >
          Entrar / Criar conta
        </Link>
      </section>
    );
  }

  const initials = (profile.display_name || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <section className="mt-6 rounded-3xl border border-gold-tint bg-surface-raised p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-20 w-20 rounded-full border-2 border-gold object-cover"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-gold bg-background text-xl font-bold text-gold">
                {initials}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-gold text-[10px] font-semibold text-primary-foreground shadow-gold hover:bg-gold-light">
              {uploading ? "…" : "Foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Minha conta</p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              {profile.display_name || user.email}
            </h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-lg border border-gold bg-gold-tint px-4 py-2 text-xs font-semibold text-gold hover:bg-gold hover:text-primary-foreground"
            >
              Painel admin
            </Link>
          )}
          <button
            onClick={logout}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:border-gold hover:text-gold"
          >
            Sair
          </button>
        </div>
      </div>

      <form onSubmit={save} className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Nome
          <input
            type="text"
            value={profile.display_name}
            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            disabled={!editing}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Telefone / WhatsApp
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            disabled={!editing}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Data de nascimento
          <input
            type="date"
            value={profile.birthdate}
            onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
            disabled={!editing}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Cidade
          <input
            type="text"
            value={profile.city}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            disabled={!editing}
            placeholder="Ex: Marília — SP"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <label className="sm:col-span-2 text-xs uppercase tracking-wider text-muted-foreground">
          Endereço de entrega
          <input
            type="text"
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            disabled={!editing}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Bebida favorita
          <select
            value={profile.favorite_drink}
            onChange={(e) => setProfile({ ...profile, favorite_drink: e.target.value })}
            disabled={!editing}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-70"
          >
            <option value="">Escolher…</option>
            {DRINKS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Vibe favorita
          <input
            type="text"
            value={profile.favorite_vibe}
            onChange={(e) => setProfile({ ...profile, favorite_vibe: e.target.value })}
            disabled={!editing}
            placeholder="Ex: boteco, churrasco, cinema…"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <label className="sm:col-span-2 text-xs uppercase tracking-wider text-muted-foreground">
          Bio
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            disabled={!editing}
            rows={3}
            maxLength={280}
            placeholder="Conta um pouco sobre você…"
            className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          {editing ? (
            <>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Salvar perfil"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-gold hover:text-gold"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light"
            >
              Editar perfil
            </button>
          )}
          {msg && <span className="text-xs text-gold">{msg}</span>}
        </div>
      </form>
    </section>
  );
}
