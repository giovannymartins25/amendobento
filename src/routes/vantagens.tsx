import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { LEVELS, levelFor, MISSIONS } from "@/lib/amendobento";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/vantagens")({
  head: () => ({
    meta: [
      { title: "Vantagens — Amendobento" },
      { name: "description", content: "Acumule pontos a cada compra e troque por brindes, cupons e produtos exclusivos." },
    ],
  }),
  component: VantagensPage,
});

type Tab = "visao" | "missoes" | "recompensas";

const REWARDS = [
  { id: "r1", name: "Cupom 10% OFF", cost: 100 },
  { id: "r2", name: "Frete grátis", cost: 150 },
  { id: "r3", name: "Adesivos Amendobento (cartela)", cost: 250 },
  { id: "r4", name: "Copo personalizado", cost: 350 },
  { id: "r5", name: "Potinho de vidro Amendobento", cost: 400 },
  { id: "r6", name: "Ecobag Amendobento", cost: 500 },
  { id: "r7", name: "Boné Amendobento", cost: 700 },
  { id: "r8", name: "Camiseta Amendobento", cost: 900 },
  { id: "r9", name: "Kit Sommelier completo", cost: 1200 },
];

function VantagensPage() {
  const [tab, setTab] = useState<Tab>("visao");
  const xp = useStore((s) => s.xp);
  const points = useStore((s) => s.points);
  const streak = useStore((s) => s.streak);
  const lastClaim = useStore((s) => s.lastClaim);
  const missionsDone = useStore((s) => s.missionsDone);
  const { current, next, progress } = levelFor(xp);
  const [reward, setReward] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const claimed = !!lastClaim && new Date(lastClaim).toISOString().slice(0, 10) === today;

  const claim = () => {
    const r = store.claimDaily();
    if (r) setReward(r);
    setTimeout(() => setReward(null), 2200);
  };

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Programa de Vantagens</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">
          Suas vantagens Amendobento
        </h1>

        {/* Explicação */}
        <section className="mt-6 rounded-3xl border border-gold-tint bg-surface-raised p-6">
          <h2 className="font-display text-xl font-semibold">Como funciona</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Compre na loja", d: "Cada R$ 1 gasto vale 1 ponto. Toda compra rende +50 de bônus." },
              { n: "2", t: "Acumule pontos", d: "Suba de nível e desbloqueie missões para ganhar ainda mais." },
              { n: "3", t: "Troque por prêmios", d: "Cupons, brindes e produtos exclusivos com seus pontos." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-background/40 p-4">
                <p className="font-display text-3xl font-bold text-gold">{s.n}</p>
                <p className="mt-2 text-sm font-semibold">{s.t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 overflow-x-auto rounded-full border border-border bg-surface-raised p-1">
          {([
            { id: "visao",       label: "Visão Geral" },
            { id: "missoes",     label: "Missões" },
            { id: "recompensas", label: "Recompensas" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                tab === t.id ? "bg-gold text-primary-foreground shadow-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "visao" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-gold-tint bg-surface-raised p-6 shadow-amber">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gold">Nível atual</p>
                  <p className="font-display text-2xl font-bold">{current.name}</p>
                  <p className="text-xs text-muted-foreground">{current.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-4xl font-bold text-gold">{xp}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">pontos totais</p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-background/40">
                <div className="animate-xp-fill h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              {next && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Faltam <strong className="text-gold">{next.min - xp} pontos</strong> para chegar em {next.name}.
                </p>
              )}

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
                <div>
                  <p className="font-display text-2xl font-bold text-gold">{points}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">pontos disponíveis</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-gold">{streak}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">dias seguidos</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-gold">{missionsDone.length}/{MISSIONS.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">missões</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-raised p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">Recompensa diária</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Volte todo dia e ganhe pontos. Sequência atual: <strong className="text-gold">{streak} {streak === 1 ? "dia" : "dias"}</strong>
              </p>
              <button
                disabled={claimed}
                onClick={claim}
                className="mt-5 w-full rounded-xl bg-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-surface-overlay disabled:text-muted-foreground disabled:shadow-none"
              >
                {claimed ? "Já resgatado hoje" : "Resgatar pontos"}
              </button>
              {reward !== null && (
                <div className="animate-xp-toast pointer-events-none fixed left-1/2 top-24 z-50 rounded-full bg-gold px-6 py-3 font-display text-xl font-bold text-primary-foreground shadow-amber">
                  +{reward} pontos
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "missoes" && (
          <div className="mt-8 flex flex-col gap-3">
            {MISSIONS.map((m) => {
              const done = missionsDone.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 rounded-2xl border bg-surface-raised p-5 transition-colors ${
                    done ? "border-success/30 opacity-80" : "border-border hover:border-gold/40"
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-gold">+{m.points} pontos</p>
                    {done ? (
                      <span className="text-[10px] uppercase tracking-wider text-success">Concluída</span>
                    ) : (
                      <button
                        onClick={() => store.completeMission(m.id, m.points)}
                        className="rounded border border-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold hover:bg-gold-tint"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "recompensas" && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REWARDS.map((r) => {
              const canRedeem = points >= r.cost;
              return (
                <div
                  key={r.id}
                  className={`flex flex-col rounded-2xl border bg-surface-raised p-5 transition-all ${
                    canRedeem ? "border-gold/40 hover:border-gold hover:shadow-gold" : "border-border opacity-70"
                  }`}
                >
                  <h3 className="font-display text-lg font-semibold">{r.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Resgate por {r.cost} pontos
                  </p>
                  <div className="mt-auto pt-4">
                    <button
                      disabled={!canRedeem}
                      onClick={() => {
                        store.addPoints(-r.cost);
                        setMsg(`Recompensa "${r.name}" resgatada!`);
                        setTimeout(() => setMsg(null), 3000);
                      }}
                      className="w-full rounded-lg border border-gold py-2.5 text-xs font-semibold text-gold transition-colors hover:bg-gold-tint disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground"
                    >
                      {canRedeem ? `Resgatar (${r.cost} pts)` : `Faltam ${r.cost - points} pts`}
                    </button>
                  </div>
                </div>
              );
            })}
            {msg && (
              <div className="col-span-full rounded-xl border border-gold bg-gold-tint p-3 text-center text-sm text-gold">
                {msg}
              </div>
            )}
          </div>
        )}

        {/* Trilha de níveis */}
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-2xl font-semibold">Sua jornada</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {LEVELS.map((l) => {
              const unlocked = xp >= l.min;
              return (
                <div
                  key={l.name}
                  className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-all ${
                    unlocked ? "border-gold bg-gold-tint" : "border-border bg-surface-raised opacity-50"
                  }`}
                >
                  <p className="font-display text-xs font-bold">{l.name}</p>
                  <p className="font-mono-coupon text-[10px] text-muted-foreground">{l.min} pts</p>
                </div>
              );
            })}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Pontos são acumulados a cada compra na loja. <Link to="/catalog" className="text-gold hover:underline">Veja o catálogo</Link>.
        </p>
      </main>
    </div>
  );
}
