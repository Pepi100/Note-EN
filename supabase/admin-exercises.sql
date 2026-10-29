alter table public.exercises enable row level security;

revoke insert on table public.exercises from public, anon, authenticated;
revoke insert (
  topic,
  chapter,
  grade,
  origin,
  prompt_text,
  additional_text,
  image_url,
  answer_type,
  options,
  correct_answer
) on table public.exercises from public, anon, authenticated;
grant insert (
  topic,
  chapter,
  grade,
  origin,
  prompt_text,
  additional_text,
  image_url,
  answer_type,
  options,
  correct_answer
) on table public.exercises to authenticated;

drop policy if exists exercises_admin_insert on public.exercises;
create policy exercises_admin_insert
on public.exercises
for insert
to authenticated
with check (true);

drop policy if exists exercises_admin_insert_guard on public.exercises;
create policy exercises_admin_insert_guard
on public.exercises
as restrictive
for insert
to authenticated
with check ((select public.is_admin()));

notify pgrst, 'reload schema';
