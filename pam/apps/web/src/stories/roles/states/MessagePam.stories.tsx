import { useEffect, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { GlobeIcon, MessagesIcon, Page, PlacesIcon, ShieldIcon, HelpIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { MessagesView, type MessageRow } from '../../../screens/MessagesView';
import { ThreadView } from '../../../app/messages/ThreadView';
import { ThreadFrame, ThreadHeader, ThreadIntro, ThreadTop } from '../../../app/messages/ThreadFrame';
import { HeaderActions } from '../../shell/HeaderActions';
import { asRedesign } from '../../journeys/journey';

/**
 * DRAWINGS for card "Message Pam" (Will, 18 October: anyone in the app can message Pam, which goes to the super admin's inbox; the
 * super admin can message programs and members). Two versions, so Will can choose (Mira, 02:52):
 *   A. Iris's smallest v1: "Write to Pam" under Help's answers; the person writes first; no Pam row in Messages until they do; the
 *      super admin answers, and does not start a conversation with a member.
 *   B. Nico's plan: Pam in everyone's Messages from the start, and the super admin can start a conversation with a member or a program.
 * Both get the fixed card at the top of the thread (Sage's draft, ledger d9174a60: unsigned) and the super admin's inbox from Ava's plan
 * (claude/pam-message-pam-admin-plan @ c50f0f8f): a Home row with a plain count, "Messages to Pam" grouped Waiting for Pam (longest
 * first, with the wait), Answered, Closed.
 * NOTHING HERE SHIPS: the words are Sage's drafts (the Arabic are stand-ins until Lena's), the data is pretend, the buttons do nothing.
 * Pam is a mark, never a face: the app's own icon (a white P on Pam's green) is the avatar, so nobody takes it for a person.
 */
const meta = { title: 'Design/Message Pam (plan)', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const PAM_MARK = '/icon-192.png';

const WORDS = {
  en: {
    pam: 'Pam',
    // Sage's drafts (ledger d9174a60).
    cardTitle: 'Write to Pam',
    p1: 'A person on the Pam team reads every message and writes back here. Nobody watches messages as they come in, so an answer can take a while.',
    p2: 'In danger? Call 911. In crisis? Call or text 988. Someone answers day and night.',
    p3: "Pam can help with the app, finding a place, a visit, or reaching your guide. We can't give legal advice, but we can tell you where to find free legal help.",
    p4: "Only the Pam team reads this conversation. Your guide and your programs don't see it.",
    auto: "We got your message. A person on the Pam team will read it and answer here. We don't watch messages as they come in. In danger? Call 911. In crisis? Call or text 988.",
    autoLabel: 'Automatic reply',
    composerPlaceholder: 'Write to Pam',
    helpRow: 'Write to Pam',
    helpHint: 'A person on the Pam team reads it.',
    rowLine: 'Write to Pam',
    started: 'Pam started this conversation.',
    // Stand-in words.
    mine1: "I can't get my code to come through to my phone.",
    pam1: 'Thanks, Marcus. We have sent a new code. Tell us if it still does not arrive.',
    pamStart: 'Hello Aaliyah. We are checking that everyone can sign in. Is the app working for you?',
    pamRowLine: 'We have sent a new code. Tell us if it still…',
    when1: 'Today',
    when2: 'Tue',
    caseManager: 'Dana',
    cmContext: 'Case manager',
    cmLine: 'See you Thursday at 10.',
    program: 'Fresh Start Kitchen',
    programContext: 'Program',
    programLine: 'Your visit is confirmed for Friday.',
    emptyBody: 'Once your case manager or your program messages you, it will show up here.',
    help: 'Help',
    helpIntro: 'Find an answer first. If you are still stuck, write to Pam.',
    topics: 'What Pam can help with',
    safety: 'Your safety',
    place: 'Report a place',
    home: 'Requests',
    inboxRow: 'Messages to Pam',
    programsToCheck: 'Programs to check',
    reported: 'Reported places',
    waitingCities: 'Cities people are waiting for',
    inboxTitle: 'Messages to Pam',
    gWaiting: 'Waiting for Pam',
    gAnswered: 'Answered',
    gClosed: 'Closed',
    closedRow: 'Closed conversations',
    wait: (n: string) => `Waiting ${n}`,
    w3h: '3 hours',
    w2d: '2 days',
    w20m: '20 minutes',
    ask1: "I can't get my code to come through…",
    ask2: 'How do I change my city?',
    ask3: 'Our program page has the wrong hours.',
    you: 'You: ',
    answered1: 'We have fixed your city.',
    memberIn: (city: string) => `Member · ${city}`,
    leadAt: (p: string) => `Program lead at ${p}`,
    statLine: 'Last 30 days: first reply in 5 hours on average',
    savedReplies: 'Saved replies',
    sees: 'Marcus sees your reply as from Pam.',
    seesNew: 'Aaliyah will see this as from Pam.',
    seesProgram: "This goes to each of the program's leads. They see it from Pam.",
    everyone: 'Everyone',
    messageAs: (n: string) => `Message ${n} as Pam`,
    messageProgram: 'Message this program',
    programWait: 'Waiting for Pam to check',
    memberA: 'Aaliyah',
    memberB: 'Marcus',
    lou: 'Lou',
    dana: 'Dana',
    member: 'Member',
    caseMgr: 'Case manager',
    leadLine: 'Program lead at Fresh Start Kitchen',
    city: 'Philadelphia',
  },
  ar: {
    pam: 'Pam',
    cardTitle: 'اكتب إلى Pam',
    p1: 'يقرأ شخص من فريق Pam كل رسالة ويرد هنا. لا أحد يراقب الرسائل لحظة وصولها، فقد يستغرق الرد وقتًا.',
    p2: 'في خطر؟ اتصل بـ 911. في أزمة؟ اتصل أو أرسل رسالة إلى 988. هناك من يجيب ليلًا ونهارًا.',
    p3: 'يمكن لـ Pam مساعدتك في التطبيق، وإيجاد مكان، وزيارة، أو التواصل مع مرشدك. لا نستطيع تقديم نصيحة قانونية، لكن نخبرك أين تجد مساعدة قانونية مجانية.',
    p4: 'فريق Pam فقط يقرأ هذه المحادثة. مرشدك وبرامجك لا يرونها.',
    auto: 'وصلتنا رسالتك. سيقرأها شخص من فريق Pam ويرد هنا. لا نراقب الرسائل لحظة وصولها. في خطر؟ اتصل بـ 911. في أزمة؟ اتصل أو أرسل رسالة إلى 988.',
    autoLabel: 'رد تلقائي',
    composerPlaceholder: 'اكتب إلى Pam',
    helpRow: 'اكتب إلى Pam',
    helpHint: 'يقرؤها شخص من فريق Pam.',
    rowLine: 'اكتب إلى Pam',
    started: 'بدأ Pam هذه المحادثة.',
    mine1: 'لا يصلني رمز الدخول على هاتفي.',
    pam1: 'شكرًا يا ماركوس. أرسلنا رمزًا جديدًا. أخبرنا إن لم يصل.',
    pamStart: 'مرحبًا عالية. نتأكد أن الجميع يستطيع الدخول. هل يعمل التطبيق معك؟',
    pamRowLine: 'أرسلنا رمزًا جديدًا. أخبرنا إن لم…',
    when1: 'اليوم',
    when2: 'الثلاثاء',
    caseManager: 'دانا',
    cmContext: 'مدير الحالة',
    cmLine: 'نراك الخميس في العاشرة.',
    program: 'Fresh Start Kitchen',
    programContext: 'برنامج',
    programLine: 'تم تأكيد زيارتك يوم الجمعة.',
    emptyBody: 'عندما يراسلك مدير حالتك أو برنامجك ستظهر الرسالة هنا.',
    help: 'مساعدة',
    helpIntro: 'ابحث عن إجابة أولًا. وإن بقيت عالقًا فاكتب إلى Pam.',
    topics: 'بماذا يساعد Pam',
    safety: 'سلامتك',
    place: 'أبلغ عن مكان',
    home: 'الطلبات',
    inboxRow: 'رسائل إلى Pam',
    programsToCheck: 'برامج للمراجعة',
    reported: 'أماكن تم الإبلاغ عنها',
    waitingCities: 'مدن ينتظرها الناس',
    inboxTitle: 'رسائل إلى Pam',
    gWaiting: 'بانتظار Pam',
    gAnswered: 'تم الرد',
    gClosed: 'مغلقة',
    closedRow: 'المحادثات المغلقة',
    wait: (n: string) => `بانتظار الرد منذ ${n}`,
    w3h: '3 ساعات',
    w2d: 'يومين',
    w20m: '20 دقيقة',
    ask1: 'لا يصلني رمز الدخول…',
    ask2: 'كيف أغيّر مدينتي؟',
    ask3: 'صفحة برنامجنا فيها ساعات خاطئة.',
    you: 'أنت: ',
    answered1: 'غيّرنا مدينتك.',
    memberIn: (city: string) => `عضو · ${city}`,
    leadAt: (p: string) => `قائد برنامج في ${p}`,
    statLine: 'آخر 30 يومًا: أول رد خلال 5 ساعات في المتوسط',
    savedReplies: 'ردود جاهزة',
    sees: 'سيرى ماركوس ردك على أنه من Pam.',
    seesNew: 'ستصل رسالتك إلى عالية على أنها من Pam.',
    seesProgram: 'تصل هذه الرسالة إلى كل قائد في البرنامج، ويرونها من Pam.',
    everyone: 'الجميع',
    messageAs: (n: string) => `راسل ${n} باسم Pam`,
    messageProgram: 'راسل هذا البرنامج',
    programWait: 'بانتظار مراجعة Pam',
    memberA: 'عالية',
    memberB: 'ماركوس',
    lou: 'لو',
    dana: 'دانا',
    member: 'عضو',
    caseMgr: 'مدير حالة',
    leadLine: 'قائد برنامج في Fresh Start Kitchen',
    city: 'فيلادلفيا',
  },
};
const useWords = () => (useI18n().locale === 'ar' ? WORDS.ar : WORDS.en);
type W = ReturnType<typeof useWords>;

const styles = stylex.create({
  card: { width: '100%', backgroundColor: colorVars['--color-background-muted'], borderColor: 'transparent' },
  cardTitle: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
  cardText: { fontSize: '16px', lineHeight: 1.45 },
  cardStrong: { fontSize: '16px', lineHeight: 1.45, fontWeight: 700 },
  note: {
    position: 'fixed',
    insetInline: 0,
    zIndex: 5,
    paddingInline: '20px',
    paddingBlock: '8px',
    backgroundColor: colorVars['--color-background-card'],
  },
  noteText: { fontSize: '15px', lineHeight: 1.4, color: colorVars['--color-text-secondary'] },
  helpIntro: { fontSize: '18px', lineHeight: 1.5 },
  name: { fontSize: '19px', fontWeight: 500 },
  nameWaiting: { fontSize: '19px', fontWeight: 700 },
  ctx: { fontSize: '15px' },
  waitLine: { fontSize: '15px', fontWeight: 700 },
  line: { fontSize: '17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', unicodeBidi: 'plaintext' },
  when: { fontSize: '14px' },
  group: { fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em', color: colorVars['--color-text-secondary'] },
  stat: { fontSize: '15px', color: colorVars['--color-text-secondary'] },
  full: { width: '100%', paddingInline: '12px' },
  bar: { paddingInline: '4px' },
});

const NOW = new Date();
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

/** The fixed card at the top of every Pam thread: what it is, who reads, 911 and 988 early, what Pam can't do, who sees it. */
function PamCard() {
  const w = useWords();
  return (
    <Card padding={4} xstyle={styles.card}>
      <VStack gap={3}>
        <Heading level={2} xstyle={styles.cardTitle}>
          {w.cardTitle}
        </Heading>
        <Text xstyle={styles.cardText}>{w.p1}</Text>
        {/* The line that must be readable without scrolling at 320 x 568 (Mira, 03:00): second, and in bold. */}
        <Text data-pam-danger="" xstyle={styles.cardStrong}>
          {w.p2}
        </Text>
        <Text xstyle={styles.cardText}>{w.p3}</Text>
        <Text xstyle={styles.cardText}>{w.p4}</Text>
      </VStack>
    </Card>
  );
}

/** A line of small print drawn just above the composer (the build gives ThreadView a slot; Nico's). */
function Above({ lines }: { readonly lines: readonly string[] }) {
  const [bottom, setBottom] = useState(120);
  useEffect(() => {
    const place = () => {
      const box = document.querySelector('.astryx-chat-composer');
      if (!box) return;
      setBottom(Math.max(0, window.innerHeight - (box.getBoundingClientRect().top - 4)));
    };
    place();
    const id = window.setInterval(place, 400);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div {...stylex.props(styles.note)} style={{ bottom }}>
      <VStack gap={0}>
        {lines.map((line) => (
          <Text key={line} xstyle={styles.noteText}>
            {line}
          </Text>
        ))}
      </VStack>
    </div>
  );
}

/**
 * The composer in a Pam thread (Mira, 03:16): the placeholder reads "Write to Pam"; no document button (Nico: no attachments in v1);
 * the photo button only in the version Will can choose (Iris allows screenshots); the microphone stays. ThreadView's composer is not
 * built for any of this yet, so the drawing rewrites it after it mounts: the build gives ThreadView these as props (Nico's).
 */
function PamComposer({ photo }: { readonly photo: boolean }) {
  const w = useWords();
  useEffect(() => {
    const apply = () => {
      const c = document.querySelector('.astryx-chat-composer');
      if (!c) return;
      const buttons = [...c.querySelectorAll<HTMLElement>('button.astryx-button')];
      // Speak, Add a photo, Add a document, Send.
      if (buttons.length >= 4) {
        if (!photo) buttons[1]!.style.display = 'none';
        buttons[2]!.style.display = 'none';
      }
      for (const el of c.querySelectorAll<HTMLElement>('div')) {
        if (el.children.length === 0 && /^(Write a message|اكتب رسالة)/.test(el.textContent ?? '')) el.textContent = w.composerPlaceholder;
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [photo, w.composerPlaceholder]);
  return null;
}

type Msg = { readonly id: string; readonly body: string; readonly createdAt: string; readonly mine: boolean };

/** A Pam thread as the person sees it: Pam's mark, the card at the top, the messages, the composer. */
function PersonThread({ messages, intro, photo = false }: { readonly messages: readonly Msg[]; readonly intro?: ReactNode; readonly photo?: boolean }) {
  const w = useWords();
  const { locale } = useI18n();
  return (
    <ThreadFrame>
      <ThreadTop>
        {/* No ⋯: a Pam conversation has no Report and no Block (Nico §4). */}
        <ThreadHeader name={w.pam} backHref="/messages/" backLabel={w.pam} />
      </ThreadTop>
      <ThreadView
        messages={messages}
        otherName={w.pam}
        otherPhotoUrl={PAM_MARK}
        intro={
          <VStack gap={3} xstyle={styles.full}>
            <PamCard />
            {intro}
          </VStack>
        }
        onSend={async () => true}
        sending={false}
        sendFailed={false}
        speechLanguage={locale === 'ar' ? 'ar' : 'en-US'}
      />
      <PamComposer photo={photo} />
    </ThreadFrame>
  );
}

/** The first view: nothing written yet, the card and the composer. */
function ThreadEmpty({ photo = false }: { readonly photo?: boolean }) {
  return <PersonThread messages={[]} photo={photo} />;
}

/** After the first message: the automatic reply, then a person's answer. */
function ThreadAfter() {
  const w = useWords();
  return (
    <PersonThread
      messages={[
        { id: 'm1', body: w.mine1, createdAt: minutesAgo(190), mine: true },
        { id: 'm2', body: `${w.autoLabel}\n${w.auto}`, createdAt: minutesAgo(189), mine: false },
        { id: 'm3', body: w.pam1, createdAt: minutesAgo(40), mine: false },
      ]}
    />
  );
}

/** Version B only: Pam wrote first, and says so. */
function ThreadPamStarted() {
  const w = useWords();
  return (
    <PersonThread
      messages={[{ id: 'm1', body: w.pamStart, createdAt: minutesAgo(30), mine: false }]}
      intro={
        <Text type="supporting" xstyle={styles.cardText}>
          {w.started}
        </Text>
      }
    />
  );
}

/** Help, answers first, then the way to write to Pam (both versions). */
function HelpWrite({ first = false }: { readonly first?: boolean }) {
  const w = useWords();
  const icon = { width: 26, height: 26, 'aria-hidden': true } as const;
  const answers = [
    { id: 'topics', label: w.topics, href: '/help/topics/', icon: <HelpIcon {...icon} /> },
    { id: 'safety', label: w.safety, href: '/help/safety/', icon: <ShieldIcon {...icon} /> },
    { id: 'place', label: w.place, href: '/help/report-place/', icon: <PlacesIcon {...icon} /> },
  ];
  const write = { id: 'write', label: w.helpRow, description: w.helpHint, href: '/messages/thread/?pam=1', icon: <MessagesIcon {...icon} /> };
  return (
    <Page gap={4}>
      <LargeTitleHeader title={w.help} actions={<HeaderActions />} />
      <Text type="supporting" xstyle={styles.helpIntro}>
        {w.helpIntro}
      </Text>
      <MenuList
        label={w.help}
        items={
          first
            ? [write, ...answers]
            : // Under the answers, never above them (Iris, A28): the help desk first, then a person.
              [...answers, write]
        }
      />
    </Page>
  );
}

const rowFor = (w: W, kind: 'fresh' | 'wrote'): MessageRow => ({
  id: 'pam',
  name: w.pam,
  context: kind === 'fresh' ? w.rowLine : null,
  preview: kind === 'fresh' ? w.rowLine : w.pamRowLine,
  when: kind === 'fresh' ? null : w.when1,
  unread: kind === 'wrote',
  href: '/messages/thread/?pam=1',
  photoUrl: PAM_MARK,
});

function MemberMessages({ kind }: { readonly kind: 'none' | 'fresh' | 'wrote' | 'wrote-others' }) {
  const w = useWords();
  const others: MessageRow[] = [
    { id: 'cm', name: w.caseManager, context: w.cmContext, preview: w.cmLine, when: w.when2, unread: false, href: '/messages/thread/?id=cm' },
    { id: 'prog', name: w.program, context: w.programContext, preview: w.programLine, when: w.when2, unread: false, href: '/messages/thread/?id=prog' },
  ];
  const rows: MessageRow[] =
    kind === 'none' ? [] : kind === 'fresh' ? [rowFor(w, 'fresh')] : kind === 'wrote' ? [rowFor(w, 'wrote')] : [rowFor(w, 'wrote'), ...others];
  return <MessagesView rows={rows} emptyBody={w.emptyBody} headerActions={<HeaderActions />} />;
}

function SuperAdminHome() {
  const w = useWords();
  const icon = { width: 26, height: 26, 'aria-hidden': true } as const;
  return (
    <Page gap={4}>
      <LargeTitleHeader title={w.home} actions={<HeaderActions role="super_admin" />} />
      <MenuList
        label={w.home}
        items={[
          // First, because it is the only row where a person is waiting on an answer from Pam (Ava §1). A plain number (D-586).
          { id: 'pam', label: w.inboxRow, href: '/pam/messages/?from=home', icon: <MessagesIcon {...icon} />, value: '3' },
          { id: 'programs-to-check', label: w.programsToCheck, href: '/programs/review/?from=home', icon: <PlacesIcon {...icon} />, value: '4' },
          { id: 'reported-places', label: w.reported, href: '/places/reported/', icon: <ShieldIcon {...icon} />, value: '2' },
          { id: 'waiting-cities', label: w.waitingCities, href: '/cities/waiting/?from=home', icon: <GlobeIcon {...icon} />, value: '12' },
        ]}
      />
    </Page>
  );
}

type InboxRow = { readonly name: string; readonly ctx: string; readonly wait?: string; readonly line: string; readonly when: string };

function InboxRows({ rows }: { readonly rows: readonly InboxRow[] }) {
  return (
    <List>
      {rows.map((r) => (
        <ListItem
          key={r.name}
          href="/messages/thread/?pam=1"
          startContent={<Avatar size="lg" name={r.name} tooltip={false} alt="" />}
          label={
            <Text dir="auto" xstyle={r.wait ? styles.nameWaiting : styles.name}>
              {r.name}
            </Text>
          }
          description={
            <VStack gap={0}>
              <Text type="supporting" xstyle={styles.ctx}>
                {r.ctx}
              </Text>
              {r.wait ? <Text xstyle={styles.waitLine}>{r.wait}</Text> : null}
              <Text dir="auto" type="supporting" xstyle={styles.line}>
                {r.line}
              </Text>
            </VStack>
          }
          endContent={
            <Text type="supporting" xstyle={styles.when}>
              {r.when}
            </Text>
          }
        />
      ))}
    </List>
  );
}

/** `/pam/messages/` (Ava §1): Waiting for Pam (longest first, with the wait), Answered, and Closed folded under a row. */
function Inbox({ empty }: { readonly empty?: boolean }) {
  const w = useWords();
  return (
    <SubPage title={w.inboxTitle} backHref="/?from=home" backLabel={w.home}>
      {empty ? null : (
        <>
          <Text xstyle={styles.group}>{w.gWaiting}</Text>
          <InboxRows
            rows={[
              { name: w.memberB, ctx: w.memberIn(w.city), wait: w.wait(w.w2d), line: w.ask1, when: w.when2 },
              { name: w.memberA, ctx: w.memberIn(w.city), wait: w.wait(w.w3h), line: w.ask2, when: w.when1 },
              { name: w.lou, ctx: w.leadAt(w.program), wait: w.wait(w.w20m), line: w.ask3, when: w.when1 },
            ]}
          />
          <Text xstyle={styles.group}>{w.gAnswered}</Text>
          <InboxRows rows={[{ name: w.dana, ctx: `${w.caseMgr} · ${w.city}`, line: `${w.you}${w.answered1}`, when: w.when2 }]} />
          <MenuList label={w.gClosed} items={[{ id: 'closed', label: w.closedRow, href: '/pam/messages/?show=closed', icon: <MessagesIcon width={26} height={26} aria-hidden />, value: '9' }]} />
          <Text xstyle={styles.stat}>{w.statLine}</Text>
        </>
      )}
    </SubPage>
  );
}

/** The super admin answering: the asker's first name and role (and the program for a lead), the ⋯ menu holds Close, saved replies above the composer. */
function AdminThread({ kind }: { readonly kind: 'answering' | 'new-member' | 'new-program' }) {
  const w = useWords();
  const { locale } = useI18n();
  const name = kind === 'answering' ? w.memberB : kind === 'new-member' ? w.memberA : w.program;
  const context = kind === 'new-program' ? w.programContext : w.member;
  return (
    <ThreadFrame>
      <ThreadTop>
        <ThreadHeader name={name} backHref="/pam/messages/" backLabel={w.inboxTitle} menuHref="/messages/thread/options/?pam=1" />
      </ThreadTop>
      <ThreadView
        messages={kind === 'answering' ? [{ id: 'm1', body: w.mine1, createdAt: minutesAgo(190), mine: false }] : []}
        otherName={name}
        intro={
          <ThreadIntro name={name} context={context}>
            {kind === 'answering' ? (
              <HStack gap={2} xstyle={styles.bar}>
                <Button label={w.savedReplies} variant="secondary" />
              </HStack>
            ) : null}
          </ThreadIntro>
        }
        onSend={async () => true}
        sending={false}
        sendFailed={false}
        speechLanguage={locale === 'ar' ? 'ar' : 'en-US'}
      />
      <Above lines={[kind === 'answering' ? w.sees : kind === 'new-member' ? w.seesNew : w.seesProgram]} />
    </ThreadFrame>
  );
}

/** Everyone: a message button on a person's row. Version A has none: the super admin only answers. */
function Everyone({ version }: { readonly version: 'A' | 'B' }) {
  const w = useWords();
  const people = [
    { name: w.memberA, ctx: w.member, member: true },
    { name: w.memberB, ctx: w.member, member: true },
    { name: w.dana, ctx: w.caseMgr, member: false },
    { name: w.lou, ctx: w.leadLine, member: false },
  ];
  return (
    <SubPage title={w.everyone} backHref="/profile/" backLabel={w.everyone}>
      <List>
        {people.map((p) => (
          <ListItem
            key={p.name}
            startContent={<Avatar size="lg" name={p.name} tooltip={false} alt="" />}
            label={<Text xstyle={styles.name}>{p.name}</Text>}
            description={
              <Text type="supporting" xstyle={styles.ctx}>
                {p.ctx}
              </Text>
            }
            endContent={
              version === 'A' ? undefined : (
                <IconButton label={w.messageAs(p.name)} variant="secondary" href="/messages/thread/?pam=1" icon={<MessagesIcon width={22} height={22} aria-hidden />} />
              )
            }
          />
        ))}
      </List>
    </SubPage>
  );
}

/** Version B: a program waiting for a check, with "Message this program". */
function ProgramPage() {
  const w = useWords();
  return (
    <SubPage title={w.program} backHref="/programs/review/?from=home" backLabel={w.programsToCheck}>
      <Text type="supporting" xstyle={styles.helpIntro}>
        {w.programWait}
      </Text>
      <Button label={w.messageProgram} variant="secondary" href="/messages/thread/?pam=1" icon={<MessagesIcon width={22} height={22} aria-hidden />} />
    </SubPage>
  );
}

const member = (path: string) => asRedesign('member', path);
const admin = (path: string) => asRedesign('super-admin', path);

// Both versions
/** The first view of a Pam thread: the card (who reads, 911 and 988, what Pam can't do, who sees it) and the composer. */
export const X1_ThreadEmpty: Story = { ...member('/messages/thread/'), render: () => <ThreadEmpty /> };
/** After the first message: the automatic reply (labelled), then a person's answer, all from Pam. */
export const X2_ThreadAfterFirstMessage: Story = { ...member('/messages/thread/'), render: () => <ThreadAfter /> };
/** Help: the answers first, "Write to Pam" last, with its hint. */
export const X3_HelpWriteToPam: Story = { ...member('/help/'), render: () => <HelpWrite /> };
/** The super admin's Home: Messages to Pam is the first row, with a plain count of the conversations waiting. */
export const X4_AdminHome: Story = { ...admin('/'), render: () => <SuperAdminHome /> };
/** /pam/messages/: Waiting for Pam (longest first, with how long), Answered, and Closed folded. */
export const X5_AdminInbox: Story = { ...admin('/pam/messages/'), render: () => <Inbox /> };
/** A conversation being answered: the asker's first name and role, saved replies, Close in the ⋯ menu. */
export const X6_AdminThread: Story = { ...admin('/messages/thread/'), render: () => <AdminThread kind="answering" /> };

// Version A (Iris's smallest v1)
/** A: a member with nobody else has no Pam row, and the Messages tab says what it always did. */
export const A1_MessagesBeforeWriting: Story = { ...member('/messages/'), render: () => <MemberMessages kind="none" /> };
/** A: once the person has written, Pam is a row, with the answer unread. */
export const A2_MessagesAfterWriting: Story = { ...member('/messages/'), render: () => <MemberMessages kind="wrote" /> };
/** A: the super admin can only answer, so Everyone has no message button on any row (Mira, 03:16; Ava's A kept staff rows' button). */
export const A3_AdminEveryone: Story = { ...admin('/directory/'), render: () => <Everyone version="A" /> };

/** A: Help with "Write to Pam" as the first row, as Mira's 03:16 note read; X3 has it under the answers, as Iris's research puts it. */
export const A4_HelpWriteFirst: Story = { ...member('/help/'), render: () => <HelpWrite first /> };
/** The composer with the photo button too, for the version Will can choose (Iris allows screenshots). */
export const X7_ThreadWithPhoto: Story = { ...member('/messages/thread/'), render: () => <ThreadEmpty photo /> };

// Version B (Nico's plan)
/** B: Pam is in everyone's Messages from the start, "Write to Pam" until the first message. */
export const B1_MessagesPamRow: Story = { ...member('/messages/'), render: () => <MemberMessages kind="fresh" /> };
/** B: and with others in the list once they have a conversation. */
export const B1b_MessagesWithOthers: Story = { ...member('/messages/'), render: () => <MemberMessages kind="wrote-others" /> };
/** B: a thread Pam started says so. */
export const B2_PamStarted: Story = { ...member('/messages/thread/'), render: () => <ThreadPamStarted /> };
/** B: Everyone has a message button on every row. */
export const B3_AdminEveryone: Story = { ...admin('/directory/'), render: () => <Everyone version="B" /> };
/** B: "Message this program" on a program's page. */
export const B4_ProgramPage: Story = { ...admin('/programs/review/'), render: () => <ProgramPage /> };
/** B: a new conversation with a member, before the first message: the composer says they will see it from Pam. */
export const B5_AdminStartsMember: Story = { ...admin('/messages/thread/'), render: () => <AdminThread kind="new-member" /> };
/** B: a new message to a program: it says who it reaches. */
export const B6_AdminStartsProgram: Story = { ...admin('/messages/thread/'), render: () => <AdminThread kind="new-program" /> };

const arabic = { globals: { locale: 'ar' } } as const;
export const X1_ThreadEmpty_Arabic: Story = { ...X1_ThreadEmpty, ...arabic };
export const X2_ThreadAfterFirstMessage_Arabic: Story = { ...X2_ThreadAfterFirstMessage, ...arabic };
export const X3_HelpWriteToPam_Arabic: Story = { ...X3_HelpWriteToPam, ...arabic };
export const X4_AdminHome_Arabic: Story = { ...X4_AdminHome, ...arabic };
export const X5_AdminInbox_Arabic: Story = { ...X5_AdminInbox, ...arabic };
export const A4_HelpWriteFirst_Arabic: Story = { ...A4_HelpWriteFirst, ...arabic };
export const X7_ThreadWithPhoto_Arabic: Story = { ...X7_ThreadWithPhoto, ...arabic };
export const X6_AdminThread_Arabic: Story = { ...X6_AdminThread, ...arabic };
export const A2_MessagesAfterWriting_Arabic: Story = { ...A2_MessagesAfterWriting, ...arabic };
export const B1_MessagesPamRow_Arabic: Story = { ...B1_MessagesPamRow, ...arabic };
export const B2_PamStarted_Arabic: Story = { ...B2_PamStarted, ...arabic };
export const B3_AdminEveryone_Arabic: Story = { ...B3_AdminEveryone, ...arabic };
