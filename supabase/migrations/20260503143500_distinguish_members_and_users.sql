-- 1. Ensure all 4 roles exist in the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';

-- 2. Helper functions for different authority levels
CREATE OR REPLACE FUNCTION public.can_post_and_vote(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager', 'member')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager')
  );
$$;

-- 3. Update Feedback Posting Policy
-- Admin, Manager, and Member can create feedback
DROP POLICY IF EXISTS "Users insert own feedback" ON public.feedback;
CREATE POLICY "Staff and Members insert feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_post_and_vote(auth.uid()));

-- 4. Update Voting Policy
-- Admin, Manager, and Member can vote
DROP POLICY IF EXISTS "Admin/Manager can vote" ON public.votes;
CREATE POLICY "Staff and Members can vote" ON public.votes
  FOR INSERT TO authenticated
  WITH CHECK (public.can_post_and_vote(auth.uid()));

-- 5. Comments remain open to everyone (including simple Users)
DROP POLICY IF EXISTS "Anyone can add comments" ON public.comments;
CREATE POLICY "Anyone can add comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Moderation (Delete/Update/Hide/Pin) remains restricted to Staff (Admin/Manager)
DROP POLICY IF EXISTS "Admins/Managers update any feedback" ON public.feedback;
CREATE POLICY "Staff can moderate feedback" ON public.feedback
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins/Managers delete any feedback" ON public.feedback;
CREATE POLICY "Staff can delete feedback" ON public.feedback
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));
