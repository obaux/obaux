// docusign-spike — THROWAWAY. The made-up forms F1–F5 and the envelopes E1, E100 and E-ar. Made-up people only.

const esc = (text: string) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/** A one-page PDF with lines of text, and optional anchor strings the signing tabs attach to. No PDF library. */
export function makePdf(title: string, fields: readonly { readonly label: string; readonly anchor?: string }[]): Uint8Array {
  let y = 740;
  let content = `BT /F1 18 Tf 50 ${y} Td (${esc(title)}) Tj ET\n`;
  y -= 50;
  for (const field of fields) {
    content += `BT /F1 12 Tf 50 ${y} Td (${esc(field.label)}) Tj ET\n`;
    if (field.anchor) content += `BT /F1 10 Tf 260 ${y} Td (${esc(field.anchor)}) Tj ET\n`;
    y -= 40;
  }
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

const FIELDS = {
  fullName: { label: 'Full name', anchor: '/fullName/' },
  initials: { label: 'Initials', anchor: '/initials/' },
  dob: { label: 'Birth date', anchor: '/dob/' },
  ssn: { label: 'Social Security number (made up)', anchor: '/ssn/' },
  contact: { label: 'Emergency contact name', anchor: '/contactName/' },
  date: { label: 'Date signed', anchor: '/date/' },
  sig: { label: 'Signature', anchor: '/sig/' },
} as const;

export const FORMS = [
  { id: 'F1', name: 'Intake', fields: [FIELDS.fullName, FIELDS.dob, FIELDS.ssn, FIELDS.initials, FIELDS.date, FIELDS.sig] },
  { id: 'F2', name: 'Release', fields: [FIELDS.fullName, FIELDS.initials, FIELDS.date, FIELDS.sig] },
  { id: 'F3', name: 'Program rules', fields: [FIELDS.initials, FIELDS.date, FIELDS.sig] },
  { id: 'F4', name: 'Emergency contact', fields: [FIELDS.fullName, FIELDS.contact, FIELDS.date, FIELDS.sig] },
  { id: 'F5', name: 'Photo consent', fields: [FIELDS.fullName, FIELDS.initials, FIELDS.date, FIELDS.sig] },
] as const;

export type Which = 'E1' | 'E100' | 'Ear';

const toBase64 = (bytes: Uint8Array) => {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
};

export function documentsFor(which: Which) {
  const copies = which === 'E100' ? 20 : 1;
  const documents: { documentBase64: string; name: string; fileExtension: string; documentId: string }[] = [];
  for (let copy = 1; copy <= copies; copy += 1) {
    for (const form of FORMS) {
      const id = documents.length + 1;
      documents.push({
        documentBase64: toBase64(makePdf(`${form.id} ${form.name} (made up)`, form.fields)),
        name: copies > 1 ? `${form.id} ${form.name} (${copy})` : `${form.id} ${form.name}`,
        fileExtension: 'pdf',
        documentId: String(id),
      });
    }
  }
  return documents;
}

const at = (name: string) => ({
  anchorString: `/${name}/`,
  anchorUnits: 'pixels',
  anchorXOffset: '0',
  anchorYOffset: '-4',
  anchorIgnoreIfNotPresent: 'true',
  anchorMatchWholeWord: 'true',
});

/** One set of tabs for the signer. The same tabLabel means the same thing in every form, each with a tooltip for a screen reader. */
export function signerTabs() {
  return {
    signHereTabs: [{ ...at('sig'), tabLabel: 'signature', tooltip: 'Sign here' }],
    initialHereTabs: [{ ...at('initials'), tabLabel: 'initials', tooltip: 'Your initials' }],
    dateSignedTabs: [{ ...at('date'), tabLabel: 'dateSigned', tooltip: 'Today’s date, filled in for you' }],
    textTabs: [
      { ...at('fullName'), tabLabel: 'fullName', tooltip: 'Your full name', required: 'true', width: '200', height: '20' },
      { ...at('contactName'), tabLabel: 'contactName', tooltip: 'The name of the person to call in an emergency', required: 'true', width: '200', height: '20' },
    ],
    dateTabs: [{ ...at('dob'), tabLabel: 'dob', tooltip: 'Your birth date', required: 'true', width: '100', height: '20' }],
    ssnTabs: [{ ...at('ssn'), tabLabel: 'ssn', tooltip: 'Your Social Security number', required: 'true' }],
  };
}

export const SIGNER = { email: 'ana@spike.invalid', name: 'Test Member Ana', clientUserId: '1001' } as const;

/** What the Connect webhook is told: no documents, no field values, no certificate. */
export function connectNotification(url: string) {
  return {
    url,
    loggingEnabled: 'true',
    requireAcknowledgment: 'false',
    useSoapInterface: 'false',
    includeDocuments: 'false',
    includeDocumentFields: 'false',
    includeCertificateOfCompletion: 'false',
    includeEnvelopeVoidReason: 'false',
    includeTimeZone: 'false',
    includeSenderAccountAsCustomField: 'false',
    includeHMAC: 'true',
    envelopeEvents: [{ envelopeEventStatusCode: 'sent' }, { envelopeEventStatusCode: 'completed' }, { envelopeEventStatusCode: 'declined' }, { envelopeEventStatusCode: 'voided' }],
    recipientEvents: [{ recipientEventStatusCode: 'Completed' }],
    eventData: { version: 'restv2.1', format: 'json', includeData: [] as string[] },
  };
}

export function envelopeDefinition(which: Which, opts: { readonly connectUrl?: string } = {}) {
  return {
    emailSubject: `Made-up forms (${which})`,
    status: 'sent',
    documents: documentsFor(which),
    recipients: {
      signers: [
        {
          ...SIGNER,
          recipientId: '1',
          routingOrder: '1',
          ...(which === 'Ear' ? { emailNotification: { supportedLanguage: 'ar' } } : {}),
          tabs: signerTabs(),
        },
      ],
    },
    ...(opts.connectUrl ? { eventNotification: connectNotification(opts.connectUrl) } : {}),
  };
}
