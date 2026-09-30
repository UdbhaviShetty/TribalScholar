begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name);

  insert into public.students (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;

drop trigger if exists on_signup on auth.users;
create trigger on_signup
after insert on auth.users
for each row execute function public.handle_new_user();

commit;