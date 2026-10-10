# D-480 — A planned visit has one name in each language, the tab's: Spanish says visita, not viaje

**Date:** 2026-10-10 · **Branch:** `claude/lena-es-visitas`

Mira (the merge desk), 10 October, from my own note in the promise sweep: Spanish called the same thing "Visitas" on the
tab and "viaje" in the strings around it. "Pick one, the tab's word, and make every string agree, in all the places it shows."

English has two words that Spanish folded into one: the **Trips** tab and screens (a trip is a visit a member plans, with
a place, a day and a time) and a **visit** (the same thing, seen from the place). The Spanish tab was already "Visitas"
(`tab.trips`, `trips.title`, `nav.back.trips`), as are the other five languages' tabs. Sixteen Spanish strings still said
"viaje", and a person cannot tell that a "viaje" is what the "Visitas" tab holds. They now say "visita":

`trips.new` Nueva visita · `trips.new.check` Revisa tu visita · `trips.new.add` Agregar esta visita · `trips.new.done.title`
Visita agregada · `trips.new.done.see` Ver tus visitas · `trips.new.example`, `person.trips.example` (…visitas de ejemplo) ·
`join.booked.trips` Ir a Visitas · `trips.booked.body`, `join.booked.body` (…Ya está en sus Visitas.) ·
`alerts.trip` Alguien planea una visita · `alerts.visit` Antes de su visita · `profile.promo.alerts.body.adminList`
(…mensajes y visitas) · `explore.nextTrip.label` (…Ver sus visitas.) · and the glossary entry: term "Visita", "Una visita
es el plan de un miembro para ir a un programa: el lugar, el día y la hora. Aparece en su mapa de Visitas, y el programa
también la ve."

The other five were read for the same drift. Brazilian Portuguese, Russian and Arabic already use their tab's word
everywhere. **Simplified Chinese** had one stray: `points.way.plan` said "行程" where every other line says "预约" ("安排去某个地方的预约").
**Traditional Chinese** says "行程" only inside the glossary's definition of 到訪, where the definition needs another word to
say it; left.

`test/one-word-for-a-visit.test.ts` keeps it so: per language, a list of words that must not be used for a planned visit
(es "viaje", zh "行程/旅程/旅行" outside the glossary definition, ru "поездка/путешествие", ar "رحلة", pt-BR "viagem"), checked
over every string. "Getting around" (`category.sub.transportation`) is transport, not a visit, and is exempt.

**Not changed, reported:** the public site's Spanish draft (`apps/site/src/content/about.ts`, line 85, Wren's lane, a draft
until signed, D-466) says "Guarde un viaje para encontrarlo fácilmente después." It should say "Guarde una visita para
encontrarla fácilmente después."

**What a later session might reverse:** nothing in the screens; if Will wants the Spanish tab to say "Viajes" instead, change
`tab.trips`, `trips.title` and `nav.back.trips` and take the word out of the test's list.
