-- 0018 — The Google place link, available in SQL as well as in the UI.
--
-- `googlePlaceHref` in @pam/ui builds this for the member's screen. The same URL
-- is needed server-side: the Phase 5 admin CSV export of a caseload, the
-- importer once it has a Places key, and anyone checking by hand whether a row
-- resolves to the right listing. Two implementations of one string is how they
-- drift, so this is the canonical one and a test asserts they agree.
--
-- No API key required. `place_id` makes the match exact when the importer has
-- resolved one; without it, a named organisation plus a street address resolves
-- correctly.

-- Postgres has no encodeURIComponent. This matches its unreserved set exactly
-- (A-Z a-z 0-9 - _ . ! ~ * ' ( )) and percent-encodes every other character as
-- its UTF-8 bytes, so URLs built here are byte-identical to the UI's.
create or replace function public.url_encode_component(p_text text)
returns text
language sql
immutable
strict
as $$
  select coalesce(string_agg(
    case
      when ch ~ '^[A-Za-z0-9\-_.!~*''()]$' then ch
      else (
        select string_agg('%' || upper(byte), '')
        from regexp_matches(encode(convert_to(ch, 'UTF8'), 'hex'), '..', 'g') as m(pair)
        cross join lateral unnest(m.pair) as u(byte)
      )
    end, '' order by ord), '')
  from regexp_split_to_table(p_text, '') with ordinality as t(ch, ord);
$$;

comment on function public.url_encode_component is
  'Percent-encodes to the same unreserved set as JavaScript encodeURIComponent, '
  'so SQL-built and UI-built URLs are byte-identical.';

create or replace function public.google_place_url(
  p_name text,
  p_address text default null,
  p_place_id text default null
)
returns text
language sql
immutable
as $$
  select case when coalesce(btrim(p_name), '') = '' then null else
    'https://www.google.com/maps/search/?api=1&query='
    || public.url_encode_component(
         case when coalesce(btrim(p_address), '') = ''
              then p_name
              else p_name || ', ' || p_address
         end)
    || case when coalesce(btrim(p_place_id), '') = '' then ''
            else '&query_place_id=' || public.url_encode_component(p_place_id)
       end
  end;
$$;

comment on function public.google_place_url is
  'The place''s Google listing, where its hours and phone live. Mirrors '
  'googlePlaceHref in @pam/ui — keep the two in step.';

grant execute on function public.url_encode_component(text) to anon, authenticated;
grant execute on function public.google_place_url(text, text, text) to anon, authenticated;
