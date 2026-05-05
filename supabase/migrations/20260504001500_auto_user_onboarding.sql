-- 1. Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create the public profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));

  -- Assign the default 'user' role
  -- Change 'user' to 'member' below if you want new users to post immediately
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$;

-- 2. Create the trigger on the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Retroactively fix any existing users who are missing profiles/roles
INSERT INTO public.profiles (id, email, display_name)
SELECT id, email, split_part(email, '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;
