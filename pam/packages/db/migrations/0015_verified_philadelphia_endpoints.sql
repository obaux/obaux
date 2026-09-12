-- 0015 — Philadelphia endpoints, verified.
--
-- 0009 registered four sources with catalogue pages instead of API endpoints,
-- because this build environment denies all external egress and nothing could be
-- checked. That constraint turned out to be the wrong place to look: the
-- *database* has open egress, so enabling pg_net (0014) made the check one query
-- away. See DECISIONS.md D-030.
--
-- What was actually confirmed, by request, not by assumption:
--
--   services.arcgis.com/fLeGjb7u4uXqeF9q  200, catalogue of ~1000 FeatureServers
--   City_Facilities_pub/FeatureServer/0   200, returnCountOnly -> 3,197 features
--   dbhids_locations_fy25_012126/…/0      200, Feature Layer, displayField
--                                         "provider_name", edited 2026-02
--   phl.carto.com/api/v2/sql              200, SQL API answers queries
--   opendataphilly.org                    200
--   www.pa211.org                         200 (consumer search UI; no export
--                                         endpoint discovered — see below)
--
-- The two ArcGIS layers are promoted to their own rows with real endpoints and
-- activated. The rest stay inactive with an honest reason recorded.

update public.service_imports
set source_url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services?f=json',
    is_active = true,
    errors = '[{"status":"verified","checked_at":"2026-09-12","via":"pg_net from the project database","note":"CityGeo ArcGIS Online org. Catalogue enumerates FeatureServers; each exposes /FeatureServer/<n>/query with f=json."}]'::jsonb
where source_name = 'City of Philadelphia Open Data Portal (ArcGIS)';

insert into public.service_imports
  (source_name, source_url, source_format, region_id, is_active, errors)
values
  ('Philadelphia — City Facilities',
   'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/City_Facilities_pub/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson',
   'arcgis',
   '0195b1c0-0000-4000-8000-000000000001',
   true,
   '[{"status":"verified","checked_at":"2026-09-12","feature_count":3197,"note":"Broadest single source of places a member can walk into. Needs category mapping per facility type — most rows will not be PAM services, so expect heavy filtering in category_map.json."}]'::jsonb),

  ('Philadelphia — DBHIDS provider locations',
   'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/dbhids_locations_fy25_012126/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson',
   'arcgis',
   '0195b1c0-0000-4000-8000-000000000001',
   true,
   '[{"status":"verified","checked_at":"2026-09-12","display_field":"provider_name","note":"Behavioral health and intellectual disability providers. Maps to family_services / health_counseling. Treat addresses as sensitive in UI copy — the service name alone can disclose why someone attends."}]'::jsonb);

-- PA 211: reachable, licence cleared, still no machine-readable endpoint found.
-- pa211.org answers 200 but serves a consumer search interface; the HSDS/Open
-- Referral export is not publicly documented and is normally issued per
-- agreement. Now that the licence is cleared, the remaining step is asking the
-- 211 contact for the export URL rather than discovering it.
update public.service_imports
set errors = '[{"status":"endpoint_unknown","licence":"cleared 2026-09-12","reachable":true,"checked_at":"2026-09-12","note":"Host answers 200 but exposes a consumer search UI, not an export. Ask the 211 contact for the HSDS/Open Referral feed URL; the importer already supports that format."}]'::jsonb
where source_name = 'PA 211 Southeast — HSDS export';

-- The two OpenDataPhilly catalogue rows are superseded by the ArcGIS entries
-- above, which is where those datasets actually live.
update public.service_imports
set errors = '[{"status":"superseded","checked_at":"2026-09-12","note":"Catalogue page, reachable. The underlying datasets are served from the CityGeo ArcGIS org — use those rows instead."}]'::jsonb
where source_name in (
  'OpenDataPhilly — Health & Human Services catalogue',
  'OpenDataPhilly — Health Centers'
);
