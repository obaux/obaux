-- The Pam team sees which places are missing a phone, a website, an address or hours (D-623; Will, 31 October, Control Room
-- note n-20261031-2020: "Let's add these stats on super admin user, so they have visibility on how many programs exist total.
-- And a list of programs missing info, clicking into it, opens a nested page with list of missing details, filtered and
-- searchable. Add these stats to the super admins homepage."). Expand only: two new functions and one new route, nothing
-- changed or removed.
--
--   * `program_info_gaps(p_with_list)`: for a super admin only (checked inside, as `waiting_city_counts()` does, D-593),
--     `security definer` so it can count every place whatever the caller's own reach. It returns one JSON object:
--       - `total`: places listed (active, not removed);
--       - for each detail, how many places need it (`*_need`) and how many have it (`*_have`);
--       - `missing`: how many places lack at least one detail they need;
--       - with `p_with_list`, `places`: each place that lacks something, as `{id, name, address, kind, missing[]}`, by kind
--         then name. Home asks without the list; the Missing information page asks with it.
--     Nothing personal is in it: these are the public catalogue's own places.
--   * What a place needs: a phone, a website, an address and real opening hours. A Parks & Rec place (`pprsite:`) needs only
--     an address (Will, 31 October, D-622: no phone, website or hours for Parks & Rec).
--   * What counts as missing: a phone, website or address that is null or blank; hours that are not a real week. The app's
--     stand-in hours (`hoursFor` in packages/config/src/hours.ts) are made in the app and never stored, so a row without real
--     hours is missing them, which is nearly every row today. That is the true state.
--   * The kind of place, from `source_ref`: `dbhids:` behavioral health, `cityfac:` library, `pprsite:` Parks & Rec,
--     anything else (`oic:`, `cerc:`, a place typed in by hand) added by hand.
--   * `hours_are_real(jsonb)`: the same test as `parseHours` in hours.ts. A week is the value itself or its `week`, seven
--     days, each a list of `{open, close}` in "HH:MM". Parks & Rec's `{"none": true}` (D-622) is not a week.

create or replace function public.hours_are_real(p_hours jsonb)
returns boolean
language sql
immutable
set search_path = public, extensions
as $$
  with week as (
    select case
             when jsonb_typeof(p_hours) = 'object' then coalesce(p_hours -> 'week', p_hours)
             else p_hours
           end as w
  )
  select coalesce((
    select jsonb_typeof(w) = 'array'
       and jsonb_array_length(w) = 7
       and not exists (
         select 1
         from jsonb_array_elements(w) as day(d)
         where jsonb_typeof(d) <> 'array'
            or exists (
              select 1
              from jsonb_array_elements(case when jsonb_typeof(d) = 'array' then d else '[]'::jsonb end) as period(p)
              where jsonb_typeof(p) <> 'object'
                 or jsonb_typeof(p -> 'open') is distinct from 'string'
                 or jsonb_typeof(p -> 'close') is distinct from 'string'
                 or (p ->> 'open') !~ '^\d{2}:\d{2}$'
                 or (p ->> 'close') !~ '^\d{2}:\d{2}$'
            )
       )
    from week
    where jsonb_typeof(w) = 'array'
  ), false);
$$;

comment on function public.hours_are_real(jsonb) is
  'Whether services.hours is a real week, by the same rule as parseHours in packages/config/src/hours.ts (D-623).';

revoke all on function public.hours_are_real(jsonb) from public, anon, authenticated;

create or replace function public.program_info_gaps(p_with_list boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_super_admin() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;

  with listed as (
    select
      s.id,
      s.name,
      nullif(btrim(coalesce(s.address, '')), '') as address,
      case
        when s.source_ref like 'dbhids:%' then 'health'
        when s.source_ref like 'cityfac:%' then 'library'
        when s.source_ref like 'pprsite:%' then 'parks'
        else 'hand'
      end as kind,
      nullif(btrim(coalesce(s.phone, '')), '') is not null as has_phone,
      nullif(btrim(coalesce(s.website, '')), '') is not null as has_website,
      nullif(btrim(coalesce(s.address, '')), '') is not null as has_address,
      public.hours_are_real(s.hours) as has_hours
    from public.services s
    where s.is_active and s.removed_at is null
  ),
  judged as (
    select
      l.*,
      -- Parks & Rec need only an address (D-622).
      l.kind <> 'parks' as needs_contact,
      array_remove(array[
        case when l.kind <> 'parks' and not l.has_phone then 'phone' end,
        case when l.kind <> 'parks' and not l.has_website then 'website' end,
        case when not l.has_address then 'address' end,
        case when l.kind <> 'parks' and not l.has_hours then 'hours' end
      ], null) as missing
    from listed l
  )
  select jsonb_build_object(
    'total', count(*),
    'phone_need', count(*) filter (where needs_contact),
    'phone_have', count(*) filter (where needs_contact and has_phone),
    'website_need', count(*) filter (where needs_contact),
    'website_have', count(*) filter (where needs_contact and has_website),
    'address_need', count(*),
    'address_have', count(*) filter (where has_address),
    'hours_need', count(*) filter (where needs_contact),
    'hours_have', count(*) filter (where needs_contact and has_hours),
    'missing', count(*) filter (where cardinality(missing) > 0),
    'places', case
      when p_with_list then coalesce(
        jsonb_agg(
          jsonb_build_object('id', id, 'name', name, 'address', address, 'kind', kind, 'missing', to_jsonb(missing))
          order by kind, name, id
        ) filter (where cardinality(missing) > 0),
        '[]'::jsonb)
      else null
    end
  )
  into result
  from judged;

  return result;
end;
$$;

comment on function public.program_info_gaps(boolean) is
  'How complete the place catalogue is, and which places lack a phone, a website, an address or real hours (D-623). '
  'Super admin only; no person in it.';

revoke all on function public.program_info_gaps(boolean) from public, anon;
grant execute on function public.program_info_gaps(boolean) to authenticated;

-- The new screen is a route the error log may name (20261018211942's closed list): added here, not by editing that file.
insert into public.app_error_routes (route) values
  ('/places/missing/')
on conflict do nothing;
