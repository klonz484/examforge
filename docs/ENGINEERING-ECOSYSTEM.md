# ExamForge Engineering Ecosystem

ExamForge follows the shared reuse-first engineering standard.

## Defaults
- Preserve the current Vite + React + TypeScript architecture.
- Use existing dependencies before adding new ones.
- Prefer accessible, mobile-first components and consistent Lucide icons.
- Consider Tailwind/shadcn/Radix, GSAP/Motion/React Bits only when compatible and justified; do not introduce them merely to match a checklist.
- Use Playwright for critical browser journeys; add unit tests where they provide value.

## Three layers
1. External resources: third-party libraries, official docs and examples.
2. Shared toolkit: general-purpose components, patterns, utilities and test helpers.
3. ExamForge product code: CAPS catalogue, Tonight's 20, student progress, Supabase schema and other product-specific rules.

Keep ExamForge-specific business logic, schemas, student data and branding inside ExamForge. Only promote genuinely general-purpose assets to the shared toolkit.

## Reuse-first workflow
1. Inspect existing implementation, dependencies, versions and tests.
2. Search existing project code and the shared toolkit before building.
3. Evaluate candidate external resources for compatibility, license, maintenance, security, accessibility and mobile performance.
4. Reuse or adapt the smallest suitable solution.
5. Test the change and document relevant decisions.
6. At milestone/project closeout, complete [Project Closeout](PROJECT-CLOSEOUT.md).

## Contribution requirements
A reusable asset must have a clear purpose, usage example, API/customisation notes, dependencies, compatibility, accessibility/performance notes, provenance/license, verification status and limitations. Do not contribute secrets, personal/student data, production records or proprietary ExamForge business logic.
