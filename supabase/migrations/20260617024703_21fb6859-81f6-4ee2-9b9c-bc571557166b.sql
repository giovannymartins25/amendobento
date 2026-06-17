
-- 1) xp_events: remove self-insert
DROP POLICY IF EXISTS "xp_events_insert_own" ON public.xp_events;

-- 2) subscriptions: replace permissive insert with validated SECURITY DEFINER function
DROP POLICY IF EXISTS "Users manage own subscriptions insert" ON public.subscriptions;

CREATE OR REPLACE FUNCTION public.create_subscription(
  p_combo text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_units int;
  v_price numeric;
  v_name text;
  v_id uuid;
  v_avg numeric;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF length(coalesce(p_customer_name,'')) < 1 OR length(p_customer_name) > 120 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  IF length(coalesce(p_customer_phone,'')) < 8 OR length(p_customer_phone) > 30 THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF length(coalesce(p_customer_address,'')) < 5 OR length(p_customer_address) > 500 THEN
    RAISE EXCEPTION 'Invalid address';
  END IF;

  IF p_combo IN ('degustacao','fds','esporte') THEN
    v_units := CASE p_combo WHEN 'degustacao' THEN 4 WHEN 'fds' THEN 8 ELSE 12 END;
    v_name := CASE p_combo
      WHEN 'degustacao' THEN 'Combo Degustação'
      WHEN 'fds' THEN 'Combo Final de Semana'
      ELSE 'Combo Esporte'
    END;
    SELECT COALESCE(AVG(price), 22.9) INTO v_avg
      FROM public.products WHERE active = true AND type = 'sabor';
    v_price := round((v_avg * v_units * 0.85)::numeric, 2);
  ELSE
    SELECT name, price,
           COALESCE((SELECT SUM((it->>'qty')::int) FROM jsonb_array_elements(items) it), 0)
      INTO v_name, v_price, v_units
      FROM public.products
      WHERE slug = p_combo AND type = 'combo' AND active = true;
    IF v_name IS NULL THEN
      RAISE EXCEPTION 'Combo not found';
    END IF;
    IF v_units IS NULL OR v_units <= 0 THEN
      v_units := 1;
    END IF;
  END IF;

  INSERT INTO public.subscriptions(
    user_id, combo, combo_name, units, price, status,
    customer_name, customer_phone, customer_address
  )
  VALUES (
    v_user, p_combo, v_name, v_units, v_price, 'pending',
    p_customer_name, p_customer_phone, p_customer_address
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_subscription(text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_subscription(text,text,text,text) TO authenticated;

-- 3) order_items: remove guest-order branch from SELECT policy
DROP POLICY IF EXISTS "order_items_select_via_order" ON public.order_items;
CREATE POLICY "order_items_select_via_order" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  ));

-- 4) Realtime: remove orders and order_items from publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.order_items;

-- 5) Storage: drop broad SELECT (avatars bucket is public, direct URLs still work)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- 6) Restrict has_role direct execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
