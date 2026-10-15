import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A program lead's real policies (Will's card a25, part 1): read from the
 * database, added by putting the files in the private bucket and then asking
 * `add_policy`, taken off with `archive_policy`, replaced by a new version. A
 * wrong file is said before anything is sent.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const ORG = '22222222-0000-0000-0000-0000000000aa';
const PROGRAM = '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const policy = (id: string, title: string, version = 1) => ({
  id, service_id: PROGRAM, title, version, replaces_id: null, created_at: '2026-10-06T10:00:00Z', archived_at: null,
  program_policy_files: [{ id: `${id}-f`, path: `${PROGRAM}/${id}.pdf`, name: `${id}.pdf`, content_type: 'application/pdf', size_bytes: 1000, position: 0 }],
});

async function signedInLead(page: import('@playwright/test').Page, policies: unknown[]) {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, org_id: ORG, role: 'provider', first_name: 'Lou', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_submissions*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/services*', (route) =>
    route.fulfill(json([{ id: PROGRAM, name: 'Fresh Start Kitchen', category: 'workforce', subcategory: null, description_plain: 'Words.', address: null, phone: null, website: null, needs_review: false, is_active: true, created_at: '2026-10-06T10:00:00Z' }])),
  );
  await page.route('**/rest/v1/program_policies*', (route) => route.fulfill(json(policies)));
}

test('the lead\'s own policies are listed from the database, with no WCAG A/AA violations', async ({ page }) => {
  await signedInLead(page, [policy('conf', 'Confidentiality'), policy('photo', 'Photo release')]);
  await page.goto('/program/policies/');
  await settled(page);
  await expect(page.getByRole('link', { name: /Confidentiality/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Photo release/ })).toBeVisible();
  // No example policy leaks in beside the real ones.
  await expect(page.getByText('Liability disclaimer')).toHaveCount(0);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('adding a policy puts the file in the private bucket, then asks add_policy', async ({ page }) => {
  await signedInLead(page, []);
  const uploaded: string[] = [];
  await page.route('**/storage/v1/object/policies/**', (route) => {
    uploaded.push(new URL(route.request().url()).pathname);
    return route.fulfill(json({ Key: 'policies/x' }));
  });
  const made: unknown[] = [];
  await page.route('**/rest/v1/rpc/add_policy*', (route) => {
    made.push(route.request().postDataJSON());
    return route.fulfill(json({ id: 'new' }));
  });
  await page.goto('/program/policies/');
  await settled(page);
  await page.locator('input[type=file]').setInputFiles({ name: 'code-of-conduct.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await expect.poll(() => made.length).toBe(1);
  expect(uploaded).toHaveLength(1);
  expect(uploaded[0]).toContain(`/policies/${PROGRAM}/`);
  expect(made[0]).toMatchObject({ p_service_id: PROGRAM, p_title: 'Code of conduct' });
  expect((made[0] as { p_files: unknown[] }).p_files).toHaveLength(1);
});

test('a file that is not a PDF or a photo is refused before anything is sent', async ({ page }) => {
  await signedInLead(page, []);
  let sent = 0;
  await page.route('**/storage/v1/object/policies/**', (route) => {
    sent += 1;
    return route.fulfill(json({}));
  });
  await page.goto('/program/policies/');
  await settled(page);
  await page.locator('input[type=file]').setInputFiles({ name: 'clip.mp4', mimeType: 'video/mp4', buffer: Buffer.from('x') });
  await expect(page.getByText(/Use a PDF, or a photo of each page/)).toBeVisible();
  expect(sent).toBe(0);
});

test('taking a policy off asks first, then archives it', async ({ page }) => {
  await signedInLead(page, [policy('conf', 'Confidentiality')]);
  const archived: unknown[] = [];
  await page.route('**/rest/v1/rpc/archive_policy*', (route) => {
    archived.push(route.request().postDataJSON());
    return route.fulfill(json({ id: 'conf' }));
  });
  await page.goto('/program/policies/');
  await settled(page);
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: /Remove Confidentiality/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Remove|Yes/ }).first().click();
  await expect.poll(() => archived.length).toBe(1);
  expect(archived[0]).toEqual({ p_id: 'conf' });
});

test('a policy shows its version and pages, and a new version replaces it', async ({ page }) => {
  await signedInLead(page, [policy('conf', 'Confidentiality', 2)]);
  const made: unknown[] = [];
  await page.route('**/storage/v1/object/policies/**', (route) => route.fulfill(json({ Key: 'policies/x' })));
  await page.route('**/rest/v1/rpc/add_policy*', (route) => {
    made.push(route.request().postDataJSON());
    return route.fulfill(json({ id: 'new' }));
  });
  await page.goto('/program/policies/view/?id=conf');
  await settled(page);
  await expect(page.getByText('Version 2')).toBeVisible();
  await expect(page.getByText('conf.pdf')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({ name: 'conf-v3.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await expect.poll(() => made.length).toBe(1);
  expect(made[0]).toMatchObject({ p_service_id: PROGRAM, p_replaces: 'conf' });
  await expect(page).toHaveURL(/\/program\/policies\/$/);
});

test('the Signed tab lists who signed by first name and date, nothing more', async ({ page }) => {
  await signedInLead(page, [policy('conf', 'Confidentiality')]);
  await page.route('**/rest/v1/rpc/program_policy_signers*', (route) =>
    route.fulfill(
      json([
        { policy_id: 'conf', member_id: 'm-1', first_name: 'Tanya', signed_at: '2026-10-08T15:00:00Z' },
        { policy_id: 'conf', member_id: 'm-2', first_name: 'Luis', signed_at: '2026-10-09T15:00:00Z' },
      ]),
    ),
  );
  await page.goto('/program/policies/');
  await settled(page);
  await expect(page.getByRole('link', { name: /Confidentiality/ })).toContainText('Signed by 2');
  await page.getByRole('link', { name: /Confidentiality/ }).click();
  await page.getByRole('radio', { name: /Signed/ }).click();
  await expect(page.getByText('Tanya')).toBeVisible();
  await expect(page.getByText('Luis')).toBeVisible();
  await expect(page.getByText(/Oct 8|October 8/)).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('ticking a policy on a service asks the database to make it only for that service', async ({ page }) => {
  const CONF = 'a1b2c3d4-0000-4000-8000-000000000001';
  const GED = 'b1b2c3d4-0000-4000-8000-0000000000aa';
  const COMPUTERS = 'b1b2c3d4-0000-4000-8000-0000000000bb';
  await signedInLead(page, [policy(CONF, 'Confidentiality')]);
  await page.unroute('**/rest/v1/program_services*');
  const svc = (id: string, name: string, policyIds: string[]) => ({
    id, service_id: PROGRAM, name, description: null, phone: null, website: null, address: null, hours: null, sort_order: 0,
    program_policy_services: policyIds.map((policy_id) => ({ policy_id })),
  });
  await page.route('**/rest/v1/program_services*', (route) => {
    if (route.request().method() === 'GET') return route.fulfill(json([svc(GED, 'GED class', []), svc(COMPUTERS, 'Computer room', [CONF])]));
    return route.fulfill(json([]));
  });
  const scoped: unknown[] = [];
  await page.route('**/rest/v1/rpc/set_policy_services*', (route) => {
    scoped.push(route.request().postDataJSON());
    return route.fulfill(json(null));
  });
  await page.goto(`/program/service/?id=${GED}`);
  await settled(page);
  await page.getByRole('checkbox', { name: 'Confidentiality' }).check();
  await page.getByRole('button', { name: /Save/ }).last().click();
  await expect.poll(() => scoped.length).toBe(1);
  // The policy was already only for the computer room; now it is for the GED class too.
  expect(scoped[0]).toEqual({ p_policy_id: CONF, p_service_ids: [COMPUTERS, GED] });
});
