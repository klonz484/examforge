import { createClient } from '@supabase/supabase-js'

const url = process.env.API_URL
const serviceRoleKey = process.env.SERVICE_ROLE_KEY
if (!url || !serviceRoleKey) {
  throw new Error('Local Supabase API_URL and SERVICE_ROLE_KEY are required.')
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

for (const [email, password] of [
  ['learner-a@examforge.local', 'ExamForgeLocalTest-A!2026'],
  ['learner-b@examforge.local', 'ExamForgeLocalTest-B!2026'],
]) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Could not create disposable local test user ${email}: ${error.message}`)
  if (!data.user?.id) throw new Error(`Local test user ${email} was not created.`)
}

console.log('Created two disposable local Supabase auth accounts.')
