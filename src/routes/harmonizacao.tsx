import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Nav } from "@/components/Nav";
import { DRINKS, VIBES, getVibe } from "@/lib/amendobento";
import { store, useStore } from "@/lib/store";

const search = z.object({ vibe: z.string().optional() });

export const Route = createFileRoute("/harmonizacao")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Harmonização — Amendobento" },
      { name: "description", content: "Descubra o sabor de amendoim ideal para sua bebida e seu momento." },
      { property: "og:title", content: "Harmonização — Amendobento" },
      { property: "og:description", content: "Harmonização gourmet de amendoins e bebidas." },
    ],
  }),
  component: SommelierPage,
});

const DRINK_KEYWORDS: Record<string, string[]> = {
  cerveja: ["cerveja", "beer", "ipa", "heineken", "stella", "lager", "pilsen", "chopp", "chope", "brahma", "skol"],
  "vinho-tinto": ["vinho tinto", "tinto", "merlot", "cabernet", "malbec", "syrah"],
  "vinho-branco": ["vinho branco", "branco", "chardonnay", "sauvignon", "espumante", "prosecco"],
  cafe: ["café", "cafe", "expresso", "espresso", "cappuccino", "latte"],
  suco: ["suco", "juice", "laranja", "uva", "manga"],
  refrigerante: ["coca", "coca-cola", "pepsi", "guarana", "guaraná", "refrigerante", "soda", "fanta", "sprite", "monster", "energético", "energetico"],
  "agua-gas": ["água", "agua", "gás", "gas", "sparkling", "tônica", "tonica"],
  drinque: ["gin", "drink", "drinque", "caipirinha", "mojito", "negroni", "whisky", "vodka"],
};
const VIBE_KEYWORDS: Record<string, string[]> = {
  futebol: ["futebol", "jogo", "gol", "estádio", "estadio", "torcida", "brasileirão"],
  basquete: ["basquete", "basket", "nba"],
  churrasco: ["churrasco", "churras", "carne", "brasa", "picanha"],
  piquenique: ["piquenique", "parque", "picnic"],
  "happy-hour": ["happy", "balada", "trabalho fim", "pós-trabalho"],
  jantar: ["jantar", "romântico", "romantico", "encontro", "date"],
  cinema: ["cinema", "filme", "série", "serie", "netflix", "sofá"],
  trabalho: ["trabalho", "foco", "estudar", "deadline", "home office", "código"],
};

function detect(text: string): { drink?: string; vibe?: string } {
  const t = text.toLowerCase();
  let drink: string | undefined;
  let vibe: string | undefined;
  for (const [id, kws] of Object.entries(DRINK_KEYWORDS)) if (kws.some((k) => t.includes(k))) { drink = id; break; }
  for (const [id, kws] of Object.entries(VIBE_KEYWORDS)) if (kws.some((k) => t.includes(k))) { vibe = id; break; }
  return { drink, vibe };
}

type Step = "vibe" | "drink" | "done";

function SommelierPage() {
  const { vibe: vibeQ } = Route.useSearch();
  const navigate = useNavigate();
  const chat = useStore((s) => s.chat);
  const [step, setStep] = useState<Step>(vibeQ ? "drink" : "vibe");
  const [vibe, setVibe] = useState<string | undefined>(vibeQ);
  const [drink, setDrink] = useState<string | undefined>();
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat.length === 0) {
      store.pushChat("mestre", "E aí! Qual a vibe de hoje?");
    }
    if (vibeQ) {
      const v = getVibe(vibeQ);
      if (v) {
        store.pushChat("user", v.name);
        setTyping(true);
        setTimeout(() => {
          store.pushChat("mestre", `Boa! ${v.name} pede algo na medida. E o que vai beber?`);
          setTyping(false);
        }, 700);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, typing]);

  const pickVibe = (id: string) => {
    const v = getVibe(id);
    if (!v) return;
    setVibe(id);
    store.pushChat("user", v.name);
    setTyping(true);
    setTimeout(() => {
      store.pushChat("mestre", `Massa! ${v.name} combina bem com algumas bebidas. O que vai rolar?`);
      setTyping(false);
      setStep("drink");
    }, 800);
  };

  const pickDrink = (id: string) => {
    const d = DRINKS.find((x) => x.id === id);
    if (!d) return;
    setDrink(id);
    store.pushChat("user", d.name);
    setTyping(true);
    setTimeout(() => {
      store.pushChat("mestre", "Já sei o que vai te impressionar. Bora ver o que combina?");
      setTyping(false);
      setStep("done");
    }, 900);
  };

  const sendFree = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    store.pushChat("user", text);
    setInput("");
    const { drink: dd, vibe: vv } = detect(text);
    setTyping(true);
    setTimeout(() => {
      if (dd && (vibe || vv)) {
        if (vv && !vibe) setVibe(vv);
        setDrink(dd);
        const d = DRINKS.find((x) => x.id === dd)!;
        store.pushChat("mestre", `Entendi! Pra ${d.name.toLowerCase()} eu já tenho a harmonização perfeita. Bora ver?`);
        setStep("done");
      } else if (dd) {
        setDrink(dd);
        const d = DRINKS.find((x) => x.id === dd)!;
        store.pushChat("mestre", `${d.name} anotado. E a vibe é qual?`);
        setStep("vibe");
      } else if (vv) {
        setVibe(vv);
        const v = getVibe(vv)!;
        store.pushChat("mestre", `${v.name}! Agora me diz: o que vai beber?`);
        setStep("drink");
      } else {
        store.pushChat("mestre", "Não peguei direito. Escolhe um dos botões abaixo?");
      }
      setTyping(false);
    }, 700);
  };

  const go = () => {
    navigate({ to: "/harmonizacao/resultado", search: { drink: drink ?? "cerveja", vibe: vibe ?? undefined } });
  };

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto flex max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Harmonização</p>
          <h1 className="font-display text-2xl font-bold leading-tight">Descubra seu sabor ideal</h1>
          <p className="mt-1 text-xs text-muted-foreground">Conte a vibe e a bebida — a gente sugere o resto.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-border bg-surface-raised p-4 sm:p-5">
          <div className="flex max-h-[55vh] min-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
            {chat.map((m) => (
              <div
                key={m.id}
                className={`animate-chat-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${
                    m.role === "user"
                      ? "rounded-br-sm bg-gold text-primary-foreground"
                      : "rounded-bl-sm border border-border bg-surface-overlay text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-surface-overlay px-4 py-3">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gold" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {step === "vibe" && !typing && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => pickVibe(v.id)}
                  className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}
          {step === "drink" && !typing && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {DRINKS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => pickDrink(d.id)}
                  className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
          {step === "done" && !typing && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <button
                onClick={go}
                className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold transition-transform hover:scale-[1.01]"
              >
                Ver minha harmonização
              </button>
              <button
                onClick={() => { store.clearChat(); setStep("vibe"); setVibe(undefined); setDrink(undefined); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Recomeçar conversa
              </button>
            </div>
          )}

          <form onSubmit={sendFree} className="flex items-center gap-2 border-t border-border pt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ou escreva… ex: estou tomando IPA"
              className="flex-1 rounded-full border border-border bg-surface-overlay px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold-light"
            >
              Enviar
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Sua conversa fica salva.{" "}
          <Link to="/catalog" className="text-gold underline-offset-4 hover:underline">
            Pular para o catálogo
          </Link>
        </p>
      </main>
    </div>
  );
}
