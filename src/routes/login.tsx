import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Amendobento" },
      { name: "description", content: "Entre ou crie sua conta no Clube Amendobento." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const dest = redirect && redirect.startsWith("/") ? redirect : "/perfil";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: dest, replace: true });
    });
  }, [navigate, dest]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + dest,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        setInfo("Conta criada! Você já pode entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: dest, replace: true });
      }
    } catch (err: any) {
      setError(err.message ?? "Algo deu errado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null); setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + dest,
    });
    if (result.error) { setError(result.error.message ?? "Erro no Google"); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: dest, replace: true });
  }

  async function handleForgot() {
    if (!email) { setError("Digite seu email primeiro."); return; }
    setError(null); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo("Email de recuperação enviado.");
  }

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-md px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Acesse sua conta Amendobento."
            : "Crie sua conta para comprar, acumular pontos e ganhar vantagens."}
        </p>
        {redirect && (
          <p className="mt-3 rounded-lg border border-gold-tint bg-gold-tint px-3 py-2 text-xs text-gold">
            Entre para continuar e adicionar ao carrinho.
          </p>
        )}

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-raised py-3 text-sm font-semibold transition-colors hover:border-gold disabled:opacity-50"
        >
          Continuar com Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou email <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm outline-none focus:border-gold"
            />
          )}
          <input
            type="email"
            required
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm outline-none focus:border-gold"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm outline-none focus:border-gold"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && <p className="text-xs text-gold">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="hover:text-gold">
            {mode === "login" ? "Criar conta" : "Já tenho conta"}
          </button>
          {mode === "login" && (
            <button onClick={handleForgot} className="hover:text-gold">
              Esqueci a senha
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-gold">← Voltar para o início</Link>
        </p>
      </main>
    </div>
  );
}
