-- Search the areas by every word typed (D-540).
--
-- The neighborhoods keep the source's names, which are sometimes sorted names: "Germantown, East", "Mount Airy, West",
-- "Kensington, Old". Somebody types "east germantown" or "old kensington", and matching the whole text as one piece finds
-- nothing. So the typed text is split into words and EVERY word has to appear somewhere in the label, in any order.
-- "kens" and "germantown" still work, a ZIP code is one word, "City Hall" is two words both in "City Hall".
--
-- Ordering is as before: a label that starts with what was typed first (here: with the first word), then landmarks, then A to Z.
-- Same signature, same grants; `create or replace` keeps both. EXPAND ONLY: a function body.

create or replace function public.search_areas(p_query text, p_limit integer default 8)
returns table (id uuid, kind text, label text, lat double precision, lon double precision)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with q as (
    select coalesce(
      array(
        select '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%'
        from unnest(regexp_split_to_array(btrim(coalesce(p_query, '')), '[\s,]+')) as w
        where w <> ''
      ), '{}') as pats,
      replace(replace(replace(split_part(btrim(coalesce(p_query, '')), ' ', 1), '\', '\\'), '%', '\%'), '_', '\_') || '%' as lead
  )
  select a.id, a.kind, a.label,
         extensions.st_y(a.geo::extensions.geometry),
         extensions.st_x(a.geo::extensions.geometry)
  from public.areas a, q
  where cardinality(q.pats) = 0
     or a.label ilike all (q.pats)
  order by
    (a.label ilike q.lead) desc,
    a.kind = 'landmark' desc,
    a.label
  limit least(greatest(coalesce(p_limit, 8), 1), 25);
$$;

comment on function public.search_areas is
  'Type-ahead over the starting points on the places screen. Every word typed has to appear in the label, in any order. '
  'Public reference data; the query is not logged and the choice is not stored server-side.';
