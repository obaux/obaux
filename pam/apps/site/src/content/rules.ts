/**
 * "Signing a program's rules", for members and for programs, in the app's seven languages.
 * Written 10 October from Will's ask (Control Room, 14:36 UTC: "create a post about this for
 * the public"; program policies members sign, approved for Piper to build, card a25) and the
 * merge desk's brief. It says only what Pam WILL do once Piper's signing screens are real, so
 * it is a draft: nothing is live until BOTH (1) `program-rules-live` in `signed-off.json` is
 * true (the signing screens are really in the app) AND (2) the language is in
 * `signed-off.json`'s `program-rules` list. English is at /support/signing-a-programs-rules/
 * (a Support post); the other six at /<lang>/program-rules/. Same D-461 convention as About
 * Pam: Will signs the English; the other six are drafts until a native reader has been over them.
 * Registers follow the app: es usted, pt-BR você, zh 您, ru вы, ar formal; the quoted labels
 * ("Policies to sign", "Sign", "Type my name instead", "Policies for participants") are the
 * app's own strings in each language (en.json and its six).
 *
 * The one sentence a lawyer must read before launch is "What your signature means"
 * (docs/before-launch.md).
 */
import signedOff from './signed-off.json';
import { ABOUT_LANGS, type AboutLang } from './about';

export const RULES_SLUG = 'signing-a-programs-rules';

export interface RulesSection {
  readonly title: string;
  readonly steps?: readonly string[];
  /** Shown as a gray "what you need / do not need" banner (title + the paragraph) instead of a plain section. */
  readonly note?: true;
  readonly paras: readonly string[];
}

export interface RulesText {
  readonly title: string;
  readonly summary: string;
  readonly lead: string;
  /** The label on the "how to find it in the app" card. */
  readonly howTo: string;
  readonly sections: readonly RulesSection[];
}

export const RULES: Readonly<Record<AboutLang, RulesText>> = {
  en: {
    title: 'Signing a program’s rules',
    summary: 'What a program’s policy is, how you read and sign it in Pam, and what the program sees.',
    lead: 'Some programs ask you to read and sign their rules before you visit. In Pam, you do it on your phone. You sign your name once, and after that signing the next one takes one tap.',
    howTo: 'In the app',
    sections: [
      {
        title: 'What a policy is',
        paras: ['A policy is a program’s rules. For example: “Bring ID.” A program can have one policy or several. You read each one before you sign it.'],
      },
      {
        title: 'How you sign',
        steps: [
          'Open the program in Pam. Tap “Policies to sign”.',
          'Read the policy.',
          'Tap “Sign”. Draw your name with your finger, or tap “Type my name instead” and type your full name. Typing counts the same as drawing.',
        ],
        paras: ['You do this once. Pam keeps your signature, so the next policy takes one tap.'],
      },
      {
        title: 'Signing never stops you booking a visit',
        note: true,
        paras: ['You can plan a visit before you have signed anything. Signing is for before you go, and it never stops you from booking.'],
      },
      {
        title: 'What a program sees',
        paras: ['A program sees your first name and the date you signed. It never sees the picture of your signature.'],
      },
      {
        title: 'A policy does not change after you sign',
        paras: ['A policy is never changed after you sign it. If a program writes a new version, Pam asks you to read and sign the new one.'],
      },
      {
        title: 'What your signature means',
        paras: ['Your signature in Pam is a record that you read the policy and agreed to it. It is not a legal signature.'],
      },
      {
        title: 'For programs',
        paras: [
          'Add your policies in your program, under “Policies for participants”. Members read and sign them in Pam. For each person you see their first name and the date they signed. You never see their signature. If you write a new version, members are asked to sign again.',
        ],
      },
    ],
  },
  es: {
    title: 'Firmar las políticas de un programa',
    summary: 'Algunos programas le piden que lea y firme sus políticas antes de su visita. Esto es lo que significa y lo que ve el programa.',
    lead: 'Algunos programas le piden que lea y firme sus políticas, que son sus reglas, antes de visitarlos. En Pam lo hace desde su teléfono. Firma su nombre una vez y, después, firmar la siguiente toma un solo toque.',
    howTo: 'En la app',
    sections: [
      {
        title: 'Qué es una política',
        paras: ['Una política son las reglas de un programa. Por ejemplo: “Traiga identificación”. Un programa puede tener una política o varias. Usted lee cada una antes de firmarla.'],
      },
      {
        title: 'Cómo se firma',
        steps: [
          'Abra el programa en Pam. Toque “Políticas para firmar”.',
          'Lea la política.',
          'Toque “Firmar”. Dibuje su nombre con el dedo, o toque “Escribir mi nombre” y escriba su nombre completo. Escribirlo vale igual que dibujarlo.',
        ],
        paras: ['Lo hace una sola vez. Pam guarda su firma, así que la siguiente política toma un solo toque.'],
      },
      {
        title: 'Firmar nunca le impide reservar una visita',
        note: true,
        paras: ['Puede planear una visita antes de haber firmado nada. Firmar es para antes de ir, y nunca le impide reservar.'],
      },
      {
        title: 'Lo que ve un programa',
        paras: ['Un programa ve su nombre de pila y la fecha en que firmó. Nunca ve la imagen de su firma.'],
      },
      {
        title: 'Una política no cambia después de que usted firma',
        paras: ['Una política nunca se cambia después de que usted la firma. Si un programa escribe una versión nueva, Pam le pide que lea y firme la nueva.'],
      },
      {
        title: 'Qué significa su firma',
        paras: ['Su firma en Pam es un registro de que usted leyó la política y estuvo de acuerdo. No es una firma legal.'],
      },
      {
        title: 'Para los programas',
        paras: [
          'Agregue sus políticas en su programa, en “Políticas para participantes”. Los miembros las leen y las firman en Pam. De cada persona usted ve su nombre de pila y la fecha en que firmó. Nunca ve su firma. Si escribe una versión nueva, se les pide a los miembros que vuelvan a firmar.',
        ],
      },
    ],
  },
  'pt-BR': {
    title: 'Assinar as políticas de um programa',
    summary: 'Alguns programas pedem que você leia e assine as políticas deles antes da sua visita. Veja o que isso significa e o que o programa enxerga.',
    lead: 'Alguns programas pedem que você leia e assine as políticas deles, que são as regras, antes de visitá-los. Na Pam, você faz isso no celular. Você assina o seu nome uma vez e, depois, assinar a próxima leva um toque.',
    howTo: 'No app',
    sections: [
      {
        title: 'O que é uma política',
        paras: ['Uma política são as regras de um programa. Por exemplo: “Traga um documento de identidade”. Um programa pode ter uma política ou várias. Você lê cada uma antes de assiná-la.'],
      },
      {
        title: 'Como assinar',
        steps: [
          'Abra o programa na Pam. Toque em “Políticas para assinar”.',
          'Leia a política.',
          'Toque em “Assinar”. Desenhe o seu nome com o dedo, ou toque em “Digitar o meu nome” e digite o seu nome completo. Digitar vale o mesmo que desenhar.',
        ],
        paras: ['Você faz isso uma vez só. A Pam guarda a sua assinatura, então a próxima política leva um toque.'],
      },
      {
        title: 'Assinar nunca impede você de agendar uma visita',
        note: true,
        paras: ['Você pode planejar uma visita antes de assinar qualquer coisa. Assinar é para antes de ir, e nunca impede você de agendar.'],
      },
      {
        title: 'O que um programa enxerga',
        paras: ['Um programa vê o seu primeiro nome e a data em que você assinou. Nunca vê a imagem da sua assinatura.'],
      },
      {
        title: 'Uma política não muda depois que você assina',
        paras: ['Uma política nunca é alterada depois que você a assina. Se um programa escrever uma versão nova, a Pam pede que você leia e assine a nova.'],
      },
      {
        title: 'O que a sua assinatura significa',
        paras: ['A sua assinatura na Pam é um registro de que você leu a política e concordou com ela. Não é uma assinatura legal.'],
      },
      {
        title: 'Para programas',
        paras: [
          'Adicione as suas políticas no seu programa, em “Políticas para participantes”. Os membros as leem e assinam na Pam. De cada pessoa, você vê o primeiro nome e a data em que assinou. Você nunca vê a assinatura. Se você escrever uma versão nova, os membros são convidados a assinar de novo.',
        ],
      },
    ],
  },
  'zh-CN': {
    title: '签署项目的规定',
    summary: '有些项目会请您在到访前阅读并签署他们的规定。这里说明这是什么，以及项目能看到什么。',
    lead: '有些项目会请您在到访前阅读并签署他们的规定。在 Pam 里，您用手机就能完成。您只需签一次名，之后签署下一份只需轻点一下。',
    howTo: '在应用里',
    sections: [
      {
        title: '什么是规定',
        paras: ['规定就是项目的规则，例如：“请带身份证件”。一个项目可以有一份规定，也可以有好几份。您先阅读，再签署。'],
      },
      {
        title: '怎么签署',
        steps: [
          '在 Pam 里打开该项目，点“需要签署的规定”。',
          '阅读这份规定。',
          '点“签署”。用手指写下您的名字，或点“改为输入我的名字”，然后输入您的全名。输入和手写一样有效。',
        ],
        paras: ['只需这样做一次。Pam 会保存您的签名，所以签署下一份规定只需轻点一下。'],
      },
      {
        title: '签署从不妨碍您预约到访',
        note: true,
        paras: ['您可以先安排到访，不必先签任何东西。签署是到访之前要做的事，它从不妨碍您预约。'],
      },
      {
        title: '项目能看到什么',
        paras: ['项目只能看到您的名字和您签署的日期，看不到您的签名图像。'],
      },
      {
        title: '您签署之后，规定不会被更改',
        paras: ['您签署之后，这份规定不会再被更改。如果项目写了新版本，Pam 会请您阅读并签署新版本。'],
      },
      {
        title: '您的签名意味着什么',
        paras: ['您在 Pam 里的签名，是您已阅读并同意这份规定的记录。它不是法律意义上的签名。'],
      },
      {
        title: '给项目',
        paras: ['请在您的项目里的“参与者规定”下添加规定。成员在 Pam 里阅读并签署。对每个人，您能看到他们的名字和签署日期，看不到他们的签名。如果您写了新版本，成员会被请求重新签署。'],
      },
    ],
  },
  'zh-HK': {
    title: '簽署計劃的守則',
    summary: '有些計劃會請您在到訪前閱讀並簽署他們的守則。這裡說明這是什麼，以及計劃能看到什麼。',
    lead: '有些計劃會請您在到訪前閱讀並簽署他們的守則。在 Pam 裡，您用手機就能完成。您只需簽一次名，之後簽署下一份只需輕按一下。',
    howTo: '在應用程式裡',
    sections: [
      {
        title: '什麼是守則',
        paras: ['守則就是計劃的規則，例如：「請帶身分證明文件」。一個計劃可以有一份守則，也可以有好幾份。您先閱讀，再簽署。'],
      },
      {
        title: '怎樣簽署',
        steps: [
          '在 Pam 裡打開該計劃，按「待簽署的守則」。',
          '閱讀這份守則。',
          '按「簽署」。用手指寫下您的名字，或按「改為輸入我的名字」，然後輸入您的全名。輸入與手寫效力相同。',
        ],
        paras: ['只需這樣做一次。Pam 會保存您的簽名，所以簽署下一份守則只需輕按一下。'],
      },
      {
        title: '簽署從不妨礙您預約到訪',
        note: true,
        paras: ['您可以先安排到訪，不必先簽任何東西。簽署是到訪之前要做的事，它從不妨礙您預約。'],
      },
      {
        title: '計劃能看到什麼',
        paras: ['計劃只能看到您的名字和您簽署的日期，看不到您的簽名圖像。'],
      },
      {
        title: '您簽署之後，守則不會被更改',
        paras: ['您簽署之後，這份守則不會再被更改。如果計劃寫了新版本，Pam 會請您閱讀並簽署新版本。'],
      },
      {
        title: '您的簽名代表什麼',
        paras: ['您在 Pam 裡的簽名，是您已閱讀並同意這份守則的記錄。它不是法律上的簽名。'],
      },
      {
        title: '給計劃',
        paras: ['請在您的計劃裡的「參加者守則」下新增守則。成員在 Pam 裡閱讀並簽署。對每個人，您能看到他們的名字和簽署日期，看不到他們的簽名。如果您寫了新版本，成員會被請求重新簽署。'],
      },
    ],
  },
  ru: {
    title: 'Подпись под правилами программы',
    summary: 'Некоторые программы просят вас прочитать и подписать их правила до визита. Здесь — что это значит и что видит программа.',
    lead: 'Некоторые программы просят вас прочитать и подписать их правила до визита. В Pam это делается в телефоне. Вы подписываетесь один раз, а потом следующие правила подписываются одним касанием.',
    howTo: 'В приложении',
    sections: [
      {
        title: 'Что такое правила',
        paras: ['Правила — это условия программы. Например: «Возьмите с собой документ». У программы могут быть одни правила или несколько. Каждые вы читаете до подписи.'],
      },
      {
        title: 'Как подписать',
        steps: [
          'Откройте программу в Pam. Нажмите «Правила для подписи».',
          'Прочитайте правила.',
          'Нажмите «Подписать». Нарисуйте своё имя пальцем или нажмите «Лучше ввести имя» и введите полное имя. Это считается так же, как нарисованная подпись.',
        ],
        paras: ['Это делается один раз. Pam запоминает вашу подпись, поэтому следующие правила подписываются одним касанием.'],
      },
      {
        title: 'Подпись никогда не мешает записаться на визит',
        note: true,
        paras: ['Вы можете запланировать визит, ничего не подписав. Подписывать нужно до того, как вы придёте, и это никогда не мешает записаться.'],
      },
      {
        title: 'Что видит программа',
        paras: ['Программа видит ваше имя и дату подписи. Картинку вашей подписи она не видит никогда.'],
      },
      {
        title: 'Правила не меняются после вашей подписи',
        paras: ['Правила никогда не меняют после того, как вы их подписали. Если программа напишет новую версию, Pam попросит вас прочитать и подписать новую.'],
      },
      {
        title: 'Что значит ваша подпись',
        paras: ['Ваша подпись в Pam — это запись о том, что вы прочитали правила и согласны с ними. Это не юридическая подпись.'],
      },
      {
        title: 'Для программ',
        paras: ['Добавьте свои правила в своей программе, в разделе «Правила для участников». Участники читают и подписывают их в Pam. О каждом человеке вы видите имя и дату подписи. Подписи вы не видите. Если вы напишете новую версию, участников попросят подписать снова.'],
      },
    ],
  },
  ar: {
    title: 'التوقيع على سياسات البرنامج',
    summary: 'تطلب بعض البرامج أن تقرأ سياساتها وتوقّع عليها قبل زيارتك. إليك معنى ذلك وما يراه البرنامج.',
    lead: 'تطلب بعض البرامج أن تقرأ سياساتها، وهي قواعدها، وتوقّع عليها قبل أن تزورها. في Pam تفعل ذلك على هاتفك. توقّع باسمك مرة واحدة، وبعدها يحتاج التوقيع التالي إلى لمسة واحدة.',
    howTo: 'في التطبيق',
    sections: [
      {
        title: 'ما هي السياسة',
        paras: ['السياسة هي قواعد البرنامج. مثال: «أحضر هوية». قد يكون للبرنامج سياسة واحدة أو عدة سياسات. تقرأ كل واحدة قبل أن توقّع عليها.'],
      },
      {
        title: 'كيف توقّع',
        steps: [
          'افتح البرنامج في Pam. اضغط «سياسات للتوقيع».',
          'اقرأ السياسة.',
          'اضغط «توقيع». ارسم اسمك بإصبعك، أو اضغط «كتابة اسمي بدلا من ذلك» واكتب اسمك الكامل. الكتابة تحتسب مثل الرسم تماما.',
        ],
        paras: ['تفعل ذلك مرة واحدة. يحتفظ Pam بتوقيعك، فتحتاج السياسة التالية إلى لمسة واحدة.'],
      },
      {
        title: 'التوقيع لا يمنعك أبدا من حجز زيارة',
        note: true,
        paras: ['يمكنك تخطيط زيارة قبل أن توقّع على أي شيء. التوقيع يكون قبل الذهاب، ولا يمنعك أبدا من الحجز.'],
      },
      {
        title: 'ما يراه البرنامج',
        paras: ['يرى البرنامج اسمك الأول وتاريخ توقيعك. ولا يرى صورة توقيعك أبدا.'],
      },
      {
        title: 'السياسة لا تتغير بعد أن توقّع',
        paras: ['لا تُغيَّر السياسة أبدا بعد أن توقّع عليها. إذا كتب البرنامج نسخة جديدة، يطلب منك Pam أن تقرأ النسخة الجديدة وتوقّع عليها.'],
      },
      {
        title: 'ما معنى توقيعك',
        paras: ['توقيعك في Pam سجل بأنك قرأت السياسة ووافقت عليها. وهو ليس توقيعا قانونيا.'],
      },
      {
        title: 'للبرامج',
        paras: ['أضف سياساتك في برنامجك، تحت «سياسات المشاركين». يقرأ الأعضاء السياسات ويوقّعون عليها في Pam. ترى لكل شخص اسمه الأول وتاريخ توقيعه. ولا ترى توقيعه أبدا. إذا كتبت نسخة جديدة، يُطلب من الأعضاء التوقيع من جديد.'],
      },
    ],
  },
};

const FILE = signedOff as { 'program-rules': string[]; 'program-rules-live': boolean };

/** True the day Piper's signing screens are really in the app (`signed-off.json`). */
export const SIGNING_LIVE: boolean = FILE['program-rules-live'] === true;

export function isRulesSigned(lang: AboutLang): boolean {
  return SIGNING_LIVE && (FILE['program-rules'] as readonly string[]).includes(lang);
}

/** The six languages with a page of their own at /<lang>/program-rules/ (English is the Support post). */
export function rulesBuiltLangs(): AboutLang[] {
  if (process.env.PAM_SITE_DRAFTS === '1') return ABOUT_LANGS.filter((l) => l !== 'en');
  return ABOUT_LANGS.filter((l) => l !== 'en' && isRulesSigned(l));
}

/** Where each language's copy lives: English as a Support post, the rest at /<lang>/program-rules/. */
export function rulesPath(lang: AboutLang): string {
  return lang === 'en' ? `/support/${RULES_SLUG}/` : `/${lang}/program-rules/`;
}
