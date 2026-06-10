begin;

create extension if not exists pgcrypto;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'persons'
      and column_name = 'title'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'persons'
      and column_name = 'display_title'
  ) then
    alter table public.persons rename column title to display_title;
  end if;
end $$;

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.persons
  add column if not exists generation_id uuid references public.generations(id) on delete set null,
  add column if not exists display_title text,
  add column if not exists gender text,
  add column if not exists sort_order int not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'persons_gender_check'
  ) then
    alter table public.persons
      add constraint persons_gender_check
      check (gender is null or gender in ('male', 'female', 'other'));
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'persons'
      and column_name = 'generation'
  ) then
    execute $sql$
      insert into public.generations (family_id, label, sort_order)
      select
        p.family_id,
        concat('Generation ', p.generation)::text as label,
        p.generation::int as sort_order
      from public.persons p
      where p.generation is not null
        and not exists (
          select 1
          from public.generations g
          where g.family_id = p.family_id
            and g.sort_order = p.generation::int
        )
      group by p.family_id, p.generation
    $sql$;

    execute $sql$
      update public.persons p
      set generation_id = g.id
      from public.generations g
      where p.generation_id is null
        and p.generation is not null
        and g.family_id = p.family_id
        and g.sort_order = p.generation::int
    $sql$;

    alter table public.persons drop column generation;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'relationships'
      and column_name = 'person_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'relationships'
      and column_name = 'from_person_id'
  ) then
    alter table public.relationships rename column person_id to from_person_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'relationships'
      and column_name = 'related_person_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'relationships'
      and column_name = 'to_person_id'
  ) then
    alter table public.relationships rename column related_person_id to to_person_id;
  end if;
end $$;

alter table public.relationships
  add column if not exists from_person_id uuid references public.persons(id) on delete cascade,
  add column if not exists to_person_id uuid references public.persons(id) on delete cascade;

update public.relationships
set relation_type = 'relative'
where relation_type is null
  or relation_type not in ('parent', 'child', 'spouse', 'sibling', 'relative');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'relationships_relation_type_check'
  ) then
    alter table public.relationships
      add constraint relationships_relation_type_check
      check (relation_type in ('parent', 'child', 'spouse', 'sibling', 'relative'));
  end if;
end $$;

alter table public.families
  add column if not exists root_person_id uuid references public.persons(id) on delete set null;

alter table public.media
  add column if not exists family_id uuid references public.families(id) on delete cascade,
  add column if not exists entity_type text,
  add column if not exists entity_id uuid;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'media'
      and column_name = 'person_id'
  ) then
    execute $sql$
      update public.media m
      set
        entity_type = 'person',
        entity_id = m.person_id,
        family_id = p.family_id
      from public.persons p
      where m.person_id is not null
        and p.id = m.person_id
        and (m.entity_type is null or m.entity_id is null or m.family_id is null)
    $sql$;
  end if;
end $$;

do $$
declare
  event_id_type text;
begin
  select data_type
  into event_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'events'
    and column_name = 'id';

  if event_id_type = 'uuid'
    and exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'event_media'
    )
  then
    execute $sql$
      update public.media m
      set
        entity_type = 'event',
        entity_id = em.event_id,
        family_id = e.family_id
      from public.event_media em
      join public.events e on e.id = em.event_id
      where m.id = em.media_id
        and (m.entity_type is null or m.entity_id is null or m.family_id is null)
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'media_entity_type_check'
  ) then
    alter table public.media
      add constraint media_entity_type_check
      check (entity_type is null or entity_type in ('person', 'event', 'family'));
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'media'
      and column_name = 'person_id'
  ) then
    alter table public.media drop column person_id;
  end if;
end $$;

create index if not exists generations_family_sort_idx
  on public.generations (family_id, sort_order);

create index if not exists persons_generation_sort_idx
  on public.persons (generation_id, sort_order);

create index if not exists relationships_family_from_idx
  on public.relationships (family_id, from_person_id);

create index if not exists relationships_family_to_idx
  on public.relationships (family_id, to_person_id);

create index if not exists media_entity_idx
  on public.media (family_id, entity_type, entity_id);

commit;
