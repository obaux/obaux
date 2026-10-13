# D-561 — The language choice on Join is a dropdown again

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-button-counter` (the control); Ava puts it on Join (`JoinScreen.tsx`).

Will (13 October): the seven language chips on Join take too much room, so the choice goes back to a dropdown (the chips were D-359). The look is Dot's; Ava builds the screen.

**The control:** `LanguageField` (`@pam/ui/LanguageField`, story Components/Inputs/LanguageField): Pam's own `Dropdown` (D-370), so it is the same box as "City you live in" (56px tall, 12px corners, the list under it, 48px rows, the chosen one ticked). Props: `label`, `options` (`code`, `name` in its own words, `tag` the English short name), `value`, `onChange(code)`.

- **Own names**: Español, العربية, 简体中文（普通话）; the closed box shows the current one, so on an English screen it says "English".
- **The English tag in the open list** (EN, ES, PT-BR, ZH-CN, ZH-HK, RU, AR; D-451, D-455), in the fixed-width cell the chips and the globe's list use, hidden from a screen reader, so a row reads as the language's name alone. The closed box shows the name only: with a tag a field read as two things.
- **`lang` on each row's words** (`TaggedWords`), so an Arabic row is read in Arabic and set right to left on an English page. The closed box cannot carry `lang` (Astryx draws it); the row does.
- **Right to left**: on an Arabic page the box, chevron and rows mirror, the tag first at the page's start (as `OptionTag`).
- Switching is the screen's job, as it is with the chips: `onChange` gets the code; Join switches the whole screen live and sends it as the person's language, unchanged.

**For Ava, one swap** in `JoinScreen.tsx` where `<VStack gap={2}><Text … chipsLabel>…<ChoiceChips …/></VStack>` is (the label is now the field's own, so the separate `Text` goes):

```tsx
<LanguageField
  label={t('onboarding.language.title')}
  options={SUPPORTED_LOCALES.map((code) => ({ code, name: t(`language.${code}`), tag: LANGUAGE_TAGS[code] }))}
  value={pendingLocale ?? locale}
  onChange={(code) => setLocale(code as Locale)}
/>
```

`e2e/join.spec.ts` has a test for the chips' tags (D-451/D-455); it moves to the rows of the open list (`getByRole('option')`). The page is shorter by about 200px, so the Next button no longer sits over the code box on a phone.

Pictures (390px): `docs/design/review/2026-10-13-button-counter/`: `before-join-light-en-390.png` and `after-dd-join-light-en-390.png`, the open list in English (`after-dd-open-light-en-390`), Arabic, dark, and Spanish at 320. The open list runs to the foot of the screen and scrolls inside its panel; Arabic is the seventh row.
