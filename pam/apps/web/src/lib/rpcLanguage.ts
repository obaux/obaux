/**
 * Asks Pam's database for something and tells it which language the person is
 * reading in — when the database can take it (migration 0085, D-424).
 *
 * `request_staff_access` and `request_invite_link` gained a trailing
 * `p_language`. The migration changes two functions' shapes, so it is applied by
 * hand (the live connector stops at a `drop`, D-387), and the app must not break
 * for the days between "merged" and "applied". A call that names a parameter the
 * database does not have is refused with PGRST202 ("could not find the function
 * … in the schema cache") before it runs anything, so it is safe to ask again
 * without it. Once 0085 is live the first call succeeds, every time, and this
 * quietly stops mattering; when it has been live for good, delete this file and
 * pass `p_language` plainly.
 */
export const FUNCTION_NOT_FOUND = 'PGRST202';

interface RpcClient {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ error: { code?: string } | null }>;
}

export async function rpcWithLanguage(
  client: RpcClient,
  name: string,
  args: Record<string, unknown>,
  language: string,
): Promise<{ error: { code?: string } | null }> {
  const first = await client.rpc(name, { ...args, p_language: language });
  if (first.error?.code !== FUNCTION_NOT_FOUND) return first;
  return client.rpc(name, args);
}
