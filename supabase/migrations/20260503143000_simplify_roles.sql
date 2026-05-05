-- 1. Remove the old moderator and user roles (keep it clean)
-- Note: We can't easily remove values from an enum in Postgres without recreation, 
-- but we can update the existing user_roles to map everyone to 'member'.

UPDATE public.user_roles SET role = 'member' WHERE role IN ('moderator', 'user');

-- 2. Update the role check function to be simpler
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager')
  );
$$;

-- 3. Update Feedback Policies
-- Only Admin/Manager can update/delete/moderate
DROP POLICY IF EXISTS "Admins update any feedback" ON public.feedback;
CREATE POLICY "Admins/Managers update any feedback" ON public.feedback
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Admins delete any feedback" ON public.feedback;
CREATE POLICY "Admins/Managers delete any feedback" ON public.feedback
  FOR DELETE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- 4. Update Voting Policies
-- Based on the new rule: Only Admin/Manager can vote? 
-- Or can Members vote? The user said "only can write the comments or nothing they can do".
-- I will restrict voting to Admin/Manager to be safe based on "nothing they can do".
DROP POLICY IF EXISTS "Users insert own vote" ON public.votes;
CREATE POLICY "Admin/Manager can vote" ON public.votes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- 5. Comments remain open to everyone (Members can write comments)
DROP POLICY IF EXISTS "Users can add comments" ON public.comments;
CREATE POLICY "Anyone can add comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
