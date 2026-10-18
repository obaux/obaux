/**
 * The client's call to the error log (D-616). THIS FILE IS A STAND-IN with Nico's final call shape
 * (`reportAppError({ action, code })`, 21:31, claude/messages-app-errors): when his lands on main it replaces
 * this one and nothing that calls it changes. Until then it sends nothing.
 */
export type AppErrorAction = string;

export function reportAppError(input: { readonly action: AppErrorAction; readonly code: string | number }): void {
  void input;
}
