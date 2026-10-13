'use client';

import { Dropdown } from './Dropdown.js';
import { TaggedWords } from './OptionTag.js';

/**
 * The language to use, as a field (Will, 13 October: the seven chips on Join "take too much space", so it goes back to a
 * dropdown). Pam's `Dropdown` (D-370), so it is the same box as "City you live in": 56px, 12px corners, the list under it,
 * 48px rows, the chosen one ticked.
 *
 * - **Each language by its own name**: "Español", "العربية", "简体中文（普通话）". The closed box shows the current one.
 * - **The English tag before the name in the list** ("EN", "PT-BR", "AR"; D-451, D-455), hidden from a screen reader, so a
 *   row reads as the language's own name alone. The closed box has only the name: with the tag it read as two things in a
 *   field. The row's words carry their own `lang` and `dir` (an Arabic row on an English page is read in Arabic and set
 *   right to left), as on the chips and the globe's list.
 * - **Right to left on an Arabic page**: the box, the chevron and each row mirror with the page; the tag stays first at the
 *   page's start, as in `OptionTag`.
 * - Nothing here chooses the language on its own: `onChange` gets the code, and the screen decides (Join switches the whole
 *   screen at once and sends the choice as the person's language).
 */
export interface LanguageFieldProps {
  /** The field's name, read out and shown above it: "Choose a language". */
  readonly label: string;
  readonly options: readonly {
    /** The locale code, "en", "pt-BR", "ar". */
    readonly code: string;
    /** The language in its own words. */
    readonly name: string;
    /** The short English tag: "EN", "PT-BR". */
    readonly tag: string;
  }[];
  readonly value: string;
  readonly onChange: (code: string) => void;
}

export function LanguageField({ label, options, value, onChange }: LanguageFieldProps) {
  const byCode = new Map(options.map((option) => [option.code, option]));
  return (
    <Dropdown
      label={label}
      width="100%"
      value={value}
      options={options.map((option) => ({ value: option.code, label: option.name }))}
      renderOption={(option) => {
        const language = byCode.get(option.value);
        return (
          <TaggedWords tag={language?.tag} lang={option.value}>
            {option.label}
          </TaggedWords>
        );
      }}
      onChange={onChange}
    />
  );
}
