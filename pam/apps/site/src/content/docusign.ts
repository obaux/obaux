/**
 * The Home page's DocuSign tag (Will, 23 October, Control Room: "add a small tag for DocuSign integration, pulling in the
 * DocuSign icon logo", under the programs row). The words are Sage's (signed 24 October, 2c0e66f9: "Signing with Docusign", the way the company spells its name since its 2024 rebrand). The logo is DocuSign's own file as Will gave it on 24 October (the symbol cut from it, nothing else changed;
 * `docs/design/review/2026-10-24-docusign-logo/`), shown with his go-ahead: never redrawn or recoloured here.
 *
 * `logo` is the file under `public/` once it has been added. Until then the tag shows its words alone: a missing file must
 * not leave a broken picture on the page. A test holds that a named file exists.
 */
export const DOCUSIGN = {
  label: 'Signing with Docusign',
  soon: 'Coming soon',
  logo: '/brand/docusign-symbol.png' as string | null,
  /** Read out for the logo when it is shown beside the words (the words already say DocuSign, so the picture is decoration). */
  logoAlt: '',
} as const;
