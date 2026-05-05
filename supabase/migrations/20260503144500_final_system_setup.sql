-- Consolidated Migration: Final Roles, Projects, and Comments System
-- This file replaces the intermediate trial migrations (142500, 143000, 143500)

-- 1. Expand app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';

-- 2. Projects & Project Members Tables
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 3),
  description text,
  manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 5. Final Permission Helpers
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

-- 6. Final Policies
-- Feedback
DROP POLICY IF EXISTS "Staff and Members insert feedback" ON public.feedback;
CREATE POLICY "Staff and Members insert feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_post_and_vote(auth.uid()));

DROP POLICY IF EXISTS "Staff can moderate feedback" ON public.feedback;
CREATE POLICY "Staff can moderate feedback" ON public.feedback
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can delete feedback" ON public.feedback;
CREATE POLICY "Staff can delete feedback" ON public.feedback
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Voting
DROP POLICY IF EXISTS "Staff and Members can vote" ON public.votes;
CREATE POLICY "Staff and Members can vote" ON public.votes
  FOR INSERT TO authenticated
  WITH CHECK (public.can_post_and_vote(auth.uid()));

-- Comments
DROP POLICY IF EXISTS "Anyone can add comments" ON public.comments;
CREATE POLICY "Anyone can add comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can see comments" ON public.comments FOR SELECT TO authenticated USING (true);

-- Projects
CREATE POLICY "Everyone can see projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone can see members" ON public.project_members FOR SELECT TO authenticated USING (true);

-- 7. Indices
CREATE INDEX IF NOT EXISTS idx_comments_feedback_id ON public.comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
