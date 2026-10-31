alter table public.user_exercise_progress enable row level security;

revoke all on table public.user_exercise_progress from public, anon, authenticated;
grant select (user_id, exercise_id, status, solved_at)
on table public.user_exercise_progress to authenticated;

drop policy if exists "Users can read their own exercise progress"
on public.user_exercise_progress;
create policy "Users can read their own exercise progress"
on public.user_exercise_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.submit_exercise_answer(
  p_exercise_id uuid,
  p_answer text
)
returns table (is_correct boolean, is_solved boolean, newly_solved boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_correct boolean;
  v_option_is_valid boolean;
  v_previous_status text;
  v_newly_solved boolean;
  v_updated_profiles integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '28000';
  end if;

  if p_answer is null or length(pg_catalog.btrim(p_answer)) = 0 or length(p_answer) > 1000 then
    raise exception 'A valid answer is required.'
      using errcode = '22023';
  end if;

  select
    pg_catalog.lower(pg_catalog.btrim(e.correct_answer))
      = pg_catalog.lower(pg_catalog.btrim(p_answer)),
    case
      when e.answer_type <> 'multiple_choice' then true
      when pg_catalog.jsonb_typeof(e.options) <> 'array' then false
      else exists (
        select 1
        from pg_catalog.jsonb_array_elements(e.options) as option_value
        where pg_catalog.lower(pg_catalog.btrim(
          case
            when pg_catalog.jsonb_typeof(option_value.value) = 'object'
              then coalesce(option_value.value ->> 'label', option_value.value ->> 'text', '')
            when pg_catalog.jsonb_typeof(option_value.value) in ('string', 'number')
              then option_value.value #>> '{}'
            else ''
          end
        )) = pg_catalog.lower(pg_catalog.btrim(p_answer))
      )
    end
  into v_correct, v_option_is_valid
  from public.exercises as e
  where e.id = p_exercise_id;

  if not found then
    raise exception 'Exercise not found.'
      using errcode = 'P0002';
  end if;

  v_correct := v_correct and v_option_is_valid;

  insert into public.user_exercise_progress (
    user_id,
    exercise_id,
    status,
    attempts,
    updated_at
  )
  values (v_user_id, p_exercise_id, 'in_progress', 0, pg_catalog.now())
  on conflict (user_id, exercise_id) do nothing;

  select progress.status
  into v_previous_status
  from public.user_exercise_progress as progress
  where progress.user_id = v_user_id
    and progress.exercise_id = p_exercise_id
  for update;

  update public.user_exercise_progress as progress
  set
    status = case
      when progress.status = 'solved' or v_correct then 'solved'
      else 'in_progress'
    end,
    submitted_answer = p_answer,
    attempts = progress.attempts + 1,
    solved_at = case
      when v_correct and progress.status <> 'solved' then pg_catalog.now()
      else progress.solved_at
    end,
    updated_at = pg_catalog.now()
  where progress.user_id = v_user_id
    and progress.exercise_id = p_exercise_id;

  v_newly_solved := v_correct and v_previous_status <> 'solved';

  if v_newly_solved then
    update public.profiles
    set exercises_solved = exercises_solved + 1
    where id = v_user_id;

    get diagnostics v_updated_profiles = row_count;
    if v_updated_profiles <> 1 then
      raise exception 'User profile is unavailable.'
        using errcode = 'P0001';
    end if;
  end if;

  return query
  select v_correct, (v_previous_status = 'solved' or v_correct), v_newly_solved;
end;
$function$;

revoke all on function public.submit_exercise_answer(uuid, text) from public, anon, authenticated;
grant execute on function public.submit_exercise_answer(uuid, text) to authenticated;

notify pgrst, 'reload schema';
