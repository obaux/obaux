import { describe, expect, it } from 'vitest';
import { codeOf, reportFunctionError } from '../../../supabase/functions/dispatch-sms/reportError.ts';
import { isAppErrorAction } from '../src/appErrors.ts';

/** D-616: the text dispatcher tells the error log it failed, with an action and a code and nothing else. */
const env: Record<string, string> = { SUPABASE_URL: 'https://stub.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' };

describe('reportFunctionError', () => {
  it('posts the action and a code to the log function as the service, and nothing else', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    await reportFunctionError(
      { get: (n) => env[n], fetch: (async (url: string, init: RequestInit) => (calls.push({ url, init }), new Response('true'))) as unknown as typeof fetch },
      'function.dispatch-sms',
      new Error('Twilio 429: To +12155550100 is not allowed'),
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://stub.supabase.co/rest/v1/rpc/report_app_error');
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ p_area: '/', p_action: 'function.dispatch-sms', p_code: '429', p_platform: 'server' });
    expect(String(calls[0]!.init.body)).not.toMatch(/2155550100|allowed/);
  });

  it('sends "unknown" when the error carries no status, and never the error words', () => {
    expect(codeOf(new Error('Something (phone)=(+12155550100)'))).toBe('unknown');
    expect(codeOf('rpc: 500 body')).toBe('500');
    expect(codeOf(undefined)).toBe('unknown');
  });

  it('never throws: a failing request, or no service key, is silent', async () => {
    await expect(reportFunctionError({ get: (n) => env[n], fetch: (async () => { throw new Error('down'); }) as unknown as typeof fetch }, 'function.dispatch-sms', new Error('x'))).resolves.toBeUndefined();
    await expect(reportFunctionError({ get: () => undefined, fetch: (async () => { throw new Error('should not be called'); }) as unknown as typeof fetch }, 'function.dispatch-sms', new Error('x'))).resolves.toBeUndefined();
  });

  it('uses an action key on the closed list', () => {
    expect(isAppErrorAction('function.dispatch-sms')).toBe(true);
  });
});
