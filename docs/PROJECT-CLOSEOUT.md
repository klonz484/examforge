# ExamForge Project / Milestone Closeout

Use this checklist for each meaningful milestone and before declaring the project complete.

## Quality gate
- [ ] Acceptance criteria reviewed
- [ ] TypeScript/build checks pass
- [ ] Relevant automated tests pass
- [ ] Critical Playwright journeys checked
- [ ] Mobile/responsive behaviour checked
- [ ] Accessibility and reduced-motion behaviour checked where relevant
- [ ] Dependencies, security and licenses reviewed
- [ ] Deployment/rollback notes updated

## Reusable asset review
List reusable components, layouts, hooks, utilities, design tokens, templates, animations, test helpers or documentation created/improved.

For each candidate record:
- Name and source path:
- Purpose:
- Why it is useful outside ExamForge:
- Dependencies and tested versions:
- Project-specific assumptions to remove:
- Source/provenance and license:
- Tests/verification:
- Accessibility/performance notes:
- Known limitations:

## Safe extraction
- [ ] Remove ExamForge branding and hard-coded product assumptions
- [ ] Remove CAPS/product rules, Supabase schema/API assumptions unless deliberately generic
- [ ] Remove secrets, student data, personal data and production records
- [ ] Confirm third-party license and attribution obligations
- [ ] Keep the original ExamForge feature working

## Promotion decision
- [ ] Promote to shared toolkit (include destination and PR/commit)
- [ ] Keep project-local (explain why)
- [ ] Defer (create follow-up issue)

## Closeout summary
- Milestone:
- Date:
- Reusable assets promoted:
- Documentation/tests added:
- Dependencies added/removed and reason:
- Outstanding risks/follow-ups:
