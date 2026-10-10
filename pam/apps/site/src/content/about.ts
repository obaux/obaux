/**
 * "About Pam", in the app's seven languages. One post, seven pages at
 * /<lang>/about-pam/, not filed under a Support topic.
 *
 * Sign-off (D-461): Will signs the English; the other six are drafts, "approved
 * to learn from; no native reader yet". A language is on the live site only when
 * it is listed in `signed-off.json`. Today the list is empty, so no page and no home
 * section is published; Storybook › Website › About Pam shows all seven.
 * Registers follow the app: es usted, pt-BR você, zh 您, ru вы, ar formal.
 */
import signedOff from './signed-off.json';

export type AboutLang = 'en' | 'es' | 'pt-BR' | 'zh-CN' | 'zh-HK' | 'ru' | 'ar';

/**
 * Add a language to `signed-off.json` the day its text is signed. Nothing else publishes
 * it: the file also decides whether the route exists (`next.config.mjs`).
 */
export const SIGNED_OFF = signedOff['about-pam'] as readonly AboutLang[];

export interface AboutText {
  readonly lang: AboutLang;
  readonly dir: 'ltr' | 'rtl';
  /** The language's name in itself, for the switcher. */
  readonly name: string;
  /** The switcher's short label. */
  readonly short: string;
  readonly title: string;
  readonly summary: string;
  readonly lead: string;
  readonly whyTitle: string;
  readonly why: string;
  readonly todayTitle: string;
  readonly today: readonly { readonly title: string; readonly body: string }[];
  readonly comingTitle: string;
  readonly coming: string;
  readonly helpTitle: string;
  readonly help: string;
  readonly helpLink: string;
  /** What the picture shows, for people who cannot see it. */
  readonly artAlt: string;
  /** The switcher's own label, for screen readers. */
  readonly switcherLabel: string;
}

export const ABOUT: Readonly<Record<AboutLang, AboutText>> = {
  en: {
    lang: 'en',
    dir: 'ltr',
    name: 'English',
    short: 'EN',
    title: 'About Pam',
    summary: 'Pam is a human-touch company. We help people find services, get to them, and remember to go.',
    lead: 'Pam is a human-touch company. We help people find city services, get to them, and remember to go.',
    whyTitle: 'Why Pam is here',
    why: 'Services can be hard to find, hard to get to, and easy to forget. Our aim is for Pam to message people at the right time, so a service is easy to find, easy to get to, and easy to remember.',
    todayTitle: 'What Pam does today',
    today: [
      { title: 'Find a place', body: 'See what your city has to offer: Learning, Earning, and Family Support.' },
      { title: 'Plan a visit', body: 'Save a trip, so it is easy to find again.' },
      { title: 'Talk to a person', body: 'Message your case manager or your program from the app.' },
    ],
    comingTitle: 'What is coming',
    coming: 'Texts that remind you before a visit are coming. Pam does not send them yet. We will say here when they are ready.',
    helpTitle: 'Questions?',
    help: 'The Support page explains how Pam works, in plain words.',
    helpLink: 'Go to Support',
    artAlt:
      'An illustration with no words: a phone showing three message bubbles, a map pin, a clock and a tick, with a dotted path leading from a building to a calendar.',
    switcherLabel: 'Language',
  },
  es: {
    lang: 'es',
    dir: 'ltr',
    name: 'Español',
    short: 'ES',
    title: 'Sobre Pam',
    summary: 'Pam es una empresa con trato humano. Le ayudamos a encontrar servicios, a llegar a ellos y a acordarse de ir.',
    lead: 'Pam es una empresa con trato humano. Le ayudamos a encontrar los servicios de su ciudad, a llegar a ellos y a acordarse de ir.',
    whyTitle: 'Por qué existe Pam',
    why: 'Los servicios pueden ser difíciles de encontrar, difíciles de alcanzar y fáciles de olvidar. Nuestra meta es que Pam le escriba en el momento justo, para que un servicio sea fácil de encontrar, fácil de alcanzar y fácil de recordar.',
    todayTitle: 'Lo que Pam hace hoy',
    today: [
      { title: 'Encontrar un lugar', body: 'Vea lo que su ciudad le ofrece: aprendizaje, empleo y apoyo familiar.' },
      { title: 'Planear una visita', body: 'Guarde una visita para encontrarla fácilmente después.' },
      { title: 'Hablar con una persona', body: 'Escríbale a su gestor de casos o a su programa desde la app.' },
    ],
    comingTitle: 'Lo que viene',
    coming: 'Los mensajes de texto que le recuerdan una visita antes de ir están en camino. Pam todavía no los envía. Lo diremos aquí cuando estén listos.',
    helpTitle: '¿Tiene preguntas?',
    help: 'La página de Ayuda explica cómo funciona Pam, con palabras sencillas.',
    helpLink: 'Ir a Ayuda (en inglés)',
    artAlt:
      'Una ilustración sin palabras: un teléfono con tres globos de mensaje, un marcador de mapa, un reloj y una marca de verificación, y un camino de puntos que va de un edificio a un calendario.',
    switcherLabel: 'Idioma',
  },
  'pt-BR': {
    lang: 'pt-BR',
    dir: 'ltr',
    name: 'Português (Brasil)',
    short: 'PT-BR',
    title: 'Sobre a Pam',
    summary: 'A Pam é uma empresa com toque humano. Ajudamos você a encontrar serviços, chegar até eles e lembrar de ir.',
    lead: 'A Pam é uma empresa com toque humano. Ajudamos você a encontrar os serviços da sua cidade, chegar até eles e lembrar de ir.',
    whyTitle: 'Por que a Pam existe',
    why: 'Serviços podem ser difíceis de encontrar, difíceis de alcançar e fáceis de esquecer. Nosso objetivo é que a Pam envie mensagens na hora certa, para que um serviço seja fácil de encontrar, fácil de alcançar e fácil de lembrar.',
    todayTitle: 'O que a Pam faz hoje',
    today: [
      { title: 'Encontrar um lugar', body: 'Veja o que a sua cidade oferece — aprendizado, trabalho e apoio à família.' },
      { title: 'Planejar uma visita', body: 'Salve uma viagem para achá-la fácil depois.' },
      { title: 'Falar com uma pessoa', body: 'Escreva para o seu gestor de casos ou programa, pelo app.' },
    ],
    comingTitle: 'O que vem por aí',
    coming: 'Estão chegando mensagens de texto que lembram você de uma visita antes de ir. A Pam ainda não as envia. Avisaremos aqui quando estiverem prontas.',
    helpTitle: 'Tem dúvidas?',
    help: 'A página de Ajuda explica como a Pam funciona, em palavras simples.',
    helpLink: 'Ir para Ajuda (em inglês)',
    artAlt:
      'Uma ilustração sem palavras: um celular com três balões de mensagem, um marcador de mapa, um relógio e um sinal de visto, e um caminho de pontos que vai de um prédio a um calendário.',
    switcherLabel: 'Idioma',
  },
  'zh-CN': {
    lang: 'zh-CN',
    dir: 'ltr',
    name: '简体中文',
    short: 'ZH-CN',
    title: '关于 Pam',
    summary: 'Pam 是一家有人情味的公司。我们帮您找到服务、到达那里，并记得去。',
    lead: 'Pam 是一家有人情味的公司。我们帮您找到所在城市的服务，帮您到达那里，也帮您记得去。',
    whyTitle: '为什么有 Pam',
    why: '服务可能很难找，很难到达，也很容易忘记。我们的目标是让 Pam 在合适的时候给您发消息，让服务容易找到、容易到达、容易记住。',
    todayTitle: 'Pam 现在能做什么',
    today: [
      { title: '找到一个地方', body: '看看您所在的城市能提供什么——学习、就业和家庭支持。' },
      { title: '计划一次前往', body: '保存一次行程，以后方便找到。' },
      { title: '和真人交流', body: '在应用里给您的个案管理员或项目发消息。' },
    ],
    comingTitle: '即将推出',
    coming: '出发前提醒您的短信即将推出。Pam 现在还不会发送。准备好后，我们会在这里告诉您。',
    helpTitle: '有疑问？',
    help: '“支持”页面用简单的话解释 Pam 如何运作。',
    helpLink: '前往“支持”（英文）',
    artAlt: '一幅没有文字的插图：一部手机上有三个消息气泡，分别是地图标记、时钟和对勾，一条虚线小路从一栋建筑通向一本日历。',
    switcherLabel: '语言',
  },
  'zh-HK': {
    lang: 'zh-HK',
    dir: 'ltr',
    name: '繁體中文（香港）',
    short: 'ZH-HK',
    title: '關於 Pam',
    summary: 'Pam 是一家有人情味的公司。我們幫您找到服務、前往那裡，並記得去。',
    lead: 'Pam 是一家有人情味的公司。我們幫您找到所在城市的服務，幫您前往那裡，也幫您記得去。',
    whyTitle: '為什麼有 Pam',
    why: '服務可能很難找，很難前往，也很容易忘記。我們的目標是讓 Pam 在合適的時候傳訊息給您，讓服務容易找到、容易前往、容易記住。',
    todayTitle: 'Pam 現在能做什麼',
    today: [
      { title: '找到一個地方', body: '看看您的城市能提供什麼——學習、工作和家庭支援。' },
      { title: '計劃一次前往', body: '儲存一次行程，之後方便找到。' },
      { title: '和真人交流', body: '在應用程式裡傳訊息給您的個案經理或計劃。' },
    ],
    comingTitle: '即將推出',
    coming: '出發前提醒您的短訊即將推出。Pam 現在還不會發送。準備好後，我們會在這裡告訴您。',
    helpTitle: '有疑問？',
    help: '「支援」頁面用簡單的話解釋 Pam 如何運作。',
    helpLink: '前往「支援」（英文）',
    artAlt: '一幅沒有文字的插圖：一部手機上有三個訊息氣泡，分別是地圖標記、時鐘和剔號，一條虛線小路從一棟建築通向一本日曆。',
    switcherLabel: '語言',
  },
  ru: {
    lang: 'ru',
    dir: 'ltr',
    name: 'Русский',
    short: 'RU',
    title: 'О Pam',
    summary: 'Pam — компания с человеческим подходом. Мы помогаем найти услуги, добраться до них и не забыть прийти.',
    lead: 'Pam — компания с человеческим подходом. Мы помогаем найти услуги в вашем городе, добраться до них и не забыть о них.',
    whyTitle: 'Зачем нужен Pam',
    why: 'Услуги бывает трудно найти, трудно добраться до них и легко забыть. Наша цель — чтобы Pam писал вам вовремя, и услугу было легко найти, легко добраться до неё и легко запомнить.',
    todayTitle: 'Что Pam делает сегодня',
    today: [
      { title: 'Найти место', body: 'Узнайте, что может предложить ваш город: учёба, работа и поддержка семьи.' },
      { title: 'Спланировать визит', body: 'Сохраните поездку, чтобы потом легко её найти.' },
      { title: 'Поговорить с человеком', body: 'Напишите из приложения своему кейс-менеджеру или программе.' },
    ],
    comingTitle: 'Что скоро появится',
    coming: 'Скоро появятся SMS, которые напомнят о визите заранее. Пока Pam их не отправляет. Когда они будут готовы, мы скажем об этом здесь.',
    helpTitle: 'Остались вопросы?',
    help: 'Страница «Поддержка» простыми словами объясняет, как работает Pam.',
    helpLink: 'Перейти в «Поддержку» (на английском)',
    artAlt:
      'Иллюстрация без слов: телефон с тремя облачками сообщений — метка на карте, часы и галочка, а от здания к календарю ведёт пунктирная дорожка.',
    switcherLabel: 'Язык',
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    name: 'العربية',
    short: 'AR',
    title: 'عن Pam',
    summary: 'Pam شركة تضع اللمسة الإنسانية أولاً. نساعدك على العثور على الخدمات والوصول إليها وتذكّر الذهاب.',
    lead: 'Pam شركة تضع اللمسة الإنسانية أولاً. نساعدك على العثور على خدمات مدينتك، والوصول إليها، وتذكّر الذهاب.',
    whyTitle: 'لماذا وُجدت Pam',
    why: 'قد يصعب العثور على الخدمات ويصعب الوصول إليها ويسهل نسيانها. هدفنا أن ترسل لك Pam رسالة في الوقت المناسب، ليسهل العثور على الخدمة والوصول إليها وتذكّرها.',
    todayTitle: 'ما تفعله Pam اليوم',
    today: [
      { title: 'العثور على مكان', body: 'تعرّف على ما تقدمه مدينتك — التعلم، والعمل، ودعم الأسرة.' },
      { title: 'تخطيط زيارة', body: 'احفظ رحلة لتجدها بسهولة لاحقًا.' },
      { title: 'التحدث مع شخص', body: 'راسل مدير حالتك أو برنامجك من التطبيق.' },
    ],
    comingTitle: 'ما هو قادم',
    coming: 'الرسائل النصية التي تذكّرك بالزيارة قبل موعدها قادمة قريبًا. لا ترسلها Pam بعد. سنخبرك هنا عندما تصبح جاهزة.',
    helpTitle: 'هل لديك أسئلة؟',
    help: 'تشرح صفحة الدعم كيف تعمل Pam بكلمات بسيطة.',
    helpLink: 'اذهب إلى الدعم (بالإنجليزية)',
    artAlt:
      'رسم توضيحي بلا كلمات: هاتف عليه ثلاث فقاعات رسائل، علامة موقع على خريطة وساعة وعلامة صح، ومسار منقّط يمتد من مبنى إلى تقويم.',
    switcherLabel: 'اللغة',
  },
};

export const ABOUT_LANGS = Object.keys(ABOUT) as AboutLang[];

export function aboutPath(lang: AboutLang): string {
  return `/${lang}/about-pam/`;
}

export function isSignedOff(lang: AboutLang): boolean {
  return SIGNED_OFF.includes(lang);
}

/** The languages whose page is built: signed ones, or all of them for a preview build. */
export function builtLangs(): AboutLang[] {
  return process.env.PAM_SITE_DRAFTS === '1' ? ABOUT_LANGS : ABOUT_LANGS.filter(isSignedOff);
}

/** The home page's section shows only once the English is signed. */
export const ABOUT_ON_HOME = isSignedOff('en');

export const ABOUT_ART = { wide: '/art/about-pam.webp', share: '/og/about-pam.png' } as const;
