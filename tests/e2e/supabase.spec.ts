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

test('Supabase sign-in, profile persistence, and profile RLS isolation', async ({ page }) => {
  expect(url).toBeTruthy()
  expect(anonKey).toBeTruthy()
  expect(emailA).toBeTruthy()
  expect(passwordA).toBeTruthy()
  expect(emailB).toBeTruthy()
  expect(passwordB).toBeTruthy()

  // Create a fresh, isolated browser state. The account used here is a dedicated test account.
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')

  const examDate = new Date()
  examDate.setDate(examDate.getDate() + 45)
  const dateValue = [
    examDate.getFullYear(),
    String(examDate.getMonth() + 1).padStart(2, '0'),
    String(examDate.getDate()).padStart(2, '0'),
  ].join('-')

  await page.locator('input[type="date"]').fill(dateValue)
  await page.getByRole('button', { name: 'Grade 12' }).click()
  await page.getByRole('button', { name: /Physical Science/ }).click()
  await page.getByRole('button', { name: 'Mechanics', exact: true }).click()
  await page.getByRole('button', { name: 'Electricity', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()
  await expect(page.getByRole('heading', { name: /Tonight’s 20/ })).toBeVisible()

  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('button', { name: /Account \/ sign in/ }).click()
  await page.getByRole('button', { name: /Already have an account\? Sign in/ }).click()
  await page.locator('input[type="email"]').fill(emailA!)
  await page.locator('input[type="password"]').fill(passwordA!)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('You are signed in.')).toBeVisible()

  const accountA = client()
  const signInA = await accountA.auth.signInWithPassword({ email: emailA!, password: passwordA! })
  expect(signInA.error).toBeNull()
  const userA = signInA.data.user
  expect(userA).toBeTruthy()

  // The app's auth effect syncs the completed onboarding profile to Supabase.
  await expect.poll(async () => {
    const result = await accountA.from('profiles')
      .select('id,grade,exam_date,primary_subject,weak_topics')
      .eq('id', userA!.id)
      .maybeSingle()
    return result.data?.grade ?? null
  }, { timeout: 20_000 }).toBe(12)

  const ownProfile = await accountA.from('profiles').select('id,grade').eq('id', userA!.id).maybeSingle()
  expect(ownProfile.error).toBeNull()
  expect(ownProfile.data?.id).toBe(userA!.id)

  const accountB = client()
  const signInB = await accountB.auth.signInWithPassword({ email: emailB!, password: passwordB! })
  expect(signInB.error).toBeNull()
  expect(signInB.data.user).toBeTruthy()

  // RLS must hide Account A's profile from Account B.
  const crossAccountRead = await accountB.from('profiles')
    .select('id,grade')
    .eq('id', userA!.id)
  expect(crossAccountRead.error).toBeNull()
  expect(crossAccountRead.data).toEqual([])

  // A forged insert for another user's UUID must be rejected by WITH CHECK.
  const forgedInsert = await accountB.from('profiles').insert({
    id: userA!.id,
    grade: 10,
    exam_date: dateValue,
    primary_subject: 'Mathematics',
    weak_topics: ['Algebra', 'Functions'],
  })
  expect(forgedInsert.error).not.toBeNull()

  await accountA.auth.signOut()
  await accountB.auth.signOut()
})
