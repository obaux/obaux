import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { MessagesIcon, Page, PeopleIcon, PlacesIcon, ShieldIcon, GlobeIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { MenuList } from '@pam/ui/MenuList';
import { SegmentedControl } from '@astryxdesign/core/SegmentedControl';
import { Segment } from '@pam/ui/Segment';
import { ListItem, List } from '@astryxdesign/core/List';
import { Avatar } from '@astryxdesign/core/Avatar';
import { useI18n } from '@/lib/i18n';
import { MessagesView, type MessageRow } from '../../../screens/MessagesView';
import { ThreadView } from '../../../app/messages/ThreadView';
import { ThreadFrame, ThreadHeader, ThreadIntro, ThreadTop } from '../../../app/messages/ThreadFrame';
import { NewMessagePicker } from '../../../app/messages/NewMessagePicker';
import { HeaderActions } from '../../shell/HeaderActions';
import { asRedesign } from '../../journeys/journey';
import { screen } from '../screen';

/**
 * DRAWINGS for card "Message Pam" (Will, 18 October: anyone in the app can message Pam, which goes to the super admin's inbox; the
 * super admin can message members and programs). Nico's plan (claude/messages-plan-message-pam @ bfeead66) is the source. NOTHING
 * HERE SHIPS: the words are placeholders for Sage (the Arabic are stand-ins until Lena's), the data is pretend, the buttons do
 * nothing, and where Ava's inbox plan puts the super admin's inbox is a guess (a Home row that opens a list).
 *
 * Pam is drawn as a mark, never a face, so it is not taken for a person: the app's own icon (a white P on Pam's green) as the
 * avatar, on the Messages row and at the head of the thread.
 */
const meta = { title: 'Design/Message Pam (plan)', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const PAM_MARK = '/icon-192.png';

const WORDS = {
  en: {
    pam: 'Pam',
    writeToPam: 'Write to Pam',
    // The pinned lines (plan, section 4): who reads it, and not for emergencies. Sage's.
    reads: 'The Pam team reads what you write here.',
    emergency: 'For an emergency, call 911. In a crisis, call or text 988.',
    placeholder: 'Write to Pam',
    mine1: "I can't get my code to come through to my phone.",
    pam1: 'Thanks, Marcus. We have sent a new code. Tell us if it still does not arrive.',
    pamRow: 'We have sent a new code. Tell us if it still…',
    caseManager: 'Dana',
    cmContext: 'Case manager',
    cmLine: 'See you Thursday at 10.',
    program: 'Fresh Start Kitchen',
    programLine: 'Program',
    programPreview: 'Your visit is confirmed for Friday.',
    emptyBody: 'Write to Pam. A person at Pam reads every message.',
    when1: 'Today',
    when2: 'Tue',
    when3: 'Oct 12',
    inboxTitle: 'Pam inbox',
    waiting: 'Waiting',
    closed: 'Closed',
    waitingFor: 'Waiting for a reply',
    answered: 'Answered',
    member: 'Member',
    lead: 'Program lead',
    ask1: "I can't get my code to come through…",
    ask2: 'How do I change my city?',
    ask3: 'Our program page has the wrong hours.',
    ask4: 'Thank you, that fixed it.',
    close: 'Close conversation',
    reopen: 'Reopen',
    replyAs: 'Reply as Pam',
    sees: 'Marcus sees your reply as from Pam.',
    seesNew: 'Aaliyah will see this as from Pam.',
    newTitle: 'New message',
    home: 'Requests',
    programsToCheck: 'Programs to check',
    reported: 'Reported places',
    waitingCities: 'Cities people are waiting for',
    people: 'Everyone',
    memberA: 'Aaliyah',
    memberB: 'Marcus',
    programA: 'Fresh Start Kitchen',
    programB: 'Learning Center',
    ctxMember: 'Member',
    ctxProgram: 'Program',
    helpContact: 'Contact Pam',
    helpContactLine: 'Opens a conversation with the Pam team.',
    help: 'Help',
    helpIntro: 'Find an answer, or write to the Pam team.',
    topics: 'What Pam can help with',
    safety: 'Your safety',
  },
  ar: {
    pam: 'Pam',
    writeToPam: 'اكتب إلى Pam',
    reads: 'يقرأ فريق Pam ما تكتبه هنا.',
    emergency: 'في حالة الطوارئ اتصل بـ 911. في أزمة اتصل أو أرسل رسالة إلى 988.',
    placeholder: 'اكتب إلى Pam',
    mine1: 'لا يصلني رمز الدخول على هاتفي.',
    pam1: 'شكرًا يا ماركوس. أرسلنا رمزًا جديدًا. أخبرنا إن لم يصل.',
    pamRow: 'أرسلنا رمزًا جديدًا. أخبرنا إن لم…',
    caseManager: 'دانا',
    cmContext: 'مدير الحالة',
    cmLine: 'نراك الخميس في العاشرة.',
    program: 'Fresh Start Kitchen',
    programLine: 'برنامج',
    programPreview: 'تم تأكيد زيارتك يوم الجمعة.',
    emptyBody: 'اكتب إلى Pam. يقرأ شخص في Pam كل رسالة.',
    when1: 'اليوم',
    when2: 'الثلاثاء',
    when3: '12 أكتوبر',
    inboxTitle: 'صندوق Pam',
    waiting: 'بانتظار الرد',
    closed: 'مغلقة',
    waitingFor: 'بانتظار الرد',
    answered: 'تم الرد',
    member: 'عضو',
    lead: 'قائد برنامج',
    ask1: 'لا يصلني رمز الدخول…',
    ask2: 'كيف أغيّر مدينتي؟',
    ask3: 'صفحة برنامجنا فيها ساعات خاطئة.',
    ask4: 'شكرًا، تم الحل.',
    close: 'أغلق المحادثة',
    reopen: 'أعد الفتح',
    replyAs: 'رُدّ باسم Pam',
    sees: 'سيرى ماركوس ردك على أنه من Pam.',
    seesNew: 'ستصل رسالتك إلى عالية على أنها من Pam.',
    newTitle: 'رسالة جديدة',
    home: 'الطلبات',
    programsToCheck: 'برامج للمراجعة',
    reported: 'أماكن تم الإبلاغ عنها',
    waitingCities: 'مدن ينتظرها الناس',
    people: 'الجميع',
    memberA: 'عالية',
    memberB: 'ماركوس',
    programA: 'Fresh Start Kitchen',
    programB: 'Learning Center',
    ctxMember: 'عضو',
    ctxProgram: 'برنامج',
    helpContact: 'تواصل مع Pam',
    helpContactLine: 'يفتح محادثة مع فريق Pam.',
    help: 'مساعدة',
    helpIntro: 'ابحث عن إجابة، أو اكتب إلى فريق Pam.',
    topics: 'بماذا يساعد Pam',
    safety: 'سلامتك',
  },
};
const useWords = () => (useI18n().locale === 'ar' ? WORDS.ar : WORDS.en);

const styles = stylex.create({
  // The two lines above the composer: who reads, and not for emergencies. Quiet, 15px, in the page's gutter.
  pinned: {
    position: 'fixed',
    insetInline: 0,
    zIndex: 5,
    paddingInline: '20px',
    paddingBlock: '8px',
    backgroundColor: colorVars['--color-background-card'],
  },
  pinnedText: { fontSize: '15px', lineHeight: 1.4, color: colorVars['--color-text-secondary'] },
  closeBar: { paddingInline: '4px' },
  helpIntro: { fontSize: '18px', lineHeight: 1.5 },
  inboxName: { fontSize: '19px', fontWeight: 500 },
  inboxNameWaiting: { fontSize: '19px', fontWeight: 700 },
  inboxCtx: { fontSize: '15px' },
  inboxLine: { fontSize: '17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', unicodeBidi: 'plaintext' },
  inboxWhen: { fontSize: '14px' },
});

/** The row for Pam, always first: the app's mark, "Pam", and a line. */
const pamRow = (w: ReturnType<typeof useWords>, opts: { readonly unread?: boolean; readonly fresh?: boolean }): MessageRow => ({
  id: 'pam',
  name: w.pam,
  context: opts.fresh ? w.writeToPam : null,
  preview: opts.fresh ? w.writeToPam : w.pamRow,
  when: opts.fresh ? null : w.when1,
  unread: opts.unread ?? false,
  href: '/messages/thread/?pam=1',
  photoUrl: PAM_MARK,
});

function MemberMessages({ fresh, withOthers }: { readonly fresh: boolean; readonly withOthers: boolean }) {
  const w = useWords();
  const rows: MessageRow[] = [
    pamRow(w, { fresh, unread: !fresh }),
    ...(withOthers
      ? [
          { id: 'cm', name: w.caseManager, context: w.cmContext, preview: w.cmLine, when: w.when2, unread: false, href: '/messages/thread/?id=cm' },
          { id: 'prog', name: w.program, context: w.programLine, preview: w.programPreview, when: w.when3, unread: false, href: '/messages/thread/?id=prog' },
        ]
      : []),
  ];
  return <MessagesView rows={rows} emptyBody={w.emptyBody} headerActions={<HeaderActions />} />;
}

/** The thread's pinned lines, drawn just above the composer (the real build would give ThreadView a slot for them: Nico's). */
function PinnedLines({ lines }: { readonly lines: readonly string[] }) {
  const [bottom, setBottom] = useState(120);
  useEffect(() => {
    const place = () => {
      const box = document.querySelector('.astryx-chat-composer');
      if (!box) return;
      // Just above the composer's rounded box.
      const top = box.getBoundingClientRect().top - 4;
      setBottom(Math.max(0, window.innerHeight - top));
    };
    place();
    const id = window.setInterval(place, 400);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div {...stylex.props(styles.pinned)} style={{ bottom }}>
      <VStack gap={0}>
        {lines.map((line) => (
          <Text key={line} xstyle={styles.pinnedText}>
            {line}
          </Text>
        ))}
      </VStack>
    </div>
  );
}

const NOW = new Date();
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

function PamThread({ empty }: { readonly empty: boolean }) {
  const w = useWords();
  const { locale } = useI18n();
  return (
    <ThreadFrame>
      <ThreadTop>
        {/* No ⋯: a Pam conversation has no Report and no Block (plan, section 4). */}
        <ThreadHeader name={w.pam} backHref="/messages/" backLabel={w.pam} />
      </ThreadTop>
      <ThreadView
        messages={empty ? [] : [
          { id: 'm1', body: w.mine1, createdAt: minutesAgo(190), mine: true },
          { id: 'm2', body: w.pam1, createdAt: minutesAgo(40), mine: false },
        ]}
        otherName={w.pam}
        otherPhotoUrl={PAM_MARK}
        intro={<ThreadIntro name={w.pam} photoUrl={PAM_MARK} context={null} />}
        onSend={async () => true}
        sending={false}
        sendFailed={false}
        speechLanguage={locale === 'ar' ? 'ar' : 'en-US'}
      />
      <PinnedLines lines={[w.reads, w.emergency]} />
    </ThreadFrame>
  );
}

/** Messages for a member who has nobody else: Pam is the one row, and the tab shows for everyone. */
export const M1_MessagesOnlyPam: Story = { ...asRedesign('member', '/messages/'), render: () => <MemberMessages fresh withOthers={false} /> };
/** Once Pam has written back, with a case manager and a program in the list too. */
export const M1b_MessagesWithOthers: Story = { ...asRedesign('member', '/messages/'), render: () => <MemberMessages fresh={false} withOthers /> };
/** The conversation: what the person wrote, Pam's reply "from Pam", the two pinned lines above the box. */
export const M2_PamThread: Story = { ...asRedesign('member', '/messages/thread/'), render: () => <PamThread empty={false} /> };
/** What "Contact Pam" opens the first time: an empty thread with the pinned lines, ready to write. */
export const M3_ContactPamOpens: Story = { ...asRedesign('member', '/messages/thread/'), render: () => <PamThread empty /> };

function HelpWithPam() {
  const w = useWords();
  return (
    <Page gap={4}>
      <LargeTitleHeader title={w.help} actions={<HeaderActions />} />
      <Text type="supporting" xstyle={styles.helpIntro}>
        {w.helpIntro}
      </Text>
      <MenuList
        label={w.help}
        items={[
          // The same first row as today (D-512); signed in, it now opens the Pam conversation instead of the website.
          { id: 'contact', label: w.helpContact, description: w.helpContactLine, href: '/messages/thread/?pam=1', icon: <MessagesIcon width={26} height={26} aria-hidden /> },
          { id: 'topics', label: w.topics, href: '/help/topics/', icon: <PlacesIcon width={26} height={26} aria-hidden /> },
          { id: 'safety', label: w.safety, href: '/help/safety/', icon: <ShieldIcon width={26} height={26} aria-hidden /> },
        ]}
      />
    </Page>
  );
}
/** Help: Contact Pam is the first row, and now opens the conversation. */
export const M3a_HelpContactPam: Story = { ...asRedesign('member', '/help/'), render: () => <HelpWithPam /> };

function SuperAdminHome() {
  const w = useWords();
  const icon = { width: 26, height: 26, 'aria-hidden': true } as const;
  return (
    <Page gap={4}>
      <LargeTitleHeader title={w.home} actions={<HeaderActions role="super_admin" />} />
      <MenuList
        label={w.home}
        items={[
          // A plain number (D-586): the conversations waiting for a reply. The red badge is for what is new since last looked.
          { id: 'pam', label: w.inboxTitle, href: '/pam-inbox/', icon: <MessagesIcon {...icon} />, value: '3' },
          { id: 'programs-to-check', label: w.programsToCheck, href: '/programs/review/?from=home', icon: <PlacesIcon {...icon} />, value: '4' },
          { id: 'reported-places', label: w.reported, href: '/places/reported/', icon: <ShieldIcon {...icon} />, value: '2' },
          { id: 'waiting-cities', label: w.waitingCities, href: '/cities/waiting/?from=home', icon: <GlobeIcon {...icon} />, value: '12' },
        ]}
      />
    </Page>
  );
}
/** The super admin's Home, with a Pam inbox row first and its waiting count. */
export const M4_SuperAdminHome: Story = { ...asRedesign('super-admin', '/'), render: () => <SuperAdminHome /> };

function Inbox({ closed }: { readonly closed: boolean }) {
  const w = useWords();
  const rows = closed
    ? [{ name: w.memberB, ctx: w.member, line: w.ask4, when: w.when3, waiting: false }]
    : [
        { name: w.memberB, ctx: w.member, line: w.ask1, when: w.when1, waiting: true },
        { name: w.memberA, ctx: w.member, line: w.ask2, when: w.when2, waiting: true },
        { name: 'Lou', ctx: `${w.lead} · ${w.program}`, line: w.ask3, when: w.when2, waiting: true },
      ];
  return (
    <Page gap={3}>
      <LargeTitleHeader title={w.inboxTitle} actions={<HeaderActions role="super_admin" />} />
      <SegmentedControl label={w.inboxTitle} value={closed ? 'closed' : 'waiting'} onChange={() => {}} layout="fill">
        <Segment value="waiting" label={w.waiting} />
        <Segment value="closed" label={w.closed} />
      </SegmentedControl>
      <List>
        {rows.map((r) => (
          <ListItem
            key={r.name}
            href="/messages/thread/?pam=1"
            startContent={<Avatar size="lg" name={r.name} tooltip={false} alt="" />}
            label={<Text dir="auto" xstyle={r.waiting ? styles.inboxNameWaiting : styles.inboxName}>{r.name}</Text>}
            description={
              <VStack gap={0}>
                <Text type="supporting" xstyle={styles.inboxCtx}>{r.ctx}</Text>
                <Text dir="auto" type="supporting" xstyle={styles.inboxLine}>{r.line}</Text>
              </VStack>
            }
            endContent={<Text type="supporting" xstyle={styles.inboxWhen}>{r.when}</Text>}
          />
        ))}
      </List>
    </Page>
  );
}
/** The inbox: one row per person, first name and role (and the program for a lead), waiting for a reply first. */
export const M5_Inbox: Story = { ...asRedesign('super-admin', '/messages/'), render: () => <Inbox closed={false} /> };
export const M5b_InboxClosed: Story = { ...asRedesign('super-admin', '/messages/'), render: () => <Inbox closed /> };

function SuperAdminThread({ fresh }: { readonly fresh: boolean }) {
  const w = useWords();
  const { locale } = useI18n();
  const name = fresh ? w.memberA : w.memberB;
  return (
    <ThreadFrame>
      <ThreadTop>
        <ThreadHeader name={name} backHref="/messages/" backLabel={w.inboxTitle} />
      </ThreadTop>
      <ThreadView
        messages={fresh ? [] : [
          { id: 'm1', body: w.mine1, createdAt: minutesAgo(190), mine: false },
        ]}
        otherName={name}
        intro={
          <ThreadIntro name={name} context={w.member}>
            {fresh ? null : (
              <HStack gap={2} xstyle={styles.closeBar}>
                <Button label={w.close} variant="secondary" />
              </HStack>
            )}
          </ThreadIntro>
        }
        onSend={async () => true}
        sending={false}
        sendFailed={false}
        speechLanguage={locale === 'ar' ? 'ar' : 'en-US'}
      />
      <PinnedLines lines={[fresh ? w.seesNew : w.sees]} />
    </ThreadFrame>
  );
}
/** A super admin answering: the asker's first name and role, Close, and a line saying the reply goes out as Pam. */
export const M6_SuperAdminThread: Story = { ...asRedesign('super-admin', '/messages/thread/'), render: () => <SuperAdminThread fresh={false} /> };
/** The same, starting a new conversation with a member (nothing written yet). */
export const M6b_SuperAdminStartsOne: Story = { ...asRedesign('super-admin', '/messages/thread/'), render: () => <SuperAdminThread fresh /> };

function StartPicker() {
  const w = useWords();
  return (
    <>
      <Inbox closed={false} />
      <NewMessagePicker
        isOpen
        onOpenChange={() => {}}
        people={[
          { id: 'a', name: w.memberA, context: w.ctxMember },
          { id: 'b', name: w.memberB, context: w.ctxMember },
          { id: 'p1', name: w.programA, context: w.ctxProgram },
          { id: 'p2', name: w.programB, context: w.ctxProgram },
        ]}
        onPick={async () => null}
      />
    </>
  );
}
/** Starting a conversation: pick any member or any program (the existing New message sheet, with members and programs in it). */
export const M7_StartPicker: Story = { ...asRedesign('super-admin', '/messages/'), render: () => <StartPicker /> };

// `screen` and `PeopleIcon` are kept for the next round of drawings (the inbox's place in Ava's plan).
void screen;
void PeopleIcon;

const arabic = { globals: { locale: 'ar' } } as const;
export const M1_MessagesOnlyPam_Arabic: Story = { ...M1_MessagesOnlyPam, ...arabic };
export const M1b_MessagesWithOthers_Arabic: Story = { ...M1b_MessagesWithOthers, ...arabic };
export const M2_PamThread_Arabic: Story = { ...M2_PamThread, ...arabic };
export const M3_ContactPamOpens_Arabic: Story = { ...M3_ContactPamOpens, ...arabic };
export const M3a_HelpContactPam_Arabic: Story = { ...M3a_HelpContactPam, ...arabic };
export const M4_SuperAdminHome_Arabic: Story = { ...M4_SuperAdminHome, ...arabic };
export const M5_Inbox_Arabic: Story = { ...M5_Inbox, ...arabic };
export const M6_SuperAdminThread_Arabic: Story = { ...M6_SuperAdminThread, ...arabic };
export const M7_StartPicker_Arabic: Story = { ...M7_StartPicker, ...arabic };
