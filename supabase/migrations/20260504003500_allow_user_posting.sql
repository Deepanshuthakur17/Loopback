-- Allow the 'user' role to also post and vote
CREATE OR REPLACE FUNCTION public.can_post_and_vote(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager', 'member', 'user')
  );
$$;

-- Ensure everyone can see their own and others' feedback
DROP POLICY IF EXISTS "Anyone can view feedback" ON public.feedback;
CREATE POLICY "Anyone can view feedback" ON public.feedback
  FOR SELECT USING (true);
