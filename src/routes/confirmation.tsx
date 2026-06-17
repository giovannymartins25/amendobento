import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Nav } from "@/components/Nav";
import { store } from "@/lib/store";

export const Route = createFileRoute("/confirmation")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === "string" ? search.orderId : undefined,
    xp: typeof search.xp === "number" ? search.xp : typeof search.xp === "string" ? Number(search.xp) || 0 : 0,
  }),
  head: () => ({
    meta: [
      { title: "Pedido confirmado — Amendobento" },
      { name: "description", content: "Seu pedido foi confirmado com sucesso." },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { orderId, xp } = Route.useSearch();
  const code = orderId
    ? `AMD-${orderId.slice(0, 8).toUpperCase()}`
    : `AMD-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const awarded = useRef(false);
  useEffect(() => {
    if (awarded.current) return;
    awarded.current = true;
    if (xp && xp > 0) store.addXp(xp);
    store.clearCoupon();
  }, [xp]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <div className="mb-6 animate-bounce text-7xl">✅</div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Pedido Confirmado</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
          Obrigado pela sua compra!
        </h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground">
          {xp > 0 ? (
            <>
              Você ganhou <strong className="text-gold">+{xp} XP</strong> nesta compra.
            </>
          ) : (
            <>Em breve avisaremos o status da entrega.</>
          )}
        </p>

        <div className="font-mono-coupon mt-8 rounded-xl border border-border bg-surface-raised px-6 py-4 text-lg font-bold text-gold">
          {code}
        </div>

        <div className="mt-10 flex w-full flex-col gap-3">
          <Link
            to="/vantagens"
            className="rounded-lg bg-gold py-4 text-base font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.01] hover:bg-gold-light"
          >
            Ver minhas vantagens
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar à home
          </Link>
        </div>
      </main>
    </div>
  );
}
