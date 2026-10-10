-- Assigning a guide, handing a member over, and limiting or pausing (D-446).
--
-- Who may change a member's guide, and only through the functions: before the
-- contract migration any case manager could insert a row assigning themselves
-- any unassigned member straight through PostgREST, with no audit_log row.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana         '33333333-0000-0000-0000-00000000000a'
\set ray          '33333333-0000-0000-0000-00000000000b'
\set marcus       '33333333-0000-0000-0000-00000000000c'
\set alice        '33333333-0000-0000-0000-00000000000f'
\set region_north '11111111-0000-0000-0000-000000000001'
\set boss         '33333333-0000-0000-0000-0000000023a0'
\set fay          '33333333-0000-0000-0000-0000000023a1'
\set hana         '33333333-0000-0000-0000-0000000023a2'
\set paused_cm    '33333333-0000-0000-0000-0000000023a3'

reset role;
insert into auth.users (id) values (:'boss'), (:'fay'), (:'hana'), (:'paused_cm');
insert into public.profiles (id, role, first_name, region_id, access_status) values
  (:'boss',      'super_admin', 'Wren', :'region_north', 'active'),
  (:'fay',       'admin',       'Fay',  :'region_north', 'active'),
  (:'hana',      'member',      'Hana', :'region_north', 'active'),
  (:'paused_cm', 'admin',       'Pat',  :'region_north', 'suspended');
set role authenticated;

-- ===========================================================================
\echo ''
\echo '--- Nobody writes admin_assignments directly any more ---'
-- ===========================================================================
select test.as_user(:'dana');
select test.check_raises('Dana cannot assign herself the unassigned Hana with an insert',
  format($$insert into public.admin_assignments (admin_id, member_id) values (%L, %L)$$, :'dana', :'hana'));
select test.check_raises('Dana cannot move her row for Marcus to Hana',
  format($$update public.admin_assignments set member_id = %L where member_id = %L$$, :'hana', :'marcus'));
select test.check_raises('Dana cannot end her own assignment with an update',
  format($$update public.admin_assignments set ended_at = now() where member_id = %L$$, :'marcus'));
select test.check_raises('Dana cannot delete an assignment',
  format($$delete from public.admin_assignments where member_id = %L$$, :'marcus'));
select test.check('Dana still reads her own assignment',
  (select count(*) from public.admin_assignments where member_id = :'marcus' and ended_at is null), 1);
select test.check('Dana still cannot read Hana',
  (select count(*) from public.profiles where id = :'hana'), 0);

select test.as_user(:'marcus');
select test.check('Marcus still reads who supports him',
  (select count(*) from public.admin_assignments where member_id = :'marcus' and ended_at is null), 1);

-- ===========================================================================
\echo ''
\echo '--- Only the super admin assigns ---'
-- ===========================================================================
select test.as_user(:'dana');
select test.check_raises('a case manager cannot call assign_guide',
  format($$select public.assign_guide(%L, %L)$$, :'hana', :'dana'));
select test.as_user(:'hana');
select test.check_raises('a member cannot assign themselves a guide',
  format($$select public.assign_guide(%L, %L)$$, :'hana', :'dana'));
select test.as_user(:'alice');
select test.check_raises('a program lead cannot assign a guide',
  format($$select public.assign_guide(%L, %L)$$, :'hana', :'alice'));
select test.check_raises('nobody calls the internal setter',
  format($$select public.set_guide_internal(%L, %L, 'x')$$, :'hana', :'dana'));

select test.as_user(:'boss');
select test.check_raises('a guide must be a case manager, not a program lead',
  format($$select public.assign_guide(%L, %L)$$, :'hana', :'alice'));
select test.check_raises('a guide must be a case manager, not a member',
  format($$select public.assign_guide(%L, %L)$$, :'hana', :'marcus'));
select test.check_raises('only a member can have a guide',
  format($$select public.assign_guide(%L, %L)$$, :'fay', :'dana'));
select test.check_raises('a paused case manager cannot be made a guide',
  format($$select public.assign_guide(%L, %L)$$, :'hana', :'paused_cm'));

select test.check('the super admin sees Hana as unassigned',
  (select count(*) from public.directory_guides() where member_id = :'hana'), 0);
select public.assign_guide(:'hana', :'fay');
select test.check('...then assigns Fay as her guide',
  (select count(*) from public.directory_guides() where member_id = :'hana' and guide_id = :'fay'), 1);
select public.assign_guide(:'hana', :'fay');

reset role;
select test.check('assigning the same guide twice writes nothing more',
  (select count(*) from public.audit_log where target_id = :'hana' and action = 'assignment.set'), 1);
select test.check('one active assignment',
  (select count(*) from public.admin_assignments where member_id = :'hana' and ended_at is null), 1);
set role authenticated;

select test.as_user(:'fay');
select test.check('Fay now reads Hana',
  (select count(*) from public.profiles where id = :'hana'), 1);

-- ===========================================================================
\echo ''
\echo '--- Handing over: one''s own members, to a colleague in the same city ---'
-- ===========================================================================
select test.check('Fay''s picker lists Dana, in her city',
  (select count(*) from public.guides_i_can_choose() where id = :'dana'), 1);
select test.check('...and not herself, Ray (South), the paused Pat or any member',
  (select count(*) from public.guides_i_can_choose()
    where id in (:'fay', :'ray', :'paused_cm', :'hana', :'marcus', :'alice')), 0);
select test.as_user(:'hana');
select test.check('a member''s picker is empty',
  (select count(*) from public.guides_i_can_choose()), 0);
select test.check('a member gets nothing from directory_guides',
  (select count(*) from public.directory_guides()), 0);

select test.as_user(:'dana');
select test.check_raises('Dana cannot hand over Hana, who is not hers',
  format($$select public.hand_over_member(%L, %L)$$, :'hana', :'dana'));
select test.check('a case manager gets nothing from directory_guides',
  (select count(*) from public.directory_guides()), 0);

select test.as_user(:'fay');
select test.check_raises('Fay cannot hand Hana to Ray, in another city',
  format($$select public.hand_over_member(%L, %L)$$, :'hana', :'ray'));
select test.check_raises('...nor to herself',
  format($$select public.hand_over_member(%L, %L)$$, :'hana', :'fay'));
select test.check_raises('...nor to a program lead',
  format($$select public.hand_over_member(%L, %L)$$, :'hana', :'alice'));
select public.hand_over_member(:'hana', :'dana');
select test.check('once handed over, Fay no longer reads Hana',
  (select count(*) from public.profiles where id = :'hana'), 0);
select test.check_raises('...nor can she limit her',
  format($$select public.admin_set_access_status(%L, 'limited', 'testing')$$, :'hana'));

select test.as_user(:'dana');
select test.check('...and Dana does',
  (select count(*) from public.profiles where id = :'hana'), 1);

reset role;
select test.check('the hand-over is in the audit log, from Fay to Dana',
  (select count(*) from public.audit_log
    where target_id = :'hana' and action = 'assignment.handed_over'
      and actor_id = :'fay' and meta->>'from' = :'fay' and meta->>'to' = :'dana'), 1);
select test.check('history is kept: two rows for Hana, one active',
  (select count(*) from public.admin_assignments where member_id = :'hana'), 2);
set role authenticated;

-- ===========================================================================
\echo ''
\echo '--- Limiting, pausing and turning back on ---'
-- ===========================================================================
select test.as_user(:'dana');
select test.check_raises('a limit needs a reason',
  format($$select public.admin_set_access_status(%L, 'limited', '  ')$$, :'hana'));
select public.admin_set_access_status(:'hana', 'limited', 'Sent unkind messages');
select test.check('Dana limits Hana',
  (select count(*) from public.profiles where id = :'hana' and access_status = 'limited'), 1);
select public.admin_set_access_status(:'hana', 'suspended', 'Asked to pause');
select test.check('...pauses her',
  (select count(*) from public.profiles where id = :'hana' and access_status = 'suspended'), 1);
select public.admin_set_access_status(:'hana', 'active', 'Talked it through');
select test.check('...and turns her back on',
  (select count(*) from public.profiles where id = :'hana' and access_status = 'active'), 1);
select test.check_raises('a case manager cannot set access_status by a direct update',
  format($$update public.profiles set access_status = 'limited' where id = %L$$, :'hana'));

reset role;
select test.check('every change is in the audit log with its reason',
  (select count(*) from public.audit_log
    where target_id = :'hana' and action = 'access.status' and meta ? 'reason'), 3);
set role authenticated;

-- ===========================================================================
\echo ''
\echo '--- The super admin limits only someone assigned to them ---'
-- ===========================================================================
select test.as_user(:'boss');
select test.check_raises('the super admin cannot limit Hana, who is Dana''s',
  format($$select public.admin_set_access_status(%L, 'limited', 'testing')$$, :'hana'));
select public.assign_guide(:'hana', :'boss');
select public.admin_set_access_status(:'hana', 'limited', 'testing');
select test.check('...but can once they assign her to themselves',
  (select count(*) from public.directory_people() where id = :'hana' and access_status = 'limited'), 1);
select public.assign_guide(:'hana', null);
select test.check('a guide can be taken away',
  (select count(*) from public.directory_guides() where member_id = :'hana'), 0);

-- Leave the fixture as 01_seed.sql left it: these people are this file's own.
reset role;
delete from public.admin_assignments where member_id = :'hana';
set role authenticated;
