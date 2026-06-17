import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { VIBES, DRINKS } from "@/lib/amendobento";

export const Route = createFileRoute("/vibe")({
  head: () => ({
    meta: [
      { title: "Qual a vibe de hoje? — Amendobento" },
      { name: "description", content: "Conte o momento que você vai viver e receba a harmonização perfeita de amendoins gourmet." },
      { property: "og:title", content: "Qual a vibe de hoje? — Amendobento" },
      { property: "og:description", content: "Do jogo ao jantar romântico: cada vibe pede uma harmonização." },
    ],
  }),
  component: VibePage,
});

function VibePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const choose = (id: string) => {
    setSelected(id);
    setTimeout(() => navigate({ to: "/selector", search: { vibe: id } }), 250);
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← Voltar
        </Link>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Passo 1 de 3</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
            Qual a <span className="italic text-gold">vibe</span> de hoje?
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Escolha o momento que você vai viver. A gente sugere as bebidas certas e, na sequência, os amendoins que harmonizam com cada uma.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VIBES.map((v) => {
            const drinkObjs = v.drinks
              .map((d) => DRINKS.find((x) => x.id === d))
              .filter(Boolean) as { id: string; name: string; emoji: string }[];
            const isSelected = selected === v.id;
            return (
              <button
                key={v.id}
                onClick={() => choose(v.id)}
                className={`group flex flex-col gap-3 rounded-2xl border bg-surface-raised p-5 text-left transition-all hover:-translate-y-1 hover:border-gold hover:shadow-gold focus:outline-none focus:ring-2 focus:ring-gold ${
                  isSelected ? "scale-[1.02] border-gold bg-gold-tint shadow-gold" : "border-border"
                }`}
              >
                <span className="text-4xl">{v.emoji}</span>
                <div>
                  <h2 className="font-display text-lg font-semibold leading-tight">{v.name}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {drinkObjs.map((d) => (
                    <span
                      key={d.id}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background/40 px-2 py-1 text-[10px] text-muted-foreground"
                    >
                      <span>{d.emoji}</span>
                      {d.name}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Não é nenhuma dessas?{" "}
          <Link to="/selector" className="text-gold underline-offset-4 hover:underline">
            Ir direto para a bebida →
          </Link>
        </p>
      </main>
    </div>
  );
}