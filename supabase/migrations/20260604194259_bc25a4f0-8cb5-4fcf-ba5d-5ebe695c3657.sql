
DROP POLICY IF EXISTS "Anyone can register interest" ON public.subscription_interests;

CREATE POLICY "Register subscription interest"
  ON public.subscription_interests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(coalesce(name, '')) BETWEEN 1 AND 120
    AND length(coalesce(email, '')) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND combo IN ('degustacao','fds','esporte')
    AND (auth.uid() IS NULL OR user_id IS NULL OR user_id = auth.uid())
  );
