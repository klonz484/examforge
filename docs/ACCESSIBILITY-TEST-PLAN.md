# ExamForge accessibility release test plan

## Automated baseline

The pull-request workflow builds the production bundle and runs Playwright in Chromium, Firefox and WebKit. The Supabase profile/RLS integration journey runs once in Chromium to avoid concurrent writes from the shared test account. The UI suite runs axe-core against the onboarding screen and account dialog with WCAG 2.2 A/AA tags.

Automated axe results do not prove WCAG conformance. Record all manual checks below before declaring the release accessible.

## Manual test record

Record the date, browser version, operating system, assistive technology/version, tester and result for each item. Do not mark a check complete without performing it.

- [ ] Android Chrome + TalkBack: complete onboarding using swipe navigation and double-tap; verify date field, grade, subject, topic choices and primary action are announced meaningfully.
- [ ] Android Chrome + TalkBack: open the account dialog; verify its title/description, email/password labels, close button and errors are announced.
- [ ] Android Chrome + TalkBack: close the dialog with its close control and verify focus/context returns to the persistent Menu control.
- [ ] Android Chrome: test portrait/landscape, 320–390 CSS px, virtual keyboard, scrolling and touch targets.
- [ ] Desktop keyboard: Tab/Shift+Tab through all controls; activate with Enter/Space; verify visible focus and no unintended keyboard traps.
- [ ] Desktop dialog: verify focus enters the modal, stays within it, Escape closes it, and focus returns to the opener or the documented fallback.
- [ ] NVDA + Firefox or Chrome on Windows: test landmarks, headings, form labels, status messages, dialog and table semantics.
- [ ] VoiceOver + Safari on macOS/iOS: test navigation, forms, dialog, and responsive mobile layout.
- [ ] 200% zoom and 320 CSS px reflow: no loss of essential information or functionality.
- [ ] Check text contrast at 4.5:1 (normal text), 3:1 (large text) and non-text UI/focus contrast at 3:1 in every supported theme.
- [ ] Verify reduced-motion setting removes non-essential animation.
- [ ] Verify errors are conveyed in text and associated with their controls, not by color alone.

## Release decision

- Chromium, Firefox and WebKit Playwright results must pass.
- No serious/critical axe violations may be waived without a documented reason and owner.
- Manual assistive-technology checks must be recorded before public accessibility claims are made.
- Supabase Preview is a separate schema/migration environment check. It is expected to be skipped when a pull request does not change `supabase/**`; the independent authenticated profile/RLS browser test is the relevant check for this UI-only change.
