import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Assina mudanças em products/orders/order_items e invalida caches públicos + admin. */
export function useRealtimeCatalog() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime:catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        qc.invalidateQueries({ queryKey: ["public", "catalog-overrides"] });
        qc.invalidateQueries({ queryKey: ["admin", "products"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
