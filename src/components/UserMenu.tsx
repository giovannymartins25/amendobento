import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Profile = { display_name: string | null; avatar_url: string | null };

export function UserMenu() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile>({ display_name: null, avatar_url: null });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setProfile({ display_name: null, avatar_url: null });
      return;
    }
    supabase
      .from("profiles")
      .select("display_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setProfile({
            display_name: (data as any).display_name ?? null,
            avatar_url: (data as any).avatar_url ?? null,
          });
      });
  }, [user]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (loading) {
    return <div className="hidden h-9 w-24 animate-pulse rounded-full bg-surface-raised sm:block" />;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="hidden h-9 items-center justify-center rounded-full bg-gold px-4 text-xs font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.02] hover:bg-gold-light sm:inline-flex"
      >
        Entrar
      </Link>
    );
  }

  const firstName = (profile.display_name || user.email || "?").split(" ")[0].split("@")[0];
  const initials = (profile.display_name || user.email || "?").slice(0, 2).toUpperCase();

  async function logout() {
    setOpen(false);
    await supabase.auth.signOut();
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-full border border-border bg-surface-raised pl-1 pr-3 text-xs font-semibold text-foreground transition-colors hover:border-gold"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full border border-gold object-cover" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full border border-gold bg-background text-[10px] font-bold text-gold">
            {initials}
          </span>
        )}
        <span className="max-w-[90px] truncate">{firstName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl">
          <Link
            to="/perfil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-foreground hover:bg-gold-tint hover:text-gold"
          >
            Meu perfil
          </Link>
          <Link
            to="/vantagens"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-foreground hover:bg-gold-tint hover:text-gold"
          >
            Vantagens
          </Link>
          <button
            onClick={logout}
            className="block w-full border-t border-border px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-background hover:text-gold"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
