// Tells Pam's error log (D-616) that this function failed: an action key and a code, never a message.
// Written to be called from anywhere in the function: it never throws and never waits on anything but one request.
// The service key it uses is the one the function already holds (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY); no new host.

export interface ReportDeps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
}

/** An HTTP status in a message like "Twilio 429: ..." (only the three digits are kept), else "unknown". */
export function codeOf(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  const match = /^[A-Za-z_-]+:? ([0-9]{3})\b/.exec(text);
  return match ? match[1]! : 'unknown';
}

export async function reportFunctionError(deps: ReportDeps, action: string, error: unknown): Promise<void> {
  try {
    const base = deps.get('SUPABASE_URL');
    const key = deps.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!base || !key) return;
    await deps.fetch(`${base}/rest/v1/rpc/report_app_error`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      // Only what the log keeps: where (the function has no screen), which action, what code. Never the error's words.
      body: JSON.stringify({ p_area: '/', p_action: action, p_code: codeOf(error), p_platform: 'server' }),
    });
  } catch {
    /* reporting a failure must never be a second failure */
  }
}
