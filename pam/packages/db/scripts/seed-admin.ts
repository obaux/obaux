/**
 * Creates the first admin — the one account that cannot be invited, because
 * there is nobody to invite it (§3.3, §10).
 *
 * Every later admin is created by an existing admin from the Admin Panel. Run
 * this once per environment:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   pnpm --filter @pam/db seed:admin -- --phone +15555550100 --name Dana --region North
 *
 * Uses the service role key, which bypasses RLS. That is the point — there is
 * no authenticated caller yet. Never expose this key to a client (§4).
 */

import { createClient } from '@supabase/supabase-js';

interface Args {
  phone: string;
  name: string;
  region: string;
}

function parseArgs(argv: readonly string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const phone = get('--phone');
  const name = get('--name');
  const region = get('--region');

  const missing = [
    ['--phone', phone],
    ['--name', name],
    ['--region', region],
  ]
    .filter(([, v]) => !v)
    .map(([f]) => f);

  if (missing.length > 0) {
    throw new Error(
      `Missing required argument(s): ${missing.join(', ')}\n` +
        'Usage: seed-admin --phone +15555550100 --name Dana --region North',
    );
  }

  if (!/^\+[1-9]\d{7,14}$/.test(phone!)) {
    // The same E.164 rule the profiles table enforces. Catching it here gives a
    // readable message instead of a constraint violation.
    throw new Error(`Phone must be E.164, e.g. +15555550100. Got: ${phone}`);
  }

  return { phone: phone!, name: name!, region: region! };
}

async function main(): Promise<void> {
  const url = process.env['SUPABASE_URL'];
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.');
  }

  const { phone, name, region } = parseArgs(process.argv.slice(2));
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1. The region. Idempotent so re-running is safe.
  const { data: existingRegion } = await db
    .from('regions')
    .select('id')
    .eq('name', region)
    .maybeSingle();

  let regionId = existingRegion?.id as string | undefined;

  if (!regionId) {
    const { data, error } = await db
      .from('regions')
      .insert({ name: region })
      .select('id')
      .single();
    if (error) throw new Error(`Could not create region: ${error.message}`);
    regionId = data.id as string;
    console.log(`Created region "${region}".`);
  } else {
    console.log(`Region "${region}" already exists.`);
  }

  // 2. The auth user. Phone-only: PAM has no password or email login (§9).
  const { data: created, error: authError } = await db.auth.admin.createUser({
    phone,
    phone_confirm: true,
  });

  let userId: string;
  if (authError) {
    // Most likely the user already exists — find them rather than failing, so
    // this script stays re-runnable.
    const { data: list } = await db.auth.admin.listUsers();
    const found = list?.users.find((u) => u.phone === phone.replace('+', ''));
    if (!found) throw new Error(`Could not create or find the auth user: ${authError.message}`);
    userId = found.id;
    console.log('Auth user already existed; reusing it.');
  } else {
    userId = created.user.id;
    console.log('Created auth user.');
  }

  // 3. The admin profile.
  const { error: profileError } = await db.from('profiles').upsert(
    {
      id: userId,
      role: 'admin',
      first_name: name,
      phone,
      region_id: regionId,
      access_status: 'active',
      // An admin has no member-facing transparency screen to acknowledge.
      transparency_ack_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (profileError) throw new Error(`Could not create the admin profile: ${profileError.message}`);

  await db.from('audit_log').insert({
    actor_id: userId,
    action: 'admin.seed',
    target_type: 'profile',
    target_id: userId,
    meta: { region, via: 'seed-admin script' },
  });

  console.log(`\nAdmin "${name}" is ready in region "${region}".`);
  console.log(`Sign in from the app with ${phone} — a verification code is sent by SMS.`);
}

main().catch((error: unknown) => {
  console.error(`\nseed-admin failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
