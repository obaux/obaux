# The inline search bar: active-field spec (a86 as inline, Will 06:45), 390px

No full-screen search, no pop up, no dropdown: the bar on Explore and staff All programs is one inline field, and typing filters the list under it. Drawn with the real `SearchLauncher` and `SearchField` (throwaway page, `mock-source.tsx.txt`). Across: resting; tapped, empty (outline); typed "food" (outline, clear ×); typed an address, with the quiet line (stand-in words, Sage's) above the list. Light on top, dark below: `states-light-dark-390.png`, singles beside it.

**Spec**
1. **Resting and active are one bar**, as D-574: 60px (`--pam-search-height`), the magnifier and words at the left in the same place (16px / 4px gap / 16px 600). A tap focuses the field in place; nothing jumps and nothing opens.
2. **Focused: the 3px dark pill outline** (D-574), in every state while the field has focus: empty, typed, an address.
3. **No Cancel.** The way to stop searching is the clear button inside the field.
4. **Clear (×):** `SearchField`'s own `hasClear`: it appears only once there is text, sits inside the pill at the right, is 48 × 48 (measured), is named "Clear", and a tap empties the field and keeps focus in it, so the keyboard stays up and the full list is back. With the field empty the list is the full list, as today.
5. **Under the bar:** the list (programs by name; or, for a typed address, the programs nearest it). When it is measured from a typed address, one quiet line sits above the list (supporting text, 14px, under the bar, Sage's words); the "Near …" control keeps saying where the list is measured from.
6. **`searchRow` (the Cancel draw-in and the 12px beside Cancel, in `@pam/ui/SearchPill`) has no use** once there is no Cancel: it should come out in the same change that removes the last use, which is Piper's build of this.
