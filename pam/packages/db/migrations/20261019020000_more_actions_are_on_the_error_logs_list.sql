-- The rest of the saves and sends that say "That didn't go through" at the bottom (D-616) are logged by their key.
-- Expand-only: the closed list gains keys; nothing is dropped.
insert into public.app_error_actions (action) values
  ('flag.send'),
  ('places.review'),
  ('policies.remove'),
  ('policies.upload'),
  ('program.add'),
  ('program.save'),
  ('programs.review'),
  ('request.withdraw'),
  ('service.remove'),
  ('service.save')
on conflict do nothing;
