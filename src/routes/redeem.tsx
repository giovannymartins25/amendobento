import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";

export const Route = createFileRoute("/redeem")({
  head: () => ({
    meta: [
      { title: "Cupom resgatado — Amendobento" },
      { name: "description", content: "Seu cupom de desconto está pronto para ser usado." },
    ],
  }),
  component: RedeemPage,
});

const CODE = "AMENDO-GOLD-50";

function RedeemPage() {
  const [copied, setCopied] = useState(false);
  const [confetti, setConfetti] = useState<{ left: number; delay: number; color: string; dur: number }[]>([]);

  useEffect(() => {
    const colors = ["#F5C842", "#F9DC7A", "#C9A020", "#F5F0E8", "#6B4A00"];
    setConfetti(
      Array.from({ length: 50 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        dur: 2 + Math.random() * 2,
      })),
    );
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Nav />

      <div className="pointer-events-none absolute inset-0 z-10">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 block h-2 w-2 rounded-sm"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              animation: `confettiFall ${c.dur}s linear ${c.delay}s forwards`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <main className="relative z-20 mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <div className="mb-6 animate-bounce text-7xl">🏆</div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Recompensa Desbloqueada</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
          Parabéns, Gourmet!
        </h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground">
          Você resgatou um cupom exclusivo. Use no checkout e aproveite seu desconto.
        </p>

        <button
          onClick={copy}
          className={`mt-8 w-full rounded-xl border-2 border-dashed px-8 py-6 transition-all ${
            copied ? "border-solid border-success" : "border-gold bg-gold-tint hover:bg-[color-mix(in_oklab,var(--gold)_14%,transparent)]"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Código do Cupom
          </p>
          <p className="font-mono-coupon mt-2 text-2xl font-bold text-gold">{CODE}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {copied ? "✓ Copiado!" : "Toque para copiar"}
          </p>
        </button>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-tint bg-gold-tint px-4 py-2 text-xs text-muted-foreground">
          ⏱ Expira em <strong className="text-gold">7 dias</strong>
        </div>

        <Link
          to="/checkout"
          search={{ product: "alho-frito", drink: "cerveja" }}
          className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-8 py-4 text-base font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.02] hover:bg-gold-light"
        >
          Usar agora no checkout →
        </Link>
        <Link to="/rewards" className="mt-4 text-sm text-muted-foreground hover:text-foreground">
          Voltar ao painel
        </Link>
      </main>
    </div>
  );
}