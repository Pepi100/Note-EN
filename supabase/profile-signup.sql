create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  date_of_birth date,
  exercises_solved integer not null default 0 check (exercises_solved >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists exercises_solved integer not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles alter column name set default '';
alter table public.profiles alter column exercises_solved set default 0;
alter table public.profiles alter column date_of_birth drop not null;

create or replace function public.try_profile_date(value text)
returns date
language plpgsql
stable
set search_path = ''
as $$
declare
  parsed_date date;
begin
  if value is null or value !~ '^\d{4}-\d{2}-\d{2}$' then
    return null;
  end if;

  begin
    parsed_date := value::date;
  exception
    when invalid_datetime_format or datetime_field_overflow then
      return null;
  end;

  if parsed_date > current_date then
    return null;
  end if;

  return parsed_date;
end;
$$;

revoke all on function public.try_profile_date(text) from public, anon, authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    ''
  );

  insert into public.profiles (id, name, date_of_birth, exercises_solved, created_at)
  values (
    new.id,
    profile_name,
    public.try_profile_date(new.raw_user_meta_data ->> 'date_of_birth'),
    0,
    new.created_at
  )
  on conflict (id) do update
  set name = coalesce(nullif(btrim(public.profiles.name), ''), excluded.name),
      date_of_birth = coalesce(public.profiles.date_of_birth, excluded.date_of_birth);

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

insert into public.profiles (id, name, date_of_birth, exercises_solved, created_at)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
    ''
  ),
  public.try_profile_date(users.raw_user_meta_data ->> 'date_of_birth'),
  0,
  users.created_at
from auth.users as users
on conflict (id) do update
set name = coalesce(nullif(btrim(public.profiles.name), ''), excluded.name),
    date_of_birth = coalesce(public.profiles.date_of_birth, excluded.date_of_birth);

update public.profiles set name = '' where name is null;
update public.profiles set exercises_solved = 0 where exercises_solved is null;
alter table public.profiles alter column name set not null;
alter table public.profiles alter column exercises_solved set not null;

drop trigger if exists on_auth_user_profile_created on auth.users;
create trigger on_auth_user_profile_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

notify pgrst, 'reload schema';
