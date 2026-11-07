import { expect, test } from '@playwright/test'

test('learner can enrol in more than seven subjects and use the full library', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
  await page.goto('/examforge/')

  const search = page.getByLabel('Search CAPS subjects')
  for (const name of ['Mathematics', 'Accounting', 'Business Studies', 'Geography', 'History', 'Life Sciences', 'Economics']) {
    await search.fill(name)
    await page.locator('.catalogue-option').filter({ hasText: name }).first().click()
  }
  await expect(page.locator('.selected-subject-chip')).toHaveCount(8)
  await page.getByLabel('Choose your first study focus').selectOption('mathematics')
  await page.getByRole('button', { name: 'Algebra', exact: true }).click()
  await page.getByRole('button', { name: 'Functions', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()

  await expect(page.locator('.dashboard-subject-slot')).toHaveCount(7)
  await expect(page.locator('.dashboard-subject-slot.filled')).toHaveCount(7)
  await page.getByRole('button', { name: /All subjects/ }).click()
  await expect(page.locator('.all-subjects-panel')).toBeVisible()
  await expect(page.locator('.all-subject-row')).toHaveCountGreaterThan(30)

  await page.getByLabel("Choose today's study subject").selectOption('accounting')
  await page.getByRole('button', { name: 'Start 7-minute Rewind' }).click()
  await expect(page.getByText(/Question content for this subject is not available yet/)).toBeVisible()
})

test('dashboard keeps seven fixed positions even when fewer subjects are enrolled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
  await page.goto('/examforge/')
  await page.locator('input[type="date"]').fill(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  await page.getByRole('button', { name: 'Mechanics', exact: true }).click()
  await page.getByRole('button', { name: 'Electricity', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()

  await expect(page.locator('.dashboard-subject-slot')).toHaveCount(7)
  await expect(page.locator('.dashboard-subject-slot.filled')).toHaveCount(1)
  await expect(page.locator('.dashboard-subject-slot.empty')).toHaveCount(6)
})
