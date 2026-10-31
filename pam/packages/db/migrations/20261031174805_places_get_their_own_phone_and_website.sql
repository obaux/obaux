-- Places get their own phone number and website (Will, 31 October 2026: "do a search for all places without contact
-- details and populate their phone and websites to the database").
--
-- Every number here was found by web search on 31 October 2026 and kept only when the place's own official site showed
-- it (high) or two independent directories agreed (medium); the rest stay empty, because a member taps the number to
-- call and a wrong number is worse than none. Libraries and Parks & Recreation sites are matched by id. Behavioral
-- health locations take their provider's main or intake line (most are programs inside schools with no public line of
-- their own), matched by the provider name the City's list gives them. A website replaces only an empty one or the
-- two generic pages every library and Parks & Recreation site pointed to. Nothing a program lead edited is touched.
-- One row per place, with its source: docs/data/2026-10-31-place-contacts.csv.

with by_place(id, phone, website) as (values
    ('40930970-2469-4121-ad30-b36ce10e38db'::uuid, '+12156851997', null),  -- Albert W Christy Sr Recreation Center
    ('6e0196ac-80d2-45d6-a916-661d75c65b3e'::uuid, '+12156852552', 'https://libwww.freelibrary.org/locations/andorra-library'),  -- Andorra Library
    ('307e625e-672b-461f-875c-ce4fa9066fe7'::uuid, '+12156852709', null),  -- Athletic Recreation Center
    ('ad4b347f-bce6-4fd3-bdfb-0031692cb289'::uuid, '+12156852895', null),  -- Awbury Park and Recreation Center
    ('925a0078-0c6f-4acb-bb0a-36a9051ba4c5'::uuid, '+12156851973', 'https://libwww.freelibrary.org/locations/blanche-a-nixoncobbs-creek-library'),  -- Blanche A. Nixon Library
    ('33067643-a3f2-41b4-ac90-ddec7de44a2e'::uuid, '+12156851471', 'https://libwww.freelibrary.org/locations/bushrod-library'),  -- Bushrod Library
    ('0cfde7da-ed71-4735-986f-c4ce371ad4e7'::uuid, '+12156850472', 'https://libwww.freelibrary.org/locations/bustleton-library'),  -- Bustleton Avenue Library
    ('c2c5bf76-4580-4480-9f13-98dfe7d39d5f'::uuid, '+12156859755', null),  -- Cecil B Moore Recreation Center
    ('a1eaa3ea-1862-4a5a-9b84-7e3f6af331dc'::uuid, '+12156852766', 'https://libwww.freelibrary.org/locations/cecil-b-moore-library'),  -- Cecil B. Moore Library
    ('7705c235-5e61-4afc-b2c9-24a9b3043133'::uuid, '+12156857436', 'https://libwww.freelibrary.org/locations/charles-l-durham-library'),  -- Charles L. Durham Library
    ('6d01695f-b803-450e-8311-bc5938168059'::uuid, '+12156859290', 'https://libwww.freelibrary.org/locations/chestnut-hill-library'),  -- Chestnut Hill Library
    ('866bba60-c759-4a1d-86b9-c7d59d9b28a5'::uuid, '+12156857654', 'https://www.phila.gov/parks-rec-finder/#/location/clayborne-lewis-playground/56a8f8177a8cee5e3a25add9'),  -- Clayborne and Lewis Playground
    ('7dd98cd3-7618-4ad0-9b6d-0c199d6d5351'::uuid, '+12156851890', null),  -- Columbus Square
    ('59c07344-c352-4897-9cd1-02ba8676064a'::uuid, '+12156852234', null),  -- Daniel E Rumph II Recreation Center
    ('5ee74f45-4580-4227-b80e-a69246361ae2'::uuid, '+12156853566', 'https://libwww.freelibrary.org/locations/david-cohen-ogontz-library'),  -- David Cohen Ogontz Library
    ('05cc21b0-c2dc-4172-90e4-8cd7cc9d2ef9'::uuid, '+12156851896', null),  -- Donald P Finnegan Recreation Center
    ('c44ef708-a133-400d-8599-138587a5e13c'::uuid, '+12156851755', 'https://libwww.freelibrary.org/locations/thomas-f-donatucci-sr-library'),  -- Donatucci Library
    ('c279e6dc-be68-4c7e-8ba6-c04e255a8ea0'::uuid, '+12156859253', null),  -- Dorothy Emanuel Recreation Center
    ('f8eedbcd-e963-4b4d-b049-39bdb04f00be'::uuid, '+12156851883', null),  -- Dr Nicola Capitolo Playground
    ('3d5edd3a-aac0-4186-8358-a8e903014aaa'::uuid, '+12156851633', 'https://libwww.freelibrary.org/locations/independence-library'),  -- East Phila/Independence Library
    ('a4c6921a-4e66-4fbd-be03-19ddd1491951'::uuid, '+12156854170', 'https://libwww.freelibrary.org/locations/eastwick-library'),  -- Eastwick Library
    ('4dd3023c-ae71-41ae-bc57-5746a2053813'::uuid, '+12156852093', 'https://libwww.freelibrary.org/locations/falls-of-schuylkill-library'),  -- Falls Of Schuylkill Library
    ('4d3cd356-9e4a-4fd6-b395-8a2ad2eaa9a8'::uuid, '+12156859990', 'https://libwww.freelibrary.org/locations/fishtown-community-library'),  -- Fishtown Community Library
    ('5f4aa4f7-c969-463f-b1ee-02d4699aba25'::uuid, '+12156850547', 'https://libwww.freelibrary.org/locations/fox-chase-library'),  -- Fox Chase Library
    ('08554eec-fde1-4f21-a9b3-fb503463051f'::uuid, '+12156851473', 'https://libwww.freelibrary.org/locations/frankford-library'),  -- Frankford Library
    ('e2b0d356-1e5d-42c7-9cd1-92b8739a0d62'::uuid, '+12156851758', 'https://libwww.freelibrary.org/locations/fumo-family-library'),  -- Fumo/Ritner Children's Library
    ('30ddba1e-953f-406e-9012-2ab1ecc12a9f'::uuid, '+12156852846', 'https://libwww.freelibrary.org/locations/greater-olney-library'),  -- Greater Olney Library
    ('94d0ccef-fcfb-417e-842f-7f2ce66893ed'::uuid, '+12156851970', 'https://libwww.freelibrary.org/locations/haddington-library'),  -- Haddington Library
    ('81f0ef19-878f-43c9-88b4-0a79b64e7cea'::uuid, '+12156851964', 'https://libwww.freelibrary.org/locations/haverford-library'),  -- Haverford Avenue Library
    ('27670c77-a920-46ff-affd-0c2f794f0acf'::uuid, '+12156858756', 'https://libwww.freelibrary.org/locations/holmesburg-library'),  -- Holmesburg Library
    ('4d71fd24-f8ac-471f-8fbd-6da38441023f'::uuid, '+12156859383', 'https://libwww.freelibrary.org/locations/katharine-drexel-library'),  -- Katherine Drexel Library
    ('b3162eb9-3939-464c-867b-de54eb65401f'::uuid, '+12156859996', 'https://libwww.freelibrary.org/locations/kensington-library'),  -- Kensington Library
    ('0f4cb187-afdf-4c0d-8c9c-689ec8703f0a'::uuid, '+12156852690', 'https://libwww.freelibrary.org/locations/kingsessing-library'),  -- Kingsessing Library
    ('26961c4e-85b3-4542-badc-859db4088125'::uuid, '+12156850549', 'https://libwww.freelibrary.org/locations/lawncrest-library'),  -- Lawncrest Library
    ('3f97dcf4-32d0-4eac-a180-3e779d5db940'::uuid, '+12156851874', null),  -- Lawrence E Murphy Recreation Center
    ('ac11cb05-73b5-414b-9144-15168f96a250'::uuid, '+12156859794', 'https://libwww.freelibrary.org/locations/lillian-marrero-library'),  -- Lillian Marrero Library
    ('59eb98ea-9262-415e-a9e1-e8fd21e74c4a'::uuid, '+12156859156', 'https://libwww.freelibrary.org/locations/logan-library'),  -- Logan Library
    ('52b1470e-6ec4-47a0-b549-3fc06f934ec5'::uuid, '+12156852095', 'https://libwww.freelibrary.org/locations/lovett-memorial-library'),  -- Lovett Memorial Library
    ('5a6b5a2d-3523-417c-9040-ff1b7646ba41'::uuid, '+12156859995', 'https://libwww.freelibrary.org/locations/mcpherson-square-library'),  -- Mcpherson Square Library
    ('630ef4da-b157-4f08-bf3b-4a3266b58a7a'::uuid, '+12156859790', 'https://libwww.freelibrary.org/locations/nicetown-tioga-library'),  -- Nicetown-tioga Library
    ('aaf0fd36-8cb9-4511-bb1a-03454a17e6c7'::uuid, '+12156852848', 'https://libwww.freelibrary.org/locations/oak-lane-library'),  -- Oak Lane Library
    ('2cc45532-f424-4398-b5fe-63a167b77de7'::uuid, '+12156850182', 'https://libwww.freelibrary.org/locations/overbrook-park-library'),  -- Overbrook Park Library
    ('10ca8577-817e-4f69-9da6-743f1a08efaa'::uuid, '+12156852662', 'https://libwww.freelibrary.org/locations/paschalville-library'),  -- Paschalville Library
    ('6c09dab6-fca7-48c8-87df-292d63b7f3ae'::uuid, '+12156856621', 'https://libwww.freelibrary.org/locations/philadelphia-city-institute'),  -- Philadelphia City Institute Library
    ('fb9bde81-76b5-4121-94c0-10393de2cce6'::uuid, '+12156851899', 'https://libwww.freelibrary.org/locations/queen-memorial-library'),  -- Queen Memorial Library
    ('c37ab387-0bf8-42dd-a167-2ee0dba95ec2'::uuid, '+12156859887', null),  -- Ramonita Negron Rivera Recreation and Community Center
    ('cb1580e1-e406-4302-995e-2d5eff9d24be'::uuid, '+12156850522', 'https://libwww.freelibrary.org/locations/northeast-regional-library'),  -- Regional Library Northeast
    ('bcdad150-b863-493d-b8db-5cdbdee7ff0d'::uuid, '+12156852150', 'https://libwww.freelibrary.org/locations/joseph-e-coleman-northwest-regional-library'),  -- Regional Library Northwest - J Coleman
    ('bf369d46-325a-4620-b3f4-e3d8672a7b5a'::uuid, '+12156857431', 'https://libwww.freelibrary.org/locations/lucien-e-blackwell-west-philadelphia-regional-library'),  -- Regional Library West - Blackwell
    ('ab45ce19-9407-470c-a6c4-60a40e960e34'::uuid, '+12156859992', 'https://libwww.freelibrary.org/locations/richmond-library'),  -- Richmond Library
    ('0db81eaa-bfbb-4ef1-9922-84b1df89e5de'::uuid, '+12156861768', 'https://libwww.freelibrary.org/locations/ramonita-g-de-rodriguez-library'),  -- Romonita de Rodriguez Library
    ('e19e3dea-98f0-4562-ac57-2ae82deb1549'::uuid, '+12156852550', 'https://libwww.freelibrary.org/locations/roxborough-library'),  -- Roxborough Library
    ('5290039e-f227-4088-9ab5-b0e8d6f92fc5'::uuid, '+12156861766', 'https://libwww.freelibrary.org/locations/charles-santore-library'),  -- Santore Library
    ('a670c9f3-ee9a-49ed-ba8e-a3023dc5d5ca'::uuid, '+12156858755', 'https://libwww.freelibrary.org/locations/tacony-library'),  -- Tacony Library
    ('a8c059ff-f66b-40b6-8fdc-51ba7039f827'::uuid, '+12156850494', 'https://libwww.freelibrary.org/locations/torresdale-library'),  -- Torresdale Library
    ('e8fec545-0989-42af-90b2-b73f3ccebf84'::uuid, '+12156859293', 'https://libwww.freelibrary.org/locations/wadsworth-library'),  -- Wadsworth Avenue Library
    ('d1454173-e140-4893-881f-9f364803b9e0'::uuid, '+12156857671', 'https://libwww.freelibrary.org/locations/walnut-street-west-library'),  -- Walnut Street West Library
    ('fe5bb224-8fc6-4173-be36-4c303b34ca2e'::uuid, '+12156850498', 'https://libwww.freelibrary.org/locations/welsh-road-library'),  -- Welsh Road Library
    ('7d337d1f-5963-42e1-a940-b7bbedc25ecd'::uuid, '+12156852843', 'https://libwww.freelibrary.org/locations/dwight-evans-library-of-west-oak-lane'),  -- West Oak Lane Library
    ('faa9d0eb-2ed0-4f39-bee4-db61c6761c7f'::uuid, '+12156851754', 'https://libwww.freelibrary.org/locations/whitman-library'),  -- Whitman Library
    ('03c49f01-cdb2-4ac0-8338-cef5df87ce40'::uuid, '+12156859799', 'https://libwww.freelibrary.org/locations/widener-library'),  -- Widener Library
    ('7a2e2375-2788-4bfc-a264-223a3c59302d'::uuid, '+12156850298', 'https://libwww.freelibrary.org/locations/wynnefield-library'),  -- Wynnefield Library
    ('2c991932-edc3-4dac-b9dc-19b111bfffdb'::uuid, '+12156859158', 'https://libwww.freelibrary.org/locations/wyoming-library')  -- Wyoming Library
), by_provider(provider_name, phone, website) as (values
    ('ADDICTION MEDICINE & HEALTH ADVOCATES, INC.', '+12159234202', null),
    ('APM', '+12672967200', 'https://apmphila.org/get-in-touch/contact-us/'),
    ('ASOCIACION PUERTORRIQUENOS EN MARCHA, INC.', '+12672967200', 'https://apmphila.org/get-in-touch/contact-us/'),
    ('Assessment & Treatment Alternatives Inc.', '+12154052100', null),
    ('BETHESDA PROJECT', '+12159851600', 'https://www.bethesdaproject.org/contact-us'),
    ('CARELINK', null, 'https://www.carelinkservices.org/'),
    ('CASA DE CONSEJERIA Y SALUD INTEGRAL, INC.', '+12156343259', null),
    ('CATHOLIC SOCIAL SERVICES', null, 'https://www.archdiocese-phl.org/directory/secretariat-for-catholic-human-services/catholic-social-services'),
    ('CENT COMP (JFK)', '+12155680860', null),
    ('CHILD CRISIS TREATMENT CENTER', '+12154960707', 'https://www.cctckids.org/contact/'),
    ('CONGRESO', '+12157638870', null),
    ('CORA', '+12153427660', null),
    ('CORA SERVICES, INC.', '+12153427660', null),
    ('FAIRMOUNT BEHAVIORAL HEALTH SYSTEM', '+12154874000', null),
    ('GAUDENZIA', '+18339764357', null),
    ('HORIZON HOUSE', '+12153863838', null),
    ('INTERAC', '+12154870914', null),
    ('J J PETERS', '+12157011560', null),
    ('JEVS', null, 'https://www.jevshumanservices.org/'),
    ('JFCS', null, 'https://jfcsphilly.org/'),
    ('JOHN F. KENNEDY BEHAVIORAL HEALTH CENTER', '+12155680860', null),
    ('MENTAL HEALTH PARTNERSHIPS', '+12157511800', null),
    ('MERAKEY', '+18886470020', 'https://www.merakey.org/services'),
    ('MERAKEY PHILADELPHIA', '+18886470020', 'https://www.merakey.org/services'),
    ('MERAKEY/DREXEL UNIVERSITY - CARING TOGETHER PROGRAM', '+12159672130', 'https://www.drexelmedicine.org/patient-services/the-caring-together-program/our-doctors-and-staff/'),
    ('NEW VITAE WELLNESS AND RECOVERY', null, 'https://www.newvitaewellness.com/'),
    ('NORTHEAST COMM CTR FOR BEHAV HEALTH', '+12158312800', null),
    ('PA HOSPITAL HALL-MERCER', '+12158297271', 'https://www.pennmedicine.org/practices/psychiatry-hall-mercer'),
    ('PREVENTION POINT', '+12156345272', 'https://ppponline.org/about-us/contact-us'),
    ('PROJECT HOME', null, 'https://www.projecthome.org/'),
    ('PUBLIC HEALTH MANAGEMENT CORPORATION', '+12159852500', 'https://phmc.org/site/about-us'),
    ('RESOURCES FOR HUMAN DEVELOPMENT', '+12159510300', null),
    ('SELF-HELP MOVEMENT, INC.', '+12156777778', null),
    ('TABOR', '+12158424800', null),
    ('THE BEHAVIORAL WELLNESS CENTER AT GIRARD/CATCH', '+12157872407', 'https://bewellctr.org/'),
    ('THE WEDGE MEDICAL CENTER, P.C.', '+12157443600', null)
), wanted as (
  select s.id, b.phone, b.website from public.services s join by_place b on b.id = s.id
  union all
  select s.id, p.phone, p.website from public.services s join by_provider p
    on s.source_ref like 'dbhids:%' and s.source_attributes->>'provider_name' = p.provider_name
)
update public.services s
set phone   = coalesce(nullif(s.phone, ''), w.phone),
    website = case
                when w.website is not null
                 and (nullif(s.website, '') is null
                      or s.website in ('https://libwww.freelibrary.org/',
                                       'https://www.phila.gov/departments/philadelphia-parks-recreation/'))
                then w.website
                else s.website
              end,
    updated_at = now()
from wanted w
where s.id = w.id
  and s.source = 'city_import'
  and not ('phone' = any (coalesce(s.provider_edited_fields, '{}'::text[])))
  and not ('website' = any (coalesce(s.provider_edited_fields, '{}'::text[])));
