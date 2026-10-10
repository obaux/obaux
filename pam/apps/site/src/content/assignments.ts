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
 */
export interface Cell {
  readonly answer?: 'Yes' | 'No';
  readonly note?: string;
}

export interface AssignmentRow {
  readonly action: string;
  readonly caseManager: Cell;
  readonly superAdmin: Cell;
}

export const ASSIGNMENT_ROWS: readonly AssignmentRow[] = [
  {
    action: 'Take on an unassigned member',
    caseManager: { answer: 'No', note: 'They can’t see who is unassigned.' },
    superAdmin: { answer: 'Yes', note: 'Assigns any member to any case manager.' },
  },
  {
    action: 'Hand a member over',
    caseManager: { answer: 'Yes', note: 'Their own members, to another case manager.' },
    superAdmin: { answer: 'Yes', note: 'Anyone.' },
  },
  {
    action: 'Unassign a member',
    caseManager: { answer: 'No' },
    superAdmin: { answer: 'Yes' },
  },
  {
    action: 'See who is unassigned',
    caseManager: { answer: 'No' },
    superAdmin: { answer: 'Yes', note: 'An “Unassigned” filter on Everyone.' },
  },
  {
    action: 'Limit or pause',
    caseManager: { note: 'Their own members only.' },
    superAdmin: { note: 'Anyone.' },
  },
  {
    action: 'Undo',
    caseManager: { note: '“Turn back on”, on the same screen.' },
    superAdmin: { note: 'Same.' },
  },
  {
    action: 'Reason',
    caseManager: {
      note: 'Required for every change and kept in the audit log. Our privacy policy promises it: “They have to write down why.”',
    },
    superAdmin: { note: 'Same.' },
  },
];
