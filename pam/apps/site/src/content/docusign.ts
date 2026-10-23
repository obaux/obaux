/**
 * The Home page's DocuSign tag (Will, 23 October, Control Room: "add a small tag for DocuSign integration, pulling in the
 * DocuSign icon logo", under the programs row). The words are Sage's to sign (A29). The logo is DocuSign's own published
 * file, unchanged, from their brand page, as their trademark rules ask: never drawn again here.
 *
 * `logo` is the file under `public/` once it has been added. Until then the tag shows its words alone: a missing file must
 * not leave a broken picture on the page. A test holds that a named file exists.
 */
export const DOCUSIGN = {
  label: 'DocuSign integration',
  soon: 'Coming soon',
  logo: null as string | null,
  /** Read out for the logo when it is shown beside the words (the words already say DocuSign, so the picture is decoration). */
  logoAlt: '',
} as const;
