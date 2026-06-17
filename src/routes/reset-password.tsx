import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Amendobento" },
      { name: "description", content: "Defina sua nova senha." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setDone(true);
      setTimeout(() => navigate({ to: "/perfil", replace: true }), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-tabbar">
      <Nav />
      <main className="mx-auto max-w-md px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Definir nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Digite a nova senha que você quer usar de agora em diante.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm outline-none focus:border-gold"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {done && <p className="text-xs text-gold">Senha atualizada! Redirecionando…</p>}
          <button
            type="submit"
            disabled={loading || done}
            className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-gold-light disabled:opacity-50"
          >
            {loading ? "Salvando…" : "Salvar senha"}
          </button>
        </form>
      </main>
    </div>
  );
}
