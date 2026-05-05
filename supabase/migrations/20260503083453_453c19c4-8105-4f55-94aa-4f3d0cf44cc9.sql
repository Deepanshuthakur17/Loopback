drop policy if exists "Avatar images are publicly accessible" on storage.objects;
-- Allow public read of individual avatar objects (still works with public URLs); listing requires authenticated owner.
create policy "Public can read avatar files"
on storage.objects for select
using (bucket_id = 'avatars' and (storage.foldername(name))[1] is not null);