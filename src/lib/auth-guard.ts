import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true if the user is authenticated. Otherwise navigates the
 * browser to /login with a redirect back to the current URL and returns false.
 * Caller should `return` early when this returns false.
 */
export async function requireAuthOrRedirect(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
  } catch {
    // fall through
  }
  if (typeof window !== "undefined") {
    const here = window.location.pathname + window.location.search;
    const target = `/login?redirect=${encodeURIComponent(here)}`;
    window.location.assign(target);
  }
  return false;
}
