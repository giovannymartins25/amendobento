import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { DRINKS, getVibe } from "@/lib/amendobento";
import { z } from "zod";

const search = z.object({ vibe: z.string().optional() });

export const Route = createFileRoute("/selector")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Escolha sua bebida — Amendobento" },
      { name: "description", content: "Selecione a bebida do momento e receba a harmonização ideal de amendoins gourmet." },
    ],
  }),
  component: SelectorPage,
});

function SelectorPage() {
  const { vibe } = Route.useSearch();
  const vibeObj = vibe ? getVibe(vibe) : undefined;
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const choose = (id: string) => {
    setSelected(id);
    setTimeout(() => navigate({ to: "/recommendation", search: { drink: id } }), 250);
  };

  const suggested = new Set(vibeObj?.drinks ?? []);
  const sortedDrinks = vibeObj
    ? [...DRINKS].sort((a, b) => Number(suggested.has(b.id)) - Number(suggested.has(a.id)))
    : DRINKS;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to={vibeObj ? "/vibe" : "/"}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {vibeObj ? "Trocar vibe" : "Voltar"}
        </Link>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">
            Passo {vibeObj ? "2 de 3" : "1 de 2"}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
            O que você está bebendo?
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {vibeObj
              ? `Para a vibe de ${vibeObj.name.toLowerCase()}, destacamos as bebidas que mais combinam.`
              : "Toque na bebida para descobrir a combinação perfeita."}
          </p>

          {vibeObj && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-gold-tint bg-gold-tint px-4 py-3 text-sm">
              <span className="text-2xl">{vibeObj.emoji}</span>
              <div>
                <p className="font-semibold text-foreground">{vibeObj.name}</p>
                <p className="text-xs text-muted-foreground">{vibeObj.desc}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {sortedDrinks.map((d) => {
            const isSuggested = suggested.has(d.id);
            return (
              <button
                key={d.id}
                onClick={() => choose(d.id)}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-surface-raised p-6 transition-all hover:scale-105 hover:border-gold focus:outline-none focus:ring-2 focus:ring-gold ${
                  selected === d.id
                    ? "scale-110 border-gold bg-gold-tint shadow-gold"
                    : isSuggested
                      ? "border-gold/60"
                      : "border-border"
                }`}
              >
                {isSuggested && (
                  <span className="absolute right-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                    Top
                  </span>
                )}
                <span className="text-4xl">{d.emoji}</span>
                <span className="text-xs font-medium text-muted-foreground">{d.name}</span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}