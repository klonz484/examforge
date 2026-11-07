# Shared UI component snapshot

Source repository: klonz484/website-development-ecosystem.
Source package: toolkit/ui-library.
Source branch at adoption: feat/accessible-component-library.

Exact upstream source revisions:
- components.tsx: 683d04e7630954ce5170443e443168f69ef50f1e
- styles.css: 44d5780357e32073be4b08b0bf42804db960373c
- reviewed package branch head: 8c3906ec6cd78461aa34bf99794cbde78ba8293c

ExamForge consumes a source snapshot because the package is not yet published to a package registry. Local CSS overrides preserve the approved ExamForge dark/orange theme and improve contrast for primary actions.

Update process:
1. Review upstream component and token changes.
2. Copy only the needed reviewed files from the upstream package.
3. Preserve ExamForge theme overrides and verify mobile styles.
4. Run npm run build and the shared UI Playwright workflow.
5. Update these source revisions and document intentional local differences.

Do not copy secrets, Supabase schema, student data or project-specific product logic into the shared library.
