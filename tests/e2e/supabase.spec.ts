import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const emailA = process.env.E2E_TEST_EMAIL_A
const passwordA = process.env.E2E_TEST_PASSWORD_A
const emailB = process.env.E2E_TEST_EMAIL_B
const passwordB = process.env.E2E_TEST_PASSWORD_B

function client() {
  if (!url || !anonKey) throw new Error('Supabase test configuration is missing.')
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

test('Supabase sign-in, full onboarding profile persistence, and profile RLS isolation', async ({ page }) => {
  expect(url).toBeTruthy()
  expect(anonKey).toBeTruthy()
  expect(emailA).toBeTruthy()
  expect(passwordA).toBeTruthy()
  expect(emailB).toBeTruthy()
  expect(passwordB).toBeTruthy()

  // Start with a clean browser and complete the same onboarding flow a student uses.
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')

  // Calculate in the browser's timezone, matching the app's local-date behavior.
  const dateValue = await page.evaluate(() => {
    const examDate = new Date()
    examDate.setDate(examDate.getDate() + 45)
    return [
      examDate.getFullYear(),
      String(examDate.getMonth() + 1).padStart(2, '0'),
      String(examDate.getDate()).padStart(2, '0'),
    ].join('-')
  })

  await page.locator('input[type="date"]').fill(dateValue)
  await page.getByRole('button', { name: 'Grade 12' }).click()
  // Physical Sciences is already the default selected subject.
  await page.getByRole('button', { name: 'Mechanics', exact: true }).click()
  await page.getByRole('button', { name: 'Electricity', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()
  await expect(page.getByRole('heading', { name: /Tonight’s 20/ })).toBeVisible()

  // Sign in through the real UI so the app can sync onboarding to the student's account.
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('button', { name: /Account \/ sign in/ }).click()
  await page.getByRole('button', { name: /Already have an account\? Sign in/ }).click()
  await page.locator('input[type="email"]').fill(emailA!)
  await page.locator('input[type="password"]').fill(passwordA!)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('You are signed in.')).toBeVisible()

  // Test an existing account too: explicitly save the edited focus instead of assuming
  // a previously-used test account has no profile row.
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('button', { name: /Study settings/ }).click()
  await page.locator('input[type="date"]').fill(dateValue)
  await page.getByRole('button', { name: 'Mathematics ATP-listed', exact: true }).click()
  // Select Mathematics as the first study focus before choosing its topics.
  await page.getByLabel('Choose your first study focus').selectOption('mathematics')
  await page.getByRole('button', { name: 'Algebra', exact: true }).click()
  await page.getByRole('button', { name: 'Functions', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()
  await expect(page.getByText('Your study focus is set. Rewind first.')).toBeVisible()

  const accountA = client()
  const signInA = await accountA.auth.signInWithPassword({ email: emailA!, password: passwordA! })
  expect(signInA.error).toBeNull()
  const userA = signInA.data.user
  expect(userA).toBeTruthy()

  // Verify every onboarding field reaches the database, not just a success toast or local state.
  await expect.poll(async () => {
    const result = await accountA.from('profiles')
      .select('id,grade,exam_date,primary_subject,weak_topics')
      .eq('id', userA!.id)
      .maybeSingle()
    if (result.error) throw result.error
    return result.data
  }, { timeout: 20_000 }).toMatchObject({
    id: userA!.id,
    grade: 12,
    exam_date: dateValue,
    primary_subject: 'Mathematics',
    weak_topics: ['Algebra', 'Functions'],
  })

  const ownProfile = await accountA.from('profiles')
    .select('id,grade,exam_date,primary_subject,weak_topics')
    .eq('id', userA!.id)
    .maybeSingle()
  expect(ownProfile.error).toBeNull()
  expect(ownProfile.data).toMatchObject({
    id: userA!.id,
    grade: 12,
    exam_date: dateValue,
    primary_subject: 'Physical Science',
    weak_topics: ['Mechanics', 'Electricity'],
  })

  // A second account must not be able to read or overwrite the first student's profile.
  const accountB = client()
  const signInB = await accountB.auth.signInWithPassword({ email: emailB!, password: passwordB! })
  expect(signInB.error).toBeNull()
  expect(signInB.data.user).toBeTruthy()

  const crossAccountRead = await accountB.from('profiles')
    .select('id,grade')
    .eq('id', userA!.id)
  expect(crossAccountRead.error).toBeNull()
  expect(crossAccountRead.data).toEqual([])

  const forgedInsert = await accountB.from('profiles').insert({
    id: userA!.id,
    grade: 10,
    exam_date: dateValue,
    primary_subject: 'Mathematics',
    weak_topics: ['Algebra', 'Functions'],
  })
  expect(forgedInsert.error).not.toBeNull()

  const forgedUpdate = await accountB.from('profiles')
    .update({ grade: 10, primary_subject: 'Mathematics' })
    .eq('id', userA!.id)
    .select('id')
  expect(forgedUpdate.error).toBeNull()
  expect(forgedUpdate.data).toEqual([])

  await accountA.auth.signOut()
  await accountB.auth.signOut()
})
