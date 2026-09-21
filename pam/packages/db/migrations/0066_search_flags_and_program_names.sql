-- 0066 — Finding a place by name, seeing the reported ones, and naming a
-- program in a conversation.
--
-- Three small things Will asked for on 21 September, testing the live URL,
-- that each need the database's help:
--
--   1. `/places/` gets a search box (D-188). The list is not fully loaded on
--      the client — `services_near` returns the nearest 20 within ten miles —
--      so typing "GED clases" has to be answered by the database, and with
--      typo tolerance. pg_trgm's trigram similarity is what Postgres offers
--      for that; it lives in `extensions` like every other extension here.
--   2. Reported places live in the Places list (D-189), so reviewers need the
--      places that carry an open flag, with the flag on them. `services_near`
--      cannot answer that: `flag_service()` sets `is_active = false`, which
--      takes the place out of the public catalogue policy, and a flag is not
--      a column on `services` anyway. `flagged_services()` joins the two for
--      the people allowed to see flags (`service_flags_select_admin`,
--      super admins) and nobody else.
--   3. A member's thread with a program shows the program's name under the
--      name (D-187). `conversation_partners()` (0061) returns first name and
--      role; it now also returns the partner's organisation name when the
--      partner is a program admin. `orgs.name` is public reference data
--      (`orgs_select_all`, 0007) — this widens nothing about a person.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. Search

create or replace function public.services_search(
  p_query    text,
  p_lat      double precision,
  p_lon      double precision,
  p_category public.service_category default null,
  p_limit    integer default 20
)
returns table (
  id                uuid,
  name              text,
  lookup_name       text,
  category          public.service_category,
  subcategory       text,
  address           text,
  phone             text,
  place_id          text,
  lat               double precision,
  lon               double precision,
  meters            double precision,
  has_hours         boolean,
  description_plain text,
  website           text,
  audience          text,
  hours             jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select extensions.st_setsrid(
             extensions.st_makepoint(p_lon, p_lat), 4326
           )::extensions.geography as g
  ),
  q as (
    select nullif(btrim(p_query), '') as text
  ),
  scored as (
    -- Named columns, not `s.*`: `services` is granted column by column
    -- (0017 keeps `name_may_disclose` and the edit bookkeeping off the
    -- public read), and a `*` would trip over the columns nobody may see.
    select
      s.id, s.name, s.lookup_name, s.category, s.subcategory, s.address,
      s.phone, s.place_id, s.geo, s.hours, s.description_plain, s.website,
      s.audience,
      greatest(
        -- A plain substring match anywhere is a full score: somebody who
        -- typed the words exactly should not be outranked by a near-miss.
        case when s.name ilike '%' || q.text || '%'
               or coalesce(s.lookup_name, '') ilike '%' || q.text || '%'
               or coalesce(s.address, '') ilike '%' || q.text || '%'
             then 1.0 else 0.0 end,
        extensions.word_similarity(q.text, s.name),
        extensions.word_similarity(q.text, coalesce(s.lookup_name, '')),
        extensions.word_similarity(q.text, coalesce(s.address, '')),
        extensions.similarity(q.text, s.name)
      ) as score
    from public.services s, q
    where q.text is not null
      and s.is_walk_in
      and (p_category is null or s.category = p_category)
  )
  select
    s.id,
    s.name,
    coalesce(s.lookup_name, s.name),
    s.category,
    s.subcategory,
    s.address,
    s.phone,
    s.place_id,
    extensions.st_y(s.geo::extensions.geometry),
    extensions.st_x(s.geo::extensions.geometry),
    coalesce(extensions.st_distance(s.geo, origin.g), 0),
    s.hours is not null,
    s.description_plain,
    s.website,
    s.audience,
    s.hours
  from scored s, origin
  -- 0.3 is pg_trgm's own default threshold for `%`; typing "clases" for
  -- "Classes" scores about 0.6, a different place scores under 0.2.
  where s.score >= 0.3
  order by s.score desc, s.geo <-> origin.g
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

comment on function public.services_search is
  'Places whose name, lookup name or address matches p_query, with typo '
  'tolerance (pg_trgm), best match first then nearest. RLS-filtered like '
  'services_near: a member sees the published catalogue (0066, D-188).';

revoke all on function public.services_search(text, double precision, double precision, public.service_category, integer) from public;
grant execute on function public.services_search(text, double precision, double precision, public.service_category, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Reported places

create or replace function public.flagged_services()
returns table (
  id                uuid,
  name              text,
  lookup_name       text,
  category          public.service_category,
  address           text,
  phone             text,
  place_id          text,
  lat               double precision,
  lon               double precision,
  has_hours         boolean,
  description_plain text,
  website           text,
  audience          text,
  hours             jsonb,
  flag_id           uuid,
  reason            text,
  note              text,
  flag_count        bigint,
  flagged_at        timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with latest as (
    select distinct on (f.service_id)
      f.service_id, f.id as flag_id, f.reason, f.note, f.created_at,
      count(*) over (partition by f.service_id) as flag_count
    from public.service_flags f
    where f.status = 'pending'
    order by f.service_id, f.created_at desc
  )
  select
    s.id, s.name, coalesce(s.lookup_name, s.name), s.category, s.address,
    s.phone, s.place_id,
    extensions.st_y(s.geo::extensions.geometry),
    extensions.st_x(s.geo::extensions.geometry),
    s.hours is not null, s.description_plain, s.website, s.audience, s.hours,
    l.flag_id, l.reason, l.note, l.flag_count, l.created_at
  from latest l
  join public.services s on s.id = l.service_id
  where (public.is_admin() or public.is_super_admin())
    and s.removed_at is null
  order by l.created_at desc;
$$;

comment on function public.flagged_services is
  'Every place with an open flag, with the newest flag on it, for the people '
  'who review flags — case managers (service_flags_select_admin) and super '
  'admins. Anyone else gets zero rows: the guard is inside (0066, D-189).';

revoke all on function public.flagged_services() from public, anon;
grant execute on function public.flagged_services() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. A program's name beside a program admin, in a conversation

drop function if exists public.conversation_partners();

create function public.conversation_partners()
returns table (
  conversation_id uuid,
  profile_id      uuid,
  first_name      text,
  role            public.user_role,
  program_name    text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    mine.conversation_id,
    theirs.profile_id,
    p.first_name,
    p.role,
    case when p.role = 'provider' then o.name else null end
  from public.conversation_members mine
  join public.conversation_members theirs
    on theirs.conversation_id = mine.conversation_id
   and theirs.profile_id <> mine.profile_id
  join public.profiles p on p.id = theirs.profile_id
  left join public.orgs o on o.id = p.org_id
  where mine.profile_id = auth.uid();
$$;

comment on function public.conversation_partners is
  'For every conversation the caller is in, the other participant''s name and '
  'role — and, for a program admin, their organisation''s name (0066), which is '
  'public reference data. Nothing else; never last_active_at or phone (0061).';

revoke all on function public.conversation_partners() from public;
revoke all on function public.conversation_partners() from anon;
grant execute on function public.conversation_partners() to authenticated;
