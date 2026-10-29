alter table public.profiles enable row level security;
alter table public.profiles add column if not exists name text;
alter table public.profiles alter column date_of_birth drop not null;

revoke all on table public.profiles from anon, authenticated, public;
revoke select (name, date_of_birth, exercises_solved) on table public.profiles from anon, authenticated;
revoke update (name, date_of_birth) on table public.profiles from anon, authenticated;
grant select (name, date_of_birth, exercises_solved) on table public.profiles to authenticated;
grant update (name, date_of_birth) on table public.profiles to authenticated;

drop policy if exists "Users can read their own solved-problem count" on public.profiles;
drop policy if exists "Users can read their own profile details" on public.profiles;
create policy "Users can read their own profile details"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile details" on public.profiles;
drop policy if exists "Users can update their own date of birth" on public.profiles;
create policy "Users can update their own profile details"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- This owner-privileged view intentionally exposes only anonymous counts, not identifiers or personal data.
-- Keep the profiles table restricted to each user's own row; do not add an all-rows SELECT policy there.
create or replace view public.profile_problem_counts
with (security_barrier = true)
as
select exercises_solved
from public.profiles;

revoke all on table public.profile_problem_counts from anon, authenticated, public;
grant select on table public.profile_problem_counts to authenticated;

notify pgrst, 'reload schema';
