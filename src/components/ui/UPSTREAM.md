# Shared UI component snapshot

Source: klonz484/website-development-ecosystem, toolkit/ui-library.
Upstream branch at adoption: feat/accessible-component-library.
Source commit: 6a7f1f983f995efcbd4b3b2fd1a7249705de7f09.
Adopted into ExamForge as a source snapshot because the library is not yet published to a package registry.

Update process:
1. Review upstream component and token changes.
2. Copy only the needed reviewed files from the upstream package.
3. Preserve ExamForge theme overrides and verify mobile styles.
4. Run npm run build and npm run test:e2e.
5. Update this source commit and document intentional local differences.

Do not copy secrets, Supabase schema, student data or project-specific product logic into the shared library.
