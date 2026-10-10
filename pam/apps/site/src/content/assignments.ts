/**
 * Case manager assignments — who can do what.
 *
 * The rules come from Will's table (9 October 2026). Two cells there pointed at
 * numbered open questions from the conversation they were drafted in; a reader
 * of the public site was not in it, so those pointers are gone and each
 * sentence stands on its own.
 *
 * `answer` is the Yes / No a reader scans for; `note` is everything after it.
 * A cell with only a note ("Same") has no yes or no to give.
 *
 * `live` says whether Pam can do it today. The public post describes only what is
 * live (10 October, Will via Mira: nothing promised that members or staff cannot do
 * yet), so every row here is **held** (`live: false`) until its screen ships: taking
 * on, handing over, unassigning and the Unassigned filter (the Accounts & invites
 * assign-and-limit work), and limiting, pausing and turning back on (the RPC exists,
 * no screen calls it: STATUS "How a case manager limits or pauses someone"). When a
 * row ships, flip its flag; `AssignmentsTable` shows the live rows and the post
 * renders it once any are live.
 */
export interface Cell {
  readonly answer?: 'Yes' | 'No';
  readonly note?: string;
}

export interface AssignmentRow {
  readonly action: string;
  /** Pam can do this today. Held rows are not shown on the public site. */
  readonly live: boolean;
  readonly caseManager: Cell;
  readonly superAdmin: Cell;
}

export const ASSIGNMENT_ROWS: readonly AssignmentRow[] = [
  {
    action: 'Take on an unassigned member',
    live: false,
    caseManager: { answer: 'No', note: 'They can’t see who is unassigned.' },
    superAdmin: { answer: 'Yes', note: 'Assigns any member to any case manager.' },
  },
  {
    action: 'Hand a member over',
    live: false,
    caseManager: { answer: 'Yes', note: 'Their own members, to another case manager.' },
    superAdmin: { answer: 'Yes', note: 'Anyone.' },
  },
  {
    action: 'Unassign a member',
    live: false,
    caseManager: { answer: 'No' },
    superAdmin: { answer: 'Yes' },
  },
  {
    action: 'See who is unassigned',
    live: false,
    caseManager: { answer: 'No' },
    superAdmin: { answer: 'Yes', note: 'An “Unassigned” filter on Everyone.' },
  },
  {
    action: 'Limit or pause',
    live: false,
    caseManager: { note: 'Their own members only.' },
    superAdmin: { note: 'Anyone.' },
  },
  {
    action: 'Undo',
    live: false,
    caseManager: { note: '“Turn back on”, on the same screen.' },
    superAdmin: { note: 'Same.' },
  },
  {
    action: 'Reason',
    live: false,
    caseManager: {
      note: 'Required for every change and kept in the audit log. Our privacy policy promises it: “They have to write down why.”',
    },
    superAdmin: { note: 'Same.' },
  },
];

/** What the public post shows: only what Pam can do today. */
export const LIVE_ASSIGNMENT_ROWS: readonly AssignmentRow[] = ASSIGNMENT_ROWS.filter((r) => r.live);
