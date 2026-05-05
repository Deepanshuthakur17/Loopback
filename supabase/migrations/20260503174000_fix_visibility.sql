-- Make sure everyone can see everyone's roles so badges work for all users
ALTER POLICY "Allow public read access" ON public.user_roles USING (true);
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;
CREATE POLICY "Anyone can view user roles" ON public.user_roles FOR SELECT USING (true);

-- Ensure profiles are also public
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
