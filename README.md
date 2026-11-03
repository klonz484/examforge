# ExamForge MVP — PWA + Supabase

Mobile-first React + TypeScript PWA starter for South African Grade 10–12 Physical Science and Mathematics learners.

## Included in this starter

- Dark, orange ExamForge UI inspired by the supplied screen references.
- Onboarding: grade, exam date, subject and weak topics.
- Dashboard with exam countdown, Tonight's 20 and prescribed-work card.
- Five-question Rewind flow with answer feedback and active-time counter.
- Past-paper catalogue UI with search and filters (sample/demo records only).
- Camera-friendly image/PDF note selection and private Supabase Storage upload.
- Progress screen with clearly labelled demo mastery values.
- Supabase email/password sign-up and sign-in wiring.
- SQL schema with Row Level Security and a private notes bucket.
- PWA manifest, install metadata and basic offline shell service worker.

## 1. Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. Without Supabase environment variables the app runs in demo mode. Demo mode is for interface testing only; it does not persist student records to a server.

## 2. Connect Supabase

1. Create a Supabase project.
2. Copy the Project URL and publishable/anon key into `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

3. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.
4. In Supabase Auth, configure email confirmation and allowed redirect URLs for localhost and your eventual production domain.
5. Restart Vite after changing environment variables.

The browser key is intentionally the publishable/anon key. Never put a Supabase `service_role` key, database password, or AI provider key in a `VITE_` variable or frontend file.

## 3. Current implementation boundary

This is a functional frontend starter, not a production-ready learning platform. The following are still required before public launch:

- A server-side Edge Function for OCR + AI question generation, with schema validation, confidence thresholds, moderation, rate limits, quotas and cost logging.
- A worker/Edge Function that reads private uploads, extracts content, generates draft questions and stores them as `pending`. Students should review generated questions before they enter Rewind.
- A curated, rights-reviewed DBE/provincial past-paper catalogue and official marking memos. The visible paper list is sample data, not downloadable papers.
- Real mastery calculations based on attempts and marks. Current progress bars are labelled demo values.
- A server-verified payment integration and entitlement checks. Never unlock paid features based only on client state.
- Parent access/consent model and WhatsApp provider integration; not included in this MVP frontend.
- Full offline session queue/sync and robust timer persistence. The service worker currently caches the app shell only.
- Production testing, privacy notice, POPIA review, backups, monitoring and accessibility checks.

## 4. Recommended AI pipeline

`private upload -> server-side file validation -> OCR/layout extraction -> extraction confidence gate -> topic classification -> question generation -> deterministic schema validation -> draft review -> approved question bank -> Rewind selection`

Do not treat uploaded notes as authoritative facts. The generator should detect ambiguity, avoid unsupported claims, and flag low-confidence extraction for student review. Never let the model directly update marks, mastery, subscriptions or account permissions.

## 5. Deployment

Build with `npm run build`; the static output is `dist/`. Deploy `dist/` to Cloudflare Pages or Vercel. GitHub Pages can host the static frontend, but it cannot safely host secret-bearing server functions. Keep Supabase Edge Functions (or another trusted backend) for AI and privileged operations.

For GitHub Pages under a repository subpath, configure Vite's `base` and service-worker paths before deployment. A root-domain deployment is simpler.

## 6. Product decisions carried forward

- Default dark mode; orange is the main action colour and purple is reserved for AI notes.
- Tonight's 20 is the primary dashboard action.
- Exactly five Rewind questions are shown in this prototype.
- Notes are private by default and stored under the authenticated user's folder.
- AI-generated questions remain drafts until reviewed.
- Pricing shown in the PRD (R149/month and R349 until finals) is not charged by this starter.
