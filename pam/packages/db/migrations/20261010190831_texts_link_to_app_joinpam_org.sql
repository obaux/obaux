-- Texts link to app.joinpam.org, not the old vercel.app address (the merge desk for Will,
-- 10 October 2026: "use the proper link").
--
-- `app_url` is the base of every link Pam writes into a text from the database (the
-- approval text first; 0054). It still held the address the app had before it moved to
-- app.joinpam.org, which forwards but shows the old name in the text and in its link
-- preview. Not a secret.
--
-- Data only: no DROP, nothing else changes.

update public.app_settings
set value = 'https://app.joinpam.org'
where key = 'app_url' and value = 'https://web-ten-umber-88.vercel.app';
