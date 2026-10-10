'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { ProgramDetails } from './useJoin';
import type { SessionState } from './useSession';
import {
  OWN_PROGRAM_COLUMNS,
  SUBMISSION_COLUMNS,
  changeRequest,
  editColumns,
  programFromRow,
  resendArguments,
  submitArguments,
  type EditableProgram,
  type OwnProgram,
  type OwnProgramRow,
  type SubmissionRow,
} from './ownProgram';

/**
 * A program lead's own program, read from the database instead of remembered
 * by the tab (D-447; before-launch "Load a program lead's own program").
 *
 * - `idle`     — not asked: anyone but a signed-in program lead, or a demo
 *                account, which shows the example program (D-172).
 * - `loading`  — asking.
 * - `none`     — the lead has no program yet: the Program tab is Add a program.
 * - `ready`    — their program, waiting for review or live.
 * - `error`    — could not ask; the screens fall back to what this tab knows.
 *
 * One store for the page, so Home, the Program tab and the review page do not
 * each ask: a lead's program is one row, read once and again after a send or
 * a save.
 */
export type OwnProgramState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'none' }
  | { readonly status: 'ready'; readonly program: OwnProgram }
  | { readonly status: 'error' };

const IDLE: OwnProgramState = { status: 'idle' };
const LOADING: OwnProgramState = { status: 'loading' };

let store: { userId: string | null; state: OwnProgramState } = { userId: null, state: IDLE };
const listeners = new Set<() => void>();
let loadId = 0;

function publish(userId: string | null, state: OwnProgramState): void {
  store = { userId, state };
  listeners.forEach((listener) => listener());
}

async function load(userId: string): Promise<void> {
  const mine = ++loadId;
  // Keep showing the last answer while asking again, so a save does not flash
  // the screen back to a spinner.
  if (store.userId !== userId || store.state.status === 'idle' || store.state.status === 'error') {
    publish(userId, LOADING);
  }
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (mine !== loadId) return;
    const orgId = (profile as { org_id: string | null } | null)?.org_id ?? null;
    if (orgId === null) {
      publish(userId, { status: 'none' });
      return;
    }
    // Only a program that is on the list or waiting to be: a first send that
    // was deleted (withdrawn) is deactivated and is the lead's no longer.
    const { data, error } = await supabase
      .from('services')
      .select(OWN_PROGRAM_COLUMNS)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    if (mine !== loadId) return;
    const row = ((data ?? []) as OwnProgramRow[])[0];
    if (!row) {
      publish(userId, { status: 'none' });
      return;
    }
    // What is waiting for Pam on it: the first check, or a change to a live
    // program (D-462). A program that predates the review record has none.
    const { data: waiting, error: waitingError } = await supabase
      .from('program_submissions')
      .select(SUBMISSION_COLUMNS)
      .eq('service_id', row.id)
      .in('status', ['in_review', 'changes_asked'])
      .order('sent_at', { ascending: false });
    if (waitingError) throw waitingError;
    if (mine !== loadId) return;
    publish(userId, { status: 'ready', program: programFromRow(row, (waiting ?? []) as SubmissionRow[]) });
  } catch {
    if (mine === loadId) publish(userId, { status: 'error' });
  }
}

/** Ask again — after a send or a save, or when something else may have changed it. */
export function refreshOwnProgram(): Promise<void> {
  return store.userId === null ? Promise.resolve() : load(store.userId);
}

/**
 * Send a program for review (`submit_program`, 20261010042108): the lead's
 * organisation is made if they have none, and the listing waits for Pam.
 * Resolves false when it could not be saved; nothing is shown as sent then.
 */
export async function submitOwnProgram(details: ProgramDetails): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('submit_program', submitArguments(details));
    if (error) return false;
    await refreshOwnProgram();
    return true;
  } catch {
    return false;
  }
}

/**
 * Correct a program and send it again (`resend_program_submission`,
 * 20261010135742): "Edit and send again" after Pam asked for changes, or a
 * correction while it waits. The same submission goes back to review. Resolves
 * false when it could not be saved.
 */
export async function resendOwnProgram(submissionId: string, details: ProgramDetails): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('resend_program_submission', resendArguments(submissionId, details));
    if (error) return false;
    await refreshOwnProgram();
    return true;
  } catch {
    return false;
  }
}

/**
 * Save an edit of the lead's own program (D-447). The description, phone and
 * website of a live program apply at once; a changed name or address is not
 * written to the live listing but asked of Pam (`request_program_change`), and
 * waits beside it. A program still being checked changes in place.
 */
export async function saveOwnProgram(program: OwnProgram, draft: EditableProgram): Promise<boolean> {
  // A program still being checked is corrected through its submission, so the
  // record Pam reads says the same as the listing (and a request for changes is
  // answered by saving).
  if (!program.isLive && program.submissionId !== null) {
    return resendOwnProgram(program.submissionId, {
      ...program.details,
      name: draft.name,
      category: draft.category,
      description: draft.description,
      address: draft.address,
      phone: draft.phone,
      website: draft.website,
    });
  }
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { error } = await supabase.from('services').update(editColumns(draft, program.isLive)).eq('id', program.id);
    if (error) return false;
    const change = program.isLive ? changeRequest(program, draft) : null;
    if (change) {
      const { error: changeError } = await supabase.rpc('request_program_change', {
        p_service_id: program.id,
        p_name: change.name,
        p_category: change.category,
        p_subcategory: change.subcategory,
        p_address: change.address,
      });
      if (changeError) {
        await refreshOwnProgram();
        return false;
      }
    }
    await refreshOwnProgram();
    return true;
  } catch {
    return false;
  }
}

/**
 * Take back what is waiting for Pam: "Delete and start over" on a first send
 * (D-385), or "Cancel these changes" on a live program's (D-447). The record is
 * kept; a first listing is taken off so it can never go live late.
 */
export async function withdrawSubmission(submissionId: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('withdraw_program_submission', { p_id: submissionId });
    if (error) return false;
    await refreshOwnProgram();
    return true;
  } catch {
    return false;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Whether this session asks the database at all: a signed-in program lead who
 * is not a demo account. Everyone else keeps the example or the empty state.
 */
export function asksForOwnProgram(session: SessionState): string | null {
  if (session.status !== 'signed-in') return null;
  if (session.session.role !== 'provider' || session.session.isDemo) return null;
  return session.session.userId;
}

export function useOwnProgram(session: SessionState): OwnProgramState {
  const userId = asksForOwnProgram(session);
  const snapshot = useSyncExternalStore(
    subscribe,
    () => store,
    () => store,
  );
  useEffect(() => {
    if (userId !== null && (store.userId !== userId || store.state.status === 'idle')) void load(userId);
  }, [userId]);
  if (userId === null) return IDLE;
  return snapshot.userId === userId ? snapshot.state : LOADING;
}
