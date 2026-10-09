/**
 * Example connections (D-213) — the people on a member's side, as the
 * redesigned Connections screen shows them: a photo, who they are, which
 * program, a line on how they help, and three facts.
 *
 * Programs first, people first (Will, 1 October): each card is a person at
 * a program, not the program itself. The same cast as the rest of the
 * example set (`dummy-people.ts`) and the same ids, so "Message" on a
 * profile opens the example conversation that already exists between
 * Jordan and that person (`dummy-conversations.ts`).
 *
 * **Photos are placeholders**, hotlinked from Unsplash (its licence allows
 * this) for staff only — never a member. Nothing real is behind them; when
 * real profiles exist, a photo is the person's own upload or nothing (the
 * avatar's initials). Where an image cannot load, the avatar shows initials.
 */
import type { Locale } from './index.js';

export interface DummyConnection {
  readonly id: string;
  readonly firstName: string;
  readonly role: 'admin' | 'provider';
  /** The program a provider runs; null for a case manager. */
  readonly programName: string | null;
  /** That program's place, for the link on the card (D-272); null for a case manager. */
  readonly placeId: string | null;
  /**
   * Who connected the member to this person (D-272) — a connection id,
   * the case manager. Null for the case manager themself.
   */
  readonly connectedById: string | null;
  readonly photoUrl: string;
  /** How they can help — a sentence, in every language. */
  readonly help: Readonly<Record<Locale, string>>;
  readonly yearsHelping: number;
  readonly peopleHelped: number;
  /** Languages they speak, written in themselves: "EN · ES". */
  readonly languages: string;
}

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=320&h=320&fit=crop&crop=faces&q=70`;

export const DUMMY_CONNECTIONS: readonly DummyConnection[] = [
  {
    id: 'dummy-a1',
    firstName: 'Teresa',
    role: 'admin',
    programName: null,
    placeId: null,
    connectedById: null,
    photoUrl: photo('1531123897727-8f129e1688ce'),
    help: {
      en: 'Your case manager. Teresa helps you find programs, sort out ID and benefits, and plan your week.',
      es: 'Tu administradora de casos. Teresa te ayuda a encontrar programas, arreglar tu identificación y beneficios, y planear tu semana.',
      'pt-BR': 'Sua gestora de casos. Teresa ajuda você a encontrar programas, resolver seus documentos de identidade e benefícios, e planejar a sua semana.',
      'zh-CN': '您的个案管理员。Teresa 会帮您找到合适的项目、办理身份证件和福利申请，并安排您这一周的计划。',
      'zh-HK': '您的個案經理。Teresa 會協助您尋找合適的計劃、辦理身份證明文件和福利申請，並安排您這一週的行程。',
      ru: 'Ваш кейс-менеджер. Teresa поможет вам найти программы, оформить документы и пособия и спланировать неделю.',
      ar: 'مديرة الحالة الخاصة بك. تساعدك Teresa في العثور على البرامج وترتيب وثائق الهوية والمزايا والتخطيط لأسبوعك.',
    },
    yearsHelping: 9,
    peopleHelped: 140,
    languages: 'EN · ES',
  },
  {
    id: 'dummy-p1',
    firstName: 'Sandra',
    role: 'provider',
    programName: 'Example Learning Center',
    placeId: 'dummy-place-learning',
    connectedById: 'dummy-a1',
    photoUrl: photo('1494790108377-be9c29b29330'),
    help: {
      en: 'Runs the GED class. Ask Sandra about class times, getting caught up, or the computer room.',
      es: 'Dirige la clase de GED. Pregúntale a Sandra por los horarios, cómo ponerte al día o la sala de computadoras.',
      'pt-BR': 'Coordena a turma de GED. Pergunte a Sandra sobre os horários das aulas, como colocar os estudos em dia ou a sala de informática.',
      'zh-CN': '负责 GED 课程。有关上课时间、如何赶上进度或电脑室的问题，都可以问 Sandra。',
      'zh-HK': '負責 GED 課程。有關上課時間、如何追上進度或電腦室的問題，都可以問 Sandra。',
      ru: 'Ведёт курс GED. Спросите Sandra о расписании занятий, о том, как нагнать материал, или о компьютерном классе.',
      ar: 'تدير دورة GED. اسأل Sandra عن مواعيد الدروس أو كيفية اللحاق بالمنهج أو غرفة الحاسوب.',
    },
    yearsHelping: 6,
    peopleHelped: 85,
    languages: 'EN',
  },
  {
    id: 'dummy-p2',
    firstName: 'Marcus',
    role: 'provider',
    programName: 'Example Workforce Center',
    placeId: 'dummy-place-workforce',
    connectedById: 'dummy-a1',
    photoUrl: photo('1507003211169-0a1dd7228f2d'),
    help: {
      en: 'Helps with résumés, interviews and job openings posted each week. Walk-ins welcome.',
      es: 'Ayuda con currículums, entrevistas y ofertas de trabajo que se publican cada semana. Sin cita.',
      'pt-BR': 'Ajuda com currículos, entrevistas e vagas de emprego publicadas toda semana. Sem hora marcada.',
      'zh-CN': '协助撰写简历、准备面试，并提供每周更新的招聘信息。无需预约，欢迎直接前来。',
      'zh-HK': '協助撰寫履歷、準備面試，並提供每星期更新的職位空缺。毋須預約，歡迎直接前來。',
      ru: 'Помогает с резюме, собеседованиями и вакансиями, которые публикуются каждую неделю. Можно прийти без записи.',
      ar: 'تساعد في كتابة السيرة الذاتية والاستعداد للمقابلات والاطلاع على الوظائف الشاغرة التي تُنشر كل أسبوع. الزيارة بدون موعد مسبق مرحّب بها.',
    },
    yearsHelping: 4,
    peopleHelped: 60,
    languages: 'EN · ES',
  },
];

export function dummyConnection(id: string): DummyConnection | null {
  return DUMMY_CONNECTIONS.find((c) => c.id === id) ?? null;
}

/**
 * A program's staff member, with their photo (D-335): for the booked place
 * page's staff badge. The example program leads only; a real program has
 * no photo here until staff can add one.
 */
export function programStaffFor(placeId: string): DummyConnection | null {
  return DUMMY_CONNECTIONS.find((c) => c.role === 'provider' && c.placeId === placeId) ?? null;
}

/**
 * The photo for a member's staff contact, if Pam has one (D-335): the same
 * person by first name and program — or, for a case manager, no program.
 * Anyone else keeps their initials.
 */
export function staffPhotoFor(firstName: string | null | undefined, programName: string | null | undefined): string | null {
  if (!firstName) return null;
  return DUMMY_CONNECTIONS.find((c) => c.firstName === firstName && c.programName === (programName ?? null))?.photoUrl ?? null;
}
