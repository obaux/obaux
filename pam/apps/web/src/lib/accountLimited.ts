/**
 * Is this account limited right now?
 *
 * A limited account can read but not send or start a message: the database
 * refuses the insert (`is_active_account()` in `messages_insert_sender`,
 * 0031). From the phone a refusal and a dropped connection look the same — an
 * insert that came back with an error — and "Your connection dropped" is not
 * true of the first (terms.s.limits.p3: "Pam tells you it is off and who to
 * call", D-427). So a send that failed asks once, here, which one it was.
 *
 * Returns false whenever it cannot tell (offline, signed out): the generic
 * failure notice is the honest answer then.
 */
export async function readAccountLimited(): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('access_status')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (error) return false;
    return (data as { access_status?: string } | null)?.access_status === 'limited';
  } catch {
    return false;
  }
}
