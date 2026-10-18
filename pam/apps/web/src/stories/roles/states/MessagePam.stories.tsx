import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
import { GlobeIcon, MessagesIcon, Page, PeopleIcon, PlacesIcon, ShieldIcon, HelpIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { Switch } from '@astryxdesign/core/Switch';
import { AlertBannerHost } from '@/lib/AlertBannerHost';
import { EyeIcon, EyeOffIcon, MailIcon } from '@pam/ui';
import { FactGroup, FactRow, GuideCard, ReadCard, SummaryCard, type SummaryLine } from '@pam/ui/Reading';
import { TRANSPARENCY_GROUPS, TRANSPARENCY_SCREEN } from '@pam/config';
import { splitLine, TransparencyReading } from '../../../screens/TransparencyReading';
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
    replyAs: 'Reply as Pam', // stand-in
    writeAs: 'Write as Pam', // stand-in
    helpRow: 'Write to Pam',
    helpHint: '',
    rowLine: 'Write to Pam',
    // Option B, clean (Will, 18 October): a welcome from day one, an automatic reply out of hours, a thread like any other. Sage's words to come.
    // Sage's words (fb410c60, signed-english.md): "Hi {name}, it's Pam. If you need help with anything, reply here."
    welcome: "Hi Marcus, it's Pam. If you need help with anything, reply here.",
    outHours: "Thanks for writing. Pam is here Monday to Friday, 9am to 5pm Eastern time, and we'll read your message then. In a crisis, call or text 988.",
    notSent: 'Not sent',
    tryAgain: 'Try again',
    sendingLabel: 'Sending…',
    sentLabel: 'Sent',
    stillHere: 'Not sent. Your message is still here.',
    welcomeLine: "Hi Marcus, it's Pam. If you need help with…",
    started: 'Pam started this conversation.',
    // Option C (Sage, ledger 7b280684).
    cTitle: 'The Pam team can now start a conversation with you, as Pam.',
    cBody: "You'll see it in Messages, and only the Pam team can read it. You can turn this off in Profile.",
    cSwitch: 'Pam can write to me first',
    cHint: "Off: Pam answers when you write, and doesn't start a conversation.",
    profile: 'Profile',
    pLanguage: 'Language',
    pAlerts: 'Text alerts',
    pCalendar: 'Calendar',
    pMessages: 'Messages from Pam',
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
    replyAs: 'رُدّ باسم Pam',
    writeAs: 'اكتب باسم Pam',
    helpRow: 'اكتب إلى Pam',
    helpHint: '',
    rowLine: 'اكتب إلى Pam',
    welcome: 'أهلًا ماركوس، معك Pam. إن احتجت مساعدة في أي شيء فردّ هنا.',
    outHours: 'شكرًا لكتابتك. Pam متاح من الاثنين إلى الجمعة، من 9 صباحًا إلى 5 مساءً بتوقيت الشرق، وسنقرأ رسالتك حينها. في أزمة اتصل أو أرسل رسالة إلى 988.',
    notSent: 'لم تُرسل',
    tryAgain: 'حاول مرة أخرى',
    sendingLabel: 'جارٍ الإرسال…',
    sentLabel: 'أُرسلت',
    stillHere: 'لم تُرسل. رسالتك ما زالت هنا.',
    welcomeLine: 'أهلًا ماركوس، معك Pam. إن احتجت مساعدة…',
    started: 'بدأ Pam هذه المحادثة.',
    cTitle: 'يمكن لفريق Pam الآن أن يبدأ محادثة معك، باسم Pam.',
    cBody: 'ستراها في الرسائل، ولا يقرؤها إلا فريق Pam. يمكنك إيقاف ذلك من ملفي.',
    cSwitch: 'يمكن لـ Pam أن يكتب لي أولًا',
    cHint: 'إيقاف: يرد Pam عندما تكتب، ولا يبدأ محادثة.',
    profile: 'ملفي',
    pLanguage: 'اللغة',
    pAlerts: 'تنبيهات نصية',
    pCalendar: 'التقويم',
    pMessages: 'رسائل من Pam',
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
  cardTitle: { fontSize: '19px', lineHeight: 1.25, fontWeight: 700 },
  cardText: { fontSize: '15px', lineHeight: 1.4 },
  cardStrong: { fontSize: '15px', lineHeight: 1.4, fontWeight: 700 },
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
  switchWords: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  switchLabel: { fontSize: '18px', fontWeight: 600 },
  statusRow: { width: '100%', paddingInline: '4px' },
  statusError: { fontSize: '15px', fontWeight: 600, color: colorVars['--color-text-red'] },
  statusQuiet: { fontSize: '14px', color: colorVars['--color-text-secondary'] },
  statusRetry: { minHeight: '48px', fontSize: '15px', fontWeight: 700, color: colorVars['--color-text-red'] },
  overlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'oklch(0 0 0 / 42%)', borderRadius: '12px' },
  full: { width: '100%', paddingInline: '12px' },
  bar: { paddingInline: '4px' },
});

const NOW = new Date();
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

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
function PamComposer({ photo, placeholder, draft = null }: { readonly photo: boolean; readonly placeholder?: string; readonly draft?: string | null }) {
  const w = useWords();
  const text = placeholder ?? w.composerPlaceholder;
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
        if (el.children.length === 0 && /^(Write a message|اكتب رسالة)/.test(el.textContent ?? '')) el.textContent = text;
      }
      // A failed text keeps its words in the box (drawing only: the build keeps the draft in state).
      if (draft) {
        const field = c.querySelector<HTMLElement>('[contenteditable], [role="textbox"]');
        if (field && field.textContent !== draft) field.textContent = draft;
        for (const el of c.querySelectorAll<HTMLElement>('div')) {
          if (el.children.length === 0 && el.textContent === text) el.style.display = 'none';
        }
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [photo, text, draft]);
  return null;
}


/**
 * What a message in flight looks like (Will, 18 October: "this has to work better than anything else in the app"). The words and the
 * ways are one set for a text and a photo: in flight, "Sending…" under the bubble (a photo has a ring of progress over it, with a
 * cross to stop it); once it is there, a quiet "Sent" under the last message only; and when it fails, the message STAYS in the
 * thread with a red outline and "Not sent" and a 48px "Try again" under it, so nothing is lost and one tap sends it again. The
 * thread's own bubbles do not know these states yet (ThreadView's messages carry no status), so the drawing adds them to the last
 * bubble after it mounts; the build gives each message a `status`.
 */
type Status = 'text-failed' | 'photo-sending' | 'photo-sent' | 'photo-failed';

function StatusRow({ status }: { readonly status: Status }) {
  const w = useWords();
  const failed = status === 'text-failed' || status === 'photo-failed';
  return (
    <HStack gap={1} align="center" justify="end" xstyle={styles.statusRow}>
      {failed ? (
        <>
          <Text xstyle={styles.statusError}>{w.notSent}</Text>
          <Button label={w.tryAgain} variant="ghost" xstyle={styles.statusRetry} />
        </>
      ) : status === 'photo-sending' ? (
        <Text xstyle={styles.statusQuiet}>{w.sendingLabel}</Text>
      ) : (
        <Text xstyle={styles.statusQuiet}>{w.sentLabel}</Text>
      )}
    </HStack>
  );
}

function PhotoOverlay({ status }: { readonly status: 'photo-sending' | 'photo-failed' }) {
  const failed = status === 'photo-failed';
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const place = () => {
      const img = document.querySelector<HTMLElement>('article.astryx-chat-message:last-of-type .astryx-chat-message-bubble img');
      if (img) setBox({ left: img.offsetLeft, top: img.offsetTop, width: img.offsetWidth, height: img.offsetHeight });
    };
    place();
    const id = window.setInterval(place, 400);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div {...stylex.props(styles.overlay)} style={box ? { ...box, inset: 'auto' } : undefined}>
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
        {failed ? (
          <path d="M24 14v13M24 33v1" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : (
          <>
            <circle cx="24" cy="24" r="19" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeDasharray="74 120" transform="rotate(-90 24 24)" />
            <path d="M17 17l14 14M31 17L17 31" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        )}
      </svg>
    </div>
  );
}

function Decorate({ status }: { readonly status: Status }) {
  const [hosts, setHosts] = useState<{ row: HTMLElement; bubble: HTMLElement } | null>(null);
  useEffect(() => {
    const find = () => {
      const articles = document.querySelectorAll<HTMLElement>('article.astryx-chat-message');
      const last = articles[articles.length - 1];
      const bubble = last?.querySelector<HTMLElement>('.astryx-chat-message-bubble');
      if (!last || !bubble) return;
      let row = last.nextElementSibling instanceof HTMLElement && last.nextElementSibling.hasAttribute('data-pam-status') ? last.nextElementSibling : null;
      if (!row) {
        row = document.createElement('div');
        row.setAttribute('data-pam-status', '');
        // The status sits on its own line under the last message, after it in the list, on the side the bubble is on.
        row.style.display = 'flex';
        row.style.justifyContent = 'flex-end';
        row.style.paddingInline = '12px';
        last.after(row);
      }
      bubble.style.position = 'relative';
      if (status === 'text-failed' || status === 'photo-failed') bubble.style.outline = '2px solid light-dark(#a11d1d, #ff8a8a)';
      setHosts((prev) => (prev && prev.row === row && prev.bubble === bubble ? prev : { row: row!, bubble }));
    };
    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [status]);
  if (!hosts) return null;
  return (
    <>
      {createPortal(<StatusRow status={status} />, hosts.row)}
      {status === 'photo-sending' || status === 'photo-failed' ? createPortal(<PhotoOverlay status={status} />, hosts.bubble) : null}
    </>
  );
}

type Msg = { readonly id: string; readonly body: string | null; readonly photoUrl?: string; readonly createdAt: string; readonly mine: boolean };

/** A Pam thread as the person sees it: Pam's mark, the card at the top, the messages, the composer. */
function PersonThread({ messages, status = null, draft = null }: { readonly messages: readonly Msg[]; readonly status?: Status | null; readonly draft?: string | null }) {
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
        // The same intro every conversation has (D-526), Pam's mark centred over "Pam"; once it scrolls away the bar carries the name.
        // Nothing else: no card, no strip, no list of terms (Will, 18 October).
        intro={<ThreadIntro name={w.pam} photoUrl={PAM_MARK} context={null} />}
        onSend={async () => true}
        sending={false}
        sendFailed={false}
        speechLanguage={locale === 'ar' ? 'ar' : 'en-US'}
      />
      <PamComposer photo draft={draft} />
      {status ? <Decorate status={status} /> : null}
    </ThreadFrame>
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
  const write = { id: 'write', label: w.helpRow, href: '/messages/thread/?pam=1', icon: <MessagesIcon {...icon} /> };
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
  // From day one the row carries the welcome's first line, unread (Will, 18 October); later, the last thing said.
  context: null,
  preview: kind === 'fresh' ? w.welcomeLine : w.pamRowLine,
  when: w.when1,
  unread: true,
  href: '/messages/thread/?pam=1',
  photoUrl: PAM_MARK,
});

function MemberMessages({ kind }: { readonly kind: 'none' | 'fresh' | 'fresh-others' | 'wrote' | 'wrote-others' }) {
  const w = useWords();
  const others: MessageRow[] = [
    { id: 'cm', name: w.caseManager, context: w.cmContext, preview: w.cmLine, when: w.when2, unread: false, href: '/messages/thread/?id=cm' },
    { id: 'prog', name: w.program, context: w.programContext, preview: w.programLine, when: w.when2, unread: false, href: '/messages/thread/?id=prog' },
  ];
  const rows: MessageRow[] =
    kind === 'none' ? [] : kind === 'fresh' ? [rowFor(w, 'fresh')] : kind === 'fresh-others' ? [rowFor(w, 'fresh'), ...others] : kind === 'wrote' ? [rowFor(w, 'wrote')] : [rowFor(w, 'wrote'), ...others];
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
      <PamComposer photo placeholder={kind === 'answering' ? w.replyAs : w.writeAs} />
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


const NOW2 = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const PHOTO = '/onboarding/hero-city.webp';

/** Pam's welcome is the first message, there from day one: the thread is never empty. */
function pamThread(kind: 'welcome' | 'out-of-hours' | 'text-failed' | 'draft-kept' | 'photo-sending' | 'photo-sent' | 'photo-failed') {
  return function PamThreadStory() {
    const w = useWords();
    const welcome: Msg = { id: 'w', body: w.welcome, createdAt: NOW2(300), mine: false };
    const mine: Msg = { id: 'm', body: w.mine1, createdAt: NOW2(20), mine: true };
    const photo: Msg = { id: 'p', body: null, photoUrl: PHOTO, createdAt: NOW2(2), mine: true };
    if (kind === 'welcome') return <PersonThread messages={[welcome]} />;
    if (kind === 'out-of-hours') return <PersonThread messages={[welcome, mine, { id: 'a', body: w.outHours, createdAt: NOW2(19), mine: false }]} />;
    if (kind === 'text-failed') return <PersonThread messages={[welcome, mine]} status="text-failed" />;
    if (kind === 'draft-kept') return <PersonThread messages={[welcome]} draft={w.mine1} />;
    return <PersonThread messages={[welcome, photo]} status={kind} />;
  };
}
const ThreadWelcome = pamThread('welcome');
const ThreadOutOfHours = pamThread('out-of-hours');
const ThreadTextFailed = pamThread('text-failed');
const ThreadDraftKept = pamThread('draft-kept');
const ThreadPhotoSending = pamThread('photo-sending');
const ThreadPhotoSent = pamThread('photo-sent');
const ThreadPhotoFailed = pamThread('photo-failed');

// The member's side, clean (Will's answer on a100: B; "messaging Pam should feel like messaging anyone else")
/** P1: Pam's welcome is the first message from day one; the header is the mark centred over "Pam"; the composer has the microphone, the photo button and Send. */
export const P1_ThreadWelcome: Story = { ...member('/messages/thread/'), render: () => <ThreadWelcome /> };
/** P2: written to outside business hours: their message, then Pam's automatic reply saying when Pam is back, with one 988 line. Not labelled: it reads like any reply. */
export const P2_ThreadOutOfHours: Story = { ...member('/messages/thread/'), render: () => <ThreadOutOfHours /> };
/** P3: a text that did not send stays in the thread, outlined, with "Not sent" and Try again under it (a 48px target). Nothing is lost. */
export const P3_TextFailed: Story = { ...member('/messages/thread/'), render: () => <ThreadTextFailed /> };
/** P3b: the other way to keep a draft: the words stay in the box and the line above says so (shown for comparison). */
export const P3b_TextFailedDraftInBox: Story = { ...member('/messages/thread/'), render: () => <><ThreadDraftKept /><Above lines={[WORDS.en.stillHere]} /></> };
/** P4: a photo on its way: dimmed, a ring of progress with a cross to stop it, "Sending…" under it. */
export const P4_PhotoSending: Story = { ...member('/messages/thread/'), render: () => <ThreadPhotoSending /> };
/** P5: the photo is there: the picture as sent, and a quiet "Sent" under the last message. */
export const P5_PhotoSent: Story = { ...member('/messages/thread/'), render: () => <ThreadPhotoSent /> };
/** P6: a photo that did not send stays, dimmed with an alert mark, "Not sent" and Try again under it. */
export const P6_PhotoFailed: Story = { ...member('/messages/thread/'), render: () => <ThreadPhotoFailed /> };
/** P7: Messages from day one: Pam's row with the welcome's first line, unread, alone; and with others. */
export const P7_MessagesDayOne: Story = { ...member('/messages/'), render: () => <MemberMessages kind="fresh" /> };
export const P7b_MessagesDayOneWithOthers: Story = { ...member('/messages/'), render: () => <MemberMessages kind="fresh-others" /> };
/** P8: Help: the answers first, then "Write to Pam" with no hint. (X3 is the same screen.) */
export const P8_HelpWriteToPam: Story = { ...member('/help/'), render: () => <HelpWrite /> };


/**
 * "What others can see" with the Pam card (Lena L4, claude/lena-message-pam-privacy; Sage's words, may still move): the last step of
 * signing up and Profile's short version. It is TransparencyReading as it stands, with one more card, "The Pam team can see:", after
 * "A program can see:", and one more line in the short version. It is never in the guide's list. Drawing only: `TransparencyReading`
 * is Lena's to change; this copy exists so the card can be seen in place.
 */
const PAM_WORDS = {
  heading: 'The Pam team can see',
  line: 'What you and Pam write to each other, and the photos you send there.',
  grey: 'Your guide and your programs cannot see any of it.',
  summary: 'Only the Pam team can see what you and Pam write to each other, and the photos you send there.',
};
const asTitleLocal = (heading: string) => heading.replace(/[:：]\s*$/, '');

function TransparencyWithPam({ detail }: { readonly detail: boolean }) {
  const { t } = useI18n();
  const byKey = new Map(TRANSPARENCY_SCREEN.canSee.map((line) => [line.key, line] as const));
  const summary: SummaryLine[] = [
    { text: t('transparency.summary.see'), mark: 'yes', icon: <EyeIcon /> },
    { text: t('transparency.summary.cannot'), mark: 'no', icon: <EyeOffIcon /> },
    { text: t('transparency.summary.reported'), mark: 'yes', icon: <MessagesIcon width={24} height={24} /> },
    { text: t('transparency.summary.program'), mark: 'yes', icon: <PeopleIcon width={24} height={24} /> },
    { text: PAM_WORDS.summary, mark: 'yes', icon: <MessagesIcon width={24} height={24} /> },
    { text: t('privacy.s.contact.p1'), mark: 'call', icon: <MailIcon /> },
  ];
  return (
    <VStack gap={3}>
      <GuideCard title={t('guide.title')} body={t('guide.body')} icon={<PeopleIcon width={24} height={24} />} />
      <SummaryCard title={t('transparency.summary.title')} lines={summary} />
      {detail ? (
        <>
          <ReadCard title={asTitleLocal(t(TRANSPARENCY_SCREEN.canSeeHeadingKey))} icon={<EyeIcon />}>
            <VStack gap={3}>
              {TRANSPARENCY_GROUPS.map((group) => (
                <FactGroup key={group.titleKey} title={t(group.titleKey)}>
                  {group.keys.map((key) => {
                    const line = byKey.get(key);
                    if (!line) return null;
                    const { lead, detail: more } = splitLine(t(line.key));
                    return <FactRow key={key} lead={lead} detail={more} mark="yes" />;
                  })}
                </FactGroup>
              ))}
            </VStack>
          </ReadCard>
          <ReadCard title={asTitleLocal(t(TRANSPARENCY_SCREEN.cannotSeeHeadingKey))} icon={<EyeOffIcon />}>
            <FactGroup>
              {TRANSPARENCY_SCREEN.cannotSee.map((line) => {
                const { lead, detail: more } = splitLine(t(line.key));
                return <FactRow key={line.key} lead={lead} detail={more} mark="no" />;
              })}
            </FactGroup>
          </ReadCard>
          <ReadCard title={asTitleLocal(t(TRANSPARENCY_SCREEN.programHeadingKey))} icon={<PeopleIcon width={24} height={24} />}>
            <FactGroup>
              {TRANSPARENCY_SCREEN.program.map((line) => {
                const { lead, detail: more } = splitLine(t(line.key));
                return <FactRow key={line.key} lead={lead} detail={more} mark="yes" />;
              })}
            </FactGroup>
          </ReadCard>
          {/* The new card: the third, after the program's, and never in the guide's list. */}
          <ReadCard title={PAM_WORDS.heading} icon={<MessagesIcon width={24} height={24} />}>
            <FactGroup>
              <FactRow lead={PAM_WORDS.line} detail={PAM_WORDS.grey} mark="yes" />
            </FactGroup>
          </ReadCard>
          <Text type="supporting" xstyle={styles.helpIntro}>
            {t(TRANSPARENCY_SCREEN.footerKey)}
          </Text>
        </>
      ) : null}
    </VStack>
  );
}

function PrivacyFull() {
  const { t } = useI18n();
  return (
    <SubPage title={t('transparency.title')} backHref="/legal/privacy/" backLabel={t('nav.back.legal')}>
      <TransparencyWithPam detail />
    </SubPage>
  );
}
function PrivacyShort() {
  const { t } = useI18n();
  return (
    <SubPage title={t('privacy.controls.title')} backHref="/legal/" backLabel={t('nav.back.legal')}>
      <Text type="supporting" xstyle={styles.helpIntro}>
        {t('privacy.controls.intro')}
      </Text>
      <TransparencyWithPam detail={false} />
    </SubPage>
  );
}
void TransparencyReading;
/** The last step of signing up, and the full list: the Pam team's card is the third, after "A program can see". */
export const L1_WhatOthersCanSeeFull: Story = { ...member('/legal/privacy/'), render: () => <PrivacyFull /> };
/** Profile › What others can see, the short version: one more line, "Only the Pam team can see…". (The page's action rows below are not drawn.) */
export const L2_WhatOthersCanSeeShort: Story = { ...member('/legal/privacy/'), render: () => <PrivacyShort /> };

// The super admin's side (unchanged, plus photos in the composer)
/** Help: the answers first, "Write to Pam" last, with its hint. */
export const X3_HelpWriteToPam: Story = { ...member('/help/'), render: () => <HelpWrite /> };
/** The super admin's Home: Messages to Pam is the first row, with a plain count of the conversations waiting. */
export const X4_AdminHome: Story = { ...admin('/'), render: () => <SuperAdminHome /> };
/** /pam/messages/: Waiting for Pam (longest first, with how long), Answered, and Closed folded. */
export const X5_AdminInbox: Story = { ...admin('/pam/messages/'), render: () => <Inbox /> };
/** A conversation being answered: the asker's first name and role, saved replies, Close in the ⋯ menu. */
export const X6_AdminThread: Story = { ...admin('/messages/thread/'), render: () => <AdminThread kind="answering" /> };

// Version A (Iris's smallest v1)


// Version B (Nico's plan)
/** B: Everyone has a message button on every row. */
export const B3_AdminEveryone: Story = { ...admin('/directory/'), render: () => <Everyone version="B" /> };
/** B: "Message this program" on a program's page. */
export const B4_ProgramPage: Story = { ...admin('/programs/review/'), render: () => <ProgramPage /> };
/** B: a new conversation with a member, before the first message: the composer says they will see it from Pam. */
export const B5_AdminStartsMember: Story = { ...admin('/messages/thread/'), render: () => <AdminThread kind="new-member" /> };
/** B: a new message to a program: it says who it reaches. */
export const B6_AdminStartsProgram: Story = { ...admin('/messages/thread/'), render: () => <AdminThread kind="new-program" /> };

// Option C (Sage, ledger 7b280684)

const arabic = { globals: { locale: 'ar' } } as const;
export const P1_ThreadWelcome_Arabic: Story = { ...P1_ThreadWelcome, ...arabic };
export const P2_ThreadOutOfHours_Arabic: Story = { ...P2_ThreadOutOfHours, ...arabic };
export const P3_TextFailed_Arabic: Story = { ...P3_TextFailed, ...arabic };
export const P3b_TextFailedDraftInBox_Arabic: Story = { ...P3b_TextFailedDraftInBox, ...arabic };
export const P4_PhotoSending_Arabic: Story = { ...P4_PhotoSending, ...arabic };
export const P5_PhotoSent_Arabic: Story = { ...P5_PhotoSent, ...arabic };
export const P6_PhotoFailed_Arabic: Story = { ...P6_PhotoFailed, ...arabic };
export const P7_MessagesDayOne_Arabic: Story = { ...P7_MessagesDayOne, ...arabic };
export const P8_HelpWriteToPam_Arabic: Story = { ...P8_HelpWriteToPam, ...arabic };
export const X3_HelpWriteToPam_Arabic: Story = { ...X3_HelpWriteToPam, ...arabic };
export const X4_AdminHome_Arabic: Story = { ...X4_AdminHome, ...arabic };
export const X5_AdminInbox_Arabic: Story = { ...X5_AdminInbox, ...arabic };
export const X6_AdminThread_Arabic: Story = { ...X6_AdminThread, ...arabic };
export const B3_AdminEveryone_Arabic: Story = { ...B3_AdminEveryone, ...arabic };
