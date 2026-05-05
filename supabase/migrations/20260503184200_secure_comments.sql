-- Secure the comments table with proper RLS policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);

-- 2. Authenticated users can create comments
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can edit their OWN comments
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);

-- 4. Authors AND Admins can delete comments
DROP POLICY IF EXISTS "Authors and admins can delete comments" ON public.comments;
CREATE POLICY "Authors and admins can delete comments" ON public.comments FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);
