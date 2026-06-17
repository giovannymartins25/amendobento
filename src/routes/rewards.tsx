import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { MISSIONS } from "@/lib/amendobento";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Meu Clube — Amendobento" },
      { name: "description", content: "Acompanhe seus pontos, missões e recompensas no Clube Amendobento." },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const points = useStore((s) => s.points);
  const missionsDone = useStore((s) => s.missionsDone);
  const target = 500;
  const pct = Math.min(100, (points / target) * 100);
  const TIERS = [
    { name: "Iniciante", pts: 0 },
    { name: "Gourmet", pts: 250 },
    { name: "Sommelier", pts: 500 },
    { name: "Maître", pts: 1000 },
  ];
  const currentTier = TIERS.slice().reverse().find((t) => points >= t.pts)!;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Clube Amendobento</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">
          Seu Painel de Recompensas
        </h1>

        <div className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-surface-raised to-[oklch(0.27_0.05_70/0.3)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-gold-dark px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                🏅 {currentTier.name}
              </span>
              <span className="text-sm text-muted-foreground">Olá, João!</span>
            </div>
            <span className="font-mono-coupon text-[10px] text-muted-foreground">
              ID #AMD-{points.toString().padStart(6, "0")}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-5xl font-bold text-gold">{points}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                pontos acumulados
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Próximo prêmio</p>
              <p className="font-display text-2xl font-semibold text-foreground">{target} pts</p>
              <p className="mt-1 text-xs text-muted-foreground">faltam {target - points} pts</p>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-overlay">
            <div className="progress-shimmer h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{points} pts</span>
            <span>🎁 {target} pts</span>
          </div>

          <Link
            to="/redeem"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gold py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold-tint"
          >
            Resgatar cupom (50 pts)
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Missões Ativas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Complete e ganhe pontos.</p>

          <div className="mt-6 flex flex-col gap-3">
            {MISSIONS.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-4 rounded-2xl border bg-surface-raised p-5 transition-colors ${
                  m.done ? "border-success/30" : "border-border hover:border-gold/40"
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-overlay text-2xl">
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-gold">+{m.points} pts</p>
                  {missionsDone.includes(m.id) ? (
                    <span className="text-[10px] uppercase tracking-wider text-success">✓ Concluída</span>
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}